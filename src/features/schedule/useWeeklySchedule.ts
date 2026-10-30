import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ShiftCode } from '@/config/schedule';
import { toDateKey } from '@/features/attendance/attendanceRules';
import {
  addDays,
  getWeekDates,
  getWeekStart,
  type Employee,
  type ScheduleEntry,
} from '@/features/schedule/scheduleRules';
import {
  fetchEmployees,
  fetchSchedules,
  upsertShiftAssignments,
} from '@/features/schedule/scheduleService';

export type DepartmentFilter = 'all' | string;

export function useWeeklySchedule() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [department, setDepartment] = useState<DepartmentFilter>('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [employeeList, scheduleList] = await Promise.all([
        fetchEmployees(),
        fetchSchedules(toDateKey(weekStart), toDateKey(addDays(weekStart, 6))),
      ]);
      setEmployees(employeeList);
      setSchedules(scheduleList);
      setError(null);
    } catch {
      setError('Không thể tải lịch làm việc. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visibleEmployees = useMemo(
    () => (department === 'all' ? employees : employees.filter((item) => item.department === department)),
    [employees, department]
  );

  const scheduleByKey = useMemo(() => {
    const map = new Map<string, ScheduleEntry>();
    for (const entry of schedules) {
      map.set(`${entry.employeeCode}|${entry.workDate}`, entry);
    }
    return map;
  }, [schedules]);

  const saveShift = useCallback(
    async (employeeCode: string, workDate: string, shiftCode: ShiftCode) => {
      await upsertShiftAssignments([{ employeeCode, workDate, shiftCode }]);
      await reload();
    },
    [reload]
  );

  const shiftWeek = useCallback((days: number) => {
    setWeekStart((current) => addDays(current, days));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setWeekStart(getWeekStart(new Date()));
  }, []);

  return {
    weekStart,
    weekDates,
    shiftWeek,
    goToCurrentWeek,
    department,
    setDepartment,
    employees,
    visibleEmployees,
    scheduleByKey,
    isLoading,
    error,
    reload,
    saveShift,
  };
}
