import { useState } from 'react';
import { CalendarClock, Check, Loader2, RotateCcw, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { RolloverMode } from '@/features/leave/leaveRules';
import { cn } from '@/lib/utils';

interface LeaveRolloverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  isRolling: boolean;
  onConfirm: (mode: RolloverMode) => Promise<boolean>;
}

interface RolloverOption {
  mode: RolloverMode;
  title: string;
  description: string;
  icon: LucideIcon;
}

const OPTIONS: RolloverOption[] = [
  {
    mode: 'reset',
    title: 'Xóa phép năm cũ',
    description: 'Đưa số phép tồn về 0. Năm mới bắt đầu từ tháng 1 với 1 ngày phép tích lũy.',
    icon: RotateCcw,
  },
  {
    mode: 'carry',
    title: 'Chuyển sang năm mới',
    description: 'Giữ lại toàn bộ số phép còn lại làm phép tồn đầu kỳ của năm mới.',
    icon: CalendarClock,
  },
];

export function LeaveRolloverDialog({ open, onOpenChange, year, isRolling, onConfirm }: LeaveRolloverDialogProps) {
  const [mode, setMode] = useState<RolloverMode>('carry');
  const nextYear = year + 1;

  async function handleConfirm() {
    const succeeded = await onConfirm(mode);
    if (succeeded) onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isRolling) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg border-[#E2E8F0] bg-white sm:rounded-xl">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-semibold text-[#1F2A30]">Chốt sổ phép chuyển giao năm mới</DialogTitle>
          <DialogDescription className="text-sm text-[#5C6670]">
            Bạn muốn xử lý số ngày phép chưa sử dụng của năm {year} như thế nào? Lựa chọn sẽ áp dụng cho năm {nextYear}.
          </DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Cách xử lý phép tồn" className="flex flex-col gap-3">
          {OPTIONS.map((option) => {
            const selected = mode === option.mode;
            const Icon = option.icon;
            return (
              <button
                key={option.mode}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isRolling}
                onClick={() => setMode(option.mode)}
                className={cn(
                  'flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
                  selected
                    ? 'border-[#4F7284] bg-[#4F7284]/5 ring-1 ring-[#4F7284]'
                    : 'border-[#E2E8F0] bg-white hover:border-[#4F7284]/50 hover:bg-[#F8FAFC]'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    selected ? 'bg-[#4F7284] text-white' : 'bg-[#F8FAFC] text-[#4F7284]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-semibold text-[#1F2A30]">{option.title}</span>
                  <span className="text-sm text-[#5C6670]">{option.description}</span>
                </div>
                <span
                  className={cn(
                    'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    selected ? 'border-[#4F7284] bg-[#4F7284] text-white' : 'border-[#CBD5E1] bg-white'
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRolling}
            className="border-[#E2E8F0] text-[#1F2A30]"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isRolling}
            className="bg-[#4F7284] text-white hover:bg-[#3F5C6C]"
          >
            {isRolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận chốt phép
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
