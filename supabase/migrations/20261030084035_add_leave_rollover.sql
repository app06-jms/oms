/*
# Annual leave balances and year-end rollover

1. New Tables
- `leave_carryovers`: opening leave balance ("Phép tồn đầu kỳ") per employee per year.
  - `year` (integer), `employee_code` (text, references employees.code), `carry_over_days` (integer, >= 0).
  - Primary key (year, employee_code). A missing row means a carry-over of 0.
- `leave_rollovers`: one row per closed year, recording which year-end option was used and when.
  - `year` (integer, primary key), `mode` ('reset' or 'carry'), `executed_at` (timestamptz).

2. New Functions
- `leave_accrued_days(year)`: internal helper. Accrues 1 day per month: 12 for past years, the current month for the current year, 0 for future years.
- `rollover_leave_year(year, mode)`: for every employee, computes the remaining balance of the given year (carry-over + accrued days - days on shift P in the roster).
  - mode 'carry': the remaining balance (never below 0) becomes the carry-over of year + 1.
  - mode 'reset': the carry-over of year + 1 is set to 0.
  - Re-running for the same year overwrites the previous result for year + 1.

3. Security
- RLS enabled on both tables.
- SELECT granted to anon and authenticated (no sign-in in this app).
- No direct write grants. Writes happen only through `rollover_leave_year`.
- `leave_accrued_days` is not callable by clients. `rollover_leave_year` has PUBLIC execute revoked and EXECUTE granted to anon and authenticated.

4. Notes
- Days on shift P are counted from the roster (work_schedules) for the whole calendar year.
- Accrual rules here must match the frontend leave rules.
*/

CREATE TABLE IF NOT EXISTS leave_carryovers (
  year integer NOT NULL,
  employee_code text NOT NULL REFERENCES employees(code),
  carry_over_days integer NOT NULL DEFAULT 0 CHECK (carry_over_days >= 0),
  PRIMARY KEY (year, employee_code)
);

CREATE TABLE IF NOT EXISTS leave_rollovers (
  year integer PRIMARY KEY,
  mode text NOT NULL CHECK (mode IN ('reset', 'carry')),
  executed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leave_carryovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_rollovers ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON leave_carryovers, leave_rollovers TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_leave_carryovers" ON leave_carryovers;
CREATE POLICY "anon_select_leave_carryovers" ON leave_carryovers FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_leave_rollovers" ON leave_rollovers;
CREATE POLICY "anon_select_leave_rollovers" ON leave_rollovers FOR SELECT
TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION leave_accrued_days(p_year integer)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_current_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_current_month integer := EXTRACT(MONTH FROM CURRENT_DATE)::integer;
BEGIN
  IF p_year < v_current_year THEN
    RETURN 12;
  END IF;
  IF p_year = v_current_year THEN
    RETURN v_current_month;
  END IF;
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION rollover_leave_year(p_year integer, p_mode text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_mode NOT IN ('reset', 'carry') THEN
    RAISE EXCEPTION 'Phương thức chốt phép không hợp lệ: %', p_mode USING ERRCODE = '22023';
  END IF;
  IF p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'Năm không hợp lệ: %', p_year USING ERRCODE = '22023';
  END IF;

  INSERT INTO leave_carryovers (year, employee_code, carry_over_days)
  SELECT
    p_year + 1,
    e.code,
    CASE WHEN p_mode = 'carry' THEN GREATEST(0, balance.remaining) ELSE 0 END
  FROM employees e
  CROSS JOIN LATERAL (
    SELECT
      COALESCE(
        (SELECT lc.carry_over_days FROM leave_carryovers lc WHERE lc.year = p_year AND lc.employee_code = e.code),
        0
      )
      + leave_accrued_days(p_year)
      - (
        SELECT COUNT(*)
        FROM work_schedules ws
        WHERE ws.employee_code = e.code
          AND ws.shift_code = 'P'
          AND EXTRACT(YEAR FROM ws.work_date) = p_year
      ) AS remaining
  ) balance
  ON CONFLICT (year, employee_code) DO UPDATE SET carry_over_days = EXCLUDED.carry_over_days;

  INSERT INTO leave_rollovers (year, mode, executed_at)
  VALUES (p_year, p_mode, now())
  ON CONFLICT (year) DO UPDATE SET mode = EXCLUDED.mode, executed_at = EXCLUDED.executed_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION leave_accrued_days(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION rollover_leave_year(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rollover_leave_year(integer, text) TO anon, authenticated;
