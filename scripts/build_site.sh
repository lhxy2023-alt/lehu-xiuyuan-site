#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/build"
PYTHON_MKDOCS="/Library/Developer/CommandLineTools/usr/bin/python3"

echo "[build_site] root: $ROOT"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$ROOT"
"$PYTHON_MKDOCS" -m mkdocs build -d "$BUILD_DIR"
echo "[build_site] done -> $BUILD_DIR"
