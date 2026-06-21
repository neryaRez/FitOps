# FitOps

FitOps is an AWS-native, serverless fitness tracking app for long-term body progress.

Users can track weight, body measurements, progress photos, and AI coaching insights through a secure cloud backend.

## Live Deployment

Default deployment uses the CloudFront distribution URL.

Optional custom domain deployment:

```txt
https://fitops.<your-root-domain>
```

Example:

```txt
https://fitops.nerya.dev
```

Custom domain support is optional. A tester or reviewer without a domain can deploy and use the app normally through CloudFront.

## Highlights

- React/Vite frontend
- S3 + CloudFront static hosting
- Optional Route 53 custom domain
- Optional ACM certificate for HTTPS custom domain
- Cognito authentication
- API Gateway HTTP API
- Serverless Lambda backend
- DynamoDB data storage
- Private S3 bucket for progress photos
- Amazon Bedrock AI coach through Lambda only
- Terraform Infrastructure as Code
- GitHub Actions CI/CD with AWS OIDC
- No long-running backend servers
- No static AWS keys in GitHub Secrets

## Architecture

```txt
User
  ↓
Route 53 custom domain, optional
  ↓
CloudFront
  ↓
S3 static React frontend
  ↓
API Gateway HTTP API
  ↓
Lambda functions
  ↓
DynamoDB / private S3 / Amazon Bedrock
```

Without a custom domain, users access the app directly through CloudFront. With a custom domain enabled, Route 53 points the domain to CloudFront and ACM provides the TLS certificate.

Cognito Hosted UI handles authentication. Protected API routes use Cognito JWT authorizers. The frontend never talks directly to DynamoDB, private S3 data, or Bedrock.

## Main AWS Resources

| Layer | Service |
|---|---|
| Frontend | S3 + CloudFront |
| Optional DNS | Route 53 |
| Optional HTTPS certificate | ACM |
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
├── frontend/
├── backend/functions/
├── infra/terraform/
├── scripts/
└── .github/workflows/
```

## Prerequisites

Install AWS CLI v2, Terraform, Node.js 22+, npm, and optionally GitHub CLI.

## Bootstrap

Authenticate to AWS, then run bootstrap once:

```bash
aws sts get-caller-identity
./scripts/bootstrap-aws.sh
```

The bootstrap step creates or configures remote Terraform state, state locking, GitHub Actions OIDC, the deployment IAM role, required GitHub repository variables, and optional custom domain variables when a Route 53 domain is detected.

The goal is to avoid static AWS keys in GitHub Secrets. GitHub Actions authenticates to AWS using OIDC and assumes a dedicated IAM role.

Optional overrides:

```bash
PROJECT_NAME=fitops ENVIRONMENT=dev AWS_REGION=us-east-1 ./scripts/bootstrap-aws.sh
```

## GitHub Repository Variables

Required:

```txt
AWS_REGION
AWS_GITHUB_ACTIONS_ROLE_ARN
TF_STATE_BUCKET
TF_STATE_LOCK_TABLE
TF_DEV_STATE_KEY
PROJECT_NAME
ENVIRONMENT
```

Optional custom domain variables:

```txt
ENABLE_CUSTOM_DOMAIN
ROOT_DOMAIN
FRONTEND_SUBDOMAIN
```

Example:

```txt
ENABLE_CUSTOM_DOMAIN=true
ROOT_DOMAIN=nerya.dev
FRONTEND_SUBDOMAIN=fitops
```

If these variables are missing or disabled, the app runs normally using the CloudFront URL.

## Optional Custom Domain Provisioning

Custom domain provisioning is handled by a dedicated workflow:

```txt
Actions → Provision Optional Domain → Run workflow
```

Workflow file:

```txt
.github/workflows/provision_domain.yml
```

The workflow authenticates with AWS OIDC, validates the Route 53 hosted zone, runs Terraform, provisions ACM DNS validation, configures the CloudFront alias, creates Route 53 A/AAAA records, updates Cognito callback/logout URLs, updates CORS, rebuilds the frontend with the custom domain URL, uploads to S3, invalidates CloudFront, and runs smoke tests.

If custom domain support is disabled or no root domain is configured, the workflow exits safely without provisioning domain resources.

## Terraform DNS Modules

Custom domain support is implemented through optional Terraform modules:

```txt
infra/terraform/modules/dns/acm-certificate
infra/terraform/modules/dns/cloudfront-alias
```

These modules are controlled by feature flags and do not create resources when custom domain support is disabled.

## Deployment Flow

```txt
Push to main
  ↓
GitHub Actions
  ↓
AWS OIDC authentication
  ↓
Terraform when needed
  ↓
Frontend build
  ↓
S3 upload
  ↓
CloudFront invalidation
```

Manual full deployment:

```txt
Actions → Build Start → Run workflow
```

Automatic updates:

```txt
update.yml runs on push to main
```

`update.yml` handles frontend deploys, backend Lambda-related Terraform changes, and infrastructure changes when relevant. Frontend-only changes do not run `terraform apply`.

Custom domain provisioning is intentionally handled by `provision_domain.yml` so domain setup remains optional and explicit.

## Local Frontend Development

```bash
cd frontend
npm install

cat > .env.local <<'EOF_ENV'
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_APP_CLIENT_ID=your-app-client-id
VITE_COGNITO_HOSTED_UI_BASE_URL=https://your-domain.auth.us-east-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:5173
EOF_ENV

npm run dev
npm run build
```

## Lambda Backend

Backend code lives under `backend/functions/`.

Each function is packaged and deployed as an AWS Lambda function through Terraform. Lambda functions are invoked by API Gateway routes and receive authenticated user context from Cognito JWT claims.

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

Public route: `GET /health`.

Protected routes include `/me`, `/profile`, `/weight`, `/measurements`, `/photos`, `/ai/recommendation`, and `/ai/chat/conversations`. All protected routes require Cognito JWT authentication.

## Security Model

- No AWS access keys in GitHub Secrets
- GitHub Actions uses OIDC
- Frontend contains no backend secrets
- Frontend does not access DynamoDB, private S3 data, or Bedrock directly
- API Gateway validates Cognito JWTs
- Lambda derives user identity from JWT claims
- User data is partitioned by authenticated user ID
- Progress photos are stored in a private S3 bucket
- Uploads use backend-controlled signed URLs
- Terraform state is encrypted in S3 and protected by locking
- Custom domain HTTPS is handled through ACM and CloudFront
- Route 53 records are managed by Terraform when enabled

## Migration Note

FitOps was migrated from a Base44-generated frontend into an AWS-native serverless architecture. Base44 is not used as the backend, auth provider, data layer, or AI provider.

## License

Personal portfolio / learning project.