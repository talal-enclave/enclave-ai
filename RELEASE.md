# Enclave v1.6.1 — Excel and PowerPoint attachment support

This release makes the CEO conversation accept the same safe office formats
already supported by the unified attachment backend.

- CEO chat file selection now accepts Word, Excel, PowerPoint, CSV, text and
  common image formats.
- Modern `.xlsx` and `.pptx` files are stored as conversation attachments and
  their readable text is included in the CEO source context.
- Legacy `.xls` and `.ppt` files are accepted and stored; they remain available
  for download even when text extraction is not possible.
- The existing 20 MB limit, executable-signature checks, private attachment
  storage and audit logging remain active.
- The CEO execution-first behavior from v1.6.0 is preserved when this release
  is applied on top of v1.6.0. If v1.6.0 has not been installed yet, the
  bundled backend includes that behavior as well.

No operational records, government records or existing attachments are reset,
deleted or rewritten by this release.
