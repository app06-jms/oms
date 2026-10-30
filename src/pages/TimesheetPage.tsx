import { Link } from 'react-router-dom';
import { FileDown, ArrowRightLeft } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AdjustmentApprovalTable } from '@/features/timesheet/components/AdjustmentApprovalTable';
import { TimesheetFilterBar } from '@/features/timesheet/components/TimesheetFilterBar';
import { TimesheetLogTable } from '@/features/timesheet/components/TimesheetLogTable';
import { useTimesheet } from '@/features/timesheet/useTimesheet';

const CLOSING_PATH = '/nhan-su/chot-cong';

export function TimesheetPage() {
  const timesheet = useTimesheet();
  const closingSearch = new URLSearchParams({
    from: timesheet.range.from ?? '',
    to: timesheet.range.to ?? '',
    department: timesheet.filters.department,
    status: timesheet.filters.status,
  }).toString();

  async function handleDecide(recordId: string, decision: 'approved' | 'rejected') {
    const ok = await timesheet.decide(recordId, decision);
    if (!ok) return;
    toast({
      title:
        decision === 'approved'
          ? 'Đã duyệt đề xuất. Ca làm việc được chuyển sang Điều chỉnh ca.'
          : 'Đã từ chối đề xuất. Chấm công được ghi nhận là Lệch ca.',
    });
  }

  return (
    <div
      className="print-area -mx-4 -my-6 flex min-h-full flex-col gap-6 bg-white px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <PageHeading groupTitle="Nhân sự" title="Bảng chấm công" />
          <p className="text-sm text-[#5C6670]">
            Tổng hợp nhật ký chấm công, xem duyệt đề xuất điều chỉnh và kết xuất báo cáo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()} className="border-[#E2E8F0] bg-white">
            <FileDown className="h-4 w-4" />
            Xuất báo cáo PDF
          </Button>
          <Button asChild className="bg-[#4F7284] text-white hover:bg-[#426071]">
            <Link to={`${CLOSING_PATH}?${closingSearch}`}>
              <ArrowRightLeft className="h-4 w-4" />
              Chuyển dữ liệu sang Chốt công
            </Link>
          </Button>
        </div>
      </div>

      <TimesheetFilterBar
        range={timesheet.range}
        onRangeChange={timesheet.setRange}
        onPresetSelect={timesheet.applyQuickRange}
        filters={timesheet.filters}
        onFiltersChange={timesheet.setFilters}
      />

      {timesheet.loadError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {timesheet.loadError}
        </p>
      )}

      {timesheet.decisionError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {timesheet.decisionError}
        </p>
      )}

      <Tabs defaultValue="log" className="flex flex-col gap-4">
        <TabsList className="h-auto w-fit justify-start gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 print:hidden">
          <TabsTrigger value="log" className="data-[state=active]:bg-white data-[state=active]:text-[#1F2A30]">
            Bảng dữ liệu chấm công
          </TabsTrigger>
          <TabsTrigger
            value="approval"
            className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1F2A30]"
          >
            Duyệt đề xuất điều chỉnh
            <span className="rounded-full bg-pending/10 px-2 py-0.5 text-xs font-semibold text-pending">
              Chờ duyệt ({timesheet.pendingRows.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <TimesheetLogTable rows={timesheet.rows} isLoading={timesheet.isLoading} />
        </TabsContent>

        <TabsContent value="approval" className="mt-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <AdjustmentApprovalTable
            rows={timesheet.pendingRows}
            isLoading={timesheet.isLoading}
            decidingId={timesheet.decidingId}
            onDecide={handleDecide}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
