# FitOps — Architecture & Separation of Concerns

## TL;DR

| Folder | Runs where | Goes to S3? | Phase 2 destination |
|--------|-----------|-------------|---------------------|
| `src/pages/` | Browser | ✅ Yes (compiled) | S3 + CloudFront |
| `src/components/` | Browser | ✅ Yes (compiled) | S3 + CloudFront |
| `src/api/` | Browser | ✅ Yes (compiled) | S3 + CloudFront |
| `src/lib/` | Browser | ✅ Yes (compiled) | S3 + CloudFront |
| `src/hooks/` | Browser | ✅ Yes (compiled) | S3 + CloudFront |
| `backend/functions/` | Node.js only | ❌ Never | AWS Lambda |
| `backend/models/` | Reference only | ❌ Never | CloudFormation / CDK |
| `backend/serverless.yml` | CLI only | ❌ Never | Serverless Framework deploy |

---

## What goes to S3 after `npm run build`

```
npm run build
    ↓
dist/
  index.html          ← SPA entry point
  assets/
    index-[hash].js   ← All React pages + components + api/ clients bundled
    index-[hash].css  ← All styles
```

`backend/functions/` is **never imported** by any React file, so Vite never
touches it. It does NOT appear in `dist/`. Safe to ignore.

Upload to S3:
```bash
aws s3 sync dist/ s3://fitops-frontend --delete
aws cloudfront create-invalidation --distribution-id XXXX --paths "/*"
```

---

## Folder Roles

### `src/pages/` — React page components (FRONTEND)
Route-level visual pages. Pure UI. No business logic.

### `src/components/` — Reusable UI components (FRONTEND)
UI building blocks. No direct DB access.

### `src/api/` — Frontend API clients (FRONTEND)
**The bridge between the UI and data.**

| File | What it calls today | What it will call in Phase 2 |
|------|--------------------|-----------------------------|
| `userApi.js` | Base44 SDK | `GET/PUT /users/{id}/profile` |
| `progressApi.js` | Base44 SDK | `GET/POST/DELETE /users/{id}/weight\|measurements\|photos` |
| `aiApi.js` | Base44 SDK (stub) | `GET/POST /users/{id}/insights` |

These are the **only** files that touch data. Pages import from here.
In Phase 2, swap the internals — the function signatures stay identical.

### `src/lib/` — Frontend utilities (FRONTEND)
Auth context, hooks (`useCurrentUser`), utility functions.

### `backend/functions/` — AWS Lambda handlers (BACKEND ONLY)
Node.js CommonJS. Never imported by React. Deploy with Serverless Framework:
```bash
cd backend
npm install
npx serverless deploy --stage prod
```

### `backend/models/` — DynamoDB table definitions (BACKEND ONLY)
CloudFormation YAML. Used by `serverless.yml` to provision DynamoDB tables.

---

## How Frontend talks to Backend (Phase 2)

```
Browser (S3 + CloudFront)
    │
    │  HTTPS  (fetch / axios)
    ▼
API Gateway  (AWS)
    │
    ▼
Lambda functions  (backend/functions/)
    │
    ▼
DynamoDB  (tables defined in backend/models/)
```

Frontend never talks to DynamoDB directly.
Frontend never runs Node.js code.
The only communication is HTTP via API Gateway.

---

## Phase 2 Migration Steps

1. `cd backend && npx serverless deploy --stage prod`
   → Note the API Gateway base URL output (e.g. `https://xxx.execute-api.us-east-1.amazonaws.com/prod`)

2. Create `.env.production` in project root:
   ```
   VITE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod
   ```

3. In each `src/api/*.js` file, replace Base44 SDK calls with `fetch()`:
   ```js
   // Before (Phase 1)
   return base44.entities.UserProfile.filter({ userId });

   // After (Phase 2)
   const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/profile`);
   return res.json();
   ```

4. `npm run build` → `aws s3 sync dist/ s3://fitops-frontend --delete`

5. Auth: wire AWS Cognito JWT tokens into the `Authorization` header of each fetch call.