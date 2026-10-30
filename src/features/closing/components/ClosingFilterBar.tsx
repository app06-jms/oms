import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS } from '@/config/schedule';
import type { ClosingFilters } from '@/features/closing/closingRules';
import type { TimesheetStatus } from '@/features/timesheet/timesheetRules';

interface ClosingFilterBarProps {
  filters: ClosingFilters;
  onFiltersChange: (filters: ClosingFilters) => void;
}

const STATUS_OPTIONS: { value: TimesheetStatus; label: string }[] = [
  { value: 'off-shift', label: 'Lệch ca' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'valid', label: 'Hợp lệ' },
  { value: 'adjusted', label: 'Đã điều chỉnh' },
];

const selectTriggerClass = 'h-10 w-full border-[#E2E8F0] bg-white sm:w-[200px]';

export function ClosingFilterBar({ filters, onFiltersChange }: ClosingFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm print:hidden lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as ClosingFilters['status'] })}
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
      </div>

      <div className="relative w-full lg:w-[360px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6670]" />
        <Input
          type="search"
          aria-label="Tìm nhân viên"
          placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          className="h-10 border-[#E2E8F0] bg-white pl-9"
        />
      </div>
    </div>
  );
}
