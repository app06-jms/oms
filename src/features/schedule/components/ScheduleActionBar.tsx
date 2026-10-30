import { Check, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEPARTMENTS } from '@/config/schedule';
import type { DepartmentFilter } from '@/features/schedule/useWeeklySchedule';

interface ScheduleActionBarProps {
  rangeLabel: string;
  summary: string;
  isCurrentWeek: boolean;
  department: DepartmentFilter;
  isEditing: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onGoToCurrentWeek: () => void;
  onDepartmentChange: (department: DepartmentFilter) => void;
  onToggleEditing: () => void;
}

export function ScheduleActionBar({
  rangeLabel,
  summary,
  isCurrentWeek,
  department,
  isEditing,
  onPreviousWeek,
  onNextWeek,
  onGoToCurrentWeek,
  onDepartmentChange,
  onToggleEditing,
}: ScheduleActionBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreviousWeek} aria-label="Tuần trước">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[12rem] text-center text-sm font-medium tabular-nums text-[#1E293B]">
            {rangeLabel}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextWeek} aria-label="Tuần sau">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onGoToCurrentWeek}
          disabled={isCurrentWeek}
          className="border-[#E2E8F0] text-[#1E293B]"
        >
          Tuần này
        </Button>

        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Lọc theo bộ phận">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả bộ phận</SelectItem>
            {DEPARTMENTS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">
        <span className="text-sm font-medium text-[#475569]">{summary}</span>
        <Button variant={isEditing ? 'default' : 'secondary'} onClick={onToggleEditing} aria-pressed={isEditing}>
          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? 'Xong chỉnh sửa' : 'Chỉnh sửa lịch'}
        </Button>
      </div>
    </div>
  );
}
