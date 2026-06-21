# FitOps

FitOps is an AWS-native fitness tracking app for long-term body progress.

Users can track weight, body measurements, progress photos, and AI coaching insights through a secure cloud backend.

## Highlights

- React/Vite frontend
- S3 + CloudFront hosting
- Cognito authentication
- API Gateway HTTP API
- Lambda backend
- DynamoDB data storage
- Private S3 bucket for progress photos
- Amazon Bedrock AI coach through Lambda only
- Terraform Infrastructure as Code
- GitHub Actions CI/CD with AWS OIDC

## Architecture

```txt
User → CloudFront → S3 static frontend → API Gateway → Lambda → DynamoDB / private S3 / Bedrock
```

Cognito Hosted UI handles authentication. Protected API routes use Cognito JWT authorizers. The frontend never talks directly to DynamoDB, private S3 data, or Bedrock.

## Main AWS Resources

| Layer | Service |
|---|---|
| Frontend | S3 + CloudFront |
| Auth | Cognito User Pool + Hosted UI |
| API | API Gateway HTTP API |
| Backend | Lambda |
| Database | DynamoDB |
| Photos | Private S3 bucket |
| AI | Amazon Bedrock via Lambda |
| CI/CD | GitHub Actions OIDC |
| IaC | Terraform |

## Repository Structure

```txt
.
├── frontend/
├── backend/functions/
├── infra/terraform/
├── scripts/
└── .github/workflows/
```

## Prerequisites

Install AWS CLI v2, Terraform `>= 1.6`, Node.js 22+, npm, and optionally GitHub CLI.

```bash
aws --version
terraform -version
node -v
npm -v
gh --version
```

## AWS Authentication

```bash
aws configure
# or
aws sso login

aws sts get-caller-identity
```

## Bootstrap

The bootstrap script prepares the Terraform backend and GitHub Actions OIDC role.

It creates/configures S3 state, DynamoDB locking, the GitHub Actions IAM role, and minimal repository variables.

```bash
./scripts/bootstrap-aws.sh
```

Optional overrides:

```bash
PROJECT_NAME=fitops ENVIRONMENT=dev AWS_REGION=us-east-1 ./scripts/bootstrap-aws.sh
```

## Required GitHub Repository Variables

```txt
AWS_REGION
AWS_GITHUB_ACTIONS_ROLE_ARN
TF_STATE_BUCKET
TF_STATE_LOCK_TABLE
TF_DEV_STATE_KEY
PROJECT_NAME
ENVIRONMENT
```

## Manual Full Deployment

Use GitHub Actions:

```txt
Actions → Build Start → Run workflow
```

`build_start.yml` performs AWS OIDC auth, Terraform apply, frontend build, S3 upload, CloudFront invalidation, and smoke tests.

## Automatic Updates

`update.yml` runs on push to `main`.

```txt
frontend/       → build frontend, upload to S3, invalidate CloudFront
backend/        → Terraform plan/apply for Lambda-related changes
infra/terraform → Terraform fmt/init/validate/plan/apply
```

Frontend-only changes do not run `terraform apply`.

## Local Frontend Development

```bash
cd frontend
npm install
```

Create `.env.local`:

```bash
cat > .env.local <<'EOF'
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_APP_CLIENT_ID=your-app-client-id
VITE_COGNITO_HOSTED_UI_BASE_URL=https://your-domain.auth.us-east-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:5173
EOF
```

Run locally:

```bash
npm run dev
npm run build
```

## Local Frontend Deployment

After Terraform outputs exist:

```bash
./scripts/deploy-frontend.sh
```

This reads Terraform outputs, generates `frontend/.env.production`, builds the app, uploads assets to S3, and invalidates CloudFront.

## Terraform Commands

```bash
terraform -chdir=infra/terraform/environments/dev fmt -recursive ../../
terraform -chdir=infra/terraform/environments/dev init
terraform -chdir=infra/terraform/environments/dev validate
terraform -chdir=infra/terraform/environments/dev plan
terraform -chdir=infra/terraform/environments/dev apply
```

## Terraform State Lock Troubleshooting

If Terraform fails with `Error acquiring the state lock`, check if Terraform is still running:

```bash
ps aux | grep '[t]erraform'
```

If the lock is stale:

```bash
terraform -chdir=infra/terraform/environments/dev force-unlock <LOCK_ID>
```

Do not force-unlock while another Terraform command is actually running.

## API Routes

Public:

```txt
GET /health
```

Protected by Cognito JWT:

```txt
GET  /me
GET  /profile
PUT  /profile
GET  /weight
POST /weight
DELETE /weight/{date}
GET  /measurements
POST /measurements
DELETE /measurements/{date}
GET  /photos
POST /photos/upload-url
POST /photos/complete
DELETE /photos/{photoId}
GET  /ai/recommendation
POST /ai/recommendation/generate
GET  /ai/chat/conversations
POST /ai/chat/conversations
GET  /ai/chat/conversations/{conversationId}
POST /ai/chat/conversations/{conversationId}/messages
```

## Security Model

- No AWS access keys in GitHub Secrets
- GitHub Actions uses OIDC
- Frontend contains no backend secrets
- Frontend does not access DynamoDB directly
- Frontend does not access Bedrock directly
- API Gateway validates Cognito JWTs
- Lambda derives user identity from JWT claims
- User data is partitioned by authenticated user ID
- Progress photos are stored in a private S3 bucket
- Uploads use backend-controlled signed URLs
- Terraform state is encrypted in S3 and protected by locking

## Current Environment

```txt
environment = dev
region      = us-east-1
```

## Migration Note

FitOps was migrated from a Base44-generated frontend into an AWS-native architecture.

Some visual assets may still reference Base44-hosted image URLs as static design assets only. Base44 is not used as the backend, auth provider, data layer, or AI provider.

## License

Personal portfolio / learning project.
