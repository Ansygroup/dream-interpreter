#!/usr/bin/env bash
# Dreamer i18n self-heal — escalation notifier.
# Reads status JSON; if next_action starts with ESCALATE, broadcasts
# a short alert to any connected channel. If next_action is OK/NOOP,
# stays silent.
#
# USAGE: bash tools/dreamer-notify.sh [STATUS_JSON_PATH]
# Default status path: /tmp/dreamer-selfheal-status.json
#
# Notification methods (tried in order; first to succeed wins):
#   1. Write to ~/AppData/Local/hermes/profiles/anst/inbox/dreamer-alert.md
#      (anst reads it on next session start)
#   2. Fallback: append to ~/AppData/Local/hermes/profiles/anst/inbox/dreamer-log.md
set -euo pipefail

STATUS_JSON="${1:-C:/tmp/dreamer-selfheal-status.json}"
ANST_INBOX="$HOME/AppData/Local/hermes/profiles/anst/inbox"
mkdir -p "$ANST_INBOX"

if [ ! -f "$STATUS_JSON" ]; then
  echo "Dreamer-notify: status file not found at $STATUS_JSON; nothing to do"
  exit 0
fi

# Parse next_action + counts with python (always available)
read_status() {
  python -c "
import json, sys
with open(r'$STATUS_JSON', encoding='utf-8') as f:
    s = json.load(f)
print(s.get('next_action', 'UNKNOWN'))
print(sum(s.get('added_count', {}).values()))
print(sum(s.get('rejected_quality_count', {}).values()))
print(len(s.get('errors', [])))
print(s.get('write_back', {}).get('fields_written', 0))
"
}
NEXT_ACTION=$(read_status | sed -n '1p')
ADDED=$(read_status | sed -n '2p')
REJECTED=$(read_status | sed -n '3p')
ERRORS=$(read_status | sed -n '4p')
WROTE=$(read_status | sed -n '5p')

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SUBJECT="🌙 Dreamer self-heal — $NEXT_ACTION"

# Always log to the long-term log (silent, not a notification)
LOG="$ANST_INBOX/dreamer-log.md"
printf -- "\n## %s\n- next_action: %s\n- added: %s | rejected_quality: %s | errors: %s | wrote: %s\n" \
  "$TS" "$NEXT_ACTION" "$ADDED" "$REJECTED" "$ERRORS" "$WROTE" >> "$LOG"

# Decide: is this an alert?
if [[ "$NEXT_ACTION" == ESCALATE* ]]; then
  # Full alert: write to inbox and rotate
  ALERT="$ANST_INBOX/dreamer-alert.md"
  cat > "$ALERT" <<EOF
# $SUBJECT

- **next_action**: \`$NEXT_ACTION\`
- **added**: $ADDED
- **rejected_quality**: $REJECTED
- **errors**: $ERRORS
- **wrote to source**: $WROTE

## Recent errors (top 5):
EOF
  python -c "
import json
with open(r'$STATUS_JSON', encoding='utf-8') as f:
    s = json.load(f)
for e in s.get('errors', [])[:5]:
    print(f\"- {e.get('locale','?')} {e.get('slug','?')} ({e.get('en','?')}): {e.get('error','?')}\")
for locale, items in s.get('rejected_quality', {}).items():
    for x in items[:3]:
        print(f\"- {locale} {x.get('slug','?')} rejected: {x.get('reason','?')} -> {x.get('translation','?')[:30]}\")
"
  echo
  echo "Dreamer-notify: ESCALATE alert written to $ALERT"
  echo "  anst will see it on next session start (or via the log)"
elif [[ "$NEXT_ACTION" == OK_NOOP* ]]; then
  echo "Dreamer-notify: NOOP — nothing new, staying silent (logged only)"
else
  # OK with work done — log only, no inbox alert
  echo "Dreamer-notify: OK ($ADDED added) — logged, no alert"
fi
