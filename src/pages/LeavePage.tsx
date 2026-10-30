import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  DEFAULT_LEAVE_FILTERS,
  getYearOptions,
  type LeaveFilters,
  type RolloverMode,
} from '@/features/leave/leaveRules';
import { LeaveBalanceTable } from '@/features/leave/components/LeaveBalanceTable';
import { LeaveFilterBar } from '@/features/leave/components/LeaveFilterBar';
import { LeaveKpiCards } from '@/features/leave/components/LeaveKpiCards';
import { LeaveRolloverDialog } from '@/features/leave/components/LeaveRolloverDialog';
import { useLeave } from '@/features/leave/useLeave';

const ROLLOVER_MODE_LABELS: Record<RolloverMode, string> = {
  reset: 'Xóa phép năm cũ',
  carry: 'Chuyển sang năm mới',
};

export function LeavePage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = getYearOptions(today);
  const [year, setYear] = useState(currentYear);
  const [filters, setFilters] = useState<LeaveFilters>(DEFAULT_LEAVE_FILTERS);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const leave = useLeave(year, filters);
  const lastRollover = leave.lastRollover;

  async function handleRollover(mode: RolloverMode) {
    const succeeded = await leave.runRollover(mode);
    if (succeeded) {
      toast({
        title: `Đã chốt sổ phép năm ${year}.`,
        description: `Số dư năm ${year + 1} đã được cập nhật theo cách: ${ROLLOVER_MODE_LABELS[mode]}.`,
      });
    }
    return succeeded;
  }

  const emptyMessage =
    leave.totalCount === 0
      ? 'Chưa có nhân viên nào trong danh sách.'
      : 'Không tìm thấy nhân viên phù hợp với bộ lọc.';

  return (
    <div className="print-area -mx-4 -my-6 flex min-h-full flex-col gap-6 bg-white px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <PageHeading groupTitle="Nhân sự" title="Sổ phép" />
          <p className="text-sm text-[#5C6670]">
            Theo dõi quỹ phép, tự động trừ phép theo lịch làm việc và chốt chuyển phép cuối năm.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setIsRolloverOpen(true)}
          disabled={leave.isLoading}
          className="h-10 bg-[#4F7284] text-white hover:bg-[#3F5C6C]"
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          Chốt sổ phép năm
        </Button>
      </div>

      {leave.loadError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {leave.loadError}
        </p>
      )}
      {leave.actionError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {leave.actionError}
        </p>
      )}

      <LeaveKpiCards kpis={leave.kpis} isLoading={leave.isLoading} />

      <LeaveFilterBar
        year={year}
        yearOptions={yearOptions}
        onYearChange={setYear}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <LeaveBalanceTable rows={leave.rows} isLoading={leave.isLoading} emptyMessage={emptyMessage} />
        </div>
        <p className="text-xs text-[#5C6670]">
          {lastRollover
            ? `Đã chốt sổ phép năm ${year} lúc ${new Date(lastRollover.executedAt).toLocaleString('vi-VN')} (${ROLLOVER_MODE_LABELS[lastRollover.mode]}).`
            : `Chưa chốt sổ phép năm ${year}.`}
        </p>
      </div>

      <LeaveRolloverDialog
        open={isRolloverOpen}
        onOpenChange={setIsRolloverOpen}
        year={year}
        isRolling={leave.isRolling}
        onConfirm={handleRollover}
      />
    </div>
  );
}
