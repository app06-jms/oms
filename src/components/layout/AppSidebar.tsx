import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NavTree } from '@/components/layout/NavTree';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        'sticky top-16 hidden h-[calc(100vh-4rem)] flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out lg:flex',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-3' : 'px-4')}>
        <NavTree collapsed={collapsed} />
      </div>
      <div className={cn('border-t border-border p-3', collapsed && 'flex justify-center')}>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          className={cn('text-foreground hover:bg-background/60', !collapsed && 'w-full justify-start gap-3')}
        >
          <ToggleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="text-sm font-medium">Thu gọn menu</span>}
        </Button>
      </div>
    </aside>
  );
}
