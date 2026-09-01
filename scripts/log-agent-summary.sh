#!/bin/sh
set -eu

AGENT="${1:-unknown}"

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec /bin/sh "${SCRIPT_DIR}/run-agent-log-hook.sh" "${AGENT}" --summary-stdin
