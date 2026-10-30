import { LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatClockTime, type AttendanceRecord } from '@/features/attendance/attendanceRules';
import { cn } from '@/lib/utils';

interface AttendanceActionPanelProps {
  openRecord: AttendanceRecord | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isInRange: boolean;
  isDeviceValid: boolean;
  error: string | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function AttendanceActionPanel({
  openRecord,
  isLoading,
  isSubmitting,
  isInRange,
  isDeviceValid,
  error,
  onCheckIn,
  onCheckOut,
}: AttendanceActionPanelProps) {
  const isCheckedIn = openRecord !== null;
  const isActionDisabled = !isInRange || !isDeviceValid || isSubmitting || isLoading;

  let subtext: string;
  if (openRecord) {
    subtext = `Đã vào ca lúc: ${formatClockTime(openRecord.checkInAt)}`;
  } else if (!isInRange) {
    subtext = 'Bạn cần đứng trong bán kính khách sạn để chấm công.';
  } else {
    subtext = 'Nhấn "Vào ca" khi bắt đầu ca làm việc.';
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <LiveClock />

      <Badge
        className={cn(
          'border-transparent px-4 py-1.5 text-sm hover:bg-transparent',
          isCheckedIn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        Trạng thái: {isCheckedIn ? 'Đang trong ca' : 'Chưa vào ca'}
      </Badge>

      <div className="flex w-full flex-col gap-3">
        <Button
          size="lg"
          disabled={isActionDisabled}
          onClick={isCheckedIn ? onCheckOut : onCheckIn}
          className={cn(
            'h-16 w-full gap-3 rounded-lg text-lg font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]',
            isCheckedIn ? 'bg-pending hover:bg-pending/90' : 'bg-success hover:bg-success/90'
          )}
        >
          {isCheckedIn ? <LogOut className="h-6 w-6" aria-hidden="true" /> : <LogIn className="h-6 w-6" aria-hidden="true" />}
          {isSubmitting ? 'Đang xử lý...' : isCheckedIn ? 'Ra ca' : 'Vào ca'}
        </Button>

        <p className="text-sm text-muted-foreground">{isLoading ? 'Đang tải trạng thái ca...' : subtext}</p>

        {!isDeviceValid && (
          <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-sm font-medium text-error">
            Thiết bị không hợp lệ. Vui lòng dùng điện thoại đã đăng ký.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const date = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-5xl font-semibold tabular-nums tracking-tight text-foreground">{time}</p>
      <p className="text-sm capitalize text-muted-foreground">{date}</p>
    </div>
  );
}
