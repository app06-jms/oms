export const SCHEDULE_SHIFTS = {
  S1: { code: 'S1', name: 'Ca Sáng', startHour: 6, endHour: 14 },
  C1: { code: 'C1', name: 'Ca Chiều', startHour: 14, endHour: 22 },
  D1: { code: 'D1', name: 'Ca Đêm', startHour: 22, endHour: 6 },
  OFF: { code: 'OFF', name: 'Nghỉ', startHour: null, endHour: null },
  P: { code: 'P', name: 'Nghỉ phép', startHour: null, endHour: null },
  UP: { code: 'UP', name: 'Nghỉ không lương', startHour: null, endHour: null },
} as const;

export type ShiftCode = keyof typeof SCHEDULE_SHIFTS;

export const SHIFT_CODES = Object.keys(SCHEDULE_SHIFTS) as ShiftCode[];

export const WORKING_SHIFT_CODES: ShiftCode[] = ['S1', 'C1', 'D1'];

export const DEPARTMENTS = ['Lễ tân', 'Buồng phòng', 'F&B', 'Bếp', 'Hành chính / HR'] as const;

export const WEEKDAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'] as const;
