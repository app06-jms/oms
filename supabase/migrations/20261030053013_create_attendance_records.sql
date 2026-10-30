/*
# Create attendance records table

Stores each employee's daily shift check-ins and check-outs for the Daily Attendance page.

1. New Tables
- `attendance_records`
  - `id` (uuid, primary key)
  - `employee_code` (text, the employee's code, e.g. "NV001")
  - `shift_name` (text, the shift the check-in was assigned to)
  - `work_date` (date, taken from the check-in date so overnight shifts stay on their start day)
  - `check_in_at` (timestamptz, required)
  - `check_out_at` (timestamptz, empty while the shift is still open)
  - `created_at` (timestamptz, defaults to now)

2. Integrity
- A check constraint ensures check-out always comes after check-in.
- A partial unique index allows only one open shift per employee at a time.
- An index on employee and work date keeps history queries fast.

3. Security
- Row level security is enabled.
- The app has no sign-in, so the `anon` and `authenticated` roles get only the verbs the app uses.
- Records can be inserted and read. Only the check-out time of an open record can be updated; completed records cannot be changed. Records cannot be deleted through the API.
*/

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text NOT NULL,
  shift_name text NOT NULL,
  work_date date NOT NULL,
  check_in_at timestamptz NOT NULL,
  check_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_checkout_after_checkin CHECK (check_out_at IS NULL OR check_out_at > check_in_at)
);

CREATE INDEX IF NOT EXISTS attendance_records_employee_date_idx
  ON attendance_records (employee_code, work_date);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_one_open_shift_idx
  ON attendance_records (employee_code)
  WHERE check_out_at IS NULL;

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON attendance_records TO anon, authenticated;
GRANT UPDATE (check_out_at) ON attendance_records TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_attendance_records" ON attendance_records;
CREATE POLICY "anon_select_attendance_records" ON attendance_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_open_attendance_records" ON attendance_records;
CREATE POLICY "anon_insert_open_attendance_records" ON attendance_records FOR INSERT
  TO anon, authenticated WITH CHECK (check_out_at IS NULL);

DROP POLICY IF EXISTS "anon_close_open_attendance_records" ON attendance_records;
CREATE POLICY "anon_close_open_attendance_records" ON attendance_records FOR UPDATE
  TO anon, authenticated USING (check_out_at IS NULL) WITH CHECK (check_out_at IS NOT NULL);
