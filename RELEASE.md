# Enclave AI v1.0.0

Initial production source baseline for the Enclave AI Command Center.

## Baseline status

- Project-wide technical go-live acceptance: passed
- Production clean-start reset: completed
- 10 business agents: enabled
- Enclave Office Command Center UI redesign: completed
- Final UI build/deploy/smoke verification: passed

## Repository safety

The production `.env`, active `Caddyfile`, backups and recovery artifacts,
runtime logs/data, historical `.before-*` snapshots, generated build files,
and the currently root-owned/unreadable `scripts/` directory are excluded
from this release repository.

Use `.env.example` and `Caddyfile.example` as configuration templates.

## Release

Tag: `v1.0.0`

## v1.0.1 hardening

- Added HSTS, nosniff, clickjacking, referrer and browser-permission security headers at the Caddy edge.
- Preserved HTTPS and Basic Auth protection.
- Added a tracked backup-integrity verifier with freshness checking.
- Added daily checksum/freshness verification at 03:05 Riyadh time.
- Caddy's product `Server` header remains informational and is not treated as a security boundary.
- No application business logic or database schema changes.

## v1.0.2 no-sudo operations hardening

- Added a daily production security/operations self-check.
- Validates Git cleanliness, storage thresholds, public ports, Docker exposure,
  secret-file permissions, API/Web health, agent foundation, HTTPS security
  headers, TLS certificate expiry, backup freshness/checksums, and required
  cron jobs.
- Scheduled daily at 03:15 Asia/Riyadh, after the 02:30 backup and 03:05
  backup-integrity verification.
- Root-level SSH/UFW/Fail2ban/package changes remain intentionally deferred
  until administrative sudo access is available.
- No application business logic or database schema changes.

## v1.0.3 compliance expiry priority alerts

- Standardized government/corporate and employee government-document renewal lead time to 90 days.
- Added daily compliance-expiry synchronization at 06:15 Asia/Riyadh.
- Compliance documents with expiry dates are represented in HR Calendar with a 90-day alert window.
- Priority becomes HIGH inside 90 days and CRITICAL inside 30 days or after expiry.
- Existing compliance records are reconciled to the 90-day rule.
- No automatic renewal, filing, payment, or external communication is performed.

## v1.0.4 pre-operational readiness register

- Added a centralized Government & Corporate Pre-Operational Readiness view.
- Reuses the authoritative corporate compliance records instead of duplicating them.
- Adds manual readiness priority, responsible owner, action due date, and readiness notes.
- Effective priority preserves the v1.0.3 expiry rule: 31-90 days HIGH; 0-30 days or expired CRITICAL.
- Displays linked evidence documents from Unified Attachments.
- No action due dates or owners are invented; unconfirmed values remain blank.
- Existing compliance status remains authoritative in Government Compliance.
- Production web builds use Next.js Webpack mode to avoid the observed Turbopack next/font/google internal resolver failure.

## v1.1.0 sales + commercial finance command center

- Sales live-ready.
- Finance daily landing page is Commercial Finance only: Financial Proposals, Billing Schedule, Commercial Invoices, Collections and Alerts.
- Existing accounting engine remains in the backend and is preserved at /finance/accounting but is not linked from the daily finance landing page.
- Approved/active quotations can receive a billing schedule with separate invoice issue date and payment due date.
- Due invoices are prepared automatically as draft commercial invoices at 06:45 Asia/Riyadh.
- Commercial invoice issuance requires explicit user approval.
- Invoice issuance does not send externally and does not create accounting postings or bank transfers.
- Collection recording requires evidence/reference.
- CEO cross-functional internal orchestration, Daily Operations Report and Business Accountability Report enabled.

## v1.1.1 CEO chat attachments

- Added direct multi-file attachment support to the CEO Agent chat.
- CEO chat attachments use the existing Unified Attachments storage and are linked to the conversation.
- Supported CEO text extraction in this release: PDF, DOCX, TXT and CSV.
- Active attachments remain available as source context in later messages in the same CEO conversation.
- CEO orchestration receives the same attachment context for internal specialist work.
- Scanned/image-only documents are stored but are treated as non-extractable rather than guessed.
- Uploading files does not trigger external sending, payment, accounting posting, or other external execution.

## v1.2.0 CEO-Only Command Center

- User-facing operation is now CEO-only.
- Specialist agents remain enabled in the backend but are no longer direct user entry points.
- Department cards are read-only activity indicators.
- Office cards glow while a department is working and use a separate waiting-for-approval state.
- The UI lights likely departments immediately while the current CEO request is processing, then falls back to actual task/approval status.
- Pending approvals are handled inside the CEO screen.
- CEO chat attachments and conversation history remain available.
- Daily operations signals are surfaced in the CEO screen.
- CEO instructions explicitly prohibit redirecting the user to another agent or specialist workspace.
- Existing Sales, Commercial Finance, Operations, Legal, HR, IT, Procurement, Marketing, Admin and Audit backends remain preserved.

## v1.3.0 CEO Execution Engine

- Adds evidence-first execution to the CEO-only command center.
- Specialist prose is advisory only and is not proof that a system action happened.
- Real internal execution is supported for guarded Sales, Commercial Finance and Operations actions.
- The CEO can read client state, Finance status, daily reports and accountability from live records.
- Explicit client/project registration can create real Sales Account and Opportunity records.
- Business work items can be created for named accountable people such as external commercial contributors.
- Due commercial invoice drafts can be prepared through the existing approval-gated Commercial Finance workflow.
- Commercial proposal creation is blocked if quantity, unit price or direct cost is missing or not evidenced.
- No default/illustrative prices, costs, discounts, VAT, invoice numbers or dates may be used as business facts.
- Positive VAT remains governed by verified Company Profile registration.
- External send, accounting posting, payments, bank transfers and automatic Finance customer creation remain disabled.
- Financial Proposal DOCX/PDF generation remains unavailable in v1.3.0 and may not be promised.

## v1.3.1 CEO Execution Quality Fix

- Fixes named-person accountability resolution for Fahad Al-Anzi even when the execution planner omits the person field.
- Uses ASCII-safe Unicode source representation for Arabic name matching.
- Keeps Fahad accountability evidence-based through Operations/Sales records; no HR employee record is required or created.
- Normalizes accountability execution to the Sales/commercial office.
- Prevents duplicate presentation of the same authoritative system report.
- Prevents the CEO from redirecting Fahad accountability into HR.
- No business records are created, changed or deleted by this release.

## v1.3.2 Accountability Evidence Fix

- Excludes CEO orchestration/delegation tasks from named-person accountability evidence.
- Only explicit `business_work_item` tasks count as work items assigned to an accountable person.
- Sales Leads and Opportunities remain included when their owner/relationship owner matches the named person.
- Prevents the current accountability lookup request from appearing as historical work for the person being queried.
- No business records are created, changed, or deleted by this release.

## v1.3.3 Proposal Readiness Fix

- Adds deterministic `get_proposal_readiness` based on the live Sales/Commercial Finance contract.
- Proposal readiness reports actual stored Account and Opportunity identifiers and never asks the user for IDs already in the system.
- Exact required inputs for an internal proposal record are line description, quantity, unit price, and direct cost.
- Discount, validity date, payment terms, scope summary, and notes are optional for the proposal record.
- VAT status and proposal VAT rate are system-derived.
- Billing address, currency, salesperson internal number, existing quote reference, and pre-draft approval are not required to create the internal proposal record.
- Read-only proposal readiness requires no user approval.
- When the Execution Engine handles a request, the legacy CEO orchestrator is bypassed to prevent duplicate/generic output from overriding execution evidence.
- Artifact capability flags are not treated as proof that a document exists.
- Financial Proposal DOCX/PDF generation remains unavailable.
- No business records are created, changed, or deleted by this release.

## v1.3.4 Final Execution UX Fix

- Finalizes the v1.3 CEO execution UX for commercial proposal readiness and draft creation.
- Proposal readiness now identifies missing commercial inputs as Sales Quotation Line fields, not Opportunity fields.
- When proposal inputs are missing, the CEO asks only for the exact required fields or a source attachment containing them.
- The CEO must not offer generic A/B process options, internal notification workflows, or ask permission for read-only lookup.
- The CEO must not claim that Sales/Finance were notified unless a real supported system action exists.
- Commercial proposal line descriptions must be evidenced in the user request or attached source material.
- Optional payment terms and scope summary are used only when evidenced in source material; otherwise they are omitted.
- Draft quotation creation remains an internal system action and does not require approval.
- Approval is still required before external quotation use/activation.
- Financial Proposal DOCX/PDF generation remains unavailable until the Artifact Engine release.
- No business records are created, changed, or deleted by this release.

## v1.4.0 Financial Proposal Artifact Engine

- Generates real DOCX and PDF files from an authoritative Sales Quotation record.
- Links generated files to the Sales Quotation and copies them into the active CEO conversation so the current interface displays download links automatically.
- Marks draft and pending-approval quotations as internal-review drafts.
- Excludes direct cost, gross profit, and margin from client-facing files.
- Uses authoritative Company Profile and Quotation VAT data without inventing tax values.
- Requires a real quotation with line items; readiness data alone cannot generate files.
- Supports Arabic and English in DOCX/PDF through DejaVu fonts, Arabic shaping, and bidirectional rendering.
- Excludes generated outputs from CEO source-evidence extraction to avoid circular evidence.
- Performs no external sending, accounting posting, payment, or bank transfer.

## v1.4.1 Direct Cost Semantics & Artifact Completion UX

- Clarifies Sales Quotation direct_cost semantics: stored direct_cost is total direct cost for the quotation line.
- When quantity is greater than one, the CEO must not infer whether a stated Direct Cost is per-unit or line-total.
- Ambiguous Direct Cost basis blocks quotation creation and asks only whether the amount is per unit or total for the line.
- Explicit per-unit cost is multiplied by quantity before storage; explicit line-total cost is stored unchanged.
- Quantity equal to one remains unambiguous.
- Successful draft quotation + DOCX/PDF generation ends with a concise execution result instead of generic A/B workflow choices.
- validity_date, payment_terms and scope_summary remain optional; null approval fields are normal for a draft quotation.
- No automatic Finance/Sales notification or review claim is allowed without an explicit user request and real execution evidence.
- Existing Shory quotation and generated artifacts are preserved unchanged by this release.

## v1.4.2 Explicit Commercial Input Authority Fix

- Treats commercial values explicitly supplied by the user in the current request as authoritative source evidence for internal draft quotation creation.
- Removes the false requirement that Direct Cost must already be stored in Opportunity records or proven by an uploaded supplier/internal cost document.
- Adds a deterministic override for explicitly labeled proposal inputs such as Description, Quantity, Unit Price, and Direct Cost per unit / total.
- When complete labeled inputs are present, the deterministic route replaces a planner-generated blocked/advisory plan with real create_commercial_proposal execution.
- If DOCX/PDF are requested in the same command, artifact generation follows quotation creation automatically.
- Existing v1.4.1 Direct Cost basis safety remains authoritative: quantity greater than one still requires an explicit per-unit or line-total basis.
- No external sending is introduced.

## v1.4.3 Office Activity UI & Signal Accuracy

- Replaces generic department status cards with miniature-office cards.
- Every department remains visible as an office, including idle departments.
- Active offices use a calm warm-yellow lamp and subtle yellow glow.
- Idle offices remain visible but unlit.
- Waiting-approval offices use a restrained amber state.
- Removes frontend keyword/localBusy forcing from department activity status.
- Active task counts now include only pending/in-progress business_work_item records.
- Excludes generic auto-chat, legacy CEO delegation and advisory task noise from office lighting.
- Pending real approvals remain visible as waiting_approval.
- No business records are changed by this release.

## v1.4.4 Transient Office Execution Lighting

- Lights inferred department offices immediately while a CEO command is actively processing.
- Transient lighting requires both loading=true and localBusy membership.
- Existing setLocalBusy([]) in the request finally block turns transient lighting off immediately when the request completes.
- Persistent office status remains server-authoritative and still requires a real business_work_item or pending approval.
- Adds a subtle warm-yellow lamp pulse during active request execution.
- No backend or business data changes.
