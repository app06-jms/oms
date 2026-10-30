import { supabase } from '@/lib/supabase';
import type { RolloverMode } from '@/features/leave/leaveRules';

interface CarryOverRow {
  employee_code: string;
  carry_over_days: number;
}

interface RolloverRow {
  mode: RolloverMode;
  executed_at: string;
}

export interface RolloverRecord {
  mode: RolloverMode;
  executedAt: string;
}

function assertArray<T>(data: unknown): T[] {
  if (!Array.isArray(data)) throw new Error('Dữ liệu sổ phép không hợp lệ.');
  return data as T[];
}

export async function fetchCarryOverByCode(year: number): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('leave_carryovers')
    .select('employee_code, carry_over_days')
    .eq('year', year);

  if (error) throw error;
  return new Map(
    assertArray<CarryOverRow>(data).map((row) => [row.employee_code, Number(row.carry_over_days)])
  );
}

export async function fetchRolloverRecord(year: number): Promise<RolloverRecord | null> {
  const { data, error } = await supabase
    .from('leave_rollovers')
    .select('mode, executed_at')
    .eq('year', year)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const row = data as RolloverRow;
  return { mode: row.mode, executedAt: row.executed_at };
}

export async function runLeaveRollover(year: number, mode: RolloverMode): Promise<void> {
  const { error } = await supabase.rpc('rollover_leave_year', { p_year: year, p_mode: mode });
  if (error) throw error;
}
