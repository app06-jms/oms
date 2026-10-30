import { useState } from 'react';
import { CalendarClock, Lock, PencilLine } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PayrollPeriod } from '@/features/closing/closingService';
import { fromDateTimeInputValue, toDateTimeInputValue } from '@/features/closing/closingRules';
import { cn } from '@/lib/utils';

interface ClosingControlBarProps {
  period: string;
  payrollPeriod: PayrollPeriod;
  canLock: boolean;
  blockerCount: number;
  busyKey: string | null;
  isAdjustMode: boolean;
  onToggleAdjustMode: () => void;
  onDeadlineChange: (deadline: string | null) => void;
  onLock: () => void;
}

export function ClosingControlBar({
  period,
  payrollPeriod,
  canLock,
  blockerCount,
  busyKey,
  isAdjustMode,
  onToggleAdjustMode,
  onDeadlineChange,
  onLock,
}: ClosingControlBarProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isLocked = payrollPeriod.status === 'locked';
  const [month, year] = period.split('-');

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-col gap-1 text-xs font-medium text-[#5C6670]">
          Thời hạn xác nhận
          <span className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#4F7284]" />
            <Input
              type="datetime-local"
              aria-label="Thời hạn xác nhận"
              disabled={isLocked || busyKey === 'deadline'}
              value={toDateTimeInputValue(payrollPeriod.deadline)}
              onChange={(event) =>
                onDeadlineChange(event.target.value ? fromDateTimeInputValue(event.target.value) : null)
              }
              className="h-10 w-[220px] border-[#E2E8F0] bg-white text-sm text-[#1F2A30]"
            />
          </span>
        </label>
        <span
          className={cn(
            'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold',
            isLocked ? 'bg-success/10 text-success' : 'bg-pending/10 text-pending'
          )}
        >
          {isLocked ? 'Trạng thái: Đã khóa dữ liệu' : 'Trạng thái: Đang đối soát'}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          disabled={isLocked}
          onClick={onToggleAdjustMode}
          aria-pressed={isAdjustMode}
          className={cn('border-[#E2E8F0] bg-white', isAdjustMode && 'border-[#4F7284] text-[#4F7284]')}
        >
          <PencilLine className="h-4 w-4" />
          {isAdjustMode ? 'Thoát chế độ điều chỉnh' : 'Điều chỉnh công'}
        </Button>
        <Button
          disabled={isLocked || !canLock || busyKey === 'lock'}
          onClick={() => setIsConfirmOpen(true)}
          className="bg-[#4F7284] text-white hover:bg-[#426071]"
        >
          <Lock className="h-4 w-4" />
          Xác nhận chốt công
        </Button>
        {!isLocked && !canLock && (
          <p className="text-xs text-[#A15C00]">Còn {blockerCount} mục chưa duyệt trong kỳ.</p>
        )}
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chốt công tháng {month}/{year}?</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi chốt, dữ liệu chấm công của kỳ này sẽ bị khóa, không thể điều chỉnh hay duyệt thêm, và sẽ
              được chuyển sang Tổng hợp công tháng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={onLock}
              className="bg-[#4F7284] text-white hover:bg-[#426071]"
            >
              Xác nhận chốt công
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
