#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-fitops}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
AUTO_APPROVE="${AUTO_APPROVE:-true}"

ROOT_DOMAIN="${ROOT_DOMAIN:-}"
FRONTEND_SUBDOMAIN="${FRONTEND_SUBDOMAIN:-}"
ENABLE_CUSTOM_DOMAIN="${ENABLE_CUSTOM_DOMAIN:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

TF_DEV_DIR="$ROOT_DIR/infra/terraform/environments/$ENVIRONMENT"
TF_BOOTSTRAP_DIR="$ROOT_DIR/infra/terraform/bootstrap"

DEV_BACKEND_FILE="$TF_DEV_DIR/backend.tf"
DEV_TFVARS_FILE="$TF_DEV_DIR/terraform.tfvars"

BOOTSTRAP_BACKEND_FILE="$TF_BOOTSTRAP_DIR/backend.tf"
BOOTSTRAP_TFVARS_FILE="$TF_BOOTSTRAP_DIR/terraform.tfvars"

echo
echo "============================================================"
echo "🚀 FitOps AWS Bootstrap"
echo "============================================================"
echo

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_tool() {
  local tool="$1"
  if ! command_exists "$tool"; then
    echo "❌ Missing required tool: $tool"
    exit 1
  fi
}

clean_name() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9-]/-/g' \
    | sed 's/--*/-/g' \
    | sed 's/^-//' \
    | sed 's/-$//'
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

detect_root_domain() {
  if [[ -n "${ROOT_DOMAIN:-}" ]]; then
    echo "$ROOT_DOMAIN"
    return 0
  fi

  aws route53domains list-domains \
    --region us-east-1 \
    --query "Domains[].DomainName" \
    --output text 2>/dev/null \
    | tr '\t' '\n' \
    | grep -E '^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' \
    | sort \
    | head -n 1 || true
}

create_or_update_backend_bucket() {
  echo
  echo "Preparing Terraform backend S3 bucket..."
  echo

  if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
    echo "✅ Backend bucket already exists: $STATE_BUCKET"
  else
    echo "📦 Creating backend bucket: $STATE_BUCKET"

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

    echo "✅ Backend bucket created."
  fi

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

  cat > "$policy_file" <<POLICY
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
POLICY

  aws s3api put-bucket-policy \
    --bucket "$STATE_BUCKET" \
    --policy "file://$policy_file"

  rm -f "$policy_file"

  echo "✅ Backend bucket secured."
}

create_or_update_lock_table() {
  echo
  echo "Preparing Terraform lock table..."
  echo

  if aws dynamodb describe-table \
    --table-name "$LOCK_TABLE" \
    --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "✅ Lock table already exists: $LOCK_TABLE"
  else
    echo "🔐 Creating lock table: $LOCK_TABLE"

    aws dynamodb create-table \
      --table-name "$LOCK_TABLE" \
      --region "$AWS_REGION" \
      --billing-mode PAY_PER_REQUEST \
      --attribute-definitions AttributeName=LockID,AttributeType=S \
      --key-schema AttributeName=LockID,KeyType=HASH

    aws dynamodb wait table-exists \
      --table-name "$LOCK_TABLE" \
      --region "$AWS_REGION"

    echo "✅ Lock table created."
  fi
}

write_backend_tf() {
  local target_file="$1"
  local state_key="$2"

  mkdir -p "$(dirname "$target_file")"

  cat > "$target_file" <<BACKEND
terraform {
  backend "s3" {
    bucket         = "$STATE_BUCKET"
    key            = "$state_key"
    region         = "$AWS_REGION"
    dynamodb_table = "$LOCK_TABLE"
    encrypt        = true
  }
}
BACKEND

  echo "✅ Wrote backend file: $target_file"
}

write_dev_tfvars() {
  mkdir -p "$TF_DEV_DIR"

  cat > "$DEV_TFVARS_FILE" <<TFVARS
project_name = "$PROJECT_NAME"
environment  = "$ENVIRONMENT"
aws_region   = "$AWS_REGION"

enable_custom_domain = $ENABLE_CUSTOM_DOMAIN
root_domain          = "$ROOT_DOMAIN_DETECTED"
frontend_subdomain   = "$FRONTEND_SUBDOMAIN"
TFVARS

  echo "✅ Wrote dev tfvars: $DEV_TFVARS_FILE"
}

write_bootstrap_tfvars() {
  mkdir -p "$TF_BOOTSTRAP_DIR"

  cat > "$BOOTSTRAP_TFVARS_FILE" <<TFVARS
project_name             = "$PROJECT_NAME"
environment              = "$ENVIRONMENT"
aws_region               = "$AWS_REGION"
github_repository        = "$GITHUB_REPOSITORY"
github_branch            = "main"
github_oidc_provider_arn = $GITHUB_OIDC_PROVIDER_VALUE
terraform_state_bucket   = "$STATE_BUCKET"
terraform_lock_table     = "$LOCK_TABLE"
TFVARS

  echo "✅ Wrote bootstrap tfvars: $BOOTSTRAP_TFVARS_FILE"
}

run_bootstrap_terraform() {
  echo
  echo "Running Terraform bootstrap only..."
  echo

  cd "$TF_BOOTSTRAP_DIR"

  terraform fmt -recursive .
  terraform init
  terraform validate

  if [[ "$AUTO_APPROVE" == "true" ]]; then
    terraform apply -auto-approve
  else
    terraform plan -out=tfplan
    terraform apply tfplan
  fi

  GITHUB_ACTIONS_ROLE_ARN="$(terraform output -raw github_actions_role_arn)"
  GITHUB_ACTIONS_ROLE_NAME="$(terraform output -raw github_actions_role_name)"
  GITHUB_OIDC_PROVIDER_OUTPUT_ARN="$(terraform output -raw github_oidc_provider_arn)"

  echo
  echo "✅ Bootstrap Terraform completed."
  echo "GitHub Actions role:"
  echo "  $GITHUB_ACTIONS_ROLE_ARN"
  echo
}

print_github_variables_manual_instructions() {
  echo
  echo "Set these GitHub Repository Variables manually if needed:"
  echo "  AWS_REGION=$AWS_REGION"
  echo "  AWS_GITHUB_ACTIONS_ROLE_ARN=$GITHUB_ACTIONS_ROLE_ARN"
  echo "  TF_STATE_BUCKET=$STATE_BUCKET"
  echo "  TF_STATE_LOCK_TABLE=$LOCK_TABLE"
  echo "  TF_DEV_STATE_KEY=$DEV_STATE_KEY"
  echo "  PROJECT_NAME=$PROJECT_NAME"
  echo "  ENVIRONMENT=$ENVIRONMENT"
  echo "  ENABLE_CUSTOM_DOMAIN=$ENABLE_CUSTOM_DOMAIN"
  echo "  FRONTEND_SUBDOMAIN=$FRONTEND_SUBDOMAIN"
  if [[ -n "${ROOT_DOMAIN_DETECTED:-}" ]]; then
    echo "  ROOT_DOMAIN=$ROOT_DOMAIN_DETECTED"
  fi
}

configure_github_variables_if_possible() {
  echo
  echo "Configuring minimal GitHub repository variables..."
  echo

  if ! command_exists gh; then
    echo "ℹ️ GitHub CLI not installed. Skipping automatic GitHub variable setup."
    print_github_variables_manual_instructions
    return 0
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "ℹ️ GitHub CLI is installed but not authenticated."
    echo "   Run later: gh auth login"
    print_github_variables_manual_instructions
    return 0
  fi

  set +e

  gh variable set AWS_REGION --repo "$GITHUB_REPOSITORY" --body "$AWS_REGION"
  rc_region=$?

  gh variable set AWS_GITHUB_ACTIONS_ROLE_ARN --repo "$GITHUB_REPOSITORY" --body "$GITHUB_ACTIONS_ROLE_ARN"
  rc_role=$?

  gh variable set TF_STATE_BUCKET --repo "$GITHUB_REPOSITORY" --body "$STATE_BUCKET"
  rc_bucket=$?

  gh variable set TF_STATE_LOCK_TABLE --repo "$GITHUB_REPOSITORY" --body "$LOCK_TABLE"
  rc_lock=$?

  gh variable set TF_DEV_STATE_KEY --repo "$GITHUB_REPOSITORY" --body "$DEV_STATE_KEY"
  rc_key=$?

  gh variable set PROJECT_NAME --repo "$GITHUB_REPOSITORY" --body "$PROJECT_NAME"
  rc_project=$?

  gh variable set ENVIRONMENT --repo "$GITHUB_REPOSITORY" --body "$ENVIRONMENT"
  rc_env=$?

  gh variable set ENABLE_CUSTOM_DOMAIN --repo "$GITHUB_REPOSITORY" --body "$ENABLE_CUSTOM_DOMAIN"
  rc_custom_domain=$?

  gh variable set FRONTEND_SUBDOMAIN --repo "$GITHUB_REPOSITORY" --body "$FRONTEND_SUBDOMAIN"
  rc_frontend_subdomain=$?

  rc_root_domain=0
  if [[ -n "${ROOT_DOMAIN_DETECTED:-}" ]]; then
    gh variable set ROOT_DOMAIN --repo "$GITHUB_REPOSITORY" --body "$ROOT_DOMAIN_DETECTED"
    rc_root_domain=$?
  else
    echo "ℹ️ No Route 53 registered domain detected. ROOT_DOMAIN will not be set."
  fi

  set -e

  if [[ "$rc_region" -eq 0 \
    && "$rc_role" -eq 0 \
    && "$rc_bucket" -eq 0 \
    && "$rc_lock" -eq 0 \
    && "$rc_key" -eq 0 \
    && "$rc_project" -eq 0 \
    && "$rc_env" -eq 0 \
    && "$rc_custom_domain" -eq 0 \
    && "$rc_frontend_subdomain" -eq 0 \
    && "$rc_root_domain" -eq 0 ]]; then
    echo "✅ Minimal GitHub repository variables configured."
  else
    echo "ℹ️ Could not configure all GitHub variables automatically."
    print_github_variables_manual_instructions
  fi
}

echo "Checking required tools..."
require_tool git
require_tool aws
require_tool terraform
echo "✅ Required tools found."
echo

echo "Checking AWS identity..."
ACCOUNT_ID="$(aws sts get-caller-identity \
  --query Account \
  --output text \
  --region "$AWS_REGION" 2>/dev/null || true)"

if [[ -z "$ACCOUNT_ID" || "$ACCOUNT_ID" == "None" ]]; then
  echo "❌ Could not detect AWS account."
  echo "Run first:"
  echo "  aws configure"
  echo "or:"
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

[[ -n "$PROJECT_CLEAN" ]] || PROJECT_CLEAN="fitops"
[[ -n "$USER_CLEAN" ]] || USER_CLEAN="user"

ROOT_DOMAIN_DETECTED="$(detect_root_domain)"
FRONTEND_SUBDOMAIN="${FRONTEND_SUBDOMAIN:-$PROJECT_CLEAN}"

if [[ -n "$ROOT_DOMAIN_DETECTED" ]]; then
  ENABLE_CUSTOM_DOMAIN="${ENABLE_CUSTOM_DOMAIN:-true}"
else
  ENABLE_CUSTOM_DOMAIN="${ENABLE_CUSTOM_DOMAIN:-false}"
fi

STATE_BUCKET="${PROJECT_CLEAN}-${USER_CLEAN}-tfstate-${ACCOUNT_ID}-${AWS_REGION}"
LOCK_TABLE="${PROJECT_CLEAN}-${USER_CLEAN}-terraform-locks"

DEV_STATE_KEY="tfstate/${PROJECT_CLEAN}/${USER_CLEAN}/${ENVIRONMENT}/terraform.tfstate"
BOOTSTRAP_STATE_KEY="tfstate/${PROJECT_CLEAN}/${USER_CLEAN}/bootstrap/terraform.tfstate"

EXISTING_GITHUB_OIDC_PROVIDER_ARN="${GITHUB_OIDC_PROVIDER_ARN:-$(detect_existing_github_oidc_provider_arn)}"

if [[ -n "$EXISTING_GITHUB_OIDC_PROVIDER_ARN" ]]; then
  GITHUB_OIDC_PROVIDER_VALUE="\"$EXISTING_GITHUB_OIDC_PROVIDER_ARN\""
else
  GITHUB_OIDC_PROVIDER_VALUE="null"
fi

echo "Project:      $PROJECT_NAME"
echo "Environment:  $ENVIRONMENT"
echo "AWS region:   $AWS_REGION"
echo "AWS account:  $ACCOUNT_ID"
echo "GitHub repo:  $GITHUB_REPOSITORY"
echo
echo "Optional custom domain:"
echo "  Enabled:           $ENABLE_CUSTOM_DOMAIN"
echo "  Root domain:       ${ROOT_DOMAIN_DETECTED:-none}"
echo "  Frontend prefix:   $FRONTEND_SUBDOMAIN"
echo
echo "Terraform backend:"
echo "  S3 bucket:        $STATE_BUCKET"
echo "  DynamoDB lock:    $LOCK_TABLE"
echo "  Dev state key:    $DEV_STATE_KEY"
echo "  Bootstrap key:    $BOOTSTRAP_STATE_KEY"
echo

create_or_update_backend_bucket
create_or_update_lock_table

write_backend_tf "$DEV_BACKEND_FILE" "$DEV_STATE_KEY"
write_backend_tf "$BOOTSTRAP_BACKEND_FILE" "$BOOTSTRAP_STATE_KEY"

write_dev_tfvars
write_bootstrap_tfvars

run_bootstrap_terraform
configure_github_variables_if_possible

echo
echo "============================================================"
echo "✅ Bootstrap completed"
echo "============================================================"
echo
echo "Next step:"
echo "  Commit and push, then run the first GitHub Action to provision dev."
echo
