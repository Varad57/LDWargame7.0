#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════
# Wargame Backend Load Test — 500 Concurrent Users
# ══════════════════════════════════════════════════════════════════════════
#
# Tests: login (auto-register), progress, verify, leaderboard
# Requirements: curl, bash
#
# Usage:
#   chmod +x load_test.sh
#   ./load_test.sh [BASE_URL] [CONCURRENT_USERS] [REQUESTS_PER_USER]
#
# Example:
#   ./load_test.sh http://localhost:8080 500 5
# ══════════════════════════════════════════════════════════════════════════

BASE_URL="${1:-http://localhost:8080}"
CONCURRENT="${2:-500}"
REQS_PER_USER="${3:-5}"
TOTAL=$((CONCURRENT * REQS_PER_USER))

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

RESULTS_DIR="./load_test_results"
rm -rf "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR"

echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Wargame Backend Load Test${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "  Target:      ${YELLOW}${BASE_URL}${NC}"
echo -e "  Concurrent:  ${YELLOW}${CONCURRENT}${NC} users"
echo -e "  Reqs/user:   ${YELLOW}${REQS_PER_USER}${NC}"
echo -e "  Total reqs:  ${YELLOW}${TOTAL}${NC}"
echo ""

# ── Health Check ──────────────────────────────────────────────────────────
echo -e "${CYAN}[1/5] Health check...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null)
if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}  ✗ Server unreachable (HTTP $HTTP_CODE). Start the backend first.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Server is up${NC}"
echo ""

# ── Test 1: Concurrent Login (Auto-Register) ─────────────────────────────
echo -e "${CYAN}[2/5] Testing concurrent LOGIN (auto-register) — $CONCURRENT users...${NC}"
LOGIN_START=$(date +%s%N)
for i in $(seq 1 "$CONCURRENT"); do
    (
        CALLSIGN="LOADTEST_USER_${i}"
        PASSWORD="testpass_${i}"
        RESP=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            -X POST "$BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"callsign\":\"$CALLSIGN\",\"password\":\"$PASSWORD\"}" 2>/dev/null)
        
        HTTP_CODE=$(echo "$RESP" | tail -2 | head -1)
        TIME=$(echo "$RESP" | tail -1)
        BODY=$(echo "$RESP" | head -1)
        TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        SUCCESS=$(echo "$BODY" | grep -o '"success":true')
        
        echo "$TOKEN" > "$RESULTS_DIR/token_${i}.txt"
        echo "${HTTP_CODE} ${TIME} ${SUCCESS:+OK}" >> "$RESULTS_DIR/login_results.txt"
    ) &
done
wait
LOGIN_END=$(date +%s%N)
LOGIN_MS=$(( (LOGIN_END - LOGIN_START) / 1000000 ))

LOGIN_OK=$(grep -c "OK" "$RESULTS_DIR/login_results.txt" 2>/dev/null || echo 0)
LOGIN_FAIL=$((CONCURRENT - LOGIN_OK))
LOGIN_AVG=$(awk '{sum += $2; n++} END {if(n>0) printf "%.3f", sum/n; else print "0"}' "$RESULTS_DIR/login_results.txt")
LOGIN_MAX=$(awk '{if($2>max) max=$2} END {printf "%.3f", max}' "$RESULTS_DIR/login_results.txt")
LOGIN_P95=$(sort -t' ' -k2 -n "$RESULTS_DIR/login_results.txt" | awk -v p=0.95 'NR==1{n=0} {a[n++]=$2} END{printf "%.3f", a[int(n*p)]}')

echo -e "  Success: ${GREEN}${LOGIN_OK}${NC} / ${CONCURRENT}  |  Failed: ${RED}${LOGIN_FAIL}${NC}"
echo -e "  Total:   ${YELLOW}${LOGIN_MS}ms${NC}  |  Avg: ${YELLOW}${LOGIN_AVG}s${NC}  |  Max: ${YELLOW}${LOGIN_MAX}s${NC}  |  P95: ${YELLOW}${LOGIN_P95}s${NC}"
echo ""

# ── Test 2: Concurrent Login (Existing Users — Password Verify) ──────────
echo -e "${CYAN}[3/5] Testing concurrent LOGIN (existing users, password verify) — $CONCURRENT users...${NC}"
VERIFY_LOGIN_START=$(date +%s%N)
for i in $(seq 1 "$CONCURRENT"); do
    (
        CALLSIGN="LOADTEST_USER_${i}"
        PASSWORD="testpass_${i}"
        RESP=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            -X POST "$BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"callsign\":\"$CALLSIGN\",\"password\":\"$PASSWORD\"}" 2>/dev/null)
        
        HTTP_CODE=$(echo "$RESP" | tail -2 | head -1)
        TIME=$(echo "$RESP" | tail -1)
        BODY=$(echo "$RESP" | head -1)
        TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        SUCCESS=$(echo "$BODY" | grep -o '"success":true')
        
        # Update token for progress test
        echo "$TOKEN" > "$RESULTS_DIR/token_${i}.txt"
        echo "${HTTP_CODE} ${TIME} ${SUCCESS:+OK}" >> "$RESULTS_DIR/verify_login_results.txt"
    ) &
done
wait
VERIFY_LOGIN_END=$(date +%s%N)
VERIFY_LOGIN_MS=$(( (VERIFY_LOGIN_END - VERIFY_LOGIN_START) / 1000000 ))

VL_OK=$(grep -c "OK" "$RESULTS_DIR/verify_login_results.txt" 2>/dev/null || echo 0)
VL_FAIL=$((CONCURRENT - VL_OK))
VL_AVG=$(awk '{sum += $2; n++} END {if(n>0) printf "%.3f", sum/n; else print "0"}' "$RESULTS_DIR/verify_login_results.txt")
VL_MAX=$(awk '{if($2>max) max=$2} END {printf "%.3f", max}' "$RESULTS_DIR/verify_login_results.txt")
VL_P95=$(sort -t' ' -k2 -n "$RESULTS_DIR/verify_login_results.txt" | awk -v p=0.95 'NR==1{n=0} {a[n++]=$2} END{printf "%.3f", a[int(n*p)]}')

echo -e "  Success: ${GREEN}${VL_OK}${NC} / ${CONCURRENT}  |  Failed: ${RED}${VL_FAIL}${NC}"
echo -e "  Total:   ${YELLOW}${VERIFY_LOGIN_MS}ms${NC}  |  Avg: ${YELLOW}${VL_AVG}s${NC}  |  Max: ${YELLOW}${VL_MAX}s${NC}  |  P95: ${YELLOW}${VL_P95}s${NC}"
echo ""

# ── Test 3: Concurrent Progress Fetch ─────────────────────────────────────
echo -e "${CYAN}[4/5] Testing concurrent PROGRESS fetch — $CONCURRENT users...${NC}"
PROGRESS_START=$(date +%s%N)
for i in $(seq 1 "$CONCURRENT"); do
    (
        TOKEN=$(cat "$RESULTS_DIR/token_${i}.txt" 2>/dev/null)
        if [ -z "$TOKEN" ]; then
            echo "000 0.000 SKIP" >> "$RESULTS_DIR/progress_results.txt"
            exit 0
        fi
        RESP=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            "$BASE_URL/api/progress" \
            -H "Authorization: Bearer $TOKEN" 2>/dev/null)
        
        HTTP_CODE=$(echo "$RESP" | tail -2 | head -1)
        TIME=$(echo "$RESP" | tail -1)
        SUCCESS=$(echo "$RESP" | head -1 | grep -o '"success":true')
        
        echo "${HTTP_CODE} ${TIME} ${SUCCESS:+OK}" >> "$RESULTS_DIR/progress_results.txt"
    ) &
done
wait
PROGRESS_END=$(date +%s%N)
PROGRESS_MS=$(( (PROGRESS_END - PROGRESS_START) / 1000000 ))

PROG_OK=$(grep -c "OK" "$RESULTS_DIR/progress_results.txt" 2>/dev/null || echo 0)
PROG_FAIL=$((CONCURRENT - PROG_OK))
PROG_AVG=$(awk '{sum += $2; n++} END {if(n>0) printf "%.3f", sum/n; else print "0"}' "$RESULTS_DIR/progress_results.txt")
PROG_MAX=$(awk '{if($2>max) max=$2} END {printf "%.3f", max}' "$RESULTS_DIR/progress_results.txt")
PROG_P95=$(sort -t' ' -k2 -n "$RESULTS_DIR/progress_results.txt" | awk -v p=0.95 'NR==1{n=0} {a[n++]=$2} END{printf "%.3f", a[int(n*p)]}')

echo -e "  Success: ${GREEN}${PROG_OK}${NC} / ${CONCURRENT}  |  Failed: ${RED}${PROG_FAIL}${NC}"
echo -e "  Total:   ${YELLOW}${PROGRESS_MS}ms${NC}  |  Avg: ${YELLOW}${PROG_AVG}s${NC}  |  Max: ${YELLOW}${PROG_MAX}s${NC}  |  P95: ${YELLOW}${PROG_P95}s${NC}"
echo ""

# ── Test 4: Concurrent Leaderboard ────────────────────────────────────────
echo -e "${CYAN}[5/5] Testing concurrent LEADERBOARD fetch — $CONCURRENT users...${NC}"
LB_START=$(date +%s%N)
for i in $(seq 1 "$CONCURRENT"); do
    (
        RESP=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            "$BASE_URL/api/leaderboard" 2>/dev/null)
        
        HTTP_CODE=$(echo "$RESP" | tail -2 | head -1)
        TIME=$(echo "$RESP" | tail -1)
        
        echo "${HTTP_CODE} ${TIME} $( [ "$HTTP_CODE" = "200" ] && echo OK)" >> "$RESULTS_DIR/leaderboard_results.txt"
    ) &
done
wait
LB_END=$(date +%s%N)
LB_MS=$(( (LB_END - LB_START) / 1000000 ))

LB_OK=$(grep -c "OK" "$RESULTS_DIR/leaderboard_results.txt" 2>/dev/null || echo 0)
LB_FAIL=$((CONCURRENT - LB_OK))
LB_AVG=$(awk '{sum += $2; n++} END {if(n>0) printf "%.3f", sum/n; else print "0"}' "$RESULTS_DIR/leaderboard_results.txt")
LB_MAX=$(awk '{if($2>max) max=$2} END {printf "%.3f", max}' "$RESULTS_DIR/leaderboard_results.txt")
LB_P95=$(sort -t' ' -k2 -n "$RESULTS_DIR/leaderboard_results.txt" | awk -v p=0.95 'NR==1{n=0} {a[n++]=$2} END{printf "%.3f", a[int(n*p)]}')

echo -e "  Success: ${GREEN}${LB_OK}${NC} / ${CONCURRENT}  |  Failed: ${RED}${LB_FAIL}${NC}"
echo -e "  Total:   ${YELLOW}${LB_MS}ms${NC}  |  Avg: ${YELLOW}${LB_AVG}s${NC}  |  Max: ${YELLOW}${LB_MAX}s${NC}  |  P95: ${YELLOW}${LB_P95}s${NC}"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Summary${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "  Login (register):  ${GREEN}${LOGIN_OK}${NC}/${CONCURRENT} OK  |  ${LOGIN_MS}ms total  |  Avg ${LOGIN_AVG}s  |  P95 ${LOGIN_P95}s"
echo -e "  Login (verify):    ${GREEN}${VL_OK}${NC}/${CONCURRENT} OK  |  ${VERIFY_LOGIN_MS}ms total  |  Avg ${VL_AVG}s  |  P95 ${VL_P95}s"
echo -e "  Progress:          ${GREEN}${PROG_OK}${NC}/${CONCURRENT} OK  |  ${PROGRESS_MS}ms total  |  Avg ${PROG_AVG}s  |  P95 ${PROG_P95}s"
echo -e "  Leaderboard:       ${GREEN}${LB_OK}${NC}/${CONCURRENT} OK  |  ${LB_MS}ms total  |  Avg ${LB_AVG}s  |  P95 ${LB_P95}s"
echo ""

TOTAL_FAIL=$((LOGIN_FAIL + VL_FAIL + PROG_FAIL + LB_FAIL))
TOTAL_REQS=$((CONCURRENT * 4))
if [ "$TOTAL_FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}✓ ALL ${TOTAL_REQS} REQUESTS PASSED — 0 failures${NC}"
else
    echo -e "  ${RED}✗ ${TOTAL_FAIL} / ${TOTAL_REQS} FAILED${NC}"
fi
echo ""

# ── Cleanup test users ────────────────────────────────────────────────────
echo -e "${YELLOW}Note: ${CONCURRENT} test users (LOADTEST_USER_*) were created in the DB.${NC}"
echo -e "${YELLOW}To clean them up, run:${NC}"
echo -e "  sqlite3 ./wargame.db \"DELETE FROM players WHERE callsign LIKE 'LOADTEST_USER_%';\""
echo ""

rm -rf "$RESULTS_DIR"
