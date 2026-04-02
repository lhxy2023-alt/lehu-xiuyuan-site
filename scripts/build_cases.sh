#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CASES_SRC="$ROOT/cases"
CASES_DEST="$ROOT/build/cases"

echo "[build_cases] source: $CASES_SRC"
test -f "$CASES_SRC/index.html"
mkdir -p "$ROOT/build"
rm -rf "$CASES_DEST"
mkdir -p "$CASES_DEST"
rsync -a --delete --exclude ".DS_Store" --exclude "README.md" --exclude "BACKEND_GUIDE.md" --exclude "FIELD_MAPPING.md" "$CASES_SRC/" "$CASES_DEST/"
echo "[build_cases] done -> $CASES_DEST"
