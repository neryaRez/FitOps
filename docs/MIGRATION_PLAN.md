# FitOps Migration Plan — From Base44 Prototype to AWS-Native App

## 1. Big Picture

FitOps started as a Base44-generated application, but the goal is to gradually turn it into a fully owned, production-style AWS project.

The target architecture is:

```text
React/Vite Frontend
    ↓ build
S3 Static Website + CloudFront
    ↓ HTTPS
API Gateway
    ↓
AWS Lambda Backend
    ↓
DynamoDB + S3
    ↓
OpenAI / AI Agent workflow for insights
```

The main idea is not to rewrite everything at once.

The correct approach is to keep the working React application, understand its structure, isolate Base44 dependencies, and replace them gradually with our own AWS backend.

---

## 2. Current State

The current project has several important parts:

### Frontend

The frontend is a React/Vite application.

Main folders:

```text
src/pages/
src/components/
src/lib/
src/api/
src/App.jsx
src/main.jsx
```

These files run in the browser and are bundled by Vite into `dist/` after running:

```bash
npm run build
```

The `dist/` folder is the final static frontend that can later be uploaded to S3 and served through CloudFront.

### Current Data Layer

Right now, the frontend talks to Base44 through SDK calls such as:

```js
base44.entities.UserProfile
base44.entities.WeightLog
base44.entities.MeasurementLog
base44.entities.ProgressPhoto
base44.entities.AIRecommendation
```

These calls are mostly concentrated inside the `src/api/` folder.

This is good, because it means we can replace the internals of the API files without rewriting all pages and components.

### Current AI Layer

The project already has an AI concept:

* BMI analysis
* fitness path
* meal guidance
* workout plan
* progress insights

Currently, the frontend AI API uses Base44 `InvokeLLM` / stub logic.

The future goal is to replace this with our own backend flow using OpenAI, probably through Lambda and possibly Step Functions / agent-like orchestration.

### Backend Skeleton

The project already contains an initial backend direction:

```text
backend/functions/
backend/models/
backend/serverless.yml
```

This backend includes Lambda handlers for:

* users
* progress
* AI insights

And model definitions for DynamoDB tables.

This is useful, but we should treat it as a reference or first draft, not as final production infrastructure.

---

## 3. Final Target

The desired final project should be organized clearly:

```text
fitops/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend/
│   ├── functions/
│   │   ├── users/
│   │   ├── progress/
│   │   └── ai/
│   ├── package.json
│   └── README.md
│
├── infra/
│   └── terraform/
│       ├── environments/
│       │   └── dev/
│       ├── modules/
│       │   ├── frontend-s3/
│       │   ├── api-gateway/
│       │   ├── lambda/
│       │   ├── dynamodb/
│       │   ├── s3-photos/
│       │   └── cognito/
│       └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── MIGRATION_PLAN.md
│   └── SECURITY_NOTES.md
│
└── README.md
```

Important: this is the target structure, not the first action. Moving files too early can break Vite aliases and imports.

---

## 4. Core Principle: Do Not Break the Frontend

The existing frontend should remain working while we migrate.

The safest migration strategy:

1. Keep pages and components mostly unchanged.
2. Keep the public function signatures in `src/api/` unchanged.
3. Replace Base44 calls inside the API files one by one.
4. Test after each replacement.

Example:

Current frontend page calls:

```js
const profile = await getProfile(user.email);
```

This should stay the same.

Only the inside of `getProfile()` should change later.

Before:

```js
return base44.entities.UserProfile.filter({ userId });
```

After:

```js
return fetch(`${API_BASE_URL}/users/${userId}/profile`);
```

This keeps the UI stable while the backend changes underneath.

---

## 5. Migration Phases

## Phase 0 — Audit and Baseline

Goal: understand what exists before changing anything.

Tasks:

* Confirm the project runs locally with `npm install` and `npm run dev`.
* Confirm `npm run build` creates a valid `dist/` folder.
* List all Base44 dependencies.
* List all imports from `@/api/*`.
* Understand which pages depend on which API functions.

Success condition:

The current app builds locally before we touch architecture.

---

## Phase 1 — Documentation and Structure Clarity

Goal: make the project understandable.

Tasks:

* Create/update `docs/MIGRATION_PLAN.md`.
* Create/update `docs/ARCHITECTURE.md`.
* Create/update `docs/API_CONTRACT.md`.
* Create `docs/SECURITY_NOTES.md`.
* Add a top-level README that explains:

  * What the app does
  * Current Base44 state
  * Future AWS target
  * How to run locally
  * How deployment will work later

Success condition:

A new developer can understand the project without guessing what is frontend, backend, infra, Base44, or AWS.

---

## Phase 2 — Frontend Isolation

Goal: prepare the frontend to be deployable as a static website.

Tasks:

* Ensure `npm run build` works.
* Confirm `dist/` contains only static frontend assets.
* Confirm backend code is not imported by frontend code.
* Prepare `.env.example`.
* Prepare `.env.production` pattern for future API URL.

Environment variables:

```text
VITE_API_BASE_URL=https://example.execute-api.region.amazonaws.com/prod
```

Success condition:

The frontend can be built and theoretically uploaded to S3 without backend files leaking into the bundle.

---

## Phase 3 — Minimal AWS Frontend Hosting

Goal: deploy the static frontend first.

Initial simple version:

* S3 bucket for static files
* S3 website hosting or CloudFront origin
* Upload `dist/`

Better production direction:

* Private S3 bucket
* CloudFront distribution
* Origin Access Control
* HTTPS with ACM later
* React Router fallback to `index.html`

Success condition:

The React app loads publicly from AWS, even if it still calls Base44 behind the scenes.

---

## Phase 4 — Minimal Backend API

Goal: create one tiny backend route before migrating everything.

Start with a health route:

```text
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "fitops-api"
}
```

This proves:

* API Gateway works
* Lambda works
* Terraform/serverless deployment works
* Frontend can call the API

Success condition:

Frontend can call `/health` successfully through API Gateway.

---

## Phase 5 — Move User Profile from Base44 to AWS

Goal: migrate the smallest meaningful data flow.

Backend:

```text
GET /users/{userId}/profile
PUT /users/{userId}/profile
```

Database:

```text
DynamoDB table: user_profiles
PK: userId
```

Frontend file to update:

```text
src/api/userApi.js
```

Keep the same exported functions:

```js
getProfile(userId)
createProfile(profileData)
updateProfile(profileId, updates)
upsertProfile(userId, profileData)
```

But change the internals to call API Gateway instead of Base44.

Success condition:

Onboarding/profile data is stored in DynamoDB and loaded back into the app.

---

## Phase 6 — Move Progress Data to AWS

Goal: migrate weight logs, measurements, and photos.

Backend endpoints:

```text
GET    /users/{userId}/weight
POST   /users/{userId}/weight
DELETE /users/{userId}/weight/{logId}

GET    /users/{userId}/measurements
POST   /users/{userId}/measurements
DELETE /users/{userId}/measurements/{logId}

GET    /users/{userId}/photos
POST   /users/{userId}/photos
DELETE /users/{userId}/photos/{photoId}
```

Storage:

* DynamoDB for metadata
* S3 for progress photos

Security direction:

* S3 bucket should not be public
* Use presigned upload/download URLs later
* Restrict CORS to the frontend domain

Success condition:

Weight, measurements, and photos no longer depend on Base44.

---

## Phase 7 — Authentication

Goal: replace Base44 auth with AWS-managed auth.

Target:

* Cognito User Pool
* JWT tokens
* API Gateway JWT authorizer
* Frontend sends token in `Authorization` header

Important security rule:

The backend must not blindly trust `userId` from the URL.

The Lambda should compare:

```text
userId from request path
vs
user identity from JWT claims
```

Success condition:

A user can only access their own profile, progress logs, photos, and AI insights.

---

## Phase 8 — AI Insights with OpenAI

Goal: replace Base44 AI with our own AI backend.

Initial backend flow:

```text
POST /users/{userId}/insights/generate
    ↓
Lambda loads profile + progress data
    ↓
Lambda calls OpenAI
    ↓
Lambda validates/structures response
    ↓
Lambda stores result in DynamoDB
    ↓
GET /users/{userId}/insights returns latest result
```

Future advanced flow:

```text
POST /insights/generate
    ↓
Step Functions
    ↓
Data Collector Lambda
    ↓
AI Agent / OpenAI call
    ↓
Validator Lambda
    ↓
DynamoDB save
    ↓
status: pending → ready
```

AI output should remain structured:

```json
{
  "bmiAnalysis": "...",
  "fitnessPath": "...",
  "mealGuidance": "...",
  "workoutPlan": "...",
  "progressInsights": "..."
}
```

Security requirements:

* OpenAI API key must be stored in SSM Parameter Store or Secrets Manager.
* Never expose the OpenAI API key to the frontend.
* Add input validation.
* Add safe health/fitness disclaimers where needed.
* Avoid pretending to provide medical diagnosis.

Success condition:

AI insights are generated through our backend, saved in DynamoDB, and shown in the frontend.

---

## Phase 9 — Terraform Infrastructure

Goal: manage the AWS infrastructure using Terraform.

Recommended structure:

```text
infra/terraform/
├── environments/
│   └── dev/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── terraform.tfvars.example
│       └── backend.tf
│
└── modules/
    ├── frontend-s3-cloudfront/
    ├── api-gateway/
    ├── lambda/
    ├── dynamodb/
    ├── s3-photos/
    ├── cognito/
    └── iam/
```

Terraform principles:

* Generic naming using project/env/account/region.
* Remote state in S3.
* DynamoDB lock table.
* Least privilege IAM.
* No hardcoded secrets.
* Environment separation.
* Outputs for frontend API URL, CloudFront URL, table names, bucket names.

Success condition:

The full AWS environment can be recreated from Terraform.

---

## Phase 10 — CI/CD

Goal: automate builds and deployments.

Possible future setup:

Frontend:

```text
GitHub Actions
    ↓
npm ci
npm run build
aws s3 sync dist/
cloudfront invalidation
```

Backend:

```text
GitHub Actions
    ↓
package Lambda
terraform plan/apply
```

Security direction:

* GitHub Actions OIDC to AWS
* No AWS keys stored in GitHub secrets
* Separate deploy roles
* Minimal permissions

Success condition:

Push to main can safely deploy frontend/backend through controlled pipelines.

---

## 6. Base44 Dependency Removal Plan

Base44 dependencies should be removed gradually.

### Current Base44 touch points

Likely files:

```text
src/api/base44Client.js
src/api/userApi.js
src/api/progressApi.js
src/api/aiApi.js
src/lib/AuthContext.jsx
src/lib/useCurrentUser.js
vite.config.js
README.md
```

### Removal order

1. Keep Base44 working while AWS skeleton is created.
2. Replace `userApi.js`.
3. Replace `progressApi.js`.
4. Replace `aiApi.js`.
5. Replace auth.
6. Remove `base44Client.js`.
7. Remove Base44 Vite plugin if no longer needed.
8. Clean README and docs.

---

## 7. Security Notes

Security must be part of the architecture from the beginning.

Main rules:

* Frontend never accesses DynamoDB directly.
* Frontend never contains secrets.
* OpenAI API key stays only in backend secret storage.
* S3 photos bucket should be private.
* API Gateway should use JWT authorization.
* Lambda should verify user ownership.
* IAM permissions should be least-privilege.
* CORS should be restricted in production.
* Terraform state should be remote and locked.
* Logs should not expose private user data.

---

## 8. First Practical Checklist

Before writing major code, do this:

```text
[ ] Run npm install
[ ] Run npm run dev
[ ] Run npm run build
[ ] Confirm dist/ exists
[ ] Search all Base44 references
[ ] Search all imports from src/api
[ ] Decide final repo structure
[ ] Create docs folder
[ ] Save this migration plan
[ ] Choose first AWS target: frontend S3 or backend /health
```

Recommended first technical move:

```text
Create a clean docs/ folder and preserve this plan.
Then verify the frontend builds.
Only after that, start Terraform.
```

---

## 9. Working Style

We will work step by step.

No giant code dumps.
No full rewrite before understanding.
No moving folders without checking imports.
No security shortcuts that become permanent.

Each step should have:

```text
Goal
Files touched
Exact change
How to test
Rollback idea
```

That is how this becomes a serious portfolio-grade AWS migration project, not just another generated app.
