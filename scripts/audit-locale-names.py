#!/usr/bin/env python3
"""Meaning guard for localized symbol names (playbook §31).

Structural lint cannot catch a locale value that is *syntactically* fine but
*semantically* wrong (e.g. `leg` shipping Khmer for "blood"). Duplicate-value
detection alone also misses it when the wrong word is unique. So this checks
both: (1) one locale value reused by two different symbols, and (2) a
reference set of related symbols that must NOT share a translation.

Exit 0 = clean, 1 = at least one finding (fail the build).
Usage: python scripts/audit-locale-names.py [path/to/symbol-names.ts]
"""
import os
import re
import sys
from collections import defaultdict

DEFAULT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "symbol-names.ts")

# Symbols that must never resolve to the same term in any locale.
MUST_DIFFER = [
    ("leg", "foot"),
    ("leg", "knee"),
    ("leg", "hand"),
    ("hand", "foot"),
    ("foot", "knee"),
    ("blood", "desert"),
    ("blood", "water"),
    ("head", "hair"),
    ("eye", "ear"),
    ("snake", "key"),
    ("death", "water"),
    ("leg", "lion"),  # §31: leg once shipped Khmer near-identical to lion's
]

# Symbol pairs that legitimately share one translation (same concept, multiple
# slugs). These are NOT bugs — forbidding them would force invented synonyms.
ALLOWED_SAME = [
    ("flood", "water_flood"),
    ("losing_teeth", "teeth_fall"),
    ("losing_teeth", "teeth_falling"),
    ("teeth_fall", "teeth_falling"),
]

LOCALES = ("ar", "el", "km", "lt")


def load(path):
    src = open(path, encoding="utf-8").read()
    data = {}
    for slug, body in re.findall(r"(\w+):\s*\{([^{}]*)\}", src):
        fields = dict(re.findall(r"(\w+):\s*'([^']*)'", body))
        if fields:
            data[slug] = fields
    return data


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    data = load(path)
    if not data:
        print("AUDIT FAIL: parsed 0 symbols from %s" % path)
        return 1
    print("audited %d symbols from %s" % (len(data), os.path.basename(path)))

    findings = []
    allowed = {frozenset(p) for p in ALLOWED_SAME}

    # 1) same translation reused by two different symbols
    for loc in LOCALES:
        col = defaultdict(list)
        for slug, fields in data.items():
            if fields.get(loc):
                col[fields[loc]].append(slug)
        for value, slugs in col.items():
            if len(slugs) < 2:
                continue
            legit = all(
                frozenset((a, b)) in allowed
                for a in slugs
                for b in slugs
                if a != b
            )
            if not legit:
                findings.append("%s value %r reused by %s" % (loc, value, sorted(slugs)))

    # 2) related symbols that must stay distinct
    for a, b in MUST_DIFFER:
        if a not in data or b not in data:
            continue
        for loc in LOCALES:
            va, vb = data[a].get(loc), data[b].get(loc)
            if va and vb and va == vb:
                findings.append("%s: %s and %s share %r (must differ)" % (loc, a, b, va))

    if findings:
        print("\nAUDIT FAIL: %d finding(s)" % len(findings))
        for f in findings:
            print("  - %s" % f)
        return 1

    print("AUDIT PASS: no duplicate or colliding locale values")
    return 0


if __name__ == "__main__":
    sys.exit(main())