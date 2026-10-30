import { LEAVE_ACCRUAL_PER_MONTH } from '@/config/leave';
import { toDateKey } from '@/features/attendance/attendanceRules';
import type { Employee, ScheduleEntry } from '@/features/schedule/scheduleRules';
import { normalizeSearchText } from '@/lib/text';

export type RolloverMode = 'reset' | 'carry';

export interface LeaveRow {
  employee: Employee;
  carryOverDays: number;
  accruedDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface LeaveFilters {
  department: string;
  search: string;
}

export interface LeaveKpis {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export const DEFAULT_LEAVE_FILTERS: LeaveFilters = { department: 'all', search: '' };

export function getAccruedDays(year: number, today: Date = new Date()): number {
  const currentYear = today.getFullYear();
  if (year < currentYear) return 12 * LEAVE_ACCRUAL_PER_MONTH;
  if (year === currentYear) return (today.getMonth() + 1) * LEAVE_ACCRUAL_PER_MONTH;
  return 0;
}

export function getYearOptions(today: Date = new Date()): number[] {
  const current = today.getFullYear();
  return [current - 2, current - 1, current, current + 1];
}

export function getYearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: toDateKey(new Date(year, 11, 31)) };
}

export function buildLeaveRows(
  employees: Employee[],
  schedules: ScheduleEntry[],
  carryOverByCode: Map<string, number>,
  year: number,
  today: Date = new Date()
): LeaveRow[] {
  const accruedDays = getAccruedDays(year, today);
  const usedByCode = new Map<string, number>();
  for (const entry of schedules) {
    if (entry.shiftCode !== 'P') continue;
    usedByCode.set(entry.employeeCode, (usedByCode.get(entry.employeeCode) ?? 0) + 1);
  }

  return [...employees]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((employee) => {
      const carryOverDays = carryOverByCode.get(employee.code) ?? 0;
      const usedDays = usedByCode.get(employee.code) ?? 0;
      return {
        employee,
        carryOverDays,
        accruedDays,
        usedDays,
        remainingDays: carryOverDays + accruedDays - usedDays,
      };
    });
}

export function applyLeaveFilters(rows: LeaveRow[], filters: LeaveFilters): LeaveRow[] {
  const query = normalizeSearchText(filters.search);
  return rows.filter(({ employee }) => {
    if (filters.department !== 'all' && employee.department !== filters.department) return false;
    if (!query) return true;
    return (
      normalizeSearchText(employee.fullName).includes(query) || normalizeSearchText(employee.code).includes(query)
    );
  });
}

export function buildLeaveKpis(rows: LeaveRow[]): LeaveKpis {
  return {
    totalDays: rows.reduce((sum, row) => sum + row.carryOverDays + row.accruedDays, 0),
    usedDays: rows.reduce((sum, row) => sum + row.usedDays, 0),
    remainingDays: rows.reduce((sum, row) => sum + row.remainingDays, 0),
  };
}
