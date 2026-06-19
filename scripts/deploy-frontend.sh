#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${ENVIRONMENT:-dev}"
TF_DIR="$PROJECT_ROOT/infra/terraform/environments/$ENVIRONMENT"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo
echo "============================================================"
echo "🚀 FitOps local frontend deploy"
echo "============================================================"

command -v terraform >/dev/null || { echo "❌ terraform missing"; exit 1; }
command -v aws >/dev/null || { echo "❌ aws missing"; exit 1; }
command -v npm >/dev/null || { echo "❌ npm missing"; exit 1; }

cd "$TF_DIR"

API_ENDPOINT="$(terraform output -raw api_endpoint)"
FRONTEND_BUCKET="$(terraform output -raw static_site_bucket_name)"
CLOUDFRONT_DISTRIBUTION_ID="$(terraform output -raw cloudfront_distribution_id)"
CLOUDFRONT_DOMAIN="$(terraform output -raw cloudfront_domain_name)"

COGNITO_USER_POOL_ID="$(terraform output -raw cognito_user_pool_id)"
COGNITO_APP_CLIENT_ID="$(terraform output -raw cognito_app_client_id)"
COGNITO_HOSTED_UI_BASE_URL="$(terraform output -raw cognito_hosted_ui_base_url)"
COGNITO_REDIRECT_URI="$(terraform output -raw cognito_callback_url)"
COGNITO_LOGOUT_URI="$(terraform output -raw cognito_logout_url)"

AWS_REGION="${AWS_REGION:-us-east-1}"

echo
echo "API:        $API_ENDPOINT"
echo "Frontend:   https://$CLOUDFRONT_DOMAIN"
echo "Bucket:     $FRONTEND_BUCKET"
echo "CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
echo

cd "$FRONTEND_DIR"

cat > .env.production <<ENVEOF
VITE_API_BASE_URL=$API_ENDPOINT
VITE_COGNITO_REGION=$AWS_REGION
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_APP_CLIENT_ID=$COGNITO_APP_CLIENT_ID
VITE_COGNITO_HOSTED_UI_BASE_URL=$COGNITO_HOSTED_UI_BASE_URL
VITE_COGNITO_REDIRECT_URI=$COGNITO_REDIRECT_URI
VITE_COGNITO_LOGOUT_URI=$COGNITO_LOGOUT_URI
ENVEOF

echo "✅ Generated frontend/.env.production"
echo

npm run build

test -f dist/index.html || { echo "❌ dist/index.html missing"; exit 1; }

echo
echo "Uploading assets to S3..."

aws s3 sync dist/ "s3://$FRONTEND_BUCKET" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

aws s3 cp dist/index.html "s3://$FRONTEND_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

echo
echo "Invalidating CloudFront..."

INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text
)"

echo "✅ Invalidation created: $INVALIDATION_ID"
echo
echo "Live URL:"
echo "https://$CLOUDFRONT_DOMAIN"
echo
