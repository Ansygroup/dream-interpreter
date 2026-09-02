#!/usr/bin/env python3
"""Quick probe: is google/gemma-4-26b-a4b-it:free still working on OpenRouter?"""
import os, json, urllib.request, urllib.error
key = open(os.path.expanduser("~") + r"\AppData\Local\hermes\profiles\dreamer\.env").read()
for line in key.splitlines():
    if line.startswith("OPENROUTER_API_KEY="):
        key = line.split("=", 1)[1].strip()
        break

for model in ["google/gemma-4-26b-a4b-it:free", "minimax/minimax-m2.7:free", "openrouter/free"]:
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "Translate to Greek: airplane"}],
        "max_tokens": 30,
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.loads(r.read().decode())
            msg = d["choices"][0]["message"]
            content = msg.get("content")
            reasoning = msg.get("reasoning")
            if content:
                print(f"  {model}: OK content={content!r}")
            elif reasoning:
                print(f"  {model}: OK reasoning_only ({len(reasoning)} chars) -> {reasoning[:80]!r}")
            else:
                print(f"  {model}: OK EMPTY msg_keys={list(msg.keys())}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:200]
        print(f"  {model}: HTTP {e.code} -> {err_body}")
    except Exception as e:
        print(f"  {model}: ERROR {type(e).__name__}: {e}")