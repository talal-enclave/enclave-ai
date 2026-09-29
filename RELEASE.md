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
