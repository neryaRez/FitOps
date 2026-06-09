#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# FitOps AWS Bootstrap
# ============================================================
# One-command bootstrap for the FitOps AWS dev environment.
#
# What it does:
#   1. Detects project root.
#   2. Validates required tools.
#   3. Validates AWS identity.
#   4. Detects GitHub repository from git remote.
#   5. Detects existing GitHub OIDC provider.
#      - If exists: Terraform uses it.
#      - If not: Terraform creates it.
#      - If Terraform already manages it: Terraform keeps managing it.
#   6. Creates Terraform backend resources:
#      - S3 bucket for tfstate
#      - DynamoDB table for state locking
#      - local backend.tf
#   7. Generates local terraform.tfvars.
#   8. Runs terraform init/fmt/validate/apply.
#   9. Prints outputs and tests /health.
#  10. Best-effort GitHub Actions repository variables setup.
#
# Usage:
#   ./scripts/bootstrap-aws.sh
#
# Optional environment overrides:
#   PROJECT_NAME=fitops ./scripts/bootstrap-aws.sh
#   ENVIRONMENT=dev ./scripts/bootstrap-aws.sh
#   AWS_REGION=us-east-1 ./scripts/bootstrap-aws.sh
#   GITHUB_REPOSITORY=OWNER/REPOSITORY ./scripts/bootstrap-aws.sh
#   GITHUB_OIDC_PROVIDER_ARN=arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com ./scripts/bootstrap-aws.sh
#   AUTO_APPROVE=false ./scripts/bootstrap-aws.sh
# ============================================================

PROJECT_NAME="${PROJECT_NAME:-fitops}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
AUTO_APPROVE="${AUTO_APPROVE:-true}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

TF_ENV_DIR="$ROOT_DIR/infra/terraform/environments/$ENVIRONMENT"
BACKEND_FILE="$TF_ENV_DIR/backend.tf"
TFVARS_FILE="$TF_ENV_DIR/terraform.tfvars"

echo
echo "============================================================"
echo "🚀 FitOps AWS bootstrap"
echo "============================================================"
echo

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

clean_name() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9-]/-/g' \
    | sed 's/--*/-/g' \
    | sed 's/^-//' \
    | sed 's/-$//'
}

require_tool() {
  local tool="$1"

  if ! command_exists "$tool"; then
    echo "❌ Missing required tool: $tool"
    exit 1
  fi
}

detect_github_repository() {
  local remote_url

  remote_url="$(git -C "$ROOT_DIR" remote get-url origin 2>/dev/null || true)"

  if [[ -z "$remote_url" ]]; then
    return 1
  fi

  echo "$remote_url" \
    | sed -E 's#^https://github.com/##' \
    | sed -E 's#^git@github.com:##' \
    | sed -E 's#\.git$##'
}

detect_existing_github_oidc_provider_arn() {
  aws iam list-open-id-connect-providers \
    --query "OpenIDConnectProviderList[].Arn" \
    --output text 2>/dev/null \
    | tr '\t' '\n' \
    | grep "oidc-provider/token.actions.githubusercontent.com" \
    | head -n 1 || true
}

terraform_state_has_managed_github_oidc_provider() {
  terraform state list 2>/dev/null \
    | grep -q 'module.github_frontend_deploy.aws_iam_openid_connect_provider.github'
}

create_or_update_backend_bucket() {
  echo
  echo "Preparing Terraform backend resources..."
  echo

  if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
    echo "✅ S3 backend bucket already exists: $STATE_BUCKET"
  else
    echo "📦 Creating S3 backend bucket: $STATE_BUCKET"

    if [[ "$AWS_REGION" == "us-east-1" ]]; then
      aws s3api create-bucket \
        --bucket "$STATE_BUCKET" \
        --region "$AWS_REGION"
    else
      aws s3api create-bucket \
        --bucket "$STATE_BUCKET" \
        --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi

    echo "✅ S3 backend bucket created."
  fi

  echo "🔒 Securing backend bucket..."

  aws s3api put-public-access-block \
    --bucket "$STATE_BUCKET" \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

  aws s3api put-bucket-versioning \
    --bucket "$STATE_BUCKET" \
    --versioning-configuration Status=Enabled

  aws s3api put-bucket-encryption \
    --bucket "$STATE_BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [
        {
          "ApplyServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          },
          "BucketKeyEnabled": true
        }
      ]
    }'

  local policy_file
  policy_file="$(mktemp)"

  cat > "$policy_file" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::$STATE_BUCKET",
        "arn:aws:s3:::$STATE_BUCKET/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
EOF

  aws s3api put-bucket-policy \
    --bucket "$STATE_BUCKET" \
    --policy "file://$policy_file"

  rm -f "$policy_file"

  echo "✅ Backend bucket security configured."
}

create_or_update_lock_table() {
  echo
  echo "Preparing Terraform lock table..."
  echo

  if aws dynamodb describe-table \
    --table-name "$LOCK_TABLE" \
    --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "✅ DynamoDB lock table already exists: $LOCK_TABLE"
  else
    echo "🔐 Creating DynamoDB lock table: $LOCK_TABLE"

    aws dynamodb create-table \
      --table-name "$LOCK_TABLE" \
      --region "$AWS_REGION" \
      --billing-mode PAY_PER_REQUEST \
      --attribute-definitions AttributeName=LockID,AttributeType=S \
      --key-schema AttributeName=LockID,KeyType=HASH

    aws dynamodb wait table-exists \
      --table-name "$LOCK_TABLE" \
      --region "$AWS_REGION"

    echo "✅ DynamoDB lock table created."
  fi
}

write_backend_tf() {
  mkdir -p "$TF_ENV_DIR"

  cat > "$BACKEND_FILE" <<EOF
terraform {
  backend "s3" {
    bucket         = "$STATE_BUCKET"
    key            = "$STATE_KEY"
    region         = "$AWS_REGION"
    dynamodb_table = "$LOCK_TABLE"
    encrypt        = true
  }
}
EOF

  echo
  echo "✅ Generated Terraform backend file:"
  echo "   $BACKEND_FILE"
}

write_tfvars_null_oidc() {
  cat > "$TFVARS_FILE" <<EOF
project_name              = "$PROJECT_NAME"
environment               = "$ENVIRONMENT"
aws_region                = "$AWS_REGION"
github_repository         = "$GITHUB_REPOSITORY"
github_oidc_provider_arn  = null
EOF
}

write_tfvars_existing_oidc() {
  local oidc_provider_arn="$1"

  cat > "$TFVARS_FILE" <<EOF
project_name              = "$PROJECT_NAME"
environment               = "$ENVIRONMENT"
aws_region                = "$AWS_REGION"
github_repository         = "$GITHUB_REPOSITORY"
github_oidc_provider_arn  = "$oidc_provider_arn"
EOF
}

prepare_tfvars_with_oidc_strategy() {
  echo
  echo "Preparing local terraform.tfvars..."
  echo

  mkdir -p "$TF_ENV_DIR"

  # Initial tfvars, needed before terraform init/state checks.
  write_tfvars_null_oidc

  cd "$TF_ENV_DIR"
  terraform init

  GITHUB_OIDC_PROVIDER_ARN="${GITHUB_OIDC_PROVIDER_ARN:-}"

  if terraform_state_has_managed_github_oidc_provider; then
    echo "✅ GitHub OIDC provider is already managed by this Terraform state."
    echo "   Keeping github_oidc_provider_arn = null"
    write_tfvars_null_oidc
  else
    if [[ -z "$GITHUB_OIDC_PROVIDER_ARN" ]]; then
      GITHUB_OIDC_PROVIDER_ARN="$(detect_existing_github_oidc_provider_arn)"
    fi

    if [[ -n "$GITHUB_OIDC_PROVIDER_ARN" ]]; then
      echo "✅ Existing GitHub OIDC provider detected:"
      echo "   $GITHUB_OIDC_PROVIDER_ARN"
      write_tfvars_existing_oidc "$GITHUB_OIDC_PROVIDER_ARN"
    else
      echo "ℹ️ No existing GitHub OIDC provider detected."
      echo "   Terraform will create one."
      write_tfvars_null_oidc
    fi
  fi

  echo "✅ Generated local variables file:"
  echo "   $TFVARS_FILE"
}

run_terraform() {
  echo
  echo "Running Terraform..."
  echo

  cd "$TF_ENV_DIR"

  terraform fmt -recursive ../../
  terraform validate

  if [[ "$AUTO_APPROVE" == "true" ]]; then
    terraform apply -auto-approve
  else
    terraform plan -out=tfplan
    terraform apply tfplan
  fi
}

configure_github_variables_if_possible() {
  echo
  echo "Configuring GitHub Actions repository variables..."
  echo

  if ! command_exists gh; then
    echo "ℹ️ GitHub CLI not installed. Skipping automatic GitHub variable setup."
    print_github_variables_manual_instructions
    return 0
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "ℹ️ GitHub CLI is installed but not authenticated. Skipping automatic GitHub variable setup."
    echo "   To enable it later, run: gh auth login"
    print_github_variables_manual_instructions
    return 0
  fi

  if [[ -z "$FRONTEND_DEPLOY_ROLE_ARN" ]]; then
    echo "ℹ️ Frontend deploy role ARN is empty. Skipping GitHub variable setup."
    print_github_variables_manual_instructions
    return 0
  fi

  set +e
  gh variable set AWS_REGION --repo "$GITHUB_REPOSITORY" --body "$AWS_REGION"
  local rc_region=$?

  gh variable set AWS_FRONTEND_DEPLOY_ROLE_ARN --repo "$GITHUB_REPOSITORY" --body "$FRONTEND_DEPLOY_ROLE_ARN"
  local rc_role=$?

  gh variable set FRONTEND_BUCKET --repo "$GITHUB_REPOSITORY" --body "$FRONTEND_BUCKET"
  local rc_bucket=$?

  gh variable set CLOUDFRONT_DISTRIBUTION_ID --repo "$GITHUB_REPOSITORY" --body "$CLOUDFRONT_DISTRIBUTION_ID"
  local rc_cf=$?
  set -e

  if [[ "$rc_region" -eq 0 && "$rc_role" -eq 0 && "$rc_bucket" -eq 0 && "$rc_cf" -eq 0 ]]; then
    echo "✅ GitHub repository variables configured automatically."
  else
    echo "ℹ️ Could not configure all GitHub variables automatically."
    echo "   This may be caused by missing repo permissions or GitHub CLI auth scope."
    print_github_variables_manual_instructions
  fi
}

print_github_variables_manual_instructions() {
  echo
  echo "Set these GitHub Repository Variables manually if needed:"
  echo "  AWS_REGION=$AWS_REGION"
  echo "  AWS_FRONTEND_DEPLOY_ROLE_ARN=$FRONTEND_DEPLOY_ROLE_ARN"
  echo "  FRONTEND_BUCKET=$FRONTEND_BUCKET"
  echo "  CLOUDFRONT_DISTRIBUTION_ID=$CLOUDFRONT_DISTRIBUTION_ID"
}

print_outputs_and_health_check() {
  echo
  echo "============================================================"
  echo "✅ FitOps AWS environment is deployed"
  echo "============================================================"
  echo

  terraform output

  API_ENDPOINT="$(terraform output -raw api_endpoint)"
  CLOUDFRONT_DOMAIN="$(terraform output -raw cloudfront_domain_name)"
  FRONTEND_BUCKET="$(terraform output -raw static_site_bucket_name)"
  CLOUDFRONT_DISTRIBUTION_ID="$(terraform output -raw cloudfront_distribution_id)"
  FRONTEND_DEPLOY_ROLE_ARN="$(terraform output -raw github_frontend_deploy_role_arn 2>/dev/null || true)"

  echo
  echo "Health check:"
  curl "$API_ENDPOINT/health" || true
  echo

  echo
  echo "Frontend CloudFront URL:"
  echo "https://$CLOUDFRONT_DOMAIN"
  echo

  echo "API endpoint:"
  echo "$API_ENDPOINT"
  echo
}

echo "Checking required tools..."

require_tool git
require_tool aws
require_tool terraform
require_tool curl

echo "✅ Required tools found."
echo

echo "Checking AWS identity..."

ACCOUNT_ID="$(aws sts get-caller-identity \
  --query Account \
  --output text \
  --region "$AWS_REGION" 2>/dev/null || true)"

if [[ -z "$ACCOUNT_ID" || "$ACCOUNT_ID" == "None" ]]; then
  echo "❌ Could not detect AWS account."
  echo "Run one of these first:"
  echo "  aws configure"
  echo "  aws sso login"
  exit 1
fi

echo "✅ AWS account detected: $ACCOUNT_ID"
echo

GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}"

if [[ -z "$GITHUB_REPOSITORY" ]]; then
  GITHUB_REPOSITORY="$(detect_github_repository || true)"
fi

if [[ -z "$GITHUB_REPOSITORY" ]]; then
  echo "❌ Could not detect GitHub repository from git remote."
  echo "Run with:"
  echo "  GITHUB_REPOSITORY=OWNER/REPOSITORY ./scripts/bootstrap-aws.sh"
  exit 1
fi

PROJECT_CLEAN="$(clean_name "$PROJECT_NAME")"
USER_CLEAN="$(clean_name "${USER:-${USERNAME:-user}}")"

if [[ -z "$PROJECT_CLEAN" ]]; then
  PROJECT_CLEAN="fitops"
fi

if [[ -z "$USER_CLEAN" ]]; then
  USER_CLEAN="user"
fi

STATE_BUCKET="${PROJECT_CLEAN}-${USER_CLEAN}-tfstate-${ACCOUNT_ID}-${AWS_REGION}"
LOCK_TABLE="${PROJECT_CLEAN}-${USER_CLEAN}-terraform-locks"
STATE_KEY="tfstate/${PROJECT_CLEAN}/${USER_CLEAN}/${ENVIRONMENT}/terraform.tfstate"

echo "Project:      $PROJECT_NAME"
echo "Environment:  $ENVIRONMENT"
echo "AWS region:   $AWS_REGION"
echo "AWS account:  $ACCOUNT_ID"
echo "GitHub repo:  $GITHUB_REPOSITORY"
echo
echo "Terraform backend:"
echo "  S3 bucket:     $STATE_BUCKET"
echo "  DynamoDB lock: $LOCK_TABLE"
echo "  State key:     $STATE_KEY"
echo

create_or_update_backend_bucket
create_or_update_lock_table
write_backend_tf
prepare_tfvars_with_oidc_strategy
run_terraform
print_outputs_and_health_check
configure_github_variables_if_possible

echo
echo "Done."
echo