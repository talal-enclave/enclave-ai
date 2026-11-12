# Enclave v1.6.17 — Truthful bank-balance reads

This release fixes CEO finance lookups that were incorrectly answered from the
generic executive dashboard.

- Bank-balance and cash-position questions use the live bank cash-position
  register and return the total plus each active bank account balance.
- The generic `/api/dashboard` task/conversation summary is no longer accepted
  as evidence for a bank balance.
- The response includes the as-of date and the exact live finance source.
- This is read-only; it does not create payments, transfers, journal entries or
  external actions.

---

# Enclave v1.6.16 — Reliable vacancy creation

This release hardens the internal HR vacancy write path after a vacancy request
returned a generic HTTP 500.

- Vacancy creation is persisted and verified independently of optional manager
  reporting-line assignment.
- Legacy reporting-line schema errors no longer roll back a valid vacancy or
  become an unhandled server error.
- Failed CEO actions keep a stable conversation identifier while the truthful
  blocked result is saved, preventing rollback-related generic HTTP 500 errors.
- The result reports the real vacancy ID, position, department and whether the
  direct manager was assigned.
- No external publication, candidate contact, payment or data reset occurs.

---

# Enclave v1.6.15 — Cross-department CEO execution gate

This release fixes the broader CEO failure mode where a request outside the
small deterministic action list was handed to a specialist model and then
reported as if prose were proof of execution.

- The CEO planner receives the live internal API route contract and may call
  only an exact approved internal route.
- GET requests return live system evidence; internal POST/PUT/PATCH requests
  return success only when the route responds with record evidence.
- Payment, transfer, approval, posting, publishing, deployment and external
  routes are blocked from the generic broker.
- Specialist/delegation prose can no longer mark a task completed. Such work
  remains an in-progress work order until a supported action produces evidence.
- Executive, HR, Finance, Sales, Marketing and government-compliance report
  requests are routed to live dashboard/register endpoints.

No external communication, payment, bank transfer or data reset is performed.

---

# Enclave v1.6.14 — Deterministic CEO execution resume

This release safely completes the v1.6.13 source state after its installer
stopped during a worktree check. It validates the installed source by SHA-256
instead of requiring every manifest entry to appear as a Git change; files
that are already identical to the baseline are accepted as-is.

- Resumes the interrupted CEO evidence-firewall deployment without rerunning
  v1.6.13.
- Preserves the pre-resume source, database and attachment backup.
- Keeps deterministic evidence responses, rollback safety and live HR vacancy
  verification from v1.6.13.
- Does not reset data or send anything externally.

---

# Enclave v1.6.13 — Deterministic CEO execution responses

This release removes an unnecessary provider dependency from handled CEO
execution requests.

- Live HR reads and supported internal writes now return directly from the
  deterministic execution evidence; they do not call the language model a
  second time just to restate the result.
- Provider outages or malformed provider responses therefore cannot turn a
  verified internal action into a generic chat 500.
- Advisory/general CEO questions still use the model path.
- The v1.6.12 installer acceptance repair and interrupted-state recovery remain
  included.

---

# Enclave v1.6.12 — Installer acceptance repair

This release repairs the v1.6.11 installer acceptance path after the API
container correctly passed its checks but the container-local runner attempted
to read a frontend source file that is not mounted into that image.

- Frontend source checks run on the host staging tree; API-container checks
  validate only backend and live endpoint requirements.
- The installer can safely resume the exact uncommitted v1.6.11 source state
  left by that failed acceptance step, after verifying the expected paths and
  hashes. Unexpected changes still stop before any write.
- No database reset, record deletion or external communication is performed.

---

# Enclave v1.6.11 — Chat error handling and execution rollback

This release fixes the failure path shown as `Unexpected token 'I', "Internal
Server Error" is not valid JSON` in the CEO chat.

- The CEO chat client now parses JSON defensively and reports the real HTTP
  status/body when a proxy or upstream returns plain text.
- A failed execution transaction is rolled back before the chat continues, so
  a stale SQLAlchemy transaction cannot turn the response into an opaque 500.
- Execution-engine failures are returned as blocked evidence with no write
  claim; the assistant cannot replace them with a fabricated success message.
- The vacancy follow-up correction from v1.6.10 remains included.

---

# Enclave v1.6.10 — Vacancy follow-up execution correction

This release fixes the confirmation path that could combine an older vacancy
status question with a later “open the vacancy” command and incorrectly route
the combined text back to a read-only lookup.

- A short confirmation now rehydrates only the immediately preceding
  user-authored request; the broader user-only context is still used only to
  resolve one unambiguous vacancy title.
- Explicit mutation intent takes precedence over the live-read guard, so a
  supported `create_hr_vacancy` action is not replaced by a blocked lookup.
- The real HRVacancy write, persisted ID, department/position link and `open`
  status remain mandatory before completion is reported.

---

# Enclave v1.6.9 — Context-aware truthful execution

This release fixes the over-blocking case where a clear follow-up such as
“open the vacancy” referred to the single vacancy named in the immediately
preceding user message.

- Vacancy mutation commands may resolve a title only from the latest
  user-authored context, and only when exactly one title is evidenced.
- The known AI Platform follow-up uses the existing TECH/CTO internal mapping;
  the live write still verifies the persisted HRVacancy record before success.
- Ambiguous references remain blocked and ask for the exact title instead of
  guessing. CEO blocked responses are rendered in Arabic with the actual reason.

---

# Enclave v1.6.8 — Canonical evidence firewall

This release closes the remaining mismatch where the CEO's live vacancy read
could disagree with the HR recruitment screen or where a page-load failure was
silently rendered as zero.

- HR vacancy summary, vacancy list and CEO vacancy reads now use one canonical
  `HRVacancy` snapshot with the same status normalization, IDs and counts.
- CEO responses for handled actions are rendered from execution evidence, not
  from model-generated completion/status prose. Unsupported or unverified
  results are shown as blocked.
- The recruitment screen refreshes live data, exposes load errors and never
  replaces an unavailable or conflicting result with a false zero.
- The same evidence-first execution and approval gates remain in force for
  Finance, Sales, HR, Procurement, Legal, Admin, IT, Marketing and Audit.

No government records, external communications, payments or existing files are
reset or changed by this release.

---

# Enclave v1.6.7 — Live status evidence firewall

This release closes the read-only false-success path shown when the CEO
reported an open vacancy even though the HR dashboard showed zero.

- Vacancy status questions now read the live `HRVacancy` table and return the
  matching record IDs, matching open count and system-wide open count.
- Status is never inferred from a previous CEO response, job-description draft
  or task. Unsupported record lookups are blocked rather than hallucinated.

---

# Enclave v1.6.6 — CEO evidence firewall and verified HR vacancies

This release closes the false-success path where the CEO response described a
draft, task or specialist explanation as a completed HR or Finance record.

- Explicit vacancy requests now create or reuse a live `HRVacancy` linked to a
  real department position, verify the persisted ID and `open` status, and
  report the record evidence.
- If a direct create/update/register command has no supported database action,
  the CEO returns `blocked` and does not delegate it as if it were completed.
- Vacancy creation never publishes externally or contacts candidates.

---

# Enclave v1.6.5 — Formal employee roster import

This release fixes the case where a user provides a completed employee roster
and asks the CEO to add or activate the employees.

- A formal `.xlsx`/`.csv` employee roster attached to the CEO conversation is
  now imported into the live `HREmployee` table.
- The importer maps each row to the existing HR department and position, keeps
  the source identity fields, creates deterministic employee numbers, and sets
  the requested internal employee status to active.
- Existing rows are reused by source row, employee number, national ID or work
  email; retries do not create duplicates.
- Bilingual Arabic/English number headers are mapped explicitly, so worker ID,
  national ID, mobile and emergency-contact values cannot overwrite one another.
- The CEO response includes the real employee IDs and post-write verification.
  A row mapping error blocks the import instead of producing a partial success
  claim.
- The import does not create employment contracts, payroll, GOSI registration,
  payments or external communications.

Without an attached roster, the existing v1.6.4 behavior remains: only already
persisted formal employee records can be activated, and an empty live table is
reported as blocked.

---

# Enclave v1.6.4 — Evidence-first employee activation

This release fixes the false-success response when the CEO is asked to
activate employees.

- `activate_existing_employees` reads the live HR employee table and can only
  activate existing formal employee rows with a safe inactive/onboarding status.
- If no formal employee rows exist, the action returns `blocked` with the live
  count and cannot create a person from a position, an assistant response, a
  remembered name or an inferred leadership list.
- The completion response includes real employee IDs and before/after statuses;
  the CEO cannot claim activation without record evidence.
- Non-employee/external-worker rows, terminated rows and other non-eligible
  statuses are left unchanged.
- Payroll, contracts, GOSI registration, payments and external communication
  remain disabled.

The existing v1.6.3 organizational-structure execution remains unchanged.

---

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
