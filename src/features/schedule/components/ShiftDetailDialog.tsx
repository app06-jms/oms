import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SCHEDULE_SHIFTS, SHIFT_CODES, WORKING_SHIFT_CODES, type ShiftCode } from '@/config/schedule';
import { formatWorkDate } from '@/features/attendance/attendanceRules';
import {
  getShiftDisplayHours,
  getScheduledStart,
  isCheckInMismatched,
  type Employee,
  type ScheduleEntry,
} from '@/features/schedule/scheduleRules';
import {
  approveAdjustmentRequest,
  rejectAdjustmentRequest,
  submitAdjustmentRequest,
} from '@/features/schedule/scheduleService';
import { ShiftBadge, ShiftStatusText } from '@/features/schedule/components/ShiftBadge';

interface ShiftDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  workDate: string;
  entry: ScheduleEntry;
  isOwnSchedule: boolean;
  onChanged: () => Promise<void>;
}

function formatScheduledStart(workDate: string, entry: ScheduleEntry): string {
  const start = getScheduledStart(workDate, entry.shiftCode);
  if (!start) return '';
  return `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
}

export function ShiftDetailDialog({
  open,
  onOpenChange,
  employee,
  workDate,
  entry,
  isOwnSchedule,
  onChanged,
}: ShiftDetailDialogProps) {
  const hasShift = WORKING_SHIFT_CODES.includes(entry.shiftCode);
  const shift = SCHEDULE_SHIFTS[entry.shiftCode];
  const canSimulateCheckIn =
    isOwnSchedule && hasShift && (entry.checkStatus === 'on_shift' || entry.checkStatus === 'mismatch');

  const [checkInTime, setCheckInTime] = useState(() => formatScheduledStart(workDate, entry));
  const [requestedCode, setRequestedCode] = useState<ShiftCode | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMismatched = hasShift && isCheckInMismatched(workDate, entry.shiftCode, checkInTime);
  const showRequestForm = canSimulateCheckIn && isMismatched;
  const isAwaitingApproval = entry.checkStatus === 'pending_adjustment' && entry.requestedShiftCode !== null;
  const requestOptions = SHIFT_CODES.filter((code) => code !== entry.shiftCode);
  const canSubmitRequest = requestedCode !== '' && reason.trim().length > 0 && !isSubmitting;

  async function runAction(action: () => Promise<void>, failureMessage: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await action();
      await onChanged();
      onOpenChange(false);
    } catch {
      setError(failureMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmitRequest() {
    if (requestedCode === '' || reason.trim().length === 0) return;
    const requested = requestedCode;
    const trimmedReason = reason.trim();
    void runAction(
      () => submitAdjustmentRequest(entry.id, requested, trimmedReason),
      'Không thể gửi đề xuất. Vui lòng thử lại.'
    );
  }

  function handleApprove() {
    if (entry.requestedShiftCode === null) return;
    const requested = entry.requestedShiftCode;
    void runAction(() => approveAdjustmentRequest(entry.id, requested), 'Không thể duyệt đề xuất. Vui lòng thử lại.');
  }

  function handleReject() {
    void runAction(() => rejectAdjustmentRequest(entry.id), 'Không thể từ chối đề xuất. Vui lòng thử lại.');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{showRequestForm ? 'Gửi đề xuất điều chỉnh ca' : 'Chi tiết ca làm việc'}</DialogTitle>
          <DialogDescription>
            {employee.fullName} · {employee.code} · {formatWorkDate(workDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ca được xếp</span>
              <div className="flex items-center gap-2">
                <ShiftBadge shiftCode={entry.shiftCode} />
                <span className="text-sm font-medium text-foreground">{shift.name}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Giờ làm việc</span>
              <span className="text-sm font-medium tabular-nums text-foreground">
                {getShiftDisplayHours(entry.shiftCode)}
              </span>
            </div>
            {hasShift && (
              <div className="col-span-2 flex flex-col gap-1.5 border-t border-border pt-3">
                <span className="text-xs font-medium text-muted-foreground">Trạng thái ca</span>
                <ShiftStatusText status={entry.checkStatus} className="text-sm" />
              </div>
            )}
          </div>

          {isAwaitingApproval && entry.requestedShiftCode && (
            <div className="flex flex-col gap-3 rounded-lg border border-pending/40 bg-pending/5 p-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Ca đề xuất</span>
                <div className="flex items-center gap-2">
                  <ShiftBadge shiftCode={entry.requestedShiftCode} />
                  <span className="text-sm font-medium text-foreground">
                    {SCHEDULE_SHIFTS[entry.requestedShiftCode].name}
                  </span>
                </div>
              </div>
              {entry.adjustmentReason && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Lý do</span>
                  <p className="text-sm text-foreground">{entry.adjustmentReason}</p>
                </div>
              )}
              <div className="flex flex-col gap-2 border-t border-pending/30 pt-3">
                <span className="text-xs font-medium text-muted-foreground">Quản lý phê duyệt</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="flex-1" onClick={handleApprove} disabled={isSubmitting}>
                    <CheckCircle2 className="h-4 w-4" />
                    Duyệt điều chỉnh
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleReject} disabled={isSubmitting}>
                    <XCircle className="h-4 w-4" />
                    Từ chối
                  </Button>
                </div>
              </div>
            </div>
          )}

          {canSimulateCheckIn && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="simulated-check-in" className="text-sm font-medium text-foreground">
                  Giờ vào ca thực tế (giả lập)
                </Label>
                <Input
                  id="simulated-check-in"
                  type="time"
                  value={checkInTime}
                  onChange={(event) => setCheckInTime(event.target.value)}
                  className="w-40"
                />
              </div>
              {isMismatched ? (
                <p className="flex items-center gap-2 text-sm text-error">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Giờ vào ca lệch quá 15 phút so với lịch.
                </p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Giờ vào ca khớp với lịch làm việc.
                </p>
              )}
            </div>
          )}

          {showRequestForm && (
            <form
              className="flex flex-col gap-4 border-t border-border pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmitRequest();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-foreground">Ca đề xuất</Label>
                <Select value={requestedCode} onValueChange={(value) => setRequestedCode(value as ShiftCode)}>
                  <SelectTrigger aria-label="Chọn ca đề xuất">
                    <SelectValue placeholder="Chọn ca mong muốn" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestOptions.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code} · {SCHEDULE_SHIFTS[code].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adjustment-reason" className="text-sm font-medium text-foreground">
                  Lý do
                </Label>
                <Textarea
                  id="adjustment-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ví dụ: Chuyến xe buýt đến trễ do sự cố giao thông"
                  rows={3}
                  maxLength={300}
                />
              </div>
              <Button type="submit" disabled={!canSubmitRequest} className="w-full">
                {isSubmitting ? 'Đang gửi...' : 'Gửi đề xuất'}
              </Button>
            </form>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
