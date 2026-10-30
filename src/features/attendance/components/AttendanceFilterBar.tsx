import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getPresetRange,
  matchRangePreset,
  type DateRange,
  type RangePreset,
} from '@/features/attendance/attendanceRules';

interface AttendanceFilterBarProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const PRESET_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'this-month', label: 'Tháng này' },
  { value: 'last-month', label: 'Tháng trước' },
  { value: 'last-7-days', label: '7 ngày gần nhất' },
  { value: 'all', label: 'Tất cả' },
];

export function AttendanceFilterBar({ range, onRangeChange }: AttendanceFilterBarProps) {
  const presetValue = matchRangePreset(range);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Khoảng thời gian</Label>
        <Select
          value={presetValue}
          onValueChange={(value) => onRangeChange(getPresetRange(value as RangePreset))}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Chọn khoảng thời gian">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            {presetValue === 'custom' && (
              <SelectItem value="custom" disabled>
                Tùy chỉnh
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="attendance-from" className="text-xs font-medium text-muted-foreground">
          Từ ngày
        </Label>
        <Input
          id="attendance-from"
          type="date"
          value={range.from ?? ''}
          max={range.to ?? undefined}
          onChange={(event) => onRangeChange({ ...range, from: event.target.value || null })}
          className="w-full sm:w-44"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="attendance-to" className="text-xs font-medium text-muted-foreground">
          Đến ngày
        </Label>
        <Input
          id="attendance-to"
          type="date"
          value={range.to ?? ''}
          min={range.from ?? undefined}
          onChange={(event) => onRangeChange({ ...range, to: event.target.value || null })}
          className="w-full sm:w-44"
        />
      </div>
    </div>
  );
}
