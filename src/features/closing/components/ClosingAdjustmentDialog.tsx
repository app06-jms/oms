import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { formatWorkDate } from '@/features/attendance/attendanceRules';
import {
  fromDateTimeInputValue,
  toDateTimeInputValue,
  type ClosingRow,
} from '@/features/closing/closingRules';

const REASON_MAX_LENGTH = 300;

interface ClosingAdjustmentDialogProps {
  row: ClosingRow;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (checkInAt: string, checkOutAt: string | null, reason: string) => Promise<boolean>;
}

export function ClosingAdjustmentDialog({ row, isSubmitting, onOpenChange, onSubmit }: ClosingAdjustmentDialogProps) {
  const { record, employee } = row;
  const [checkIn, setCheckIn] = useState(toDateTimeInputValue(record.checkInAt));
  const [checkOut, setCheckOut] = useState(toDateTimeInputValue(record.checkOutAt));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const trimmedReason = reason.trim();
    if (!checkIn) {
      setError('Vui lòng nhập giờ vào.');
      return;
    }
    if (checkOut && new Date(checkOut) <= new Date(checkIn)) {
      setError('Giờ ra phải sau giờ vào.');
      return;
    }
    if (!trimmedReason) {
      setError('Vui lòng nhập lý do điều chỉnh.');
      return;
    }
    const saved = await onSubmit(
      fromDateTimeInputValue(checkIn),
      checkOut ? fromDateTimeInputValue(checkOut) : null,
      trimmedReason
    );
    if (saved) onOpenChange(false);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Điều chỉnh công</DialogTitle>
          <DialogDescription>
            {employee?.fullName ?? record.employeeCode} • {formatWorkDate(record.workDate)} • {record.shiftName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="closing-check-in">Giờ vào</Label>
              <Input
                id="closing-check-in"
                type="datetime-local"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                className="border-[#E2E8F0]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="closing-check-out">Giờ ra</Label>
              <Input
                id="closing-check-out"
                type="datetime-local"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="border-[#E2E8F0]"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="closing-reason">Lý do điều chỉnh</Label>
            <Textarea
              id="closing-reason"
              value={reason}
              maxLength={REASON_MAX_LENGTH}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nêu rõ lý do điều chỉnh giờ vào hoặc giờ ra..."
              className="min-h-[96px] border-[#E2E8F0]"
            />
            <p className="text-right text-xs text-[#5C6670]">
              {reason.length}/{REASON_MAX_LENGTH}
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="bg-[#4F7284] text-white hover:bg-[#426071]"
          >
            Lưu đề xuất điều chỉnh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
