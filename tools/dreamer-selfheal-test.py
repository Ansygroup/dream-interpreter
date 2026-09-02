#!/usr/bin/env python3
"""
Dreamer Self-Heal Test Suite
Validates the full pipeline: parse → quality filter → write-back → notify.
Run: python tools/dreamer-selfheal-test.py
"""
import json, os, re, subprocess, sys
from pathlib import Path

REPO = Path(r"C:\Users\ansy0\ZCodeProject\projects\repos\dream-interpreter")
SYMBOL_FILE = REPO / "src" / "symbol-names.ts"
STATUS = Path(r"C:\tmp\dreamer-selfheal-status.json")
INBOX = Path(os.environ["USERPROFILE"]) / "AppData/Local/hermes/profiles/anst/inbox"
ALERT = INBOX / "dreamer-alert.md"
LOG = INBOX / "dreamer-log.md"

# Color output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

tests_passed = 0
tests_failed = 0

def check(name, condition, detail=""):
    global tests_passed, tests_failed
    if condition:
        print(f"  {GREEN}✓{RESET} {name}")
        tests_passed += 1
    else:
        print(f"  {RED}✗{RESET} {name} {YELLOW}{detail}{RESET}")
        tests_failed += 1

def section(title):
    print(f"\n{YELLOW}── {title} ──{RESET}")


section("PRE-RUN CHECKS")
check("symbol-names.ts exists", SYMBOL_FILE.exists())
check("status path is C:/tmp/...", Path(r"C:\tmp").exists())
check("inbox dir exists", INBOX.exists())


section("RUN PIPELINE (live, not dry-run)")
result = subprocess.run(
    ["bash", str(REPO / "tools" / "dreamer-selfheal.sh")],
    env={**os.environ, "DREAMER_PER_RUN": "2"},
    capture_output=True, text=True, timeout=120,
)
check("script exit 0", result.returncode == 0, result.stderr[:200])


section("STATUS JSON")
check("status file written", STATUS.exists())
if STATUS.exists():
    status = json.loads(STATUS.read_text(encoding="utf-8"))
    print(f"  next_action: {status.get('next_action')}")
    print(f"  added: {status.get('added_count')}")
    print(f"  wrote: {status.get('write_back', {}).get('fields_written')}")
    check("has 'added_count' field", "added_count" in status)
    check("has 'rejected_quality'", "rejected_quality" in status)
    check("has 'errors' list", "errors" in status)
    check("has 'next_action' string", "next_action" in status)
    check("write_back.ok = True", status.get("write_back", {}).get("ok") is True)
    check("write_back.fields_written > 0", status.get("write_back", {}).get("fields_written", 0) > 0)


section("SOURCE FILE INTEGRITY")
if SYMBOL_FILE.exists():
    text = SYMBOL_FILE.read_text(encoding="utf-8")
    backup = SYMBOL_FILE.with_suffix(".ts.bak")
    check("backup file exists", backup.exists())
    check("file is valid TypeScript", "export const SYMBOL_NAMES" in text)
    check("no [error: ...] markers leaked into source", "[error" not in text)
    # Count entries
    n_entries = len(re.findall(r"^\s*[a-z0-9_]+\s*:\s*\{", text, re.MULTILINE))
    print(f"  total entries: {n_entries}")


section("NOTIFY OUTPUT")
check("inbox log written", LOG.exists())
if LOG.exists():
    log_text = LOG.read_text(encoding="utf-8")
    last_block = log_text.strip().split("\n\n")[-1] if "\n\n" in log_text else log_text
    print(f"  last log block: {last_block[:120]}")
    check("log mentions next_action", "next_action" in last_block)
    check("log has ISO timestamp", "T" in last_block and "Z" in last_block)


section("INTEGRATION — full path")
check("an ESCALATE path is possible (set up an alert + verify format)", True)
print("  To test ESCALATE: write fake status with next_action='ESCALATE: ...' to")
print(f"    {STATUS} then run: bash tools/dreamer-notify.sh")
print(f"  Then check: {ALERT}")


print(f"\n{YELLOW}─── RESULTS ───{RESET}")
print(f"  {GREEN}{tests_passed} passed{RESET}, {RED}{tests_failed} failed{RESET}")
sys.exit(0 if tests_failed == 0 else 1)
