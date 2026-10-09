#!/bin/bash
set -euo pipefail

# Only needed in ephemeral cloud sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Re-apply REA registration and skill; idempotent and non-interactive.
npx -y rea-agents@latest setup --client claude_code --yes
