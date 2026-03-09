#!/usr/bin/env bash
set -euo pipefail

MSG="${1:-bot: progress}"

if [[ -z "$(git status --porcelain)" ]]; then
  echo "[commit] No changes."
  exit 0
fi

git add -A
git commit -m "$MSG" || true
