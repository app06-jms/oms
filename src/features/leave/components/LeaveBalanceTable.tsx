import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LeaveRow } from '@/features/leave/leaveRules';
import { getInitials } from '@/lib/text';
import { cn } from '@/lib/utils';

interface LeaveBalanceTableProps {
  rows: LeaveRow[];
  isLoading: boolean;
  emptyMessage: string;
}

const COLUMN_COUNT = 8;

function formatDays(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
}

export function LeaveBalanceTable({ rows, isLoading, emptyMessage }: LeaveBalanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[60px] text-[#5C6670]">STT</TableHead>
            <TableHead className="text-[#5C6670]">Mã NV</TableHead>
            <TableHead className="text-[#5C6670]">Nhân viên</TableHead>
            <TableHead className="text-[#5C6670]">Bộ phận</TableHead>
            <TableHead className="text-right text-[#5C6670]">Phép tồn đầu kỳ</TableHead>
            <TableHead className="text-right text-[#5C6670]">Phép tích lũy</TableHead>
            <TableHead className="text-right text-[#5C6670]">Đã sử dụng (Ca P)</TableHead>
            <TableHead className="text-right text-[#5C6670]">Phép còn lại</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-[#5C6670]">
                Đang tải sổ phép...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-[#5C6670]">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            rows.map((row, index) => (
              <TableRow key={row.employee.code}>
                <TableCell className="tabular-nums text-[#5C6670]">{index + 1}</TableCell>
                <TableCell className="font-medium tabular-nums text-[#1F2A30]">{row.employee.code}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4F7284]/10 text-xs font-semibold text-[#4F7284]">
                      {getInitials(row.employee.fullName)}
                    </div>
                    <span className="font-medium text-[#1F2A30]">{row.employee.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[#1F2A30]">{row.employee.department}</TableCell>
                <TableCell className="text-right tabular-nums text-[#1F2A30]">{formatDays(row.carryOverDays)}</TableCell>
                <TableCell className="text-right tabular-nums text-[#1F2A30]">{formatDays(row.accruedDays)}</TableCell>
                <TableCell className="text-right tabular-nums text-[#1F2A30]">{formatDays(row.usedDays)}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    className={cn(
                      'border-transparent px-2.5 py-0.5 text-sm font-semibold tabular-nums hover:bg-transparent',
                      row.remainingDays > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    )}
                  >
                    {formatDays(row.remainingDays)} ngày
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
