# Enclave v1.6.2 — Non-employee worker registration

This release fixes the CEO response to a completed workers template.

- A direct instruction from the authenticated single user is sufficient
  authorization for internal registry work; a written delegation is not
  requested.
- The CEO can read the attached XLSX/CSV workers template and register rows as
  `external_worker` / `non_employee` records.
- Registration is idempotent by source attachment and row, so a retry does not
  create duplicates.
- The records do not create a formal employment contract, payroll entry, GOSI
  registration, payment, external communication or government filing.
- Formal employment activation and other consequential external actions remain
  approval-gated.

No government records or existing attachments are reset, deleted or rewritten.
