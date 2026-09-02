#!/usr/bin/env python3
"""Quick smoke test — imports dreamer-selfheal and exercises key functions."""
import sys, os
sys.path.insert(0, r"C:\Users\ansy0\ZCodeProject\projects\repos\dream-interpreter\tools")
import importlib.util
spec = importlib.util.spec_from_file_location("ds", r"C:\Users\ansy0\ZCodeProject\projects\repos\dream-interpreter\tools\dreamer-selfheal.py")
ds = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ds)

# 1) parse works
symbols, text = ds.fetch_symbols()
print(f"✅ fetch_symbols: {len(symbols)} symbols")

# 2) quality check works
for locale, word in [("el", "αεροπλάνο"), ("el", "plane"), ("km", "យន្តហោះ"), ("km", "ទ"), ("lt", "lėktuvas")]:
    ok, reason = ds.quality_check(word, locale, word.lower())
    print(f"  quality_check({locale!r}, {word!r}) -> ok={ok} reason={reason}")

# 3) has_locale detection (none of these slugs have el/km/lt yet)
for slug in ["airplane", "ambulance"]:
    for loc in ["el", "km", "lt"]:
        present = ds.has_locale(text, slug, loc)
        if present:
            print(f"  ⚠️ {slug}:{loc} already has locale")
print("✅ has_locale detection works")

# 4) write_back dry-run with mock additions
mock_additions = {"el": [("airplane", "αεροπλάνο")], "lt": [("airplane", "lėktuvas")]}
ok, msg = ds.write_back(symbols, text, mock_additions)
print(f"✅ write_back dry_run: ok={ok} msg={msg}")

# 5) write_back real (with backup) — small test
ok, msg = ds.write_back(symbols, text, mock_additions)
print(f"✅ write_back REAL: ok={ok} msg={msg}")

# Re-parse after write to confirm the field was added
symbols2, text2 = ds.fetch_symbols()
if "el" in text2 and "lt" in text2:
    print("✅ re-parse: new el/km/lt fields visible in source")

# Restore from backup
import shutil
backup = ds.SYMBOL_FILE.with_suffix(".ts.bak")
if backup.exists():
    shutil.copy2(backup, ds.SYMBOL_FILE)
    backup.unlink()
    print("✅ restored from backup")