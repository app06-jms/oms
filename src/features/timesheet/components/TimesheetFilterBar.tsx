import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS } from '@/config/schedule';
import type { DateRange } from '@/features/attendance/attendanceRules';
import {
  QUICK_RANGE_OPTIONS,
  TIMESHEET_STATUS_META,
  matchQuickRange,
  type QuickRangePreset,
  type TimesheetFilters,
  type TimesheetStatus,
} from '@/features/timesheet/timesheetRules';
import { cn } from '@/lib/utils';

interface TimesheetFilterBarProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  onPresetSelect: (preset: QuickRangePreset) => void;
  filters: TimesheetFilters;
  onFiltersChange: (filters: TimesheetFilters) => void;
}

const STATUS_OPTIONS: { value: TimesheetStatus; label: string }[] = [
  { value: 'valid', label: TIMESHEET_STATUS_META.valid.label },
  { value: 'off-shift', label: TIMESHEET_STATUS_META['off-shift'].label },
  { value: 'adjusted', label: TIMESHEET_STATUS_META.adjusted.label },
  { value: 'pending', label: TIMESHEET_STATUS_META.pending.label },
];

const selectTriggerClass = 'h-10 w-full border-[#E2E8F0] bg-white sm:w-[200px]';

export function TimesheetFilterBar({
  range,
  onRangeChange,
  onPresetSelect,
  filters,
  onFiltersChange,
}: TimesheetFilterBarProps) {
  const activePreset = matchQuickRange(range);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1">
          {QUICK_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPresetSelect(option.value)}
              aria-pressed={activePreset === option.value}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activePreset === option.value
                  ? 'bg-[#4F7284] text-white shadow-sm'
                  : 'text-[#5C6670] hover:bg-white hover:text-[#1F2A30]'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Từ ngày"
            value={range.from ?? ''}
            max={range.to ?? undefined}
            onChange={(event) => onRangeChange({ ...range, from: event.target.value || null })}
            className="h-10 w-[160px] border-[#E2E8F0] bg-white"
          />
          <span className="text-sm text-[#5C6670]">đến</span>
          <Input
            type="date"
            aria-label="Đến ngày"
            value={range.to ?? ''}
            min={range.from ?? undefined}
            onChange={(event) => onRangeChange({ ...range, to: event.target.value || null })}
            className="h-10 w-[160px] border-[#E2E8F0] bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Select value={filters.department} onValueChange={(value) => onFiltersChange({ ...filters, department: value })}>
          <SelectTrigger aria-label="Bộ phận" className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả bộ phận</SelectItem>
            {DEPARTMENTS.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as TimesheetFilters['status'] })}
        >
          <SelectTrigger aria-label="Trạng thái" className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-full lg:max-w-sm lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6670]" />
          <Input
            type="search"
            aria-label="Tìm nhân viên"
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            className="h-10 border-[#E2E8F0] bg-white pl-9"
          />
        </div>
      </div>
    </div>
  );
}
