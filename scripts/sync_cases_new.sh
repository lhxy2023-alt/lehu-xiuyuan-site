#!/bin/zsh
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXPORT_SCRIPT="$SITE_ROOT/scripts/export_frontend_data.py"
ASSEMBLE_SCRIPT="$SITE_ROOT/scripts/assemble_publish.sh"
PREVIEW_PORT="8130"
PREVIEW_URL="http://127.0.0.1:${PREVIEW_PORT}/cases/"
SITE_URL="http://127.0.0.1:${PREVIEW_PORT}/"
PREVIEW_PID_FILE="/tmp/xiuyuan-build-preview.pid"
PREVIEW_LOG_FILE="/tmp/xiuyuan-build-preview.log"
PYTHON_BIN="${PYTHON_BIN:-python3}"
PREVIEW_PYTHON="${PREVIEW_PYTHON:-$PYTHON_BIN}"
PUBLISH_BRANCH="${PUBLISH_BRANCH:-main}"
GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-taofangzheng}"
GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-taofangzheng@users.noreply.github.com}"

cd "$SITE_ROOT"

echo "[1/8] 检查 GitHub 远端状态..."
git config user.name "$(git config --get user.name || echo "$GIT_AUTHOR_NAME")"
git config user.email "$(git config --get user.email || echo "$GIT_AUTHOR_EMAIL")"
if git diff --quiet && git diff --cached --quiet; then
  git fetch origin "$PUBLISH_BRANCH"
  git merge --ff-only "origin/$PUBLISH_BRANCH"
else
  echo "检测到本地已有未发布变更，本次会保留并一起发布。"
fi

echo "[2/8] 导出 Feishu 后台数据..."
chmod +x "$EXPORT_SCRIPT" >/dev/null 2>&1 || true
"$PYTHON_BIN" "$EXPORT_SCRIPT"

echo "[3/8] 案例库源码已在当前仓库，无需从旧 OpenClaw 工作区同步。"

echo "[4/8] 组装统一发布目录 build/..."
"$ASSEMBLE_SCRIPT"

echo "[5/8] 启动或刷新本地预览服务..."
if [[ -f "$PREVIEW_PID_FILE" ]]; then
  OLD_PID="$(cat "$PREVIEW_PID_FILE" 2>/dev/null || true)"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
fi
(
  cd "$SITE_ROOT/build"
  nohup "$PREVIEW_PYTHON" -m http.server "$PREVIEW_PORT" --bind 127.0.0.1 >"$PREVIEW_LOG_FILE" 2>&1 < /dev/null &
  PREVIEW_PID=$!
  echo "$PREVIEW_PID" > "$PREVIEW_PID_FILE"
  disown "$PREVIEW_PID" 2>/dev/null || true
)
sleep 2

echo "[6/8] 检查本地预览可访问性..."
if curl --noproxy '*' -I "$SITE_URL" >/dev/null 2>&1 && curl --noproxy '*' -I "$PREVIEW_URL" >/dev/null 2>&1; then
  echo "本地预览检查通过。"
else
  echo "⚠️ 本地预览服务已尝试启动，但访问检查未完全通过。"
  echo "你仍可手动打开以下地址查看："
fi

echo "[7/8] 提交本地变更..."
git add -A
if git diff --cached --quiet; then
  echo "没有检测到新的本地变更，跳过提交。"
else
  COMMIT_MESSAGE="sync case library from Feishu $(date '+%Y-%m-%d %H:%M')"
  git commit -m "$COMMIT_MESSAGE"
fi

echo "[8/8] 推送到 GitHub..."
if git push origin "HEAD:$PUBLISH_BRANCH"; then
  echo "GitHub 推送完成。"
else
  echo "远端有新变化或推送失败，尝试同步远端后再次推送..."
  git pull --rebase origin "$PUBLISH_BRANCH"
  git push origin "HEAD:$PUBLISH_BRANCH"
  echo "GitHub 推送完成。"
fi

echo "同步与发布完成"
echo "主站预览：$SITE_URL"
echo "案例库预览：$PREVIEW_URL"
echo "公网案例库：https://lhxy2023-alt.github.io/lehu-xiuyuan-site/cases/"
echo "说明：当前脚本会从飞书多维表格导出最新数据，重建本地 build/，提交本地变更，并推送到 GitHub。"
