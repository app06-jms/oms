/*
# Store pending check-in adjustment requests on attendance records

When an employee checks in outside the allowed time window for their shift, the check-in is recorded only after they submit an adjustment request. The record then waits for manager approval.

1. Modified Table: attendance_records
- `assigned_start_at` (timestamptz, nullable): the shift start time the check-in was compared against.
- `adjustment_status` (text, nullable): 'pending' while a request awaits approval, otherwise null.
- `adjustment_reason` (text, nullable): one of late-with-reason, extra-shift, shift-swap, other.
- `adjustment_note` (text, nullable): the employee's required explanation.

2. Rules
- A record has either no adjustment fields, or a pending status with a valid reason and a non-empty note.
- Existing records are unchanged and keep null adjustment fields.

3. Security
- No change to row level security or grants. The existing table-level insert and select grants and policies cover the new columns.
*/

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS assigned_start_at timestamptz;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS adjustment_status text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS adjustment_reason text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS adjustment_note text;

ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_adjustment_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_adjustment_check CHECK (
  (adjustment_status IS NULL AND adjustment_reason IS NULL AND adjustment_note IS NULL)
  OR (
    adjustment_status = 'pending'
    AND adjustment_reason IN ('late-with-reason', 'extra-shift', 'shift-swap', 'other')
    AND length(btrim(adjustment_note)) > 0
  )
);
