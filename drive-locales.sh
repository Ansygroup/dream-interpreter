#!/usr/bin/env bash
# Driver: translate remaining incomplete locales one at a time via the live
# /api/translate endpoint, retrying transient 502s, committing each success so
# progress survives the 420s per-call cap. Re-run as many times as needed; it
# commits whatever completes before the cap kills it.
set -u
cd "$(dirname "$0")"
REPO="$(pwd)"
LIST="${1:?usage: drive-locales.sh 'am az bn ...'}"
for code in $LIST; do
  ok=0
  for attempt in 1 2 3; do
    node scripts/translate-live.mjs --only="$code" > /tmp/s.log 2>&1
    if grep -q "✓" /tmp/s.log; then ok=1; break; fi
    echo "  $code attempt $attempt failed: $(grep -E '✗' /tmp/s.log | tail -1)"
    sleep 4
  done
  if [ "$ok" -eq 1 ]; then
    git add "src/i18n/locales/$code.json"
    git commit -q -m "i18n: auto-translate $code via live /api/translate (self-completing)"
    echo "COMMITTED $code"
  else
    echo "FAILED $code"
  fi
done
echo "=== DRIVE PASS DONE ==="
git status --porcelain src/i18n/locales/ | head
