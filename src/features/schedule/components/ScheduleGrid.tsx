import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SCHEDULE_SHIFTS, SHIFT_CODES, WEEKDAY_LABELS, type ShiftCode } from '@/config/schedule';
import { formatWorkDate, toDateKey } from '@/features/attendance/attendanceRules';
import {
  getShiftDisplayHours,
  type Employee,
  type ScheduleEntry,
} from '@/features/schedule/scheduleRules';
import { ShiftBadge } from '@/features/schedule/components/ShiftBadge';

interface ScheduleGridProps {
  weekDates: Date[];
  employees: Employee[];
  scheduleByKey: Map<string, ScheduleEntry>;
  isEditing: boolean;
  onSelectEntry: (employee: Employee, workDate: string, entry: ScheduleEntry) => void;
  onShiftChange: (employeeCode: string, workDate: string, shiftCode: ShiftCode) => void;
}

const WEEKEND_START_INDEX = 5;

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

function getShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? '').toUpperCase();
}

export function ScheduleGrid({
  weekDates,
  employees,
  scheduleByKey,
  isEditing,
  onSelectEntry,
  onShiftChange,
}: ScheduleGridProps) {
  const todayKey = toDateKey(new Date());

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <Table className="min-w-[960px] border-collapse [&_td]:border-[#E2E8F0] [&_td]:border [&_th]:border-[#E2E8F0] [&_th]:border">
          <TableHeader className="bg-[#F8FAFC] text-[#1E293B]">
            <TableRow className="hover:bg-transparent">
              <TableHead
                rowSpan={2}
                className="sticky left-0 z-10 w-64 border-b-0 border-r border-border bg-[#F8FAFC] align-bottom text-[#1E293B]"
              >
                Nhân viên
              </TableHead>
              {weekDates.map((date, index) => {
                const isWeekend = index >= WEEKEND_START_INDEX;
                return (
                  <TableHead
                    key={toDateKey(date)}
                    className={`pb-1 pt-4 text-center text-xs font-medium ${
                      isWeekend ? 'text-[#C2410C]' : 'text-muted-foreground'
                    }`}
                  >
                    {WEEKDAY_LABELS[index]}
                  </TableHead>
                );
              })}
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {weekDates.map((date, index) => {
                const workDate = toDateKey(date);
                const isToday = workDate === todayKey;
                const isWeekend = index >= WEEKEND_START_INDEX;
                return (
                  <TableHead
                    key={workDate}
                    className={`pb-3 pt-0 text-center text-sm font-semibold tabular-nums ${
                      isWeekend ? 'text-[#C2410C]' : isToday ? 'text-primary' : 'text-[#1E293B]'
                    }`}
                  >
                    {formatWorkDate(workDate)}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  Không có nhân viên thuộc bộ phận này.
                </TableCell>
              </TableRow>
            )}

            {employees.map((employee) => (
              <TableRow key={employee.code} className="hover:bg-[#F8FAFC]">
                <TableCell className="sticky left-0 z-10 border-r border-border bg-white">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary text-xs font-semibold text-white">
                        {getInitials(employee.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold uppercase text-[#1E293B]">
                        {getShortName(employee.fullName)}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{employee.code}</span>
                    </div>
                  </div>
                </TableCell>

                {weekDates.map((date) => {
                  const workDate = toDateKey(date);
                  const entry = scheduleByKey.get(`${employee.code}|${workDate}`);
                  return (
                    <TableCell key={workDate} className="px-2 py-3 text-center">
                      {isEditing ? (
                        <Select
                          value={entry?.shiftCode ?? ''}
                          onValueChange={(value) => onShiftChange(employee.code, workDate, value as ShiftCode)}
                        >
                          <SelectTrigger
                            className="mx-auto h-9 w-24 text-xs"
                            aria-label={`Ca của ${employee.fullName} ngày ${formatWorkDate(workDate)}`}
                          >
                            <SelectValue placeholder="Chọn ca" />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIFT_CODES.map((code) => (
                              <SelectItem key={code} value={code}>
                                {code} · {SCHEDULE_SHIFTS[code].name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : entry ? (
                        <ScheduleCellButton
                          employee={employee}
                          workDate={workDate}
                          entry={entry}
                          onSelect={onSelectEntry}
                        />
                      ) : (
                        <span className="text-sm text-[#94A3B8]">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
        {SHIFT_CODES.map((code) => (
          <div key={code} className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShiftBadge shiftCode={code} />
            <span>{getShiftDisplayHours(code)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ScheduleCellButtonProps {
  employee: Employee;
  workDate: string;
  entry: ScheduleEntry;
  onSelect: (employee: Employee, workDate: string, entry: ScheduleEntry) => void;
}

function ScheduleCellButton({ employee, workDate, entry, onSelect }: ScheduleCellButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(employee, workDate, entry)}
      aria-label={`${SCHEDULE_SHIFTS[entry.shiftCode].name} ngày ${formatWorkDate(workDate)}`}
      className="group mx-auto flex items-center justify-center rounded-lg p-1 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ShiftBadge shiftCode={entry.shiftCode} />
    </button>
  );
}
