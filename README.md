# Fleetline — Vehicle Rental Management System

![Fleetline logo](public/logo.svg)

**Fleetline** is a full-stack, responsive vehicle-rental administration application developed with **Angular 22, TypeScript, Node.js / Express, and PostgreSQL**. It combines rental operations, customer and account management, customizable role-based access control, and the Smart Fleet Intelligence module for maintenance and vehicle insights.

## Contents

- [Feature gallery](#feature-gallery)
- [Core architecture and technology](#core-architecture-and-technology)
- [Prerequisites and installation](#prerequisites-and-installation)
- [Environment configuration](#environment-configuration)
- [Authentication design](#authentication-design)
- [Authentication API](#authentication-api)
- [Password-reset development testing](#password-reset-development-testing)
- [Database and architecture](#database-and-architecture)
- [Verification](#verification)
- [Security considerations](#security-considerations)

## Feature gallery

Every card links to a screenshot file you can replace without modifying README Markdown. Screenshots should use dummy/test data and must not expose access tokens, customer PII, private locations, or credentials.

### Authentication

#### Login & Session Management

Sign in with an existing account; use access tokens, refresh-cookie session rotation, guarded routes, and restored sessions.

**Screen:** `/auth/login`  
**Screenshot:** `docs/screenshots/login.png`

![Login & Session Management — screenshot](docs/screenshots/login.png)

#### User Registration

Create an account through the public registration form; new registrations receive the Staff role.

**Screen:** `/auth/register`  
**Screenshot:** `docs/screenshots/register.png`

![User Registration — screenshot](docs/screenshots/register.png)

#### Forgot Password

Request a time-limited, single-use password reset link with rate limiting and generic responses. Real email delivery requires configured SMTP.

**Screen:** `/auth/forgot-password`  
**Screenshot:** `docs/screenshots/forgot-password.png`

![Forgot Password — screenshot](docs/screenshots/forgot-password.png)

#### Reset Password

Validate a reset token, submit a new password, and revoke existing sessions after reset.

**Screen:** `/auth/reset-password`  
**Screenshot:** `docs/screenshots/reset-password.png`

![Reset Password — screenshot](docs/screenshots/reset-password.png)

### Dashboard

#### Main Dashboard

View period-filtered booking statistics, booking charts, recent rentals, and Fleet Health & Maintenance summary cards for authorized users.

**Screen:** `/dashboard`  
**Screenshot:** `docs/screenshots/dashboard.png`

![Main Dashboard — screenshot](docs/screenshots/dashboard.png)

#### Smart Fleet Dashboard Summary

Review service-due vehicles, maintenance downtime, critical alerts, and fleet-health coverage from the main dashboard.

**Screen:** `/dashboard`  
**Screenshot:** `docs/screenshots/smart-fleet-dashboard.png`

![Smart Fleet Dashboard Summary — screenshot](docs/screenshots/smart-fleet-dashboard.png)

### Rental operations

#### Vehicles & Inventory

Browse, search, filter, add, edit, and remove vehicle records as supported by their data source; manage bike records and validated vehicle images.

**Screen:** `/vehicles`  
**Screenshot:** `docs/screenshots/vehicles.png`

![Vehicles & Inventory — screenshot](docs/screenshots/vehicles.png)

#### Vehicle Create / Edit

Maintain vehicle details using validated forms, images, and permitted actions. Car and bike backends have different supported operations.

**Screen:** `/vehicles`  
**Screenshot:** `docs/screenshots/vehicle-form.png`

![Vehicle Create / Edit — screenshot](docs/screenshots/add-vehicle.png)

#### Bookings & Rental Records

Review rental bookings, booking details, and permitted management actions, with date-related views and status information.

**Screen:** `/bookings`  
**Screenshot:** `docs/screenshots/bookings.png`

![Bookings & Rental Records — screenshot](docs/screenshots/bookings.png)

#### Book Vehicle

Use the booking form and existing rental rules to create supported reservations; unsupported bike booking is intentionally blocked.

**Screen:** `/book-vehicle`  
**Screenshot:** `docs/screenshots/book-vehicle.png`

![Book Vehicle — screenshot](docs/screenshots/book-vehicle.png)

#### Customers

View customer records, open customer details, and perform supported create, edit, and deletion operations.

**Screen:** `/customers`  
**Screenshot:** `docs/screenshots/customers.png`

![Customers — screenshot](docs/screenshots/customers.png)

#### Customer Ledger

Review customer-related financial and ledger entries from the existing rental data service, subject to authorized UI access.

**Screen:** `/customer-ledger`  
**Screenshot:** `docs/screenshots/customer-ledger.png`

![Customer Ledger — screenshot](docs/screenshots/customer-ledger.png)

### Administration

#### Admin Users

Manage user accounts and their statuses; create and edit users and assign authorized roles.

**Screen:** `/admin-users`  
**Screenshot:** `docs/screenshots/admin-users.png`

![Admin Users — screenshot](docs/screenshots/admin-users.png)

#### Assign Roles

Assign active roles to users and manage role changes within Super Admin-protected workflows.

**Screen:** `/admin-users`  
**Screenshot:** `docs/screenshots/assign-roles.png`

![Assign Roles — screenshot](docs/screenshots/assign-roles.png)

#### Roles & Permissions

Manage system and custom roles using grouped permission controls, role assignments, and server-validated updates.

**Screen:** `/roles-permissions`  
**Screenshot:** `docs/screenshots/roles-permissions.png`

![Roles & Permissions — screenshot](docs/screenshots/roles-permissions.png)

#### Permission Matrix

Set granular View/Create/Edit/Delete and specialized module permissions, with protected system-role restrictions.

**Screen:** `/roles-permissions`  
**Screenshot:** `docs/screenshots/permission-matrix.png`

![Permission Matrix — screenshot](docs/screenshots/permission-matrix.png)

#### My Profile

Update personal profile information, manage profile images, and change account passwords.

**Screen:** `/profile`  
**Screenshot:** `docs/screenshots/profile.png`

![My Profile — screenshot](docs/screenshots/profile.png)

### Smart Fleet Intelligence

#### Fleet Intelligence Overview

Review maintenance status chart, fleet-health coverage, urgency-ranked upcoming maintenance and aggregate operational KPIs.

**Screen:** `/fleet-intelligence`  
**Screenshot:** `docs/screenshots/fleet-overview.png`

![Fleet Intelligence Overview — screenshot](docs/screenshots/fleet-overview.png)

#### Maintenance Management

Create maintenance records and recurring schedules, track services, due/overdue status, completion and costs.

**Screen:** `/fleet-intelligence/maintenance`  
**Screenshot:** `docs/screenshots/maintenance.png`

![Maintenance Management — screenshot](docs/screenshots/maintenance.png)

#### Add Maintenance Dialog

Schedule a vehicle maintenance task using the structured dialog with validation, scrolling body and distinct action footer.

**Screen:** `/fleet-intelligence/maintenance`  
**Screenshot:** `docs/screenshots/add-maintenance.png`

![Add Maintenance Dialog — screenshot](docs/screenshots/add-maintenance.png)

#### Vehicle Health

Review explainable rule-based vehicle health scores, contributing factors, inspection data and completeness indicators.

**Screen:** `/fleet-intelligence/health`  
**Screenshot:** `docs/screenshots/vehicle-health.png`

![Vehicle Health — screenshot](docs/screenshots/vehicle-health.png)

#### GPS Tracking

View Leaflet map positions from configured telemetry devices or clearly labelled local simulation; distinguish current, stale and offline observations.

**Screen:** `/fleet-intelligence/tracking`  
**Screenshot:** `docs/screenshots/tracking.png`

![GPS Tracking — screenshot](docs/screenshots/tracking.png)

#### Geofences

Configure circular geofences, associate vehicles, and review location boundary events and alerts where telemetry is available.

**Screen:** `/fleet-intelligence/geofences`  
**Screenshot:** `docs/screenshots/geofences.png`

![Geofences — screenshot](docs/screenshots/geofences.png)

#### Fleet Alerts

Review and manage fleet warnings and critical events, including maintenance, device and geofence alerts, with acknowledgement/resolution.

**Screen:** `/fleet-intelligence/alerts`  
**Screenshot:** `docs/screenshots/alerts.png`

![Fleet Alerts — screenshot](docs/screenshots/alerts.png)

#### Fleet Analytics

Analyze maintenance costs, service counts, downtime and rule-based maintenance forecasts using stored data.

**Screen:** `/fleet-intelligence/analytics`  
**Screenshot:** `docs/screenshots/fleet-analytics.png`

![Fleet Analytics — screenshot](docs/screenshots/fleet-analytics.png)

### Additional system capabilities

- **Authentication and security:** Short-lived access JWTs, refresh-token rotation with HttpOnly cookies, hashed passwords, single-use password resets, validation, API rate limiting, and protected routes.
- **Configurable RBAC:** Protected `SUPER_ADMIN` role, `ADMIN` and `STAFF` defaults, additional custom roles, multi-role assignments, granular permission matrix, backend enforcement on Fleetline-owned APIs, and role-change audit events.
- **Operational usability:** Shared form validation, reusable modals and drawers, search, filtering, pagination, status feedback, confirmation dialogs, responsive layouts, theme-consistent SVG icons, and dynamic browser titles.
- **Smart Fleet integration:** Maintenance schedules and inspections, explainable vehicle-health indicators, optional Traccar integration, labelled GPS simulation, geofence evaluation, alerts and aggregate fleet reporting.
- **No-cost local development:** Open-source Leaflet and OpenStreetMap data; self-hostable Traccar option. Actual GPS data needs configured devices/providers, and production infrastructure can incur costs.

### Important implementation and integration limits

- The *CarRentalApp* service remains an external service for cars, bookings, customers, ledger, and rental dashboard data. Its backend does not gain server-side Fleetline RBAC merely because Fleetline hides UI actions. Protect or migrate those endpoints before relying on them for sensitive production data.
- GPS simulator locations must always be labelled simulated. Live GPS tracking requires a configured real telemetry source.
- Health scoring is explainable, **rule-based** assessment, not a medically or mechanically certified safety decision or a trained predictive AI model.

## Core architecture and technology

| Layer | Technology |
| --- | --- |
| Frontend | Angular 22, TypeScript 6, RxJS, Angular Signals, Reactive Forms, SCSS, Poppins |
| Visualization | amCharts 5, Leaflet, OpenStreetMap data / configurable tile source |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Data | PostgreSQL, SQL migrations |
| Authentication | JWT, rotating refresh tokens, bcryptjs, HttpOnly cookies, SMTP reset emails |
| Access control | Database-driven RBAC with server-side middleware for Fleetline-owned APIs |
| Testing | Vitest, Playwright |
| Deployment | Vercel configuration in repository; backend and persistent jobs depend on hosting setup |

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

`npm start` launches Angular and the authentication API together. Angular runs at http://localhost:4200, proxies `/api` to the API at http://localhost:3000, and the Docker PostgreSQL instance is published on port 5435. Generate a strong random JWT_ACCESS_SECRET and replace the bootstrap password before running the seed. Never commit server/.env.

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

Fleetline uses database-backed RBAC with protected system roles, granular permissions, server-side enforcement for Fleetline-owned APIs, fresh permission resolution, audit logs, and Angular route/action checks.

The API uses parameterized SQL, centralized schemas, bcrypt cost 12, sanitized users, generic credential/reset responses, secure headers, strict CORS, body limits, auth rate limits, server-side roles, randomized file keys, content signatures, and safe-path deletion. It never logs passwords or tokens and never stores raw refresh/reset credentials.

CarRentalApp remains a separate public third-party service. Its rental endpoints cannot be made private by Fleetline authentication. Cars, customers, and car bookings continue to use its documented endpoints. It has no bike type, bike booking, vehicle-image upload, return-date persistence, availability, payment, or period-reporting endpoint. Fleetline therefore provides authenticated bike CRUD and vehicle-image storage, derives dashboard periods from the loaded booking list, and prevents bike booking instead of fabricating an unsupported external endpoint. Production should proxy or migrate the remaining rental resources behind an authenticated backend before treating rental data as confidential.
