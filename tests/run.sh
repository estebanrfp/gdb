#!/usr/bin/env bash
# GenosDB — agent-browser test runner
# Starts HTTP server, runs all test scripts, generates HTML report
set -uo pipefail

cd "$(dirname "$0")/.."

PORT=3456
BASE_URL="http://localhost:$PORT"
SCREENSHOT_DIR="tests/screenshots"
REPORT_OUT="tests/report.html"
TEMPLATE="tests/report-template.html"
RESULTS_DIR="tests/.results"

mkdir -p "$SCREENSHOT_DIR" "$RESULTS_DIR"

# --- Start HTTP server ---
echo "▸ Starting HTTP server on port $PORT..."
npx -y serve . -p "$PORT" -s --no-clipboard > /dev/null 2>&1 &
SERVER_PID=$!

cleanup() {
  echo "▸ Stopping server (PID $SERVER_PID)..."
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  rm -rf "$RESULTS_DIR"
}
trap cleanup EXIT

# Wait for server to be ready
echo "  Waiting for server..."
for i in $(seq 1 15); do
  if curl -s "$BASE_URL" > /dev/null 2>&1; then
    echo "  Server ready."
    break
  fi
  [ "$i" -eq 15 ] && { echo "  ✗ Server failed to start"; exit 1; }
  sleep 1
done

# --- Discover and run tests ---
TOTAL_PASS=0
TOTAL_FAIL=0
TEST_SECTIONS=""
TEST_FILES=(tests/todolist.sh)

for TEST_FILE in "${TEST_FILES[@]}"; do
  TEST_NAME=$(basename "$TEST_FILE" .sh)
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  RESULT_FILE="$RESULTS_DIR/$TEST_NAME.json"
  START_TIME=$(date +%s)

  # Run test, capture JSON output (last valid JSON block from stdout)
  TEST_OUTPUT=$(bash "$TEST_FILE" "$BASE_URL" 2>&1)
  TEST_EXIT=$?
  echo "$TEST_OUTPUT"

  END_TIME=$(date +%s)
  DURATION=$(( END_TIME - START_TIME ))

  # Extract JSON result (everything between last { and })
  JSON_RESULT=$(echo "$TEST_OUTPUT" | sed -n '/^{$/,/^}$/p' | tail -n +1)

  if [ -z "$JSON_RESULT" ]; then
    JSON_RESULT="{\"test\":\"$TEST_NAME\",\"status\":\"fail\",\"passed\":0,\"failed\":1,\"total\":1,\"steps\":[{\"step\":\"execution\",\"status\":\"fail\",\"error\":\"No JSON output\"}],\"screenshots\":[]}"
  fi

  echo "$JSON_RESULT" > "$RESULT_FILE"

  # Parse results
  T_STATUS=$(echo "$JSON_RESULT" | grep -o '"status": *"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  T_PASSED=$(echo "$JSON_RESULT" | grep -o '"passed": *[0-9]*' | head -1 | grep -o '[0-9]*$')
  T_FAILED=$(echo "$JSON_RESULT" | grep -o '"failed": *[0-9]*' | head -1 | grep -o '[0-9]*$')

  TOTAL_PASS=$((TOTAL_PASS + ${T_PASSED:-0}))
  TOTAL_FAIL=$((TOTAL_FAIL + ${T_FAILED:-0}))

  # Build steps HTML
  STEPS_HTML=""
  # Parse steps from JSON using basic grep
  STEP_LINES=$(echo "$JSON_RESULT" | grep -o '"step":"[^"]*","status":"[^"]*"' || true)
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    S_NAME=$(echo "$line" | grep -o '"step":"[^"]*"' | cut -d'"' -f4)
    S_STATUS=$(echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$S_STATUS" = "pass" ]; then
      STEPS_HTML="$STEPS_HTML<div class=\"step pass\"><span class=\"icon\">✓</span> $S_NAME</div>"
    else
      STEPS_HTML="$STEPS_HTML<div class=\"step fail\"><span class=\"icon\">✗</span> $S_NAME</div>"
    fi
  done <<< "$STEP_LINES"

  # Build screenshots HTML — embed as base64
  SCREENSHOTS_HTML=""
  for IMG in "$SCREENSHOT_DIR"/*.png; do
    [ -f "$IMG" ] || continue
    IMG_NAME=$(basename "$IMG")
    B64=$(base64 < "$IMG" | tr -d '\n')
    SCREENSHOTS_HTML="$SCREENSHOTS_HTML<figure><img src=\"data:image/png;base64,$B64\" alt=\"$IMG_NAME\"><figcaption>$IMG_NAME</figcaption></figure>"
  done

  # Build test section
  BADGE_CLASS="$T_STATUS"
  TEST_SECTIONS="$TEST_SECTIONS
  <div class=\"test-section\">
    <div class=\"test-header\">
      <h2>$TEST_NAME</h2>
      <span class=\"badge $BADGE_CLASS\">${T_STATUS:-fail}</span>
    </div>
    <div class=\"steps\">$STEPS_HTML</div>
    <div class=\"screenshots\">$SCREENSHOTS_HTML</div>
  </div>"
done

# --- Generate report ---
TOTAL=$((TOTAL_PASS + TOTAL_FAIL))
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

REPORT=$(cat "$TEMPLATE")
REPORT="${REPORT//\{\{TIMESTAMP\}\}/$TIMESTAMP}"
REPORT="${REPORT//\{\{PASSED\}\}/$TOTAL_PASS}"
REPORT="${REPORT//\{\{FAILED\}\}/$TOTAL_FAIL}"
REPORT="${REPORT//\{\{TOTAL\}\}/$TOTAL}"
REPORT="${REPORT//\{\{TEST_SECTIONS\}\}/$TEST_SECTIONS}"

echo "$REPORT" > "$REPORT_OUT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▸ Results: $TOTAL_PASS passed, $TOTAL_FAIL failed, $TOTAL total"
echo "▸ Report:  $REPORT_OUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ "$TOTAL_FAIL" -gt 0 ] && exit 1
exit 0
