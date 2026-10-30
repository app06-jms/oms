import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatClockTime,
  formatWorkDate,
  formatWorkedDuration,
  getWorkedMs,
} from '@/features/attendance/attendanceRules';
import { EmployeeCell } from '@/features/timesheet/components/EmployeeCell';
import {
  TIMESHEET_STATUS_META,
  getTimingNote,
  type TimesheetRow,
} from '@/features/timesheet/timesheetRules';
import { cn } from '@/lib/utils';

interface TimesheetLogTableProps {
  rows: TimesheetRow[];
  isLoading: boolean;
}

const COLUMN_COUNT = 7;

export function TimesheetLogTable({ rows, isLoading }: TimesheetLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[#5C6670]">Ngày</TableHead>
            <TableHead className="text-[#5C6670]">Tên nhân viên</TableHead>
            <TableHead className="text-[#5C6670]">Giờ vào ca</TableHead>
            <TableHead className="text-[#5C6670]">Giờ ra ca</TableHead>
            <TableHead className="text-[#5C6670]">Trạng thái</TableHead>
            <TableHead className="text-[#5C6670]">Tổng giờ làm</TableHead>
            <TableHead className="text-[#5C6670]">Đi trễ / Về sớm</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-[#5C6670]">
                Đang tải bảng chấm công...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-[#5C6670]">
                Không có dữ liệu chấm công phù hợp bộ lọc.
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            rows.map((row) => {
              const { record, status } = row;
              const meta = TIMESHEET_STATUS_META[status];
              const workedMs = getWorkedMs(record);
              const timingNote = getTimingNote(record);
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium tabular-nums text-[#1F2A30]">
                    {formatWorkDate(record.workDate)}
                  </TableCell>
                  <TableCell>
                    <EmployeeCell row={row} />
                  </TableCell>
                  <TableCell className="tabular-nums text-[#1F2A30]">{formatClockTime(record.checkInAt)}</TableCell>
                  <TableCell className="tabular-nums text-[#1F2A30]">
                    {record.checkOutAt ? formatClockTime(record.checkOutAt) : '--:--'}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('border-transparent hover:bg-transparent', meta.className)}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-[#1F2A30]">
                    {workedMs === null ? '--' : formatWorkedDuration(workedMs)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-sm',
                      timingNote === 'Đúng giờ' ? 'text-[#5C6670]' : 'font-medium text-[#B4533C]'
                    )}
                  >
                    {timingNote}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
