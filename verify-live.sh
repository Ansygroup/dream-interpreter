#!/usr/bin/env bash
URL="https://dream-interpreter-ansygroups-projects.vercel.app"
fetch() {
  curl -sL --retry 3 --retry-delay 2 "$1" -o "$2" -w "%{http_code}"
}
code=$(fetch "$URL/index.html" /c/Users/ansy0/AppData/Local/Temp/idx.html)
echo "index.html HTTP $code, bytes $(wc -c < /c/Users/ansy0/AppData/Local/Temp/idx.html)"
echo "=== first 200 chars ==="
head -c 200 /c/Users/ansy0/AppData/Local/Temp/idx.html; echo
echo "=== script srcs ==="
grep -oE '(src|href)="[^"]+\.(js|css)"' /c/Users/ansy0/AppData/Local/Temp/idx.html | head
JS=$(grep -oE '/[^"]+\.js' /c/Users/ansy0/AppData/Local/Temp/idx.html | head -1)
echo "first JS: $JS"
if [ -n "$JS" ]; then
  bcode=$(fetch "$URL$JS" /c/Users/ansy0/AppData/Local/Temp/bundle.js)
  echo "bundle HTTP $bcode, bytes $(wc -c < /c/Users/ansy0/AppData/Local/Temp/bundle.js)"
  echo "supabase.co count: $(grep -oc 'supabase\.co' /c/Users/ansy0/AppData/Local/Temp/bundle.js)"
  echo "eyJ count: $(grep -oc 'eyJ' /c/Users/ansy0/AppData/Local/Temp/bundle.js)"
fi
