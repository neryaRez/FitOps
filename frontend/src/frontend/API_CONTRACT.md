# FitOps Frontend — API Contract

This document defines the HTTP API that the frontend expects from the backend.
**Phase 1:** services/ files call the Base44 SDK directly.  
**Phase 2:** swap each service file's internals to call `VITE_API_BASE_URL` endpoints below.

## Base URL
```
VITE_API_BASE_URL=https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```
Set this in `.env.production` before building the S3/CloudFront bundle.

---

## Endpoints

### User Profile
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/users/{userId}/profile` | Fetch profile |
| PUT    | `/users/{userId}/profile` | Create or update profile |

### Weight Logs
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/users/{userId}/weight` | List all weight logs |
| POST   | `/users/{userId}/weight` | Add a weight log `{ date, weightKg }` |
| DELETE | `/users/{userId}/weight/{logId}` | Delete a log |

### Body Measurements
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/users/{userId}/measurements` | List all measurement logs |
| POST   | `/users/{userId}/measurements` | Add `{ date, neck, chest, waist, … }` |
| DELETE | `/users/{userId}/measurements/{logId}` | Delete a log |

### Progress Photos
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/users/{userId}/photos` | List all photos |
| POST   | `/users/{userId}/photos` | Upload `{ date, angle, fileBase64, mimeType }` |
| DELETE | `/users/{userId}/photos/{photoId}` | Delete a photo |

### AI Insights
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/users/{userId}/insights` | Get latest recommendation |
| POST   | `/users/{userId}/insights/generate` | Trigger analysis `{ profile, weightLogs, measurementLogs }` |

---

## Migration Checklist (Phase 2)

- [ ] Deploy `backend/` with `serverless deploy --stage prod`
- [ ] Note the API Gateway base URL output
- [ ] Set `VITE_API_BASE_URL` in `frontend/.env.production`
- [ ] In each `services/*.js` file, replace `base44.entities.*` calls with `fetch(API_BASE + '/users/...')`
- [ ] Build: `npm run build` → upload `dist/` to S3
- [ ] Create CloudFront distribution pointing to S3 bucket
- [ ] Set `index.html` as both origin and error document (for React Router SPA)
- [ ] Add Cognito User Pool → wire JWT authorizer in `serverless.yml