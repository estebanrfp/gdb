#!/usr/bin/env bash
# TodoList P2P Sync Test — verifies real-time sync between two browser peers
set -uo pipefail

BASE_URL="${1:-http://localhost:3456}"
PAGE_URL="$BASE_URL/examples/todolist.html"
SCREENSHOT_DIR="tests/screenshots"
mkdir -p "$SCREENSHOT_DIR"

PASS=0
FAIL=0
STEPS=()

pass() { PASS=$((PASS + 1)); STEPS+=("{\"step\":\"$1\",\"status\":\"pass\"}"); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL + 1)); STEPS+=("{\"step\":\"$1\",\"status\":\"fail\",\"error\":\"$2\"}"); echo "  ✗ $1 — $2"; }

ab() { agent-browser "$@" 2>/dev/null || true; }

echo "▸ TodoList P2P Sync Test"
echo "  URL: $PAGE_URL"

# --- Step 1: Open peer1 ---
ab --session peer1 open "$PAGE_URL" > /dev/null
ab --session peer1 wait 2000 > /dev/null
pass "Open peer1"

# --- Step 2: Open peer2 ---
ab --session peer2 open "$PAGE_URL" > /dev/null
ab --session peer2 wait 2000 > /dev/null
pass "Open peer2"

# --- Step 3: Wait for P2P connection ---
echo "  ⏳ Waiting for P2P connection..."
sleep 5

# --- Step 4: Add task in peer1 ---
ab --session peer1 fill "#taskInput" "Test P2P Sync" > /dev/null
ab --session peer1 press Enter > /dev/null
ab --session peer1 wait 1000 > /dev/null

PEER1_TEXT=$(agent-browser --session peer1 get text "#taskList" 2>/dev/null || echo "")
if echo "$PEER1_TEXT" | grep -q "Test P2P Sync"; then
  pass "Add task in peer1"
else
  fail "Add task in peer1" "Task text not found in peer1 taskList"
fi

# --- Step 5: Verify sync to peer2 ---
echo "  ⏳ Waiting for sync to peer2..."
sleep 6

PEER2_TEXT=$(agent-browser --session peer2 get text "#taskList" 2>/dev/null || echo "")
if echo "$PEER2_TEXT" | grep -q "Test P2P Sync"; then
  pass "Task synced to peer2"
else
  fail "Task synced to peer2" "Task not found in peer2 after sync wait"
fi

# --- Step 6: Screenshot both peers ---
ab --session peer1 screenshot "$SCREENSHOT_DIR/peer1-after-add.png" > /dev/null
ab --session peer2 screenshot "$SCREENSHOT_DIR/peer2-after-sync.png" > /dev/null
pass "Screenshots captured"

# --- Step 7: Toggle completion in peer2 (click the span text) ---
ab --session peer2 click "#taskList li span" > /dev/null
ab --session peer2 wait 1500 > /dev/null

HAS_COMPLETED=$(agent-browser --session peer2 eval "document.querySelector('#taskList li span')?.classList.contains('completed')" 2>/dev/null || echo "false")
if echo "$HAS_COMPLETED" | grep -q "true"; then
  pass "Toggle completion in peer2"
else
  fail "Toggle completion in peer2" "Completed class not found"
fi

# --- Step 8: Verify completion syncs to peer1 ---
echo "  ⏳ Waiting for completion sync..."
sleep 6

PEER1_COMPLETED=$(agent-browser --session peer1 eval "document.querySelector('#taskList li span')?.classList.contains('completed')" 2>/dev/null || echo "false")
if echo "$PEER1_COMPLETED" | grep -q "true"; then
  pass "Completion synced to peer1"
else
  fail "Completion synced to peer1" "Completed class not found in peer1"
fi

# --- Step 9: Screenshot after completion ---
ab --session peer1 screenshot "$SCREENSHOT_DIR/peer1-after-complete.png" > /dev/null
ab --session peer2 screenshot "$SCREENSHOT_DIR/peer2-after-complete.png" > /dev/null

# --- Step 10: Delete task in peer1 (click the delete button 🗑️) ---
# Use eval to find and click the delete button reliably
ab --session peer1 eval "(() => { const btns = document.querySelectorAll('#taskList li button'); for (const b of btns) { if (b.textContent.includes('🗑')) { b.click(); return 'clicked'; } } return 'not-found'; })()" > /dev/null
ab --session peer1 wait 2000 > /dev/null

PEER1_TEXT_AFTER=$(agent-browser --session peer1 get text "#taskList" 2>/dev/null || echo "Test P2P Sync")
if ! echo "$PEER1_TEXT_AFTER" | grep -q "Test P2P Sync"; then
  pass "Delete task in peer1"
else
  fail "Delete task in peer1" "Task still present after delete"
fi

# --- Step 11: Verify deletion syncs to peer2 ---
echo "  ⏳ Waiting for deletion sync..."
sleep 6

PEER2_TEXT_AFTER=$(agent-browser --session peer2 get text "#taskList" 2>/dev/null || echo "Test P2P Sync")
if ! echo "$PEER2_TEXT_AFTER" | grep -q "Test P2P Sync"; then
  pass "Deletion synced to peer2"
else
  fail "Deletion synced to peer2" "Task still present in peer2 after sync"
fi

# --- Step 12: Final screenshots ---
ab --session peer1 screenshot "$SCREENSHOT_DIR/peer1-final.png" > /dev/null
ab --session peer2 screenshot "$SCREENSHOT_DIR/peer2-final.png" > /dev/null

# --- Close sessions ---
ab --session peer1 close > /dev/null
ab --session peer2 close > /dev/null

# --- Output JSON result ---
STEPS_JSON=$(printf '%s,' "${STEPS[@]}" | sed 's/,$//')
TOTAL=$((PASS + FAIL))
STATUS="pass"
[ "$FAIL" -gt 0 ] && STATUS="fail"

cat <<EOF
{
  "test": "TodoList P2P Sync",
  "status": "$STATUS",
  "passed": $PASS,
  "failed": $FAIL,
  "total": $TOTAL,
  "steps": [$STEPS_JSON],
  "screenshots": [
    "peer1-after-add.png",
    "peer2-after-sync.png",
    "peer1-after-complete.png",
    "peer2-after-complete.png",
    "peer1-final.png",
    "peer2-final.png"
  ]
}
EOF

[ "$FAIL" -gt 0 ] && exit 1
exit 0
