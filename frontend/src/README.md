# FitOps

Body tracking app with AI insights. Built on Base44 (Phase 1), designed for AWS migration (Phase 2).

---

## Project Structure

```
fitops/
│
├── ── FRONTEND (visual pages & components) ──────────────────────────────────
│   ├── pages/                    ← Route-level page components (Landing, Dashboard, Progress, Insights, Settings, Onboarding)
│   ├── components/               ← Reusable UI components
│   │   ├── layout/               ← AppLayout (nav shell)
│   │   ├── dashboard/            ← Dashboard widgets (AIInsightsCard, QuickLogWeight)
│   │   ├── progress/             ← Progress panels (WeightChart, MeasurementsPanel, PhotosPanel)
│   │   └── ui/                   ← shadcn/ui primitives
│   ├── lib/                      ← Auth context, hooks (useCurrentUser), utils
│   ├── api/                      ← base44Client (Phase 2: swap to axios → API Gateway)
│   ├── App.jsx                   ← Router
│   └── entities/                 ← DB schemas (mirrors DynamoDB table shapes)
│
├── ── BACKEND (logic & data) ────────────────────────────────────────────────
│   └── backend/
│       ├── services/             ← Data access layer (imports used by frontend pages)
│       │   ├── userService.js    → /users/{id}/profile
│       │   ├── progressService.js→ /users/{id}/weight|measurements|photos
│       │   └── aiService.js      → /users/{id}/insights
│       ├── functions/            ← AWS Lambda handlers (deploy to serverless)
│       │   ├── users/handler.js  ← Lambda: profile CRUD → DynamoDB
│       │   ├── progress/handler.js← Lambda: weight/measurements/photos → DynamoDB + S3
│       │   └── ai/handler.js     ← Lambda: AI insights → DynamoDB (Phase 2: Bedrock)
│       ├── models/
│       │   └── dynamodb-tables.yml← CloudFormation DynamoDB table definitions
│       ├── serverless.yml        ← Serverless Framework config (API Gateway + Lambda)
│       └── package.json
│
└── frontend/
    └── API_CONTRACT.md           ← HTTP API contract + migration checklist
```

---

## Phase 1 — Base44 (current)

- Frontend: React SPA served by Base44
- Backend: Base44 SDK (entities = hosted DB)
- Run: managed by Base44 platform

## Phase 2 — AWS Migration

### Backend → AWS Lambda + API Gateway + DynamoDB

```bash
cd backend
npm install
npx serverless deploy --stage prod
# → outputs API Gateway URL
```

### Frontend → S3 + CloudFront

```bash
# Set the API Gateway URL
echo "VITE_API_BASE_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod" > .env.production

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://fitops-frontend --delete

# CloudFront invalidation
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

### Swap services (one file at a time)

Each file in `src/services/` has a clear 1:1 mapping to a Lambda handler in `backend/functions/`.
Replace the `base44.entities.*` calls with `fetch(import.meta.env.VITE_API_BASE_URL + '/users/...')`.

See `frontend/API_CONTRACT.md` for full migration checklist.

---

## Auth

- Phase 1: Base44 auth (email/Google)
- Phase 2: AWS Cognito User Pool → JWT authorizer on API Gateway