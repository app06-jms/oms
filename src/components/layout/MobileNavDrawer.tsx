import { Logo } from '@/components/layout/Logo';
import { NavTree } from '@/components/layout/NavTree';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 bg-card p-0 sm:max-w-xs">
        <SheetHeader className="flex h-16 flex-row items-center gap-2 border-b border-border px-5 text-left">
          <Logo />
          <SheetTitle className="text-base font-semibold tracking-tight text-foreground">OMS by Jenius</SheetTitle>
          <SheetDescription className="sr-only">Menu điều hướng chính</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <NavTree onNavigate={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
