# Fleetline

Fleetline is an Angular 22 vehicle-rental administration application with a dedicated Express authentication API. Rental data continues to use the documented CarRentalApp service; identity, sessions, roles, admin users, and profiles use the Fleetline PostgreSQL backend.

## Features

- Registration, login, logout, refresh rotation, password reset, password change, and session restoration
- PostgreSQL users, refresh sessions, and single-use password-reset records
- SUPER_ADMIN, ADMIN, and STAFF roles with server-side authorization
- Profile editing and profile-image upload/delete with server-side signature and 5 MB validation
- Bike CRUD, vehicle-image uploads, fleet type filtering, and image previews
- Dashboard period filtering with a shared chart-data modal
- Vehicle/customer CRUD, bookings, customer ledger, dashboard, responsive shell, loaders, toasts, drawers, and confirmations
- Angular Signals auth store, functional guards/interceptors, shared refresh flow, reactive forms, and OnPush
- amCharts 5, centralized SCSS, local Poppins, and accessible desktop/mobile layouts

## Technology

Frontend: Angular 22.2, TypeScript 6, RxJS, SCSS, amCharts 5, Vitest, and Playwright.

Backend: Node.js, Express 5, TypeScript, PostgreSQL, bcryptjs, JWT, Zod, Multer, Helmet, CORS, SMTP, and rate limiting.

## Prerequisites and installation

Use Node.js ^22.22.3, ^24.15.0, or >=26.0.0, npm 12 or compatible, and PostgreSQL 15+.

```bash
npm install
npm --prefix server install
copy server\.env.example server\.env
npm run db:up
npm run db:migrate
npm run db:seed
npm start
```

`npm start` launches Angular and the authentication API together. Angular runs at http://localhost:4200, proxies `/api` to the API at http://localhost:3000, and the Docker PostgreSQL instance is published on port 5433. Generate a strong random JWT_ACCESS_SECRET and replace the bootstrap password before running the seed. Never commit server/.env.

## Environment configuration

Placeholders are in server/.env.example.

- DATABASE_URL: PostgreSQL connection URL
- JWT_ACCESS_SECRET: access-token signing secret, at least 32 random characters
- ACCESS_TOKEN_TTL: short access-token lifetime, default 15m
- REFRESH_TOKEN_TTL_DAYS and PASSWORD_RESET_TTL_MINUTES: credential lifetimes
- FRONTEND_ORIGIN: the only allowed browser origin
- COOKIE_SECURE, COOKIE_SAME_SITE, COOKIE_DOMAIN: deployment cookie policy
- UPLOAD_DIRECTORY: profile-image storage root
- VEHICLE_UPLOAD_DIRECTORY: vehicle-image storage root
- IMAGE_UPLOAD_MAX_MB: shared server upload limit, default 5 MB
- SMTP_*: production reset-email transport
- EXPOSE_DEVELOPMENT_RESET_TOKEN: local reset testing only
- SEED_SUPER_ADMIN_*: one-time bootstrap account

Production startup requires SMTP configuration. Use TLS, secure cookies, an exact HTTPS origin, managed PostgreSQL, and durable private object storage. Angular API URLs are centralized in src/environments; production expects the frontend proxy and API to share an origin at /api.

## Authentication design

Access JWTs are short-lived and held only in Angular memory. The refresh credential is a random opaque value in an HttpOnly cookie; PostgreSQL stores only its SHA-256 hash. Every refresh rotates and revokes the previous record. Reuse of a rotated token revokes its token family.

Application initialization silently refreshes and calls /auth/me before routing. Concurrent expired requests share one refresh operation. Password resets and password changes revoke all sessions. Public registration always creates a STAFF account. Only SUPER_ADMIN can manage users and roles. Angular guards improve navigation; API middleware is the security boundary.

## Authentication API

All successes use { success, message, data }; failures use { success, message, errors }. Validation failures return 422.

| Method         | Route                        | Requirement     | Purpose                                                       |
| -------------- | ---------------------------- | --------------- | ------------------------------------------------------------- |
| POST           | /api/auth/register           | Public          | Register first/last name, email, optional phone, and password |
| POST           | /api/auth/login              | Public          | Authenticate and establish a refresh session                  |
| POST           | /api/auth/refresh-token      | Refresh cookie  | Rotate session and issue access token                         |
| POST           | /api/auth/logout             | Refresh cookie  | Revoke session and clear cookie                               |
| POST           | /api/auth/forgot-password    | Public, limited | Create reset record and deliver instructions                  |
| POST           | /api/auth/verify-reset-token | Public, limited | Validate an unused reset token                                |
| POST           | /api/auth/reset-password     | Public, limited | Consume token, change password, revoke sessions               |
| POST           | /api/auth/change-password    | Bearer          | Verify current password and revoke sessions                   |
| GET            | /api/auth/me                 | Bearer          | Get sanitized current user                                    |
| PUT            | /api/auth/me                 | Bearer          | Update first name, last name, and phone                       |
| POST           | /api/auth/me/profile-image   | Bearer          | Upload JPEG, PNG, or WebP field image, up to 5 MB             |
| DELETE         | /api/auth/me/profile-image   | Bearer          | Remove profile image                                          |
| POST           | /api/vehicles/images         | Bearer          | Upload a validated vehicle image                              |
| GET/POST       | /api/bikes                   | Bearer          | List or create bikes                                          |
| GET/PUT/DELETE | /api/bikes/:id               | Bearer          | Read, update, or delete a bike                                |
| GET/POST       | /api/admin/users             | SUPER_ADMIN     | List or create users                                          |
| PUT/DELETE     | /api/admin/users/:id         | SUPER_ADMIN     | Update or delete users                                        |

HTTP semantics: 400 invalid operation, 401 missing/invalid auth, 403 insufficient permission/inactive account, 404 missing resource, 409 duplicate email, 413 oversized upload, 422 validation, 429 rate limit, and 500 sanitized error.

Full endpoint documentation is in docs/auth-api.openapi.yaml. Inspected rental definitions remain in docs/car-rental-api.json.

## Password-reset development testing

Set EXPOSE_DEVELOPMENT_RESET_TOKEN=true only locally. Submit forgot password. Its generic response includes data.resetToken in development and Angular opens the reset form. Production never returns it and sends SMTP email instead. Tokens are random, hash-only in storage, expiring, and single-use.

## Database and architecture

Migration server/src/database/migrations/001_auth.sql creates users, refresh_sessions, and password_reset_tokens with primary/foreign keys, unique case-insensitive email, and security indexes. The migration runner tracks applied files.

```text
src/app/core       Auth store, guards, interceptors, typed services
src/app/features   Auth, rental modules, users, profile
src/app/layout     Responsive authenticated shell
src/app/shared     Reusable UI, icons, validation, list utilities

server/src/config        Environment and PostgreSQL
server/src/controllers   Thin HTTP translation
server/src/database      Migration and seed runners
server/src/middleware    Authentication, roles, validation, limits, errors
server/src/repositories  Parameterized SQL
server/src/routes        Auth and admin-user routes
server/src/services      Authentication, SMTP, file storage
server/src/validators    Zod request schemas
```

## Verification

```bash
npm run build
npm run build:server
npm run test:unit
npm run test:server
npm run test:e2e
npm run format:check
```

Backend tests cover password hashing, duplicates, valid/invalid login, expired JWTs, refresh rotation/reuse, logout, reset flow/reuse, password change, unauthorized /me, image type/size, profile update, and authorization failures.

## Security considerations

The API uses parameterized SQL, centralized schemas, bcrypt cost 12, sanitized users, generic credential/reset responses, secure headers, strict CORS, body limits, auth rate limits, server-side roles, randomized file keys, content signatures, and safe-path deletion. It never logs passwords or tokens and never stores raw refresh/reset credentials.

CarRentalApp remains a separate public third-party service. Its rental endpoints cannot be made private by Fleetline authentication. Cars, customers, and car bookings continue to use its documented endpoints. It has no bike type, bike booking, vehicle-image upload, return-date persistence, availability, payment, or period-reporting endpoint. Fleetline therefore provides authenticated bike CRUD and vehicle-image storage, derives dashboard periods from the loaded booking list, and prevents bike booking instead of fabricating an unsupported external endpoint. Production should proxy or migrate the remaining rental resources behind an authenticated backend before treating rental data as confidential.
