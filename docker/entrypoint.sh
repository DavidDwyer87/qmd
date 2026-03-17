#!/usr/bin/env sh
set -eu

# ConfigMap support:
# - Mount key/value env file at /config/qmd.env
# - Mount QMD index config at /config/index.yml
# Both are optional.

if [ -f /config/qmd.env ]; then
  # shellcheck disable=SC1091
  set -a
  . /config/qmd.env
  set +a
fi

mkdir -p \
  "${QMD_CONFIG_DIR:-/data/config}" \
  "${XDG_CACHE_HOME:-/data/cache}" \
  "${XDG_CACHE_HOME:-/data/cache}/qmd"

if [ -f /config/index.yml ]; then
  cp /config/index.yml "${QMD_CONFIG_DIR:-/data/config}/index.yml"
fi

# Allow runtime port override from ConfigMap/env without changing command args.
if [ "${1:-}" = "node" ] && [ "${2:-}" = "dist/cli/qmd.js" ] && [ "${3:-}" = "mcp" ] && [ "${4:-}" = "--http" ]; then
  exec node dist/cli/qmd.js mcp --http --port "${QMD_MCP_PORT:-8181}"
fi

exec "$@"
