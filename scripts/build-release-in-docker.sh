#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="${1:-$ROOT_DIR/release}"
ENV_SOURCE="${ENV_SOURCE:-$RELEASE_DIR/.env.local}"
DOCKER_IMAGE="${DOCKER_IMAGE:-node:22-bookworm}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$RELEASE_DIR/release.tar.gz}"
TEMP_ENV_DIR="$ROOT_DIR/.release-env-tmp"
TEMP_ENV_BACKUP="$TEMP_ENV_DIR/.env.local"

cleanup() {
  if [[ -f "$TEMP_ENV_BACKUP" ]]; then
    mkdir -p "$RELEASE_DIR"
    cp "$TEMP_ENV_BACKUP" "$RELEASE_DIR/.env.local"
  fi
  rm -rf "$TEMP_ENV_DIR"
}

trap cleanup EXIT

if [[ ! -f "$ENV_SOURCE" ]]; then
  echo "未找到环境文件: $ENV_SOURCE" >&2
  echo "请先在 release/.env.local 中准备好发布环境变量" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 docker，请先安装 Docker Desktop / Docker Engine" >&2
  exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
  echo "未检测到 tar，请先安装 tar 命令" >&2
  exit 1
fi

rm -rf "$TEMP_ENV_DIR"
mkdir -p "$TEMP_ENV_DIR"
cp "$ENV_SOURCE" "$TEMP_ENV_BACKUP"
mkdir -p "$RELEASE_DIR"

docker run --rm \
  --platform "$DOCKER_PLATFORM" \
  -u "$(id -u):$(id -g)" \
  -v "$ROOT_DIR":/workspace \
  -v "$TEMP_ENV_DIR":/tmp/release-env:ro \
  -w /workspace \
  "$DOCKER_IMAGE" \
  bash -lc '
    set -euo pipefail

    corepack enable
    corepack prepare pnpm@10.11.0 --activate

    RELEASE_DIR=/workspace/release
    BUILD_DIR=/workspace/.release-build
    TEMP_ENV=/tmp/release-env/.env.local

    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR/apps" "$BUILD_DIR/packages"

    copy_if_exists() {
      local src="$1"
      local dest="$2"
      if [[ -e "$src" ]]; then
        cp -R "$src" "$dest"
      fi
    }

    copy_if_exists /workspace/package.json "$BUILD_DIR/"
    copy_if_exists /workspace/pnpm-workspace.yaml "$BUILD_DIR/"
    copy_if_exists /workspace/turbo.json "$BUILD_DIR/"
    copy_if_exists /workspace/tsconfig.base.json "$BUILD_DIR/"
    copy_if_exists /workspace/.npmrc "$BUILD_DIR/"
    copy_if_exists /workspace/apps/api "$BUILD_DIR/apps/"
    copy_if_exists /workspace/apps/web "$BUILD_DIR/apps/"
    copy_if_exists /workspace/apps/admin "$BUILD_DIR/apps/"
    copy_if_exists /workspace/packages/shared "$BUILD_DIR/packages/"
    copy_if_exists /workspace/packages/config "$BUILD_DIR/packages/"
    cp "$TEMP_ENV" "$BUILD_DIR/.env.local"

    find "$BUILD_DIR" -type d \( -name node_modules -o -name .next -o -name dist -o -name coverage \) -prune -exec rm -rf {} +

    cd "$BUILD_DIR"

    set -a
    source "$TEMP_ENV"
    set +a

    pnpm install --no-frozen-lockfile
    pnpm --filter @umi/api typecheck
    pnpm --filter @umi/web typecheck
    pnpm --filter @umi/admin typecheck
    pnpm --filter @umi/api build
    pnpm --filter @umi/web build
    pnpm --filter @umi/admin build

    rm -rf "$RELEASE_DIR"
    mv "$BUILD_DIR" "$RELEASE_DIR"
  '

rm -f "$ARCHIVE_PATH"
(
  cd "$RELEASE_DIR"
  tar -czf /tmp/release.tar.gz .
)
mv /tmp/release.tar.gz "$ARCHIVE_PATH"
shopt -s dotglob nullglob
for path in "$RELEASE_DIR"/* "$RELEASE_DIR"/.*; do
  name="$(basename "$path")"
  if [[ "$name" == "." || "$name" == ".." || "$name" == ".env.local" || "$name" == "$(basename "$ARCHIVE_PATH")" ]]; then
    continue
  fi
  rm -rf "$path"
done
shopt -u dotglob nullglob

cat <<EOF
Docker Linux release 已生成:
  $RELEASE_DIR

压缩包已生成:
  $ARCHIVE_PATH

线上使用方式:
  1. 上传 $ARCHIVE_PATH
  2. 线上解压后:
     - API: cd 发布目录/apps/api && ./node_modules/.bin/tsx src/index.ts
     - Web: cd 发布目录/apps/web && ./node_modules/.bin/next start -p 3000
     - Admin: 使用 apps/admin/dist 作为静态目录

说明:
  - 构建在 $DOCKER_IMAGE 容器内完成
  - Docker 平台: $DOCKER_PLATFORM
  - release/node_modules 为 Linux 产物
  - 输入环境文件来自 release/.env.local
  - 构建结束后，release/ 目录只保留 release.tar.gz 和 .env.local
  - 即使构建失败，也会恢复 release/.env.local
EOF
