#!/bin/sh
set -eu

AGENT="${1:-unknown}"
shift || true

if ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
  ROOT="$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)"
fi

find_node() {
  if [ "${NODE_BINARY:-}" ] && [ -x "${NODE_BINARY}" ]; then
    printf '%s\n' "${NODE_BINARY}"
    return 0
  fi

  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi

  for candidate in \
    "${HOME:-}/.nvm/versions/node/v22.15.0/bin/node" \
    "${HOME:-}/.nvm/versions/node/v24.20.0/bin/node" \
    "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node" \
    "/opt/homebrew/bin/node" \
    "/usr/local/bin/node"
  do
    if [ -x "${candidate}" ]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  return 1
}

NODE_BIN="$(find_node)" || {
  printf '{"systemMessage":"Agent log hook could not find a Node.js runtime."}\n'
  exit 0
}

exec "${NODE_BIN}" "${ROOT}/scripts/agent-log-hook.mjs" --agent "${AGENT}" "$@"
