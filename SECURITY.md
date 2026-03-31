# Security Model

## Authentication
- All protected endpoints require a signed JWT (`Authorization: Bearer <token>`)
- Tokens issued by `POST /api/v1/auth/token`, expire in 1 hour
- Algorithm: HS256, issuer claim: `hijack-poker`
- Player ID is read from `token.sub` — client-supplied headers are ignored

## Identity & IDOR Protection
- Every player route binds identity from the JWT payload, not URL params or headers
- Players cannot access another player's rewards, history, or notifications
- `POST /api/v1/points/award` requires `body.playerId` to match the authenticated `sub` claim
- Admin routes require `isAdmin: true` claim in the JWT — separate middleware enforces this

## Input Validation
- All request bodies and params validated with `express-validator` before hitting any DB
- DynamoDB writes use explicit field destructuring — `req.body` is never spread directly
- Idempotency key (`handId`) prevents replaying hand events to farm points

## Rate Limiting
| Endpoint | Window | Limit |
|---|---|---|
| All routes | 15 min | 200 req |
| `POST /auth/token` | 15 min | 10 req |
| `POST /points/award` | 1 min | 30 req |

## Security Headers (via Helmet)
- `Content-Security-Policy` — restricts script/style/connect sources
- `Strict-Transport-Security` — 1 year HSTS
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection`
- CORS restricted to explicit `ALLOWED_ORIGINS` env variable (no wildcards)

## Data Handling
- Player IDs truncated in all logs (`pid.substring(0, 8) + '...'`)
- JWT tokens never logged
- Internal fields (`tierFloor`, `lastTierChangeAt`) stripped from all client-facing responses
- `express.json({ limit: '10kb' })` prevents oversized payload attacks

## Audit Log
Structured JSON logs on finish for sensitive actions, including: `auth`, `get_rewards`, `points_award`, `admin_get_player`, `admin_adjust_points`, `admin_leaderboard`.

## Out of Scope (acknowledged)
- `JWT_SECRET` must be rotated via environment variable in production (never use the dev default)
- In production, replace DynamoDB Local with AWS DynamoDB + IAM roles (no hardcoded credentials)
- Add HTTPS termination at the load balancer / API Gateway layer
