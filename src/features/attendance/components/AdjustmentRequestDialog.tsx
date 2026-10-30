import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADJUSTMENT_REASONS, type AdjustmentReason } from '@/config/attendance';
import {
  formatClockTime,
  formatShiftHours,
  type AttendanceAdjustmentRequest,
  type CheckInEvaluation,
} from '@/features/attendance/attendanceRules';

interface AdjustmentRequestDialogProps {
  evaluation: CheckInEvaluation;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (request: AttendanceAdjustmentRequest) => Promise<boolean>;
  onCancel: () => void;
}

function describeTiming({ timing, deltaMinutes }: CheckInEvaluation): string {
  const minutes = Math.abs(deltaMinutes);
  return timing === 'late' ? `Đi trễ ${minutes} phút` : `Đến sớm ${minutes} phút`;
}

export function AdjustmentRequestDialog({ evaluation, isSubmitting, error, onSubmit, onCancel }: AdjustmentRequestDialogProps) {
  const [reason, setReason] = useState<AdjustmentReason | ''>('');
  const [note, setNote] = useState('');
  const trimmedNote = note.trim();
  const canSubmit = reason !== '' && trimmedNote.length > 0 && !isSubmitting;

  function handleSubmit() {
    if (reason === '' || trimmedNote.length === 0) return;
    void onSubmit({ reason, note: trimmedNote });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đề xuất điều chỉnh ca làm việc</DialogTitle>
          <DialogDescription>
            Giờ vào ca của bạn nằm ngoài khung cho phép 15 phút. Vui lòng cung cấp lý do để quản lý xét duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ca được phân công</span>
              <span className="text-sm font-medium text-foreground">
                {evaluation.shift.name} ({formatShiftHours(evaluation.shift)})
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Giờ vào ca thực tế</span>
              <span className="text-sm font-medium tabular-nums text-foreground">
                {formatClockTime(evaluation.checkInAt.toISOString())}
              </span>
            </div>
            <p className="col-span-2 flex items-center gap-2 border-t border-border pt-3 text-sm text-pending">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {describeTiming(evaluation)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground">Chọn lý do</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as AdjustmentReason)}>
              <SelectTrigger aria-label="Chọn lý do">
                <SelectValue placeholder="Chọn một lý do" />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjustment-note" className="text-sm font-medium text-foreground">
              Ghi chú/Lý do chi tiết <span className="text-error">*</span>
            </Label>
            <Textarea
              id="adjustment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: Xe buýt đến trễ do kẹt xe trên đường"
              rows={3}
              maxLength={300}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi đề xuất điều chỉnh'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
