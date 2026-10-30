import * as XLSX from 'xlsx';
import { SHIFT_CODES, type ShiftCode } from '@/config/schedule';
import { toDateKey } from '@/features/attendance/attendanceRules';
import type { Employee, ScheduleEntry } from '@/features/schedule/scheduleRules';
import type { ShiftAssignment } from '@/features/schedule/scheduleService';

const CODE_HEADER = 'Mã NV';
const DATE_HEADER_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MAX_REPORTED_ERRORS = 8;

function toDisplayHeader(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function downloadScheduleTemplate(
  weekDates: Date[],
  employees: Employee[],
  scheduleByKey: Map<string, ScheduleEntry>,
  fileName: string
) {
  const header = [CODE_HEADER, 'Họ tên', 'Bộ phận', ...weekDates.map(toDisplayHeader)];
  const rows = employees.map((employee) => [
    employee.code,
    employee.fullName,
    employee.department,
    ...weekDates.map((date) => scheduleByKey.get(`${employee.code}|${toDateKey(date)}`)?.shiftCode ?? ''),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 14 }, ...weekDates.map(() => ({ wch: 12 }))];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Lịch làm việc');
  XLSX.writeFile(workbook, fileName);
}

export interface ScheduleImportResult {
  assignments: ShiftAssignment[];
  errors: string[];
}

function isShiftCode(value: string): value is ShiftCode {
  return (SHIFT_CODES as string[]).includes(value);
}

export async function parseScheduleWorkbook(file: File, employees: Employee[]): Promise<ScheduleImportResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  if (!sheet) {
    return { assignments: [], errors: ['File không có dữ liệu.'] };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
  const [headerRow = [], ...bodyRows] = rows;
  const employeeByCode = new Map(employees.map((employee) => [employee.code, employee]));

  const dateColumns: { index: number; workDate: string }[] = [];
  const errors: string[] = [];
  headerRow.forEach((cell, index) => {
    if (index === 0) return;
    const text = String(cell).trim();
    const match = DATE_HEADER_PATTERN.exec(text);
    if (match) {
      dateColumns.push({ index, workDate: `${match[3]}-${match[2]}-${match[1]}` });
    }
  });

  if (dateColumns.length === 0) {
    return {
      assignments: [],
      errors: ['Không tìm thấy cột ngày. Hãy dùng file mẫu và giữ nguyên dòng tiêu đề (dd/mm/yyyy).'],
    };
  }

  const assignments: ShiftAssignment[] = [];
  bodyRows.forEach((row, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const employeeCode = String(row[0] ?? '').trim().toUpperCase();
    if (employeeCode === '') return;

    const employee = employeeByCode.get(employeeCode);
    if (!employee) {
      errors.push(`Dòng ${lineNumber}: mã nhân viên "${employeeCode}" không tồn tại.`);
      return;
    }

    for (const column of dateColumns) {
      const value = String(row[column.index] ?? '').trim().toUpperCase();
      if (value === '') continue;
      if (!isShiftCode(value)) {
        errors.push(`Dòng ${lineNumber} (${employeeCode}): mã ca "${value}" không hợp lệ.`);
        continue;
      }
      assignments.push({ employeeCode, workDate: column.workDate, shiftCode: value });
    }
  });

  if (errors.length > MAX_REPORTED_ERRORS) {
    const hidden = errors.length - MAX_REPORTED_ERRORS;
    return {
      assignments,
      errors: [...errors.slice(0, MAX_REPORTED_ERRORS), `Và ${hidden} lỗi khác.`],
    };
  }
  return { assignments, errors };
}
