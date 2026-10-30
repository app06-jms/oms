import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatClockTime,
  formatWorkDate,
  getAdjustmentReasonLabel,
} from '@/features/attendance/attendanceRules';
import { EmployeeCell } from '@/features/timesheet/components/EmployeeCell';
import { getAssignedShiftLabel, type TimesheetRow } from '@/features/timesheet/timesheetRules';

interface AdjustmentApprovalTableProps {
  rows: TimesheetRow[];
  isLoading: boolean;
  decidingId: string | null;
  onDecide: (recordId: string, decision: 'approved' | 'rejected') => void;
}

const COLUMN_COUNT = 6;

export function AdjustmentApprovalTable({ rows, isLoading, decidingId, onDecide }: AdjustmentApprovalTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[#5C6670]">Ngày</TableHead>
            <TableHead className="text-[#5C6670]">Tên nhân viên</TableHead>
            <TableHead className="text-[#5C6670]">Ca phân công</TableHead>
            <TableHead className="text-[#5C6670]">Giờ vào / ra thực tế</TableHead>
            <TableHead className="text-[#5C6670]">Lý do giải trình</TableHead>
            <TableHead className="text-right text-[#5C6670]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-[#5C6670]">
                Đang tải đề xuất điều chỉnh...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-[#5C6670]">
                Không có đề xuất điều chỉnh nào đang chờ duyệt.
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            rows.map((row) => {
              const { record } = row;
              const isDeciding = decidingId === record.id;
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium tabular-nums text-[#1F2A30]">
                    {formatWorkDate(record.workDate)}
                  </TableCell>
                  <TableCell>
                    <EmployeeCell row={row} />
                  </TableCell>
                  <TableCell className="text-[#1F2A30]">{getAssignedShiftLabel(record)}</TableCell>
                  <TableCell className="tabular-nums text-[#1F2A30]">
                    {formatClockTime(record.checkInAt)} / {record.checkOutAt ? formatClockTime(record.checkOutAt) : '--:--'}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <p className="text-sm font-medium text-[#1F2A30]">
                      {record.adjustmentReason ? getAdjustmentReasonLabel(record.adjustmentReason) : '--'}
                    </p>
                    {record.adjustmentNote && (
                      <p className="mt-1 text-sm text-[#5C6670] line-clamp-2">{record.adjustmentNote}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={isDeciding}
                        onClick={() => onDecide(record.id, 'approved')}
                        className="bg-[#2F7A4B] text-white hover:bg-[#276640]"
                      >
                        <Check className="h-4 w-4" />
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDeciding}
                        onClick={() => onDecide(record.id, 'rejected')}
                        className="border-[#B4533C] text-[#B4533C] hover:bg-[#B4533C]/10 hover:text-[#B4533C]"
                      >
                        <X className="h-4 w-4" />
                        Từ chối
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
