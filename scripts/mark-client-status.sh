#!/usr/bin/env bash
# Sets a client's deal status in the catopia-crm D1 database.
set -euo pipefail

VALID_STATUSES=(lead active closed_won closed_lost closed_abandoned)

usage() {
  echo "Usage: $0 <email> <status>" >&2
  echo "  status must be one of: ${VALID_STATUSES[*]}" >&2
}

is_valid_status() {
  local status="$1" s
  for s in "${VALID_STATUSES[@]}"; do
    [[ "$status" == "$s" ]] && return 0
  done
  return 1
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -ne 2 ]]; then
  usage
  exit 1
fi

EMAIL="$1"
STATUS="$2"

if ! is_valid_status "$STATUS"; then
  echo "Error: '$STATUS' is not a valid status." >&2
  usage
  exit 1
fi

wrangler d1 execute catopia-crm --remote --command \
  "UPDATE clients SET status='$STATUS', updated_at=datetime('now') WHERE email='$EMAIL'"
