import { supabase } from '@/lib/supabase';
import type { AdjustmentReason } from '@/config/attendance';
import {
  toDateKey,
  type AdjustmentStatus,
  type AttendanceAdjustmentRequest,
  type AttendanceRecord,
  type CheckInEvaluation,
  type DateRange,
  type OvertimeStatus,
} from '@/features/attendance/attendanceRules';

interface AttendanceRow {
  id: string;
  employee_code: string;
  shift_name: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  adjustment_status: AdjustmentStatus | null;
  adjustment_reason: AdjustmentReason | null;
  adjustment_note: string | null;
  ot_status: OvertimeStatus | null;
  updated_at: string;
}

const COLUMNS =
  'id, employee_code, shift_name, work_date, check_in_at, check_out_at, adjustment_status, adjustment_reason, adjustment_note, ot_status, updated_at';
const ADJUSTMENT_STATUSES: readonly string[] = ['pending', 'approved', 'rejected'];
const OVERTIME_STATUSES: readonly string[] = ['approved', 'rejected'];

function isAttendanceRow(value: unknown): value is AttendanceRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.employee_code === 'string' &&
    typeof row.shift_name === 'string' &&
    typeof row.work_date === 'string' &&
    typeof row.check_in_at === 'string' &&
    typeof row.updated_at === 'string' &&
    (row.check_out_at === null || typeof row.check_out_at === 'string') &&
    (row.adjustment_status === null ||
      (typeof row.adjustment_status === 'string' && ADJUSTMENT_STATUSES.includes(row.adjustment_status))) &&
    (row.adjustment_reason === null || typeof row.adjustment_reason === 'string') &&
    (row.adjustment_note === null || typeof row.adjustment_note === 'string') &&
    (row.ot_status === null || (typeof row.ot_status === 'string' && OVERTIME_STATUSES.includes(row.ot_status)))
  );
}

function toRecord(row: unknown): AttendanceRecord {
  if (!isAttendanceRow(row)) {
    throw new Error('Unexpected attendance data.');
  }
  return {
    id: row.id,
    employeeCode: row.employee_code,
    shiftName: row.shift_name,
    workDate: row.work_date,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
    adjustmentStatus: row.adjustment_status,
    adjustmentReason: row.adjustment_reason,
    adjustmentNote: row.adjustment_note,
    otStatus: row.ot_status,
    updatedAt: row.updated_at,
  };
}

export async function fetchAttendanceHistory(employeeCode: string | null, range: DateRange): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance_records')
    .select(COLUMNS)
    .order('work_date', { ascending: false })
    .order('check_in_at', { ascending: false });

  if (employeeCode) query = query.eq('employee_code', employeeCode);
  if (range.from) query = query.gte('work_date', range.from);
  if (range.to) query = query.lte('work_date', range.to);

  const { data, error } = await query;
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Unexpected attendance data.');
  return data.map(toRecord);
}

export async function fetchOpenAttendanceRecord(employeeCode: string): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(COLUMNS)
    .eq('employee_code', employeeCode)
    .is('check_out_at', null)
    .maybeSingle();

  if (error) throw error;
  return data ? toRecord(data) : null;
}

export async function insertCheckIn(
  employeeCode: string,
  evaluation: CheckInEvaluation,
  adjustment: AttendanceAdjustmentRequest | null
): Promise<void> {
  const { checkInAt, shift, scheduledStart } = evaluation;
  const { error } = await supabase.from('attendance_records').insert({
    employee_code: employeeCode,
    shift_name: shift.name,
    work_date: toDateKey(checkInAt),
    check_in_at: checkInAt.toISOString(),
    assigned_start_at: adjustment ? scheduledStart.toISOString() : null,
    adjustment_status: adjustment ? 'pending' : null,
    adjustment_reason: adjustment?.reason ?? null,
    adjustment_note: adjustment?.note ?? null,
  });

  if (error) throw error;
}

export async function updateCheckOut(recordId: string, checkOutAt: Date): Promise<void> {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({ check_out_at: checkOutAt.toISOString() })
    .eq('id', recordId)
    .is('check_out_at', null)
    .select('id');

  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No open shift to check out from.');
  }
}

export async function decideAttendanceAdjustment(recordId: string, decision: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase.rpc('decide_attendance_adjustment', {
    p_record_id: recordId,
    p_decision: decision,
  });

  if (error) throw error;
}
