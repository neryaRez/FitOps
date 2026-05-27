#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# FitOps Terraform Backend Bootstrap
# ============================================================
# Creates automatically:
#   - S3 bucket for Terraform tfstate
#   - DynamoDB table for Terraform state locking
#
# Defaults:
#   PROJECT_NAME = fitops
#   AWS_REGION   = us-east-1
#
# Usage:
#   chmod +x scripts/bootstrap-aws.sh
#   ./scripts/bootstrap-aws.sh
#
# Optional override:
#   PROJECT_NAME=my-project AWS_REGION=eu-west-1 ./scripts/bootstrap-aws.sh
# ============================================================

PROJECT_NAME="${PROJECT_NAME:-fitops}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
ENVIRONMENT="${ENVIRONMENT:-dev}"

echo
echo "🚀 Starting Terraform backend bootstrap..."
echo

command -v aws >/dev/null 2>&1 || {
  echo "❌ AWS CLI is not installed or not found in PATH."
  exit 1
}

# ------------------------------------------------------------
# Verify AWS login
# ------------------------------------------------------------
ACCOUNT_ID="$(aws sts get-caller-identity \
  --query Account \
  --output text \
  --region "$AWS_REGION")"

if [[ -z "$ACCOUNT_ID" || "$ACCOUNT_ID" == "None" ]]; then
  echo "❌ Could not detect AWS account."
  echo "Run one of these first:"
  echo "  aws configure"
  echo "  aws sso login"
  exit 1
fi

# ------------------------------------------------------------
# Detect username automatically
# ------------------------------------------------------------
RAW_USERNAME="${USER:-${USERNAME:-user}}"

clean_name() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9-]/-/g' \
    | sed 's/--*/-/g' \
    | sed 's/^-//' \
    | sed 's/-$//'
}

PROJECT_CLEAN="$(clean_name "$PROJECT_NAME")"
USERNAME_CLEAN="$(clean_name "$RAW_USERNAME")"

if [[ -z "$PROJECT_CLEAN" ]]; then
  PROJECT_CLEAN="fitops"
fi

if [[ -z "$USERNAME_CLEAN" ]]; then
  USERNAME_CLEAN="user"
fi

# ------------------------------------------------------------
# Generic names
# ------------------------------------------------------------
STATE_BUCKET="${PROJECT_CLEAN}-${USERNAME_CLEAN}-tfstate-${ACCOUNT_ID}-${AWS_REGION}"
LOCK_TABLE="${PROJECT_CLEAN}-${USERNAME_CLEAN}-terraform-locks"
STATE_KEY="tfstate/${PROJECT_CLEAN}/${USERNAME_CLEAN}/${ENVIRONMENT}/terraform.tfstate"

echo "Project:      $PROJECT_CLEAN"
echo "User:         $USERNAME_CLEAN"
echo "Environment:  $ENVIRONMENT"
echo "Region:       $AWS_REGION"
echo "Account ID:   $ACCOUNT_ID"
echo
echo "S3 bucket:     $STATE_BUCKET"
echo "DynamoDB lock: $LOCK_TABLE"
echo "State key:     $STATE_KEY"
echo

# ------------------------------------------------------------
# Create S3 bucket if needed
# ------------------------------------------------------------
if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
  echo "✅ S3 bucket already exists: $STATE_BUCKET"
else
  echo "📦 Creating S3 bucket: $STATE_BUCKET"

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

  echo "✅ S3 bucket created."
fi

# ------------------------------------------------------------
# Secure S3 bucket
# ------------------------------------------------------------
echo "🔒 Securing S3 bucket..."

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

cat > /tmp/tf-backend-bucket-policy.json <<EOF
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
  --policy file:///tmp/tf-backend-bucket-policy.json

echo "✅ S3 bucket security configured."

# ------------------------------------------------------------
# Create DynamoDB lock table if needed
# ------------------------------------------------------------
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

# ------------------------------------------------------------
# Generate backend.tf automatically
# ------------------------------------------------------------
BACKEND_DIR="infra/terraform/environments/${ENVIRONMENT}"
BACKEND_FILE="${BACKEND_DIR}/backend.tf"

mkdir -p "$BACKEND_DIR"

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
echo "============================================================"
echo "✅ Bootstrap completed successfully"
echo "============================================================"
echo
echo "Generated Terraform backend file:"
echo "  $BACKEND_FILE"
echo
echo "Content:"
echo
cat "$BACKEND_FILE"
echo
echo "Next step:"
echo "  cd infra/terraform/environments/${ENVIRONMENT}"
echo "  terraform init"
echo