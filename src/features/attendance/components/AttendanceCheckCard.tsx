import { AttendanceActionPanel } from '@/features/attendance/components/AttendanceActionPanel';
import { AttendanceContextPanel } from '@/features/attendance/components/AttendanceContextPanel';
import { DevToolsPanel } from '@/features/attendance/components/DevToolsPanel';
import type { AttendanceRecord } from '@/features/attendance/attendanceRules';

interface AttendanceCheckCardProps {
  openRecord: AttendanceRecord | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isInRange: boolean;
  isDeviceValid: boolean;
  error: string | null;
  onInRangeChange: (inRange: boolean) => void;
  onDeviceValidChange: (isValid: boolean) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function AttendanceCheckCard(props: AttendanceCheckCardProps) {
  const { isInRange, isDeviceValid, onInRangeChange, onDeviceValidChange, ...actionProps } = props;

  return (
    <section className="grid overflow-hidden rounded-lg border border-border bg-background shadow-sm lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-8 border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
        <AttendanceContextPanel isInRange={isInRange} isDeviceValid={isDeviceValid} />
        <DevToolsPanel
          isInRange={isInRange}
          isDeviceValid={isDeviceValid}
          onInRangeChange={onInRangeChange}
          onDeviceValidChange={onDeviceValidChange}
        />
      </div>
      <div className="p-6 sm:p-8">
        <AttendanceActionPanel isInRange={isInRange} isDeviceValid={isDeviceValid} {...actionProps} />
      </div>
    </section>
  );
}
