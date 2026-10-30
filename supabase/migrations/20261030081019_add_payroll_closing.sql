/*
# Add payroll closing (Chốt công): overtime decisions, adjustments, locked periods, audit trail

1. Modified Tables
- `attendance_records`
  - `ot_status` (text, nullable): NULL = overtime not yet decided, 'approved' = overtime credited, 'rejected' = overtime capped to standard hours.

2. New Tables
- `payroll_periods`: one row per month being closed. `period_month` (YYYY-MM), `deadline` (confirmation deadline), `status` ('reconciling' or 'locked'), `locked_at`.
- `payroll_locked_summaries`: frozen per-employee totals written when a month is locked (credited hours, approved OT hours, OFF/P/UP day counts).
- `payroll_adjustments`: proposed check-in / check-out corrections raised against an attendance record, with reason and decision status.
- `payroll_audit_log`: append-only history of every overtime decision, adjustment request, adjustment decision and lock.

3. Security
- Row level security is enabled on every new table.
- anon and authenticated receive SELECT only. The app has no sign-in, so every policy targets both roles and uses USING (true) because the closing data is intentionally shared within the hotel.
- No direct INSERT, UPDATE or DELETE is granted on the new tables. All writes go through the security definer functions below.
- Each function revokes PUBLIC execution and grants EXECUTE to anon and authenticated only.

4. Functions
- `assert_payroll_open(date)`: raises when the month containing the date is locked. Internal only.
- `save_payroll_deadline(text, timestamptz)`: sets the confirmation deadline for an open month.
- `request_payroll_adjustment(uuid, timestamptz, timestamptz, text)`: creates a pending adjustment.
- `decide_payroll_adjustment(uuid, text)`: approves (applies the new times to the attendance record and clears its overtime decision) or rejects.
- `decide_overtime(uuid, text)`: approves or rejects overtime for one attendance record.
- `lock_payroll_period(text, jsonb)`: freezes the month, stores the employee snapshot, and refuses while adjustments are pending.

5. Important Notes
- Locking is one-way. Once a month is locked, its attendance, adjustments and overtime decisions cannot be changed through these functions.
- The lock snapshot is computed in the app and passed in as JSON. Keep this in mind if the app ever gains sign-in.
*/

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS ot_status text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_ot_status_check') THEN
    ALTER TABLE attendance_records
      ADD CONSTRAINT attendance_records_ot_status_check
      CHECK (ot_status IS NULL OR ot_status IN ('approved', 'rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payroll_periods (
  period_month text PRIMARY KEY CHECK (period_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  deadline timestamptz,
  status text NOT NULL DEFAULT 'reconciling' CHECK (status IN ('reconciling', 'locked')),
  locked_at timestamptz
);

CREATE TABLE IF NOT EXISTS payroll_locked_summaries (
  period_month text NOT NULL REFERENCES payroll_periods(period_month) ON DELETE CASCADE,
  employee_code text NOT NULL REFERENCES employees(code),
  full_name text NOT NULL,
  department text NOT NULL,
  credited_hours numeric(8, 2) NOT NULL DEFAULT 0 CHECK (credited_hours >= 0),
  ot_hours numeric(8, 2) NOT NULL DEFAULT 0 CHECK (ot_hours >= 0),
  off_days integer NOT NULL DEFAULT 0 CHECK (off_days >= 0),
  p_days integer NOT NULL DEFAULT 0 CHECK (p_days >= 0),
  up_days integer NOT NULL DEFAULT 0 CHECK (up_days >= 0),
  PRIMARY KEY (period_month, employee_code)
);

CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id uuid NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  work_date date NOT NULL,
  proposed_check_in_at timestamptz NOT NULL,
  proposed_check_out_at timestamptz,
  reason text NOT NULL CHECK (length(btrim(reason)) > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CHECK (proposed_check_out_at IS NULL OR proposed_check_out_at > proposed_check_in_at)
);

CREATE INDEX IF NOT EXISTS payroll_adjustments_record_idx ON payroll_adjustments (attendance_record_id);
CREATE INDEX IF NOT EXISTS payroll_adjustments_work_date_idx ON payroll_adjustments (work_date);

CREATE TABLE IF NOT EXISTS payroll_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  period_month text NOT NULL,
  attendance_record_id uuid REFERENCES attendance_records(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payroll_audit_log_period_idx ON payroll_audit_log (period_month, created_at);

ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_locked_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_audit_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON payroll_periods, payroll_locked_summaries, payroll_adjustments, payroll_audit_log TO anon, authenticated;

DROP POLICY IF EXISTS "select_payroll_periods" ON payroll_periods;
CREATE POLICY "select_payroll_periods" ON payroll_periods FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_payroll_locked_summaries" ON payroll_locked_summaries;
CREATE POLICY "select_payroll_locked_summaries" ON payroll_locked_summaries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_payroll_adjustments" ON payroll_adjustments;
CREATE POLICY "select_payroll_adjustments" ON payroll_adjustments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_payroll_audit_log" ON payroll_audit_log;
CREATE POLICY "select_payroll_audit_log" ON payroll_audit_log FOR SELECT
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION assert_payroll_open(p_work_date date)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM payroll_periods
    WHERE period_month = to_char(p_work_date, 'YYYY-MM') AND status = 'locked'
  ) THEN
    RAISE EXCEPTION 'Kỳ chốt công này đã khóa dữ liệu' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION save_payroll_deadline(p_period text, p_deadline timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM payroll_periods WHERE period_month = p_period AND status = 'locked') THEN
    RAISE EXCEPTION 'Kỳ chốt công này đã khóa dữ liệu' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO payroll_periods (period_month, deadline, status)
  VALUES (p_period, p_deadline, 'reconciling')
  ON CONFLICT (period_month) DO UPDATE SET deadline = EXCLUDED.deadline;
END;
$$;

CREATE OR REPLACE FUNCTION request_payroll_adjustment(
  p_record_id uuid,
  p_check_in_at timestamptz,
  p_check_out_at timestamptz,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record attendance_records%ROWTYPE;
  v_id uuid;
BEGIN
  IF length(btrim(coalesce(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'Vui lòng nhập lý do điều chỉnh';
  END IF;

  SELECT * INTO v_record FROM attendance_records WHERE id = p_record_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy bản ghi chấm công';
  END IF;

  PERFORM assert_payroll_open(v_record.work_date);

  INSERT INTO payroll_adjustments (
    attendance_record_id, employee_code, work_date, proposed_check_in_at, proposed_check_out_at, reason
  )
  VALUES (
    p_record_id, v_record.employee_code, v_record.work_date, p_check_in_at, p_check_out_at, btrim(p_reason)
  )
  RETURNING id INTO v_id;

  INSERT INTO payroll_audit_log (period_month, attendance_record_id, action, detail)
  VALUES (
    to_char(v_record.work_date, 'YYYY-MM'),
    p_record_id,
    'adjustment_requested',
    'Đề xuất điều chỉnh: ' || btrim(p_reason)
  );

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION decide_payroll_adjustment(p_adjustment_id uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adjustment payroll_adjustments%ROWTYPE;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Quyết định không hợp lệ';
  END IF;

  SELECT * INTO v_adjustment FROM payroll_adjustments WHERE id = p_adjustment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy đề xuất điều chỉnh';
  END IF;
  IF v_adjustment.status <> 'pending' THEN
    RAISE EXCEPTION 'Đề xuất này đã được xử lý';
  END IF;

  PERFORM assert_payroll_open(v_adjustment.work_date);

  IF p_decision = 'approved' THEN
    UPDATE attendance_records
    SET check_in_at = v_adjustment.proposed_check_in_at,
        check_out_at = v_adjustment.proposed_check_out_at,
        ot_status = NULL
    WHERE id = v_adjustment.attendance_record_id;
  END IF;

  UPDATE payroll_adjustments
  SET status = p_decision, decided_at = now()
  WHERE id = p_adjustment_id;

  INSERT INTO payroll_audit_log (period_month, attendance_record_id, action, detail)
  VALUES (
    to_char(v_adjustment.work_date, 'YYYY-MM'),
    v_adjustment.attendance_record_id,
    CASE WHEN p_decision = 'approved' THEN 'adjustment_approved' ELSE 'adjustment_rejected' END,
    CASE WHEN p_decision = 'approved' THEN 'Duyệt điều chỉnh giờ vào/ra: ' ELSE 'Từ chối điều chỉnh: ' END || v_adjustment.reason
  );
END;
$$;

CREATE OR REPLACE FUNCTION decide_overtime(p_record_id uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record attendance_records%ROWTYPE;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Quyết định không hợp lệ';
  END IF;

  SELECT * INTO v_record FROM attendance_records WHERE id = p_record_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy bản ghi chấm công';
  END IF;

  PERFORM assert_payroll_open(v_record.work_date);

  UPDATE attendance_records SET ot_status = p_decision WHERE id = p_record_id;

  INSERT INTO payroll_audit_log (period_month, attendance_record_id, action, detail)
  VALUES (
    to_char(v_record.work_date, 'YYYY-MM'),
    p_record_id,
    CASE WHEN p_decision = 'approved' THEN 'ot_approved' ELSE 'ot_rejected' END,
    CASE WHEN p_decision = 'approved' THEN 'Duyệt tăng ca' ELSE 'Từ chối tăng ca, tính công theo ca chuẩn' END
  );
END;
$$;

CREATE OR REPLACE FUNCTION lock_payroll_period(p_period text, p_rows jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM payroll_periods WHERE period_month = p_period FOR UPDATE;
  IF v_status = 'locked' THEN
    RAISE EXCEPTION 'Kỳ chốt công này đã khóa dữ liệu' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM payroll_adjustments
    WHERE status = 'pending' AND to_char(work_date, 'YYYY-MM') = p_period
  ) THEN
    RAISE EXCEPTION 'Còn đề xuất điều chỉnh chưa duyệt trong kỳ này';
  END IF;

  INSERT INTO payroll_periods (period_month, status, locked_at)
  VALUES (p_period, 'locked', now())
  ON CONFLICT (period_month) DO UPDATE SET status = 'locked', locked_at = now();

  INSERT INTO payroll_locked_summaries (
    period_month, employee_code, full_name, department, credited_hours, ot_hours, off_days, p_days, up_days
  )
  SELECT p_period, r.employee_code, r.full_name, r.department, r.credited_hours, r.ot_hours, r.off_days, r.p_days, r.up_days
  FROM jsonb_to_recordset(p_rows) AS r(
    employee_code text,
    full_name text,
    department text,
    credited_hours numeric,
    ot_hours numeric,
    off_days integer,
    p_days integer,
    up_days integer
  );

  INSERT INTO payroll_audit_log (period_month, action, detail)
  VALUES (p_period, 'period_locked', 'Khóa dữ liệu chốt công kỳ ' || p_period);
END;
$$;

REVOKE EXECUTE ON FUNCTION assert_payroll_open(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION save_payroll_deadline(text, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION request_payroll_adjustment(uuid, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION decide_payroll_adjustment(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION decide_overtime(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION lock_payroll_period(text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION save_payroll_deadline(text, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION request_payroll_adjustment(uuid, timestamptz, timestamptz, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decide_payroll_adjustment(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decide_overtime(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION lock_payroll_period(text, jsonb) TO anon, authenticated;
