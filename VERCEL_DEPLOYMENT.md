# Fleetline Vercel deployment

Last reviewed: 30 October 2026

## Architecture

Fleetline is prepared as a single Vercel project:

- Angular is built as static files from the repository root.
- Express is exported from `api/index.ts` and runs as one Node.js Vercel Function under `/api`.
- A managed PostgreSQL service supplies `DATABASE_URL`.
- Production images use the linked public Vercel Blob store. Local filesystem storage remains development-only.
- The existing CarRentalApp service remains a browser-side external dependency.

This same-origin layout is preferred over a split frontend/backend deployment because `/api` remains on the frontend origin. It avoids third-party refresh cookies and simplifies CORS and CSRF controls. A dedicated Node host remains the fallback if function or database-connection limits become operational constraints.

## Vercel project settings

Import the repository root and use the committed configuration:

| Setting          | Value                    |
| ---------------- | ------------------------ |
| Framework        | Angular                  |
| Root directory   | `.`                      |
| Install command  | `npm ci`                 |
| Build command    | `npm run vercel-build`   |
| Output directory | `dist/fleetline/browser` |
| Node.js          | 24.x                     |

`vercel.json` routes `/api/*` to the single Express function and preserves the original API path before applying the Angular SPA fallback. Requests for files with extensions are not rewritten, so hashed chunks, fonts, SVG files, and other assets remain static.

## Environment variables

Set secrets in Vercel project settings. Never commit their values. Use `.env.production.example` as the inventory.

Required:

- `NODE_ENV=production`
- `DATABASE_URL`
- `DATABASE_SSL_MODE` (`verify-full` is preferred)
- `DATABASE_SSL_CA` when the database provider supplies a private CA
- `JWT_ACCESS_SECRET` (at least 32 random characters)
- `FRONTEND_ORIGIN` (the canonical HTTPS production origin, without a trailing slash)
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=lax`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`
- `IMAGE_STORAGE_DRIVER=vercel-blob` and the Vercel-managed `BLOB_READ_WRITE_TOKEN`

Recommended pool limits for a serverless deployment are included in the example. Keep `COOKIE_DOMAIN` empty for host-only cookies. Vercel injects `VERCEL_URL`; the API accepts that exact origin for preview deployments in addition to `FRONTEND_ORIGIN`.

Do not define `SEED_SUPER_ADMIN_*` in Vercel. Seed scripts are manual bootstrap tools and must never run during a deployment.

## Database

Fleetline uses the free `fleetline-postgres` Neon resource in `iad1`, connected to Production, Preview, and Development. A read-only strict-TLS connection check succeeded. The application supports an optional CA certificate and bounded pool settings.

After creating a database, review the target and explicitly approve migrations before running:

```powershell
$env:DATABASE_URL = '<production-url>'
$env:NODE_ENV = 'production'
$env:DATABASE_SSL_MODE = 'verify-full'
npm.cmd --prefix server run db:migrate
```

The reviewed `001_auth.sql` and `002_bikes.sql` migrations were applied on 30 October 2026. Read-only verification confirmed both migration records and the `users`, `refresh_sessions`, `password_reset_tokens`, and `bikes` tables. Do not run `db:seed` automatically or as part of a Vercel build; no production seed was executed.

## Image storage

The `fleetline-images` public Vercel Blob store is linked in `iad1`. Production uses authenticated client uploads so 5 MB images do not pass through Vercel's 4.5 MB Function request limit. Token issuance requires a valid Fleetline access token, restricts MIME type and size, and binds the pathname to the user. Finalization requires authentication and rechecks Blob ownership, size, content type, and JPEG/PNG/WebP signatures before accepting the URL. Rejected and replaced profile objects are deleted. Local development retains the filesystem driver.

No existing uploaded file is migrated or deleted automatically.

## Authentication and security

- Access JWTs remain in Angular memory.
- Opaque refresh tokens remain in HttpOnly cookies and hashed in PostgreSQL.
- Use `Secure`, host-only, `SameSite=Lax` cookies on the same Vercel origin.
- CORS accepts only `FRONTEND_ORIGIN` and the exact Vercel preview URL.
- Helmet and Vercel response headers provide baseline browser hardening.
- SMTP is mandatory in production so password reset cannot silently discard mail.
- Preview uses a test-only Ethereal SMTP account. Production SMTP remains intentionally unset pending a provider account and an owned, verified sending domain. The Vercel account had no owned domains when checked on 30 October 2026; the available Resend integration cannot be provisioned honestly without one.

Endpoint-specific application limits remain in process memory. A global Vercel Firewall rule named `Fleetline API global rate limit` was published on 30 October 2026 and limits paths beginning with `/api` to 100 requests per 60 seconds per IP, denying excess traffic across all serverless instances.

## External CarRentalApp API

Live checks on 30 October 2026 returned HTTP 200 for `GetCars` and `GetDashboardData`. A browser-style preflight for `CreateNewCar` returned HTTP 204 with `Access-Control-Allow-Origin: *` and allowed `content-type`. This proves availability only at the time tested; the service has no Fleetline-controlled SLA and remains a production dependency and data-integrity risk.

Recommended longer-term work is to move cars, customers, bookings, and dashboard data into Fleetline's managed backend. That integration has not been replaced automatically.

## Verification record

Completed locally on Node.js 24.18.0 and npm 12.0.1:

- `npm ci`: passed
- `npm --prefix server ci`: passed
- `npm run build`: passed
- Angular output: `dist/fleetline/browser`
- `npm --prefix server run build`: passed
- Frontend unit tests: 3 files, 5 tests passed
- Backend tests: 1 file, 11 tests passed
- Playwright: 10 passed, 1 intentionally skipped, and 1 transient desktop failure that passed on immediate isolated rerun
- Frontend and backend `npm audit`: zero known vulnerabilities after installing the Blob SDK
- Neon strict-TLS connectivity: passed; zero application tables before migrations
- `vercel build` for Preview: passed; Angular output, Express Function bundle, API rewrites, SPA fallback, and missing-asset routing generated successfully
- Preview homepage and `/dashboard` deep-link fallback: passed
- Preview `/api/health`: passed
- Preview registration, login, authenticated profile, refresh rotation, bikes authorization, and logout: passed
- Preview password-reset SMTP submission: passed
- Vercel Blob generated-image upload, ownership/signature validation, and deletion: passed
- Missing static asset served the dedicated 404 document rather than Angular HTML: passed
- External read endpoints and write preflight: passed as described above

The disposable verification accounts, sessions, and reset records were deleted after testing. Browser-based verification of every business screen and a real production mailbox remain pending.

## Preview deployment

The CLI is available as Vercel CLI 65.8.0 and is authenticated as `sachuprakashk-4789`. The `fleetline` project, `fleetline-images` Blob store, and `fleetline-postgres` Neon resource were created and linked on 30 October 2026.

Verified Preview URL:

`https://fleetline-ennc0i3k9-sachuprakashk-4789s-projects.vercel.app`

The canonical Production alias is `https://fleetline-rental-management.vercel.app`, and `FRONTEND_ORIGIN` is configured to match it. The first plain `vercel deploy` was unexpectedly assigned to Vercel's Production target because it was the project's first deployment, despite not using `--prod`. Production SMTP remains unset, so the API intentionally fails its startup validation and the alias must not yet be treated as operational.

For another Preview deployment:

```powershell
npm.cmd exec --yes --package=vercel@latest -- vercel link --project fleetline
npm.cmd exec --yes --package=vercel@latest -- vercel env pull .env.vercel.local
npm.cmd exec --yes --package=vercel@latest -- vercel deploy
```

Do not add `.env.vercel.local` to Git. Verify `/api/health`, deep-link refreshes, authentication rotation, roles, CRUD flows, image upload/delete, email reset, and browser console/network errors before requesting production approval.

## Production and rollback

Production deployment was explicitly approved on 30 October 2026, but the release remains blocked until a real production SMTP sender is configured and verified. Once that prerequisite is satisfied:

```powershell
npm.cmd exec --yes --package=vercel@latest -- vercel deploy --prod
```

For application rollback, use Vercel's deployment history to promote the last verified deployment. A code rollback does not reverse database migrations; database changes require a separately reviewed forward migration or provider restore. Blob objects must not be bulk-deleted during rollback.

## Troubleshooting

- API startup failure: verify every required production environment variable, especially SMTP and database TLS values.
- Database certificate error: install the provider CA in `DATABASE_SSL_CA`; do not disable verification merely to silence the error.
- Refresh cookie missing: confirm a same-origin `/api` request, HTTPS, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax`, and an empty `COOKIE_DOMAIN`.
- Angular route returns 404: confirm `vercel.json` is at the project root and output is `dist/fleetline/browser`.
- Upload disappears: local filesystem storage was used; production must use the approved object store.
- HTTP 413 on upload: the request exceeded Vercel's function payload limit; use the approved direct/client upload flow.
- Intermittent external CRUD failure: inspect the CarRentalApp response; Fleetline cannot guarantee that third-party service's availability.
