#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/talal-enclave"
BACKUPS="$ROOT/backups"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-30}"

cd "$ROOT"

latest_manifest="$(
  find "$BACKUPS"     -maxdepth 1     -type f     -name 'scheduled-*.sha256'     -printf '%T@|%p\n'     | sort -nr     | head -1     | cut -d'|' -f2-
)"

if [ -z "$latest_manifest" ]; then
  echo "ERROR: no scheduled checksum manifest found"
  exit 1
fi

latest_db="$(
  find "$BACKUPS"     -maxdepth 1     -type f     -name 'scheduled-db-*.dump'     -printf '%T@|%p\n'     | sort -nr     | head -1
)"

if [ -z "$latest_db" ]; then
  echo "ERROR: no scheduled database backup found"
  exit 1
fi

db_mtime="${latest_db%%|*}"
db_path="${latest_db#*|}"
db_mtime_int="${db_mtime%%.*}"
now="$(date +%s)"
age_hours="$(( (now - db_mtime_int) / 3600 ))"

echo "Backup manifest: $latest_manifest"
echo "Latest DB backup: $db_path"
echo "Latest DB backup age: ${age_hours}h"

if [ "$age_hours" -gt "$MAX_AGE_HOURS" ]; then
  echo "ERROR: latest DB backup is older than ${MAX_AGE_HOURS} hours"
  exit 1
fi

# Manifest paths are relative to /opt/talal-enclave.
cd "$ROOT"
sha256sum -c "$latest_manifest"

echo "BACKUP INTEGRITY: PASSED"
