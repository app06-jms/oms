import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const currentUser = {
  name: 'Quản trị viên',
  role: 'Quản lý hệ thống',
  initials: 'QT',
};

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2 text-foreground" aria-label="Tài khoản">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {currentUser.initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-left md:block">
            <span className="block text-sm font-medium leading-tight">{currentUser.name}</span>
            <span className="block text-xs text-muted-foreground">{currentUser.role}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground">{currentUser.role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
          Hồ sơ cá nhân
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
