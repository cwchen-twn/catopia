#!/usr/bin/env bash
# Reads RESEND_* entries from .dev.vars and uploads them as Cloudflare Worker secrets.
set -euo pipefail

VARS_FILE=".dev.vars"
[[ -f "$VARS_FILE" ]] || { echo "Error: $VARS_FILE not found." >&2; exit 1; }

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  [[ "$key" != RESEND_* ]] && continue
  echo "Setting secret: $key"
  printf '%s' "$value" | wrangler secret put "$key"
done < "$VARS_FILE"

echo "All RESEND_* secrets uploaded."
