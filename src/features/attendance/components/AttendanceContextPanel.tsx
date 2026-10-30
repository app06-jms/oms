import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { CURRENT_EMPLOYEE, HOTEL_GEOFENCE, SHIFTS, SIMULATED_POSITIONS } from '@/config/attendance';
import { distanceInMeters } from '@/lib/geo';
import { formatShiftHours } from '@/features/attendance/attendanceRules';
import { cn } from '@/lib/utils';

interface AttendanceContextPanelProps {
  isInRange: boolean;
  isDeviceValid: boolean;
}

export function AttendanceContextPanel({ isInRange, isDeviceValid }: AttendanceContextPanelProps) {
  const simulatedPosition = isInRange ? SIMULATED_POSITIONS.inRange : SIMULATED_POSITIONS.outOfRange;
  const distance = Math.round(distanceInMeters(HOTEL_GEOFENCE.center, simulatedPosition));
  const initials = CURRENT_EMPLOYEE.fullName
    .split(' ')
    .slice(-2)
    .map((word) => word[0])
    .join('');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{CURRENT_EMPLOYEE.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {CURRENT_EMPLOYEE.position} · {CURRENT_EMPLOYEE.department}
          </p>
          <p className="text-xs text-muted-foreground">Mã nhân viên: {CURRENT_EMPLOYEE.code}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-md border border-border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ca hôm nay</p>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-base font-semibold text-foreground">{SHIFTS.day.name}</p>
          <p className="text-sm tabular-nums text-muted-foreground">{formatShiftHours(SHIFTS.day)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <VerificationRow
          isValid={isInRange}
          validText="GPS: Hợp lệ"
          invalidText="GPS: Ngoài bán kính"
          detail={`Cách ${HOTEL_GEOFENCE.name} khoảng ${distance} m (cho phép ${HOTEL_GEOFENCE.radiusMeters} m)`}
        />
        <VerificationRow
          isValid={isDeviceValid}
          validText="Thiết bị: Đã xác thực"
          invalidText="Thiết bị: Chưa xác thực"
        />
      </div>
    </div>
  );
}

interface VerificationRowProps {
  isValid: boolean;
  validText: string;
  invalidText: string;
  detail?: string;
}

function VerificationRow({ isValid, validText, invalidText, detail }: VerificationRowProps) {
  const Icon = isValid ? CheckCircle2 : TriangleAlert;

  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isValid ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{isValid ? validText : invalidText}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}
