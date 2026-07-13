#!/usr/bin/env bash
# Uploads Cloudflare Worker runtime secrets (Resend + Turnstile secret key).
# Locally, reads them from .dev.vars. In CI (no .dev.vars present), reads
# them from already-exported environment variables instead.
#
# NEXT_PUBLIC_TURNSTILE_SITE_KEY and NEXT_PUBLIC_UMAMI_WEBSITE_ID are
# intentionally NOT pushed here — both are public values baked into the
# client bundle at build time (see deploy.yml's "Build and deploy" step),
# not Worker runtime secrets.
set -euo pipefail

VARS_FILE=".dev.vars"
SECRET_KEYS=(RESEND_API_KEY RESEND_FROM RESEND_SUBJECT_PREFIX RESEND_TO TURNSTILE_SECRET_KEY)

set_secret() {
  echo "Setting secret: $1"
  printf '%s' "$2" | wrangler secret put "$1"
}

is_tracked_key() {
  local key="$1" k
  for k in "${SECRET_KEYS[@]}"; do
    [[ "$key" == "$k" ]] && return 0
  done
  return 1
}

if [[ -f "$VARS_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    is_tracked_key "$key" || continue
    set_secret "$key" "$value"
  done < "$VARS_FILE"
else
  for key in "${SECRET_KEYS[@]}"; do
    value="${!key:-}"
    [[ -z "$value" ]] && { echo "Error: $key not set (no .dev.vars and no env var)." >&2; exit 1; }
    set_secret "$key" "$value"
  done
fi

echo "All secrets uploaded."
