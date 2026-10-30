import { ChevronDown, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface DevToolsPanelProps {
  isInRange: boolean;
  isDeviceValid: boolean;
  onInRangeChange: (inRange: boolean) => void;
  onDeviceValidChange: (isValid: boolean) => void;
}

export function DevToolsPanel({ isInRange, isDeviceValid, onInRangeChange, onDeviceValidChange }: DevToolsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-dashed border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <span className="flex items-center gap-2">
          <Wrench className="h-4 w-4" aria-hidden="true" />
          Dev Tools
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="flex flex-col gap-4 border-t border-dashed border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <Label htmlFor="gps-simulation" className="text-sm text-foreground">
                Giả lập GPS
              </Label>
              <span className="text-xs text-muted-foreground">{isInRange ? 'Trong bán kính' : 'Ngoài bán kính'}</span>
            </div>
            <Switch id="gps-simulation" checked={isInRange} onCheckedChange={onInRangeChange} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <Label htmlFor="device-simulation" className="text-sm text-foreground">
                Giả lập Thiết bị
              </Label>
              <span className="text-xs text-muted-foreground">{isDeviceValid ? 'Đúng thiết bị' : 'Thiết bị khác'}</span>
            </div>
            <Switch id="device-simulation" checked={isDeviceValid} onCheckedChange={onDeviceValidChange} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
