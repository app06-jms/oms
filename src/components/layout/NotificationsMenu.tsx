import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function NotificationsMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Thông báo" className="text-foreground">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Thông báo</h2>
        </div>
        <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">Chưa có thông báo mới</p>
          <p className="text-sm text-muted-foreground">Các cập nhật quan trọng sẽ hiển thị tại đây.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
