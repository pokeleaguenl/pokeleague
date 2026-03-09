#!/usr/bin/env bash
set -euo pipefail

DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
PREFIX="${BRANCH_PREFIX:-bot}"
STAMP="$(date +%Y%m%d-%H%M)"
TOPIC="${1:-work}"

git rev-parse --is-inside-work-tree >/dev/null 2>&1

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "$DEFAULT_BRANCH" ]]; then
  NEW_BRANCH="${PREFIX}/${STAMP}-${TOPIC}"
  echo "[guard] On ${DEFAULT_BRANCH}. Creating branch: ${NEW_BRANCH}"
  git checkout -b "$NEW_BRANCH"
else
  echo "[guard] On branch: ${BRANCH} (ok)"
fi
