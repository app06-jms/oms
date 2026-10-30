/*
# Add leave codes P and UP to weekly schedules

Allows two new leave codes on the work schedule: P (annual leave) and UP (unpaid leave). Both can be assigned in the grid and in Excel imports.

1. Modified Tables
- `work_schedules.shift_code`: now accepts S1, C1, D1, OFF, P and UP.
- `work_schedules.requested_shift_code`: same accepted list as above.

2. Notes
- The constraints are replaced with wider versions. No rows are changed and no data is removed.
- Existing rows keep their current codes.

3. Security
- No change to row level security, policies or grants.
*/

ALTER TABLE work_schedules DROP CONSTRAINT IF EXISTS work_schedules_shift_code_check;
ALTER TABLE work_schedules ADD CONSTRAINT work_schedules_shift_code_check
  CHECK (shift_code IN ('S1', 'C1', 'D1', 'OFF', 'P', 'UP'));

ALTER TABLE work_schedules DROP CONSTRAINT IF EXISTS work_schedules_requested_shift_code_check;
ALTER TABLE work_schedules ADD CONSTRAINT work_schedules_requested_shift_code_check
  CHECK (requested_shift_code IS NULL OR requested_shift_code IN ('S1', 'C1', 'D1', 'OFF', 'P', 'UP'));
