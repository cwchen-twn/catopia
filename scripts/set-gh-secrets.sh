#!/usr/bin/env bash
# Pushes the secrets used by .github/workflows/deploy.yml to this repo's
# GitHub Actions secrets via `gh secret set`.
#
# RESEND_*/TURNSTILE_SECRET_KEY/NEXT_PUBLIC_TURNSTILE_SITE_KEY values are
# read from .dev.vars. CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID aren't
# stored in .dev.vars, so they're read from already-exported environment
# variables if present, otherwise prompted for.
set -euo pipefail

command -v gh >/dev/null 2>&1 || { echo "Error: gh CLI not found." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Error: not logged in to gh. Run 'gh auth login' first." >&2; exit 1; }

VARS_FILE=".dev.vars"
DEV_VARS_KEYS=(RESEND_API_KEY RESEND_FROM RESEND_SUBJECT_PREFIX RESEND_TO TURNSTILE_SECRET_KEY NEXT_PUBLIC_TURNSTILE_SITE_KEY)

set_secret() {
  echo "Setting GitHub secret: $1"
  printf '%s' "$2" | gh secret set "$1"
}

is_tracked_key() {
  local key="$1" k
  for k in "${DEV_VARS_KEYS[@]}"; do
    [[ "$key" == "$k" ]] && return 0
  done
  return 1
}

prompt_secret() {
  local key="$1" value
  read -r -s -p "Enter value for $key: " value >&2
  echo >&2
  [[ -z "$value" ]] && { echo "Error: $key cannot be empty." >&2; exit 1; }
  printf '%s' "$value"
}

for key in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
  value="${!key:-}"
  [[ -z "$value" ]] && value="$(prompt_secret "$key")"
  set_secret "$key" "$value"
done

[[ -f "$VARS_FILE" ]] || { echo "Error: $VARS_FILE not found." >&2; exit 1; }

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  is_tracked_key "$key" || continue
  set_secret "$key" "$value"
done < "$VARS_FILE"

echo "All GitHub Actions secrets set."
