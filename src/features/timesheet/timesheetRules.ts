import { LATE_TOLERANCE_MINUTES, SHIFTS } from '@/config/attendance';
import {
  formatShiftHours,
  getAttendanceStatus,
  getCheckTiming,
  getPresetRange,
  toDateKey,
  type AttendanceRecord,
  type DateRange,
} from '@/features/attendance/attendanceRules';
import { addDays, getWeekStart, type Employee } from '@/features/schedule/scheduleRules';

export type TimesheetStatus = 'valid' | 'off-shift' | 'adjusted' | 'pending' | 'in-progress';
export type QuickRangePreset = 'today' | 'this-week' | 'this-month';

export interface TimesheetFilters {
  department: string;
  status: TimesheetStatus | 'all';
  search: string;
}

export interface TimesheetRow {
  record: AttendanceRecord;
  employee: Employee | null;
  status: TimesheetStatus;
}

export const TIMESHEET_STATUS_META: Record<TimesheetStatus, { label: string; className: string }> = {
  valid: { label: 'Hợp lệ', className: 'bg-success/10 text-success' },
  'off-shift': { label: 'Lệch ca', className: 'bg-error/10 text-error' },
  adjusted: { label: 'Điều chỉnh ca', className: 'bg-[#DBEAFE] text-[#1D4ED8]' },
  pending: { label: 'Chờ duyệt', className: 'bg-pending/10 text-pending' },
  'in-progress': { label: 'Đang trong ca', className: 'bg-muted text-muted-foreground' },
};

export const QUICK_RANGE_OPTIONS: { value: QuickRangePreset; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'this-week', label: 'Tuần này' },
  { value: 'this-month', label: 'Tháng này' },
];

export function getQuickRange(preset: QuickRangePreset, today: Date = new Date()): DateRange {
  if (preset === 'today') {
    const key = toDateKey(today);
    return { from: key, to: key };
  }
  if (preset === 'this-week') {
    const start = getWeekStart(today);
    return { from: toDateKey(start), to: toDateKey(addDays(start, 6)) };
  }
  return getPresetRange('this-month', today);
}

export function matchQuickRange(range: DateRange, today: Date = new Date()): QuickRangePreset | null {
  const match = QUICK_RANGE_OPTIONS.find(({ value }) => {
    const presetRange = getQuickRange(value, today);
    return presetRange.from === range.from && presetRange.to === range.to;
  });
  return match?.value ?? null;
}

export function getTimesheetStatus(record: AttendanceRecord): TimesheetStatus {
  if (record.adjustmentStatus === 'approved') return 'adjusted';
  if (record.adjustmentStatus === 'rejected') return 'off-shift';
  if (record.adjustmentStatus === 'pending') return 'pending';
  if (!record.checkOutAt) return 'in-progress';
  return getAttendanceStatus(record) === 'off-shift' ? 'off-shift' : 'valid';
}

export function getTimingNote(record: AttendanceRecord): string {
  const { lateMinutes, earlyMinutes } = getCheckTiming(record);
  const parts: string[] = [];
  if (lateMinutes > LATE_TOLERANCE_MINUTES) parts.push(`Trễ ${lateMinutes} phút`);
  if (earlyMinutes !== null && earlyMinutes > LATE_TOLERANCE_MINUTES) parts.push(`Về sớm ${earlyMinutes} phút`);
  return parts.length > 0 ? parts.join(' · ') : 'Đúng giờ';
}

export function getAssignedShiftLabel(record: AttendanceRecord): string {
  const shift = Object.values(SHIFTS).find((item) => item.name === record.shiftName);
  return shift ? `${shift.name} (${formatShiftHours(shift)})` : record.shiftName;
}

export function buildTimesheetRows(records: AttendanceRecord[], employees: Employee[]): TimesheetRow[] {
  const employeeByCode = new Map(employees.map((employee) => [employee.code, employee]));
  return records
    .map((record) => ({
      record,
      employee: employeeByCode.get(record.employeeCode) ?? null,
      status: getTimesheetStatus(record),
    }))
    .sort((a, b) => new Date(b.record.updatedAt).getTime() - new Date(a.record.updatedAt).getTime());
}

export function filterTimesheetRows(rows: TimesheetRow[], filters: TimesheetFilters): TimesheetRow[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter(({ record, employee, status }) => {
    if (filters.department !== 'all' && employee?.department !== filters.department) return false;
    if (filters.status !== 'all' && status !== filters.status) return false;
    if (query) {
      const name = employee?.fullName.toLowerCase() ?? '';
      const code = record.employeeCode.toLowerCase();
      if (!name.includes(query) && !code.includes(query)) return false;
    }
    return true;
  });
}
