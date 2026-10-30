/*
# Create employees and weekly work schedules

Adds the staff roster and the weekly shift plan used by the Work Schedule page, with sample staff and a sample schedule for the week of 26/10/2026 to 01/11/2026.

1. New Tables
- `employees`: staff code, full name, department and position.
- `work_schedules`: one row per employee per day.
  - `shift_code` is the assigned shift: S1 (morning), C1 (afternoon), D1 (night) or OFF.
  - `check_status` tracks the attendance match: on_shift, mismatch, pending_adjustment, adjusted.
  - `requested_shift_code` and `adjustment_reason` hold an employee's adjustment request.

2. Seed Data
- Eight sample employees across Lễ tân, Buồng phòng, F&B and Bếp.
- A sample shift for every employee for 26/10/2026 to 01/11/2026. Existing rows are left untouched.

3. Security
- Row level security is enabled on both tables.
- The app has no sign-in, so `anon` and `authenticated` can read both tables and insert schedule rows.
- Updates to schedules are limited to the shift and adjustment columns. Schedule rows cannot be deleted through the API.
*/

CREATE TABLE IF NOT EXISTS employees (
  code text PRIMARY KEY,
  full_name text NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text NOT NULL REFERENCES employees (code),
  work_date date NOT NULL,
  shift_code text NOT NULL CHECK (shift_code IN ('S1', 'C1', 'D1', 'OFF')),
  check_status text NOT NULL DEFAULT 'on_shift'
    CHECK (check_status IN ('on_shift', 'mismatch', 'pending_adjustment', 'adjusted')),
  requested_shift_code text CHECK (requested_shift_code IS NULL OR requested_shift_code IN ('S1', 'C1', 'D1', 'OFF')),
  adjustment_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS work_schedules_employee_date_idx
  ON work_schedules (employee_code, work_date);

CREATE INDEX IF NOT EXISTS work_schedules_work_date_idx
  ON work_schedules (work_date);

INSERT INTO employees (code, full_name, department, position) VALUES
  ('NV001', 'Nguyễn Minh Anh', 'Lễ tân', 'Nhân viên lễ tân'),
  ('NV002', 'Trần Thu Hà', 'Buồng phòng', 'Nhân viên buồng phòng'),
  ('NV003', 'Lê Quốc Huy', 'F&B', 'Nhân viên phục vụ'),
  ('NV004', 'Phạm Gia Bảo', 'Bếp', 'Đầu bếp'),
  ('NV005', 'Võ Thị Lan', 'Lễ tân', 'Trưởng ca lễ tân'),
  ('NV006', 'Đặng Hoàng Nam', 'Buồng phòng', 'Giám sát buồng phòng'),
  ('NV007', 'Bùi Ngọc Mai', 'F&B', 'Pha chế'),
  ('NV008', 'Đỗ Minh Tuấn', 'Bếp', 'Phụ bếp')
ON CONFLICT (code) DO NOTHING;

INSERT INTO work_schedules (employee_code, work_date, shift_code)
SELECT
  e.code,
  d.work_date::date,
  CASE (EXTRACT(DAY FROM d.work_date)::int + ASCII(RIGHT(e.code, 1))) % 4
    WHEN 0 THEN 'S1'
    WHEN 1 THEN 'C1'
    WHEN 2 THEN 'D1'
    ELSE 'OFF'
  END
FROM employees e
CROSS JOIN generate_series(DATE '2026-10-26', DATE '2026-11-01', INTERVAL '1 day') AS d (work_date)
ON CONFLICT (employee_code, work_date) DO NOTHING;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON employees TO anon, authenticated;
GRANT SELECT, INSERT ON work_schedules TO anon, authenticated;
GRANT UPDATE (shift_code, check_status, requested_shift_code, adjustment_reason, updated_at)
  ON work_schedules TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_work_schedules" ON work_schedules;
CREATE POLICY "anon_select_work_schedules" ON work_schedules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_work_schedules" ON work_schedules;
CREATE POLICY "anon_insert_work_schedules" ON work_schedules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_work_schedules" ON work_schedules;
CREATE POLICY "anon_update_work_schedules" ON work_schedules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
