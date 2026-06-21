# FitOps

FitOps is an AWS-native, serverless fitness tracking app for long-term body progress.

Users can track weight, body measurements, progress photos, and AI coaching insights through a secure cloud backend.

## Highlights
- React/Vite frontend
- S3 + CloudFront static hosting
- Cognito authentication
- API Gateway HTTP API
- Serverless Lambda backend
- DynamoDB data storage
- Private S3 bucket for progress photos
- Amazon Bedrock AI coach through Lambda only
- Terraform Infrastructure as Code
- GitHub Actions CI/CD with AWS OIDC
- No long-running backend servers

## Architecture
```txt
User → CloudFront → S3 static frontend → API Gateway HTTP API → Lambda functions → DynamoDB / private S3 / Amazon Bedrock
```
FitOps uses a serverless architecture. The frontend is a static React app served from S3 through CloudFront. Backend logic runs in Lambda functions behind API Gateway. There are no EC2 servers, no containers, and no always-running backend process.

Cognito Hosted UI handles authentication. Protected API routes use Cognito JWT authorizers. The frontend never talks directly to DynamoDB, private S3 data, or Bedrock.

## Main AWS Resources
| Layer | Service |
|---|---|
| Frontend | S3 + CloudFront |
| Auth | Cognito User Pool + Hosted UI |
| API | API Gateway HTTP API |
| Backend | AWS Lambda |
| Database | DynamoDB |
| Photos | Private S3 bucket |
| AI | Amazon Bedrock via Lambda |
| CI/CD | GitHub Actions OIDC |
| IaC | Terraform |

## Repository Structure
```txt
.
├── frontend/                  # React/Vite app
├── backend/functions/         # Lambda function source code
├── infra/terraform/           # Terraform infrastructure
├── scripts/                   # Bootstrap and helper scripts
└── .github/workflows/         # CI/CD pipelines
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
The bootstrap script prepares the deployment foundation for the project.
```bash
./scripts/bootstrap-aws.sh
```
`bootstrap-aws.sh` runs before the normal Terraform environment deployment. It prepares shared bootstrap resources that Terraform and GitHub Actions need in order to work safely.

It creates or configures:
- S3 bucket for remote Terraform state
- DynamoDB table for Terraform state locking
- GitHub Actions OIDC provider or integration
- IAM role for GitHub Actions deployments
- GitHub repository variables required by the workflows

The goal of the bootstrap step is to avoid static AWS keys in GitHub Secrets. GitHub Actions authenticates to AWS using OIDC and assumes a dedicated IAM role.

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

## Deployment Flow
FitOps is deployed through GitHub Actions.
```txt
Push to main → GitHub Actions → AWS OIDC → Terraform when needed → Frontend build → S3 upload → CloudFront invalidation
```
There is no local frontend deployment script in the current setup. Local development is for testing and building. Real deployment is handled by CI/CD.

## Manual Full Deployment
Use GitHub Actions:
```txt
Actions → Build Start → Run workflow
```
`build_start.yml` performs AWS OIDC authentication, Terraform init/validate/plan/apply, frontend build, upload to S3, CloudFront invalidation, and basic smoke tests.

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
cat > .env.local <<'EOF_ENV'
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_APP_CLIENT_ID=your-app-client-id
VITE_COGNITO_HOSTED_UI_BASE_URL=https://your-domain.auth.us-east-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:5173
EOF_ENV
```
Run locally:
```bash
npm run dev
npm run build
```

## Lambda Backend
Backend code lives under `backend/functions/`.

Each function is packaged and deployed as an AWS Lambda function through Terraform.

The application uses Lambda for health checks, user identity, profile operations, weight logs, measurements, progress photo upload flow, AI recommendations, and AI chat conversations.

Lambda functions are invoked by API Gateway routes. They receive authenticated user context from Cognito JWT claims and use that identity when reading or writing user data.

## Terraform Commands
```bash
terraform -chdir=infra/terraform/environments/dev fmt -recursive ../../
terraform -chdir=infra/terraform/environments/dev init
terraform -chdir=infra/terraform/environments/dev validate
terraform -chdir=infra/terraform/environments/dev plan
terraform -chdir=infra/terraform/environments/dev apply
```

## Terraform State Lock Troubleshooting
```bash
ps aux | grep '[t]erraform'
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
FitOps was migrated from a Base44-generated frontend into an AWS-native serverless architecture.

Some visual assets may still reference Base44-hosted image URLs as static design assets only. Base44 is not used as the backend, auth provider, data layer, or AI provider.

## License
Personal portfolio / learning project.
