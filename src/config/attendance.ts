import type { Coordinates } from '@/lib/geo';

export const HOTEL_GEOFENCE = {
  name: 'Khách sạn Jenius',
  center: { latitude: 10.7769, longitude: 106.7009 } satisfies Coordinates,
  radiusMeters: 50,
};

export const SIMULATED_POSITIONS = {
  inRange: { latitude: 10.77692, longitude: 106.70092 } satisfies Coordinates,
  outOfRange: { latitude: 10.7799, longitude: 106.7009 } satisfies Coordinates,
};

export const CURRENT_EMPLOYEE = {
  code: 'NV001',
  fullName: 'Nguyễn Minh Anh',
  department: 'Lễ tân',
  position: 'Nhân viên lễ tân',
};

export const SHIFTS = {
  day: { name: 'Ca sáng', startHour: 8, endHour: 17 },
  night: { name: 'Ca đêm', startHour: 22, endHour: 6 },
} as const;

export const LATE_TOLERANCE_MINUTES = 15;

export const ADJUSTMENT_REASONS = [
  { value: 'late-with-reason', label: 'Đi trễ có lý do' },
  { value: 'extra-shift', label: 'Tăng cường ca khác' },
  { value: 'shift-swap', label: 'Hoán đổi ca' },
  { value: 'other', label: 'Khác' },
] as const;

export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]['value'];
