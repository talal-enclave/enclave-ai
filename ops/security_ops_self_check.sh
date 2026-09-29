#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/talal-enclave"
HOST="91-99-163-193.sslip.io"
MAX_DISK_PERCENT="${MAX_DISK_PERCENT:-80}"
MAX_INODE_PERCENT="${MAX_INODE_PERCENT:-80}"

cd "$ROOT"

fail() {
  echo "ERROR: $*"
  exit 1
}

warn() {
  echo "WARNING: $*"
}

echo "=================================================="
echo " ENCLAVE DAILY SECURITY / OPERATIONS SELF-CHECK"
echo " $(date -Is)"
echo "=================================================="

echo
echo "1) GIT RELEASE STATE"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || fail "project is not a Git worktree"

branch="$(git branch --show-current)"
head="$(git rev-parse --short HEAD)"
tags="$(git tag --points-at HEAD | tr '\n' ' ' || true)"

echo "Branch: $branch"
echo "HEAD: $head"
echo "Tags at HEAD: ${tags:-none}"

[ "$branch" = "main" ] || fail "production branch is not main"
[ -z "$(git status --porcelain)" ] || fail "production Git working tree is dirty"

echo "Git working tree: CLEAN"

echo
echo "2) HOST STORAGE"

disk_pct="$(
  df -P / \
  | awk 'NR==2 {gsub("%","",$5); print $5}'
)"

inode_pct="$(
  df -Pi / \
  | awk 'NR==2 {gsub("%","",$5); print $5}'
)"

echo "Root disk usage: ${disk_pct}%"
echo "Root inode usage: ${inode_pct}%"

[ "$disk_pct" -lt "$MAX_DISK_PERCENT" ] \
  || fail "disk usage is ${disk_pct}%"

[ "$inode_pct" -lt "$MAX_INODE_PERCENT" ] \
  || fail "inode usage is ${inode_pct}%"

echo
echo "3) PUBLIC LISTENING PORTS"

public_ports="$(
  ss -H -lnt 2>/dev/null \
  | awk '{print $4}' \
  | sed -nE \
    's/^(0\.0\.0\.0|\[::\]|\*)[:]([0-9]+)$/\2/p' \
  | sort -nu
)"

printf '%s\n' "$public_ports"

unexpected="$(
  printf '%s\n' "$public_ports" \
  | grep -Ev '^(22|80|443)$' \
  || true
)"

[ -z "$unexpected" ] \
  || fail "unexpected public TCP port(s): $(echo "$unexpected" | tr '\n' ' ')"

echo "Public TCP exposure: EXPECTED ONLY"

echo
echo "4) DOCKER SERVICE HEALTH / PORT EXPOSURE"

for c in \
  talal-enclave-caddy-1 \
  talal-enclave-web-1 \
  talal-enclave-api-1 \
  talal-enclave-postgres-1 \
  talal-enclave-redis-1
do
  docker inspect "$c" >/dev/null 2>&1 \
    || fail "container missing: $c"

  state="$(docker inspect -f '{{.State.Status}}' "$c")"
  echo "$c: $state"

  [ "$state" = "running" ] \
    || fail "container not running: $c"
done

for c in \
  talal-enclave-web-1 \
  talal-enclave-api-1 \
  talal-enclave-postgres-1 \
  talal-enclave-redis-1
do
  exposed="$(docker port "$c" 2>/dev/null || true)"
  [ -z "$exposed" ] \
    || fail "$c unexpectedly publishes host ports: $exposed"
done

echo "Internal services are not host-published: PASSED"

echo
echo "5) SECRET FILE PERMISSIONS"

for f in .env Caddyfile; do
  [ -f "$f" ] || fail "missing production secret/config file: $f"

  mode="$(stat -c '%a' "$f")"
  echo "$f mode: $mode"

  [ "$mode" = "600" ] \
    || fail "$f permissions are $mode; expected 600"

  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    fail "$f is tracked by Git"
  fi
done

echo "Production secrets/config: PROTECTED"

echo
echo "6) APPLICATION HEALTH"

docker compose exec -T api python - <<'PY'
import urllib.request

with urllib.request.urlopen(
    "http://127.0.0.1:8000/health",
    timeout=20,
) as response:
    assert response.status == 200

print("API health: PASSED")
PY

docker compose exec -T web node - <<'NODE'
const http = require("http");
const paths = ["/", "/hr", "/finance", "/sales", "/it", "/audit"];

function check(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: "127.0.0.1", port: 3000, path, timeout: 5000 },
      (res) => {
        res.resume();
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log(path, "HTTP", res.statusCode);
            resolve();
          } else {
            reject(new Error(`${path} -> HTTP ${res.statusCode}`));
          }
        });
      }
    );
    req.on("error", reject);
  });
}

(async () => {
  for (const path of paths) await check(path);
  console.log("Web smoke: PASSED");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE

echo
echo "7) DATABASE CONNECTIVITY / AGENT FOUNDATION"

agents="$(
  docker compose exec -T postgres sh -lc '
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc \
      "SELECT count(*) FROM agents;"
  ' | tr -d '\r'
)"

echo "Agent count: $agents"

[ "$agents" -ge 10 ] \
  || fail "agent foundation count is below 10"

echo "Database foundation: PASSED"

echo
echo "8) HTTPS / BASIC AUTH / SECURITY HEADERS"

headers="$(
  curl -k -sS -D - -o /dev/null \
    --resolve "${HOST}:443:127.0.0.1" \
    "https://${HOST}/"
)"

status="$(
  printf '%s\n' "$headers" \
  | head -1 \
  | awk '{print $2}' \
  | tr -d '\r'
)"

echo "Unauthenticated HTTPS status: $status"
[ "$status" = "401" ] \
  || fail "expected Basic Auth 401 challenge"

for header in \
  strict-transport-security \
  x-content-type-options \
  x-frame-options \
  referrer-policy \
  permissions-policy \
  www-authenticate
do
  printf '%s\n' "$headers" \
    | tr '[:upper:]' '[:lower:]' \
    | grep -q "^${header}:" \
    || fail "missing HTTPS response header: $header"

  echo "$header: PRESENT"
done

echo "HTTPS edge controls: PASSED"

echo
echo "9) TLS CERTIFICATE EXPIRY"

cert_end="$(
  echo \
  | openssl s_client \
      -connect 127.0.0.1:443 \
      -servername "$HOST" \
      2>/dev/null \
  | openssl x509 -noout -enddate \
  | cut -d= -f2-
)"

[ -n "$cert_end" ] || fail "could not read TLS certificate expiry"

echo "Certificate notAfter: $cert_end"

echo \
| openssl s_client \
    -connect 127.0.0.1:443 \
    -servername "$HOST" \
    2>/dev/null \
| openssl x509 -checkend 604800 -noout \
  >/dev/null \
|| fail "TLS certificate expires within 7 days"

echo "TLS certificate expiry: > 7 days"

echo
echo "10) BACKUP FRESHNESS / CHECKSUM"

[ -x ops/verify_backup_integrity.sh ] \
  || fail "backup integrity verifier missing"

ops/verify_backup_integrity.sh

echo
echo "11) DOCKER BUILD CACHE"

cache_line="$(
  docker system df 2>/dev/null \
  | awk '$1=="Build" && $2=="Cache" {print}'
)"

if [ -n "$cache_line" ]; then
  echo "$cache_line"
fi

reclaimable_bytes="$(
  docker builder du 2>/dev/null \
  | awk '
      /Reclaimable:/ {
        value=$2
        unit=$3
        print value unit
        exit
      }
    ' \
  || true
)"

if [ -n "$reclaimable_bytes" ]; then
  echo "Builder reclaimable: $reclaimable_bytes"
fi

echo
echo "12) CRON OPERATIONS"

cron="$(crontab -l 2>/dev/null || true)"

for needle in \
  '/home/enclave/.talal-enclave-ops/backup_local.sh' \
  '/home/enclave/.talal-enclave-ops/health_watch.sh' \
  '/opt/talal-enclave/ops/verify_backup_integrity.sh'
do
  printf '%s\n' "$cron" \
    | grep -F "$needle" \
    >/dev/null \
    || fail "required cron job missing: $needle"

  echo "cron present: $needle"
done

echo
echo "=================================================="
echo " ENCLAVE DAILY SELF-CHECK: PASSED"
echo "=================================================="
