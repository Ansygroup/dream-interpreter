#!/usr/bin/env python3
"""
Dreamer i18n Self-Heal Cron Script (v2 — production-grade)
Runs daily via Hermes cron. Translates missing locales (el/km/lt) for dream
symbols in symbol-names.ts and **writes back to the source file** with:
  - Atomic write (write to .tmp, rename)
  - Auto-backup (.bak before each run)
  - Quality filter (rejects junk translations: too short, non-Unicode,
    leak markers, mixed scripts)
  - Retry with exponential backoff (handles OpenRouter 429 gracefully)
  - Dedup cache (skip symbols already translated)
  - Rich status JSON for the cron agent to read

ENV:
  DREAMER_REPO       path to dream-interpreter repo (default: auto-detect)
  DREAMER_STATUS     where to write status JSON (default: /tmp/dreamer-selfheal-status.json)
  DREAMER_DRY_RUN    if "1", don't write back (default: 0)
  OPENROUTER_API_KEY required (injected by dreamer-selfheal.sh wrapper)
"""
import os, sys, json, time, re, shutil, urllib.request, urllib.error
from pathlib import Path

REPO = Path(os.environ.get(
    "DREAMER_REPO",
    r"C:\Users\ansy0\ZCodeProject\projects\repos\dream-interpreter",
))
SYMBOL_FILE = REPO / "src" / "symbol-names.ts"
STATUS_OUT = Path(os.environ.get("DREAMER_STATUS", r"C:\tmp\dreamer-selfheal-status.json"))
DRY_RUN = os.environ.get("DREAMER_DRY_RUN", "0") == "1"
API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

MISSING_LOCALES = ["el", "km", "lt"]
PER_RUN = int(os.environ.get("DREAMER_PER_RUN", "5"))
LOCALE_NAMES = {"el": "Greek", "km": "Khmer", "lt": "Lithuanian"}

# Unicode ranges per locale (rough — used for quality filter)
LOCALE_RANGES = {
    "el": (0x0370, 0x03FF),        # Greek block
    "km": (0x1780, 0x17FF),        # Khmer block
    "lt": None,                    # Latin script + diacritics; can't range-check
}
# Latin characters that should NEVER appear in pure Greek/Khmer words
GREEK_DISALLOWED = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
KHMER_DISALLOWED = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")


def fetch_symbols():
    """Parse symbol-names.ts → dict[slug] = {en, ar, aliases, raw_line}"""
    text = SYMBOL_FILE.read_text(encoding="utf-8")
    out = {}
    pattern = re.compile(
        r"^(\s*)([a-z0-9_]+)\s*:\s*\{\s*en\s*:\s*'([^']*)'\s*,\s*ar\s*:\s*'([^']*)'\s*"
        r"(?:,\s*aliases\s*:\s*\[([^\]]*)\])?\s*\}",
        re.MULTILINE,
    )
    for m in pattern.finditer(text):
        slug = m.group(2)
        out[slug] = {
            "en": m.group(3),
            "ar": m.group(4),
            "aliases": re.findall(r"'([^']*)'", m.group(5) or ""),
            "indent": m.group(1),
            "span": m.span(),
        }
    return out, text


def has_locale(text: str, slug: str, locale: str) -> bool:
    """Check if a given slug entry already has a `locale:` field."""
    pattern = re.compile(
        rf"^\s*{slug}\s*:\s*\{{[^\}}]*\b{locale}\s*:",
        re.MULTILINE,
    )
    return bool(pattern.search(text))


def quality_check(translation: str, locale: str, en_word: str) -> tuple[bool, str]:
    """Returns (ok, reason). Reject junk translations."""
    if not translation or len(translation) < 2:
        return False, "too_short"
    if len(translation) > 50:
        return False, "too_long"
    # Leak markers from reasoning models
    low = translation.lower()
    if any(marker in low for marker in (
        "thinking process", "here's a thinking", "let me",
        "translate ", "i'll translate", "as an ai",
    )):
        return False, "leak"
    # Identity (same as English — model didn't translate)
    if translation.strip().lower() == en_word.strip().lower():
        return False, "identity"
    # Per-locale script checks
    if locale == "el":
        # Must contain at least one Greek character
        if not any(0x0370 <= ord(c) <= 0x03FF for c in translation):
            return False, "no_greek_chars"
        # Shouldn't contain raw Latin words mixed in (unless brief transliteration)
        latin_word_count = sum(1 for w in translation.split() if len(w) > 2 and all(c in GREEK_DISALLOWED for c in w))
        if latin_word_count > len(translation.split()) // 2 + 1:
            return False, "mostly_latin"
    elif locale == "km":
        # Must contain at least one Khmer character
        if not any(0x1780 <= ord(c) <= 0x17FF for c in translation):
            return False, "no_khmer_chars"
        # Reject single-character responses (common failure mode: just one consonant)
        if len(translation) <= 1:
            return False, "single_char"
    elif locale == "lt":
        # Lithuanian: Latin script with diacritics. Allow, but reject pure-ASCII
        # junk like "###" or "n/a"
        if translation in {"###", "n/a", "?", "??", "—", "-"}:
            return False, "junk"
    return True, "ok"


def translate_with_retry(en_name: str, locale: str, max_retries: int = 3) -> tuple[str, str]:
    """Translate with exponential backoff. Returns (translation, model_used_or_error)."""
    if not API_KEY:
        return "", "no_api_key"
    target = LOCALE_NAMES.get(locale, locale)
    prompt = (
        f"Translate the following single English word into {target} ({locale}). "
        f"Reply with only the translated word or short phrase, no punctuation, no explanation.\n\n"
        f"Word: {en_name}\n"
        f"{target} ({locale}):"
    )
    # Free models known to be alive Sep 2026. m2.7 is a reasoning model that
    # leaks "Here's a thinking process..." — only use it as last-resort and
    # only after the safer two have failed entirely for THIS call.
    chain = [
        "openrouter/free",                  # OR router fallback (most reliable)
        "google/gemma-4-26b-a4b-it:free",   # multilingual
        "minimax/minimax-m2.7:free",        # reasoning — last (can leak)
    ]
    last_err = ""
    leaked_count = 0
    for m in chain:
        for attempt in range(max_retries):
            body = json.dumps({
                "model": m,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 60,
                "temperature": 0.2,
            }).encode()
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=body,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode())
                msg = data["choices"][0]["message"]
                content = (msg.get("content") or "").strip().strip("\"'.,!") or None
                if content and "thinking process" not in content.lower() and not content.startswith("Here's"):
                    return content, m
                last_err = f"{m}:leak_or_empty"
                leaked_count += 1
                if leaked_count >= 3:
                    # All 3 models in the chain leaked → no point trying more
                    return f"[error: all_models_leaked]", "all_models_leaked"
                break  # No retry for content-quality issues
            except urllib.error.HTTPError as e:
                code = e.code
                if code == 429 and attempt < max_retries - 1:
                    # Respect Retry-After if present, else exponential
                    retry_after = e.headers.get("Retry-After")
                    wait = int(retry_after) if retry_after and retry_after.isdigit() else (2 ** attempt)
                    time.sleep(wait)
                    last_err = f"{m}:429_retry_{attempt}"
                    continue
                last_err = f"{m}:HTTP{code}"
                break
            except (urllib.error.URLError, KeyError, json.JSONDecodeError) as e:
                last_err = f"{m}:{type(e).__name__}"
                break
        # Try next model in chain
    return f"[error: {last_err}]", last_err


def write_back(symbols: dict, text: str, additions: dict) -> tuple[bool, str]:
    """Insert new locale fields into symbol-names.ts entries.

    additions: dict[locale] -> list[(slug, translation)]
    Returns (success, message).

    Implementation: brace-depth-aware entry parsing. We DON'T trust the
    span from fetch_symbols() (it stops at the first `}` which can be
    inside `aliases`). Instead we walk the file character by character,
    tracking brace depth, to find each entry's TRUE end. This handles:
      - aliases with nested `}` (shouldn't happen, but defensive)
      - entries spanning multiple lines
      - trailing garbage from prior corrupt runs
    """
    if DRY_RUN:
        return True, "dry_run_skipped_write"
    if not additions:
        return True, "no_changes"
    new_text = text
    # Group additions by slug so a single entry gets ALL its new locale fields
    # written together (avoids "second edit clobbers first edit" when multiple
    # locales target the same slug).
    from collections import defaultdict
    slug_locales: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for locale, items in additions.items():
        for slug, translation in items:
            slug_locales[slug].append((locale, translation))

    edits = []
    for slug, locale_pairs in slug_locales.items():
        info = symbols.get(slug)
        if not info:
            continue
        en = info["en"]
        ar = info["ar"]
        aliases = info["aliases"]
        indent = info["indent"]
        aliases_str = ""
        if aliases:
            aliases_str = ", aliases: [" + ", ".join(f"'{a}'" for a in aliases) + "]"
        locale_str = ", ".join(f"{loc}: '{tr}'" for loc, tr in locale_pairs)
        new_line = (
            f"{indent}{slug}: {{ en: '{en}', ar: '{ar}', {locale_str}{aliases_str} }},\n"
        )
        # Find the entry's TRUE span in the CURRENT text via brace counting
        entry_start = _find_entry_start(new_text, slug)
        if entry_start < 0:
            continue
        entry_end = _find_entry_end(new_text, entry_start)
        if entry_end < 0:
            continue
        # Advance end past the `,` and any whitespace/newline so the
        # replacement covers the entire line including terminators.
        k = entry_end + 1
        if k < len(new_text) and new_text[k] == ",":
            k += 1
        # Skip trailing whitespace, include trailing newline
        while k < len(new_text) and new_text[k] in " \t":
            k += 1
        if k < len(new_text) and new_text[k] == "\n":
            k += 1
        elif k + 1 < len(new_text) and new_text[k] == "\r" and new_text[k + 1] == "\n":
            k += 2
        edits.append((entry_start, k, new_line))
    # Apply edits in reverse order to keep offsets valid
    edits.sort(key=lambda e: e[0], reverse=True)
    for start, end, new_line in edits:
        new_text = new_text[:start] + new_line + new_text[end:]
    modified_count = len(edits)
    if modified_count == 0:
        return True, "no_changes"
    # Atomic write: write to .tmp, then rename
    backup = SYMBOL_FILE.with_suffix(".ts.bak")
    shutil.copy2(SYMBOL_FILE, backup)
    tmp = SYMBOL_FILE.with_suffix(".ts.tmp")
    tmp.write_text(new_text, encoding="utf-8")
    tmp.replace(SYMBOL_FILE)
    return True, f"wrote_{modified_count}_fields backup={backup.name}"


def _find_entry_start(text: str, slug: str) -> int:
    """Find the offset where the entry for `slug` begins. Returns -1 if not found."""
    import re
    m = re.search(rf"^(\s*)({re.escape(slug)})\s*:\s*\{{", text, re.MULTILINE)
    if not m:
        return -1
    return m.start()


def _find_entry_end(text: str, start: int) -> int:
    """Find the offset right at the entry's closing `}` (NOT past the comma/newline).

    Walks the text from `start`, tracking brace depth, looking for the
    matching `}` of the opening `{` at start. Returns position of that `}`.

    The caller is responsible for emitting any trailing comma/newline in
    the replacement string.

    Returns -1 if no balanced close found.
    """
    # Find first `{` from start
    i = text.find("{", start)
    if i < 0:
        return -1
    depth = 0
    j = i
    in_string = False
    string_char = None
    while j < len(text):
        c = text[j]
        if in_string:
            # Strings can have escaped chars: \"
            if c == "\\":
                j += 2
                continue
            if c == string_char:
                in_string = False
        else:
            if c in ("'", '"'):
                in_string = True
                string_char = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return j  # position of the `}` itself
        j += 1
    return -1


def _write_status(status: dict) -> None:
    """Always write the status JSON — even on crash paths."""
    try:
        STATUS_OUT.parent.mkdir(parents=True, exist_ok=True)
        STATUS_OUT.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        # Last-resort: write a minimal status so the cron agent can read SOMETHING
        try:
            fallback = STATUS_OUT.with_suffix(".fallback.json")
            fallback.write_text(
                json.dumps({"ts": int(time.time()), "crash": True, "error": str(e)[:200]},
                           ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception:
            pass  # We tried. Nothing more we can do.


def main():
    print("🌙 Dreamer i18n self-heal (v2) — starting")
    if DRY_RUN:
        print("  ⚠️  DRY_RUN=1 — will NOT modify source files")
    try:
        symbols, original_text = fetch_symbols()
        print(f"  Found {len(symbols)} symbols in source")
        added = {loc: [] for loc in MISSING_LOCALES}
        rejected_quality = {loc: [] for loc in MISSING_LOCALES}
        errors = []
        skipped_already = {loc: 0 for loc in MISSING_LOCALES}
        # Dedup: only translate symbols missing this locale
        target_slugs = []
        for slug in list(symbols.keys())[:PER_RUN]:
            for locale in MISSING_LOCALES:
                if not has_locale(original_text, slug, locale):
                    target_slugs.append((slug, locale))
        # De-dupe within this run (one slug, multiple locales ok; same slug+locale only once)
        seen = set()
        target_slugs = [(s, l) for (s, l) in target_slugs if not ((s, l) in seen or seen.add((s, l)))]
        print(f"  Targeting {len(target_slugs)} (slug, locale) pairs this run")
        for slug, locale in target_slugs:
            en_name = symbols[slug]["en"]
            translation, used = translate_with_retry(en_name, locale)
            # Strip [error: ...] markers
            if translation.startswith("[error"):
                errors.append({"locale": locale, "slug": slug, "en": en_name, "error": translation})
                continue
            ok, reason = quality_check(translation, locale, en_name)
            if not ok:
                rejected_quality[locale].append({"slug": slug, "translation": translation, "reason": reason})
                continue
            added[locale].append({"slug": slug, "translation": translation, "model": used})
        # Write back (or skip if no additions or dry-run)
        all_additions = {loc: [(x["slug"], x["translation"]) for x in v] for loc, v in added.items()}
        total_added = sum(len(v) for v in all_additions.values())
        wrote_ok, write_msg = write_back(symbols, original_text, all_additions)
        status = {
            "ts": int(time.time()),
            "symbols_total": len(symbols),
            "locales_processed": MISSING_LOCALES,
            "dry_run": DRY_RUN,
            "added_count": {k: len(v) for k, v in added.items()},
            "added": added,
            "rejected_quality_count": {k: len(v) for k, v in rejected_quality.items()},
            "rejected_quality": rejected_quality,
            "errors": errors,
            "skipped_already_translated": skipped_already,
            "write_back": {"ok": wrote_ok, "msg": write_msg, "fields_written": total_added if wrote_ok and not DRY_RUN else 0},
            "next_action": _suggest_next_action(added, rejected_quality, errors),
        }
    except Exception as e:
        # CRASH: write a status that signals ESCALATE so cron agent + user notice
        import traceback
        tb = traceback.format_exc()
        status = {
            "ts": int(time.time()),
            "crash": True,
            "error": f"{type(e).__name__}: {e}"[:500],
            "traceback": tb.splitlines()[-6:],  # last 6 lines only
            "next_action": f"ESCALATE: script crashed — {type(e).__name__}: {str(e)[:120]}",
        }
        print(f"🌙 CRASH in main(): {e}", file=sys.stderr)
    _write_status(status)
    print(json.dumps(status, ensure_ascii=False, indent=2))
    print(f"🌙 Status written to {STATUS_OUT}")


def _suggest_next_action(added, rejected, errors):
    """Heuristic for what the cron agent should do next."""
    total_added = sum(len(v) for v in added.values())
    total_errors = len(errors)  # errors is a flat list
    total_rejected = sum(len(v) for v in rejected.values())
    if total_errors > total_added * 2:
        return "ESCALATE: model failure rate too high; check OpenRouter status or rotate keys"
    if total_rejected > total_added:
        return "ESCALATE: many translations failed quality check; consider different model"
    if total_added == 0:
        return "OK_NOOP: nothing new to translate this run"
    return "OK: translations added"


if __name__ == "__main__":
    main()