/*
# Timesheet adjustment decisions and update tracking

1. Modified Tables
- `attendance_records`
  - New column `updated_at` (timestamptz, default now()), kept current by a trigger on every update. Used to sort the timesheet by most recent change.
  - `adjustment_status` now accepts `approved` and `rejected` in addition to `pending`. Approved and rejected requests keep their reason and note.

2. New Functions
- `set_attendance_updated_at()`: trigger function that stamps `updated_at` on update.
- `decide_attendance_adjustment(record_id, decision)`: approves or rejects a pending adjustment request. In one transaction it sets the attendance status and updates the matching roster entry for the same employee and date (`adjusted` when approved, `mismatch` when rejected).

3. Security
- The decision function runs with the caller's rights, so existing row level security on both tables still applies. It is granted only to the `anon` and `authenticated` roles used by the app.
- The trigger function is not callable by any API role.

4. Important Notes
- No data is removed or rewritten. Existing rows get `updated_at` set to the migration time.
- The adjustment rule is replaced with an equivalent one that also allows the two decision statuses.
*/

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION set_attendance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_attendance_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS attendance_records_set_updated_at ON attendance_records;
CREATE TRIGGER attendance_records_set_updated_at
BEFORE UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION set_attendance_updated_at();

ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_adjustment_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_adjustment_check CHECK (
  (adjustment_status IS NULL AND adjustment_reason IS NULL AND adjustment_note IS NULL)
  OR (
    adjustment_status IN ('pending', 'approved', 'rejected')
    AND adjustment_reason IN ('late-with-reason', 'extra-shift', 'shift-swap', 'other')
    AND length(btrim(adjustment_note)) > 0
  )
);

CREATE OR REPLACE FUNCTION decide_attendance_adjustment(p_record_id uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_employee_code text;
  v_work_date date;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid adjustment decision';
  END IF;

  UPDATE attendance_records
  SET adjustment_status = p_decision
  WHERE id = p_record_id AND adjustment_status = 'pending'
  RETURNING employee_code, work_date INTO v_employee_code, v_work_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending adjustment request';
  END IF;

  UPDATE work_schedules
  SET check_status = CASE WHEN p_decision = 'approved' THEN 'adjusted' ELSE 'mismatch' END,
      updated_at = now()
  WHERE employee_code = v_employee_code AND work_date = v_work_date;
END;
$$;

REVOKE EXECUTE ON FUNCTION decide_attendance_adjustment(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decide_attendance_adjustment(uuid, text) TO anon, authenticated;
