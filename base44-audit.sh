#!/usr/bin/env bash

# ============================================================
# FitOps Base44 Dependency Audit
# ============================================================
# Purpose:
#   Find all Base44-related references in the project and create
#   a clean tracking report.
#
# Usage:
#   chmod +x base44-audit.sh
#   ./base44-audit.sh
#
# Output:
#   audit-reports/base44-audit-YYYY-MM-DD_HH-MM-SS.txt
# ============================================================

set -euo pipefail

PROJECT_ROOT="$(pwd)"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
REPORT_DIR="audit-reports"
REPORT_FILE="$REPORT_DIR/base44-audit-$TIMESTAMP.txt"

mkdir -p "$REPORT_DIR"

print_header() {
  local title="$1"
  {
    echo
    echo "============================================================"
    echo "$title"
    echo "============================================================"
  } >> "$REPORT_FILE"
}

print_subheader() {
  local title="$1"
  {
    echo
    echo "------------------------------------------------------------"
    echo "$title"
    echo "------------------------------------------------------------"
  } >> "$REPORT_FILE"
}

run_search() {
  local title="$1"
  local pattern="$2"
  local path="$3"

  print_subheader "$title"

  if grep -RIn \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    --exclude-dir=.vite \
    --exclude-dir=audit-reports \
    --exclude="*.map" \
    --exclude="a.txt" \
    --exclude="merged_all.txt" \
    --exclude="base44-audit.sh" \
    "$pattern" "$path" >> "$REPORT_FILE" 2>/dev/null; then
    echo >> "$REPORT_FILE"
  else
    echo "No matches found." >> "$REPORT_FILE"
  fi
}

{
  echo "FitOps Base44 Dependency Audit"
  echo "Generated at: $(date)"
  echo "Project root: $PROJECT_ROOT"
  echo
  echo "Goal:"
  echo "This report tracks all Base44-related references so we can"
  echo "gradually replace Base44 with our own AWS-native architecture."
  echo
  echo "Target future architecture:"
  echo "Frontend: S3 + CloudFront"
  echo "Backend: API Gateway + Lambda"
  echo "Database: DynamoDB"
  echo "Auth: Cognito"
  echo "AI: OpenAI / Agent workflow through backend only"
} > "$REPORT_FILE"

print_header "1. Base44 References Inside src/"
run_search "All lowercase 'base44' references in src/" "base44" "src"

print_header "2. @base44 Package Imports"
run_search "All '@base44' references in project files" "@base44" "."

print_header "3. Base44 Entity Usage"
run_search "Base44 entities usage" "base44.entities" "src"

print_header "4. Base44 Auth Usage"
run_search "Base44 auth usage" "base44.auth" "src"

print_header "5. Base44 AI / Integrations Usage"
run_search "Base44 integrations usage" "base44.integrations" "src"

print_header "6. Base44 Agents Usage"
run_search "Base44 agents usage" "base44.agents" "src"

print_header "7. Base44 Assets / Media URLs"
run_search "Base44 media/image URLs" "media.base44.com" "src"

print_header "8. Base44 App Parameters / Tokens"
run_search "Base44 localStorage/app params/token references" "base44_" "src"

print_header "9. Important Project Files"
{
  echo
  echo "Files likely involved in migration:"
  echo
  echo "Frontend API layer:"
  echo "  - src/api/base44Client.js"
  echo "  - src/api/userApi.js"
  echo "  - src/api/progressApi.js"
  echo "  - src/api/aiApi.js"
  echo
  echo "Auth layer:"
  echo "  - src/lib/AuthContext.jsx"
  echo "  - src/lib/useCurrentUser.js"
  echo "  - src/components/ProtectedRoute.jsx"
  echo "  - src/components/layout/AppLayout.jsx"
  echo "  - src/pages/Landing.jsx"
  echo
  echo "AI / agent layer:"
  echo "  - src/pages/Insights.jsx"
  echo "  - src/components/insights/ChatPanel.jsx"
  echo "  - src/components/insights/CoachChat.jsx"
  echo
  echo "Config/build layer:"
  echo "  - vite.config.js"
  echo "  - package.json"
  echo "  - index.html"
} >> "$REPORT_FILE"

print_header "10. Migration Notes"
{
  echo
  echo "Do not remove Base44 immediately."
  echo
  echo "Recommended replacement order:"
  echo "  1. Keep frontend working."
  echo "  2. Clean branding: title, favicon, README."
  echo "  3. Add backend health check."
  echo "  4. Replace userApi.js with API Gateway calls."
  echo "  5. Replace progressApi.js with API Gateway calls."
  echo "  6. Replace aiApi.js with OpenAI-backed Lambda flow."
  echo "  7. Replace Base44 auth with Cognito."
  echo "  8. Remove base44Client.js and @base44/sdk."
  echo "  9. Remove Base44 Vite plugin if no longer needed."
  echo
  echo "Security reminders:"
  echo "  - Never put OpenAI API keys in the frontend."
  echo "  - Frontend must never access DynamoDB directly."
  echo "  - Use API Gateway + Lambda as the backend boundary."
  echo "  - Use Cognito JWT tokens for user identity."
  echo "  - Keep S3 photo bucket private."
  echo "  - Use least-privilege IAM."
} >> "$REPORT_FILE"

print_header "Audit Completed"
{
  echo
  echo "Report file:"
  echo "  $REPORT_FILE"
  echo
} >> "$REPORT_FILE"

echo
echo "✅ Base44 audit completed successfully."
echo "📄 Report created at:"
echo "   $REPORT_FILE"
echo