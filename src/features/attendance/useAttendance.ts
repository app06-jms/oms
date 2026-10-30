import { useCallback, useEffect, useState } from 'react';
import { CURRENT_EMPLOYEE } from '@/config/attendance';
import {
  evaluateCheckIn,
  type AttendanceAdjustmentRequest,
  type AttendanceRecord,
  type CheckInEvaluation,
  type DateRange,
} from '@/features/attendance/attendanceRules';
import {
  fetchAttendanceHistory,
  fetchOpenAttendanceRecord,
  insertCheckIn,
  updateCheckOut,
} from '@/features/attendance/attendanceService';

export function useAttendance(range: DateRange) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [openRecord, setOpenRecord] = useState<AttendanceRecord | null>(null);
  const [pendingCheckIn, setPendingCheckIn] = useState<CheckInEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [history, open] = await Promise.all([
        fetchAttendanceHistory(CURRENT_EMPLOYEE.code, range),
        fetchOpenAttendanceRecord(CURRENT_EMPLOYEE.code),
      ]);
      setRecords(history);
      setOpenRecord(open);
      setError(null);
    } catch {
      setError('Không thể tải dữ liệu chấm công. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const checkIn = useCallback(async () => {
    const evaluation = evaluateCheckIn(new Date());
    if (evaluation.timing !== 'on-time') {
      setPendingCheckIn(evaluation);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await insertCheckIn(CURRENT_EMPLOYEE.code, evaluation, null);
      await refresh();
    } catch {
      setError('Không thể vào ca. Vui lòng thử lại.');
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [refresh]);

  const submitAdjustment = useCallback(
    async (request: AttendanceAdjustmentRequest): Promise<boolean> => {
      if (!pendingCheckIn) return false;
      setIsSubmitting(true);
      setError(null);
      try {
        await insertCheckIn(CURRENT_EMPLOYEE.code, pendingCheckIn, request);
        setPendingCheckIn(null);
        await refresh();
        return true;
      } catch {
        setError('Không thể gửi đề xuất. Vui lòng thử lại.');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [pendingCheckIn, refresh]
  );

  const dismissAdjustment = useCallback(() => setPendingCheckIn(null), []);

  const checkOut = useCallback(async () => {
    if (!openRecord) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateCheckOut(openRecord.id, new Date());
      await refresh();
    } catch {
      setError('Không thể ra ca. Vui lòng thử lại.');
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [openRecord, refresh]);

  return {
    records,
    openRecord,
    pendingCheckIn,
    isLoading,
    isSubmitting,
    error,
    checkIn,
    checkOut,
    submitAdjustment,
    dismissAdjustment,
  };
}
