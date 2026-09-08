#!/usr/bin/env bash
#
# Cache-busting: append ?v=<content-hash> to the code assets referenced in the
# HTML files. The hash only changes when the file's contents change, so browsers
# keep caching normally but always fetch a fresh copy right after an edit.
#
# Runs automatically before every commit (see .githooks/pre-commit) and can also
# be run by hand:  bash scripts/stamp-assets.sh
#
set -eu

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

stamp() {
  asset="$1"                       # e.g. css/style.css
  [ -f "$asset" ] || return 0
  hash="$(git hash-object "$asset" | cut -c1-10)"
  # regex-safe version of the path (escape dots)
  esc="$(printf '%s' "$asset" | sed 's/\./\\./g')"
  for f in *.html; do
    [ -f "$f" ] || continue
    sed -i -E "s#([\"'])${esc}(\?v=[0-9a-z]+)?([\"'])#\1${asset}?v=${hash}\3#g" "$f"
  done
}

stamp "css/style.css"
stamp "js/site.js"
stamp "js/admin.js"

# When invoked as a pre-commit hook, re-stage the HTML we just rewrote.
git add -- ./*.html 2>/dev/null || true
