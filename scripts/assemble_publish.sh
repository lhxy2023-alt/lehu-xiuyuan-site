#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

"$ROOT/scripts/build_site.sh"
"$ROOT/scripts/build_cases.sh"

echo "[assemble_publish] assembled successfully"
echo "[assemble_publish] root entry: $ROOT/build/index.html"
echo "[assemble_publish] cases entry: $ROOT/build/cases/index.html"
