#!/bin/sh
# 一鍵回歸：Node 測試 → fuzz → 真實瀏覽器測試 → 產生 TEST_REPORT.md
cd "$(dirname "$0")/.."
mkdir -p tools/out
node tests/test.mjs >/dev/null 2>&1; node tests/test-ui.mjs >/dev/null 2>&1   # 產生 TEST_REPORT.md 基礎表
npm test > tools/out/node-test.txt 2>&1; echo "node exit $?"
node tools/fuzz-ui.mjs > tools/out/fuzz.txt 2>&1
python3 -m http.server 8123 >/dev/null 2>&1 & SP=$!; sleep 1
python3 tools/browser-test.py > tools/out/browser.txt 2>&1; echo "browser exit $?"
kill $SP 2>/dev/null
node tools/make-test-report.mjs
