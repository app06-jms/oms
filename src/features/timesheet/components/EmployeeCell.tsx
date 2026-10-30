import { getInitials } from '@/lib/text';
import type { TimesheetRow } from '@/features/timesheet/timesheetRules';

interface EmployeeCellProps {
  row: TimesheetRow;
}

export function EmployeeCell({ row }: EmployeeCellProps) {
  const name = row.employee?.fullName ?? 'Không rõ nhân viên';
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4F7284]/10 text-xs font-semibold text-[#4F7284]">
        {getInitials(name)}
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-[#1F2A30]">{name}</span>
        <span className="text-xs text-[#5C6670]">{row.record.employeeCode}</span>
      </div>
    </div>
  );
}
