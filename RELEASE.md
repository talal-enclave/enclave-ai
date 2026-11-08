# Enclave v1.6.3 — CEO organizational structure execution

This release fixes the false-success response for internal department and
position creation from the CEO conversation.

- A direct authenticated instruction from the single user is sufficient
  authorization for internal HR organizational-registry work; a written
  delegation is not requested.
- The CEO execution layer now creates or reuses the three starter departments
  and their positions in the live HR tables, with bilingual names, codes and
  cost centers.
- The action is idempotent and blocks code/name conflicts before mutating
  records, so retrying the request does not create duplicates.
- The execution response includes the real department/position IDs and a
  verified evidence payload; the CEO must not claim completion without it.
- Reporting-to metadata is recorded in the execution evidence, and is written
  to the position relationship field when that field exists in the deployment.
- This action does not create employees, contracts, payroll, GOSI records,
  accounting postings or external communication.

No government records, financial records or existing attachments are reset,
deleted or rewritten.

---

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
