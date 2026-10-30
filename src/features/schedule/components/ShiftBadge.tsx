import { cn } from '@/lib/utils';
import type { ShiftCode } from '@/config/schedule';
import { SCHEDULE_SHIFTS, WORKING_SHIFT_CODES } from '@/config/schedule';
import { formatCheckStatus, type CheckStatus } from '@/features/schedule/scheduleRules';

const WORKING_SHIFT_TONE = 'bg-[#E0F2FE] font-semibold text-[#0369A1]';
const LEAVE_SHIFT_TONE = 'bg-[#F1F5F9] font-medium text-[#475569]';

const STATUS_TONE_CLASSES: Record<CheckStatus, string> = {
  on_shift: 'text-success',
  mismatch: 'text-error',
  pending_adjustment: 'text-pending',
  adjusted: 'text-primary',
};

interface ShiftBadgeProps {
  shiftCode: ShiftCode;
  className?: string;
}

export function ShiftBadge({ shiftCode, className }: ShiftBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-12 items-center justify-center rounded-md px-2.5 py-1 text-xs tracking-wide',
        WORKING_SHIFT_CODES.includes(shiftCode) ? WORKING_SHIFT_TONE : LEAVE_SHIFT_TONE,
        className
      )}
    >
      {SCHEDULE_SHIFTS[shiftCode].code}
    </span>
  );
}

interface ShiftStatusTextProps {
  status: CheckStatus;
  className?: string;
}

export function ShiftStatusText({ status, className }: ShiftStatusTextProps) {
  return (
    <span className={cn('text-xs font-medium', STATUS_TONE_CLASSES[status], className)}>
      {formatCheckStatus(status)}
    </span>
  );
}
