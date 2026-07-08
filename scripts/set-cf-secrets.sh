#!/usr/bin/env bash
# Uploads RESEND_* Cloudflare Worker secrets.
# Locally, reads them from .dev.vars. In CI (no .dev.vars present), reads
# them from already-exported RESEND_* environment variables instead.
set -euo pipefail

VARS_FILE=".dev.vars"
RESEND_KEYS=(RESEND_API_KEY RESEND_FROM RESEND_SUBJECT_PREFIX RESEND_TO)

set_secret() {
  echo "Setting secret: $1"
  printf '%s' "$2" | wrangler secret put "$1"
}

if [[ -f "$VARS_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" != RESEND_* ]] && continue
    set_secret "$key" "$value"
  done < "$VARS_FILE"
else
  for key in "${RESEND_KEYS[@]}"; do
    value="${!key:-}"
    [[ -z "$value" ]] && { echo "Error: $key not set (no .dev.vars and no env var)." >&2; exit 1; }
    set_secret "$key" "$value"
  done
fi

echo "All RESEND_* secrets uploaded."
