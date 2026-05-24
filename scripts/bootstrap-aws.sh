#!/usr/bin/env bash
set -euo pipefail

# FitOps AWS Bootstrap
#
# Purpose:
#   Prepare one-time AWS prerequisites required before GitHub Actions
#   can deploy infrastructure securely.
#
# Responsibilities:
#   - Create Terraform remote state S3 bucket
#   - Create Terraform lock DynamoDB table
#   - Optionally create/use a KMS key for Terraform state encryption
#   - Create GitHub Actions OIDC provider/role
#   - Generate Terraform backend configuration if needed
#
# Important:
#   This script is NOT the normal deployment path.
#   Regular infrastructure deployment should run through GitHub Actions.

PROJECT="${PROJECT:-fitops}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: aws CLI is not installed or not in PATH."
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

echo "FitOps AWS Bootstrap"
echo "--------------------"
echo "Project:      $PROJECT"
echo "Environment:  $ENVIRONMENT"
echo "AWS Region:   $AWS_REGION"
echo "Account ID:   $ACCOUNT_ID"
echo
echo "Bootstrap implementation will be added next:"
echo "- Terraform remote state"
echo "- DynamoDB state locking"
echo "- GitHub Actions OIDC role"
