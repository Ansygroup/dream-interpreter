#!/usr/bin/env python3
"""Count today's Vercel deploys team-wide (the 100/day cap is team-wide).

Usage:  python scripts/vercel-quota.py [--limit 100] [--max-pages 20]
Prints an integer count on stdout. Fails CLOSED: prints 100 on any error.

Why not just `vercel ls --limit 100 --format=json`?
  - `vercel ls` prints an AGE column ("10m"), never a date, so grepping the
    table for YYYY-MM-DD always matches 0 (dead guard).
  - `--limit` is per page and saturates at 100. A page that happens to be
    full does NOT mean today's quota is gone: 100 rows can span 35 days.
    Treating a full page as "exhausted" made the guard abort every run
    (deploy-all.sh exited 2 with only 12 deploys actually spent).
  - The query must run from a dir with no .vercel/project.json, otherwise
    `vercel ls` returns only that project and silently ignores --scope,
    under-counting the team-wide cap by ~5x.

So: page forward with --next until a page's OLDEST deployment predates
today (then no further page can contain today), counting today's rows.
Only a genuinely exhausted quota (>90 today, or >1000 pages walked without
reaching yesterday) prints a number that trips the abort.
"""
import datetime
import json
import os
import shutil
import subprocess
import sys

SCOPE = os.environ.get("VERCEL_SCOPE", "ansygroups-projects")


def vercel_argv0():
    """Resolve `vercel` to something a NATIVE Windows Python can spawn.

    On this host `vercel` is an MSYS shell shim
    (C:/Users/<u>/AppData/Roaming/npm/vercel) with no .exe extension, so
    subprocess.run(["vercel", ...]) raises WinError 2 — a shim is not a
    native executable. Prefer the .cmd shim next to it, then the .js entry.

    Strictly PATH-based: if `vercel` is not on PATH, raise so the caller
    fails CLOSED. A hardcoded fallback path made the "unreachable" test
    silently succeed, i.e. a broken install looked like a healthy count.
    """
    exe = shutil.which("vercel") or shutil.which("vercel.cmd")
    if not exe:
        raise RuntimeError("vercel CLI not on PATH")
    if exe.lower().endswith((".exe", ".cmd", ".bat")):
        return exe
    # MSYS shim -> sibling .cmd (or .exe) that native CreateProcess can run
    base = os.path.splitext(exe)[0]
    for cand in (base + ".exe", base + ".cmd", base + ".bat"):
        if os.path.exists(cand):
            return cand
    return exe  # last resort: may still work under a POSIX python


def run_page(args):
    exe = vercel_argv0()
    argv = [exe, "ls", "--scope", SCOPE, "--format=json", "--all", "--yes", *args]
    if exe.lower().endswith(".js"):
        argv = [shutil.which("node") or "node", exe, "ls", "--scope", SCOPE,
                "--format=json", "--all", "--yes", *args]
    out = subprocess.run(
        argv,
        capture_output=True, text=True, timeout=180,
        cwd=os.environ.get("TMPDIR") or os.getcwd(),
    )
    raw = out.stdout
    i = raw.find("{")
    if i < 0:
        i = raw.find("[")
    if i < 0:
        raise RuntimeError("no JSON in vercel ls output")
    d = json.loads(raw[i:])
    deps = d.get("deployments", d) if isinstance(d, dict) else d
    return deps


def main():
    limit, pages = 100, 20
    argv_rest = sys.argv[1:]
    for idx, v in enumerate(argv_rest):
        nxt = argv_rest[idx + 1] if idx + 1 < len(argv_rest) else None
        if v == "--limit" and nxt:
            limit = int(nxt)
        elif v == "--max-pages" and nxt:
            pages = int(nxt)

    today = datetime.date.today()
    count, projects, walked = 0, set(), 0
    try:
        while walked < pages:
            deps = run_page(["--limit", str(limit)] + (["--next", str(walked * limit)] if walked else []))
            walked += 1
            if not deps:
                break
            ts = sorted(x["createdAt"] for x in deps)
            for x in deps:
                projects.add(x.get("name", "?"))
                if datetime.datetime.fromtimestamp(x["createdAt"] / 1000).date() == today:
                    count += 1
            # Oldest row of this page predates today -> nothing left to count.
            if datetime.datetime.fromtimestamp(ts[0] / 1000).date() < today:
                break
            if walked * limit > 5000:
                break
    except Exception as e:  # fail closed: never deploy blind
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        print(100)
        return 0

    print(f"projects_seen={len(projects)} pages_walked={walked}", file=sys.stderr)
    print(count)
    return 0


if __name__ == "__main__":
    sys.exit(main())