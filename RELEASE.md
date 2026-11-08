# Enclave v1.6.0 — CEO execution-first behavior

This release corrects the CEO Agent interaction contract after the read-only
conversation diagnostic showed repeated A/B menus, re-opening of already
approved decisions, and failure to generate the requested workers XLSX file.

Changes:

- Replaces the persisted CEO prompt that forced exactly two options for every
  request with an execution-first contract.
- Treats clear instructions, confirmations and task handoffs as commands to
  execute; asks only for the smallest genuinely missing input.
- Adds a live read-only pending/in-progress task lookup for the CEO chat.
- Adds an idempotent bilingual `TalalEnclave_Workers_Template.xlsx` generator
  for non-employee contributors. It attaches the file to the conversation and
  does not create employee records.
- Uses recent user-authored context to continue a short confirmation such as
  `موافق`, `أوافق`, `1` or `أ` without reopening the previous decision.
- Keeps external sending, payment, banking, filing and other external effects
  approval-gated.

No operational data is reset or deleted by this release.
