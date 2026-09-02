#!/usr/bin/env bash
# Dreamer i18n self-heal cron entrypoint (v2)
# 1. Loads OPENROUTER_API_KEY from dreamer profile .env
# 2. Runs the Python self-heal script (writes back to source, atomic)
# 3. Runs the notify script (escalates to anst inbox if next_action=ESCALATE)
set -euo pipefail
export OPENROUTER_API_KEY="$(grep -E '^OPENROUTER_API_KEY=' /c/Users/ansy0/AppData/Local/hermes/profiles/dreamer/.env | head -1 | cut -d= -f2-)"
SCRIPT_DIR="C:/Users/ansy0/ZCodeProject/projects/repos/dream-interpreter/tools"
# Run self-heal
python "$SCRIPT_DIR/dreamer-selfheal.py"
# Notify (writes to anst inbox if ESCALATE)
bash "$SCRIPT_DIR/dreamer-notify.sh" "${DREAMER_STATUS:-C:/tmp/dreamer-selfheal-status.json}"
