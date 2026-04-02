#!/bin/zsh
set -euo pipefail

ROOT="/Users/taofangzheng/.openclaw/workspace"
SITE_ROOT="$ROOT/projects/xiuyuan.github.io"
CASES_ROOT="$SITE_ROOT/cases"
ASSEMBLE_SCRIPT="$SITE_ROOT/scripts/assemble_publish.sh"
PREVIEW_PORT="8130"
PREVIEW_URL="http://127.0.0.1:${PREVIEW_PORT}/cases/"
SITE_URL="http://127.0.0.1:${PREVIEW_PORT}/"
PREVIEW_PID_FILE="/tmp/xiuyuan-build-preview.pid"
PREVIEW_LOG_FILE="/tmp/xiuyuan-build-preview.log"
PREVIEW_PYTHON="/opt/homebrew/bin/python3"

cd "$ROOT"

echo "[1/6] 导出 Feishu 后台数据..."
python3 feishu-bitable-sync/export_frontend_data.py

echo "[2/6] 同步案例库源码到主站项目..."
mkdir -p "$CASES_ROOT"
rsync -a --delete \
  --exclude ".DS_Store" \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude ".git" \
  ruc-suzhou-case-library/ "$CASES_ROOT/"

echo "[3/6] 组装统一发布目录 build/..."
"$ASSEMBLE_SCRIPT"

echo "[4/6] 启动或刷新本地预览服务..."
if [[ -f "$PREVIEW_PID_FILE" ]]; then
  OLD_PID="$(cat "$PREVIEW_PID_FILE" 2>/dev/null || true)"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
fi
(
  cd "$SITE_ROOT/build"
  nohup "$PREVIEW_PYTHON" -m http.server "$PREVIEW_PORT" >"$PREVIEW_LOG_FILE" 2>&1 &
  echo $! > "$PREVIEW_PID_FILE"
)
sleep 2

echo "[5/6] 检查本地预览可访问性..."
if curl --noproxy '*' -I "$SITE_URL" >/dev/null 2>&1 && curl --noproxy '*' -I "$PREVIEW_URL" >/dev/null 2>&1; then
  echo "本地预览检查通过。"
else
  echo "⚠️ 本地预览服务已尝试启动，但访问检查未完全通过。"
  echo "你仍可手动打开以下地址查看："
fi

echo "[6/6] 同步完成"
echo "主站预览：$SITE_URL"
echo "案例库预览：$PREVIEW_URL"
echo "说明：当前脚本只负责新结构下的导出 + 组装 + 本地预览检查，不再走旧 GitHub Pages docs 覆盖逻辑。"
