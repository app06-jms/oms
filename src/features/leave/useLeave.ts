import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyLeaveFilters,
  buildLeaveKpis,
  buildLeaveRows,
  getYearRange,
  type LeaveFilters,
  type RolloverMode,
} from '@/features/leave/leaveRules';
import {
  fetchCarryOverByCode,
  fetchRolloverRecord,
  runLeaveRollover,
  type RolloverRecord,
} from '@/features/leave/leaveService';
import { fetchEmployees, fetchSchedules } from '@/features/schedule/scheduleService';
import type { Employee, ScheduleEntry } from '@/features/schedule/scheduleRules';

interface YearData {
  employees: Employee[];
  schedules: ScheduleEntry[];
  carryOverByCode: Map<string, number>;
  rollover: RolloverRecord | null;
}

export function useLeave(year: number, filters: LeaveFilters) {
  const [data, setData] = useState<YearData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const range = getYearRange(year);
    try {
      const [employees, schedules, carryOverByCode, rollover] = await Promise.all([
        fetchEmployees(),
        fetchSchedules(range.from, range.to),
        fetchCarryOverByCode(year),
        fetchRolloverRecord(year),
      ]);
      setData({ employees, schedules, carryOverByCode, rollover });
      setLoadError(null);
    } catch {
      setLoadError('Không thể tải sổ phép. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const allRows = useMemo(
    () => (data ? buildLeaveRows(data.employees, data.schedules, data.carryOverByCode, year) : []),
    [data, year]
  );
  const rows = useMemo(() => applyLeaveFilters(allRows, filters), [allRows, filters]);
  const kpis = useMemo(() => buildLeaveKpis(rows), [rows]);

  async function rollover(mode: RolloverMode): Promise<boolean> {
    setIsRolling(true);
    setActionError(null);
    try {
      await runLeaveRollover(year, mode);
      await refresh();
      return true;
    } catch {
      setActionError('Không thể chốt sổ phép. Vui lòng thử lại.');
      return false;
    } finally {
      setIsRolling(false);
    }
  }

  return {
    rows,
    kpis,
    totalCount: allRows.length,
    lastRollover: data?.rollover ?? null,
    isLoading,
    loadError,
    actionError,
    isRolling,
    runRollover: rollover,
  };
}
