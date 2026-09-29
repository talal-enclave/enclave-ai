#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/talal-enclave"
cd "$ROOT"

docker compose exec -T postgres sh -lc '
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'"'"'SQL'"'"'
BEGIN;

-- Company and future employee government documents must enter the
-- renewal-priority window no later than 90 days before expiry.
UPDATE hr_corporate_compliance_records
SET
  renewal_lead_days = GREATEST(renewal_lead_days, 90),
  updated_at = now()
WHERE renewal_lead_days < 90;

UPDATE hr_employee_government_documents
SET
  renewal_lead_days = GREATEST(renewal_lead_days, 90),
  updated_at = now()
WHERE renewal_lead_days < 90;

-- Keep existing compliance expiry events synchronized.
UPDATE hr_calendar_events e
SET
  code = left(
    '\''GC-CORP-'\'' || r.record_type || '\''-'\'' || left(r.id::text, 8),
    60
  ),
  title_en = '\''Compliance expiry: '\'' || r.record_type,
  category = '\''compliance'\'',
  description = (
    '\''Government/corporate compliance document expiry. '\''
    || '\''Priority alert window starts 90 days before expiry.'\''
  ),
  responsible_owner = r.responsible_owner,
  priority = CASE
    WHEN r.expiry_date < CURRENT_DATE THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 30 THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 90 THEN '\''high'\''
    ELSE '\''medium'\''
  END,
  start_date = r.expiry_date,
  end_date = r.expiry_date,
  all_day = true,
  recurrence_type = '\''none'\'',
  recurrence_interval = 1,
  recurrence_end_date = NULL,
  alert_days_before = 90,
  status = '\''active'\'',
  notes = '\''Auto-synced 90-day compliance expiry priority alert.'\'',
  updated_at = now()
FROM hr_corporate_compliance_records r
WHERE e.source_type = '\''government_compliance_corporate_expiry'\''
  AND e.source_reference = r.id::text
  AND r.expiry_date IS NOT NULL
  AND lower(r.status) NOT IN ('\''archived'\'', '\''inactive'\'');

-- Create missing corporate expiry events.
INSERT INTO hr_calendar_events (
  id,
  code,
  title_en,
  title_ar,
  category,
  description,
  responsible_owner,
  priority,
  start_date,
  end_date,
  all_day,
  recurrence_type,
  recurrence_interval,
  recurrence_end_date,
  alert_days_before,
  status,
  completed_at,
  completed_by,
  source_type,
  source_reference,
  notes,
  created_by,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  left(
    '\''GC-CORP-'\'' || r.record_type || '\''-'\'' || left(r.id::text, 8),
    60
  ),
  '\''Compliance expiry: '\'' || r.record_type,
  NULL,
  '\''compliance'\'',
  (
    '\''Government/corporate compliance document expiry. '\''
    || '\''Priority alert window starts 90 days before expiry.'\''
  ),
  r.responsible_owner,
  CASE
    WHEN r.expiry_date < CURRENT_DATE THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 30 THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 90 THEN '\''high'\''
    ELSE '\''medium'\''
  END,
  r.expiry_date,
  r.expiry_date,
  true,
  '\''none'\'',
  1,
  NULL,
  90,
  '\''active'\'',
  NULL,
  NULL,
  '\''government_compliance_corporate_expiry'\'',
  r.id::text,
  '\''Auto-synced 90-day compliance expiry priority alert.'\'',
  '\''system:compliance-expiry-sync'\'',
  now(),
  now()
FROM hr_corporate_compliance_records r
WHERE r.expiry_date IS NOT NULL
  AND lower(r.status) NOT IN ('\''archived'\'', '\''inactive'\'')
  AND NOT EXISTS (
    SELECT 1
    FROM hr_calendar_events e
    WHERE e.source_type = '\''government_compliance_corporate_expiry'\''
      AND e.source_reference = r.id::text
  );

-- Keep future employee-document expiry events synchronized.
UPDATE hr_calendar_events e
SET
  code = left(
    '\''GC-EMP-'\'' || r.document_type || '\''-'\'' || left(r.id::text, 8),
    60
  ),
  title_en = '\''Employee document expiry: '\'' || r.document_type,
  category = '\''compliance'\'',
  description = (
    '\''Employee government document expiry. '\''
    || '\''Priority alert window starts 90 days before expiry.'\''
  ),
  responsible_owner = r.responsible_owner,
  priority = CASE
    WHEN r.expiry_date < CURRENT_DATE THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 30 THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 90 THEN '\''high'\''
    ELSE '\''medium'\''
  END,
  start_date = r.expiry_date,
  end_date = r.expiry_date,
  all_day = true,
  recurrence_type = '\''none'\'',
  recurrence_interval = 1,
  recurrence_end_date = NULL,
  alert_days_before = 90,
  status = '\''active'\'',
  notes = '\''Auto-synced 90-day employee-document expiry priority alert.'\'',
  updated_at = now()
FROM hr_employee_government_documents r
WHERE e.source_type = '\''government_compliance_employee_expiry'\''
  AND e.source_reference = r.id::text
  AND r.expiry_date IS NOT NULL
  AND lower(r.status) NOT IN ('\''archived'\'', '\''inactive'\'');

INSERT INTO hr_calendar_events (
  id,
  code,
  title_en,
  title_ar,
  category,
  description,
  responsible_owner,
  priority,
  start_date,
  end_date,
  all_day,
  recurrence_type,
  recurrence_interval,
  recurrence_end_date,
  alert_days_before,
  status,
  completed_at,
  completed_by,
  source_type,
  source_reference,
  notes,
  created_by,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  left(
    '\''GC-EMP-'\'' || r.document_type || '\''-'\'' || left(r.id::text, 8),
    60
  ),
  '\''Employee document expiry: '\'' || r.document_type,
  NULL,
  '\''compliance'\'',
  (
    '\''Employee government document expiry. '\''
    || '\''Priority alert window starts 90 days before expiry.'\''
  ),
  r.responsible_owner,
  CASE
    WHEN r.expiry_date < CURRENT_DATE THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 30 THEN '\''critical'\''
    WHEN r.expiry_date <= CURRENT_DATE + 90 THEN '\''high'\''
    ELSE '\''medium'\''
  END,
  r.expiry_date,
  r.expiry_date,
  true,
  '\''none'\'',
  1,
  NULL,
  90,
  '\''active'\'',
  NULL,
  NULL,
  '\''government_compliance_employee_expiry'\'',
  r.id::text,
  '\''Auto-synced 90-day employee-document expiry priority alert.'\'',
  '\''system:compliance-expiry-sync'\'',
  now(),
  now()
FROM hr_employee_government_documents r
WHERE r.expiry_date IS NOT NULL
  AND lower(r.status) NOT IN ('\''archived'\'', '\''inactive'\'')
  AND NOT EXISTS (
    SELECT 1
    FROM hr_calendar_events e
    WHERE e.source_type = '\''government_compliance_employee_expiry'\''
      AND e.source_reference = r.id::text
  );

-- Cancel stale auto-generated expiry events if the source document no longer
-- has an expiry date or becomes archived/inactive.
UPDATE hr_calendar_events e
SET
  status = '\''cancelled'\'',
  updated_at = now()
WHERE e.source_type = '\''government_compliance_corporate_expiry'\''
  AND NOT EXISTS (
    SELECT 1
    FROM hr_corporate_compliance_records r
    WHERE r.id::text = e.source_reference
      AND r.expiry_date IS NOT NULL
      AND lower(r.status) NOT IN ('\''archived'\'', '\''inactive'\'')
  );

UPDATE hr_calendar_events e
SET
  status = '\''cancelled'\'',
  updated_at = now()
WHERE e.source_type = '\''government_compliance_employee_expiry'\''
  AND NOT EXISTS (
    SELECT 1
    FROM hr_employee_government_documents r
    WHERE r.id::text = e.source_reference
      AND r.expiry_date IS NOT NULL
      AND lower(r.status) NOT IN ('\''archived'\'', '\''inactive'\'')
  );

COMMIT;
SQL
'
