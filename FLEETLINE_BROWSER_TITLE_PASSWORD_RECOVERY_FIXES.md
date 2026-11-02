# Fleetline Browser Titles and Password Recovery Fixes

## Implementation summary

Fleetline now uses one Angular `TitleStrategy` to format every routed page as `[Page Name] | Fleetline`. Password recovery now provides a stable anti-enumeration confirmation, validates reset links before showing password controls, uses secure one-time tokens, sends a branded email through configured SMTP, and verifies synchronous provider acceptance.

## Browser titles

`FleetlineTitleStrategy` reads the deepest active route title and applies the Fleetline suffix centrally. Component-level document-title updates are not used.

| Route                   | Browser title     |
| ----------------------- | ----------------- |
| `/auth/login`           | `Login            | Fleetline` |
| `/auth/register`        | `Register         | Fleetline` |
| `/auth/forgot-password` | `Forgot Password  | Fleetline` |
| `/auth/reset-password`  | `Reset Password   | Fleetline` |
| `/dashboard`            | `Dashboard        | Fleetline` |
| `/vehicles`             | `Vehicles         | Fleetline` |
| `/customers`            | `Customers        | Fleetline` |
| `/customers/:id`        | `Customer Details | Fleetline` |
| `/book-vehicle`         | `Book Vehicle     | Fleetline` |
| `/bookings`             | `Bookings         | Fleetline` |
| `/bookings/:id`         | `Booking Details  | Fleetline` |
| `/customer-ledger`      | `Customer Ledger  | Fleetline` |
| `/admin-users`          | `Admin Users      | Fleetline` |
| `/profile`              | `My Profile       | Fleetline` |
| `/not-found`            | `Page Not Found   | Fleetline` |

Titles were verified for direct navigation, nested routes, redirects, refresh-compatible route initialization, and browser Back/Forward navigation.

## Forgot Password changes

- Preserved Reactive Forms email validation and duplicate-submission prevention.
- Added the same generic response for registered and unregistered addresses:
  `If an account exists with this email address, you will receive a password reset link shortly.`
- Added an in-page success state in addition to the existing global feedback system.
- Kept development reset-token access behind the existing `EXPOSE_DEVELOPMENT_RESET_TOKEN` server setting.
- Kept production reset tokens out of API responses.
- Retained the password-specific rate limiter.
- Avoided logging email addresses, raw reset tokens, passwords, or provider credentials.

## Reset Password changes

- The frontend verifies the URL token through `/api/auth/verify-reset-token` before showing the form.
- Missing, invalid, expired, and used tokens display one safe error message.
- The reset token is no longer displayed or editable in the form.
- Password and confirmation fields retain the shared password policy and now show distinct eye/eye-off SVG states.
- Password mismatch and weak-password validation remain enforced on both frontend and backend.
- Successful reset hashes the new password, consumes the token, revokes existing sessions, clears the refresh cookie, and returns the user to Login.
- Previously used reset links are rejected.

## Email delivery

When `SMTP_HOST` is configured, Fleetline sends a multipart plain-text and HTML reset email containing:

- Fleetline branding
- A single reset action
- The configured expiry duration
- A warning for unrequested resets
- A callback URL based on `FRONTEND_ORIGIN`

The email service checks that Nodemailer reports the intended recipient in the provider's accepted-recipient result. Delivery failures are recorded without logging the recipient or token, and the public response remains generic to prevent account enumeration.

### Required environment configuration

- `FRONTEND_ORIGIN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_FROM`
- `SMTP_USER` and `SMTP_PASSWORD` when the relay requires authentication
- `PASSWORD_RESET_TTL_MINUTES`
- `EXPOSE_DEVELOPMENT_RESET_TOKEN=false` outside controlled local development

The server rejects partial SMTP configuration. Production already requires SMTP host, port, and sender configuration.

### Delivery verification status

The current local environment has no SMTP host or credentials, so no external provider or real inbox was contacted. The implementation and provider-acceptance path compile successfully, but actual inbox receipt and downstream delivery events require a controlled test mailbox and valid provider credentials. An HTTP success response or SMTP acceptance alone must not be interpreted as proof of inbox delivery.

## Security behavior verified

- Registered and unregistered forgot requests return the same message.
- Empty and malformed email addresses are rejected.
- Reset tokens are random, stored only as SHA-256 hashes, time-limited, row-locked, and single-use.
- Creating a new reset invalidates older unused tokens.
- Expired and arbitrary tokens are rejected.
- Weak and mismatched passwords are rejected.
- A consumed token cannot be replayed.
- Existing sessions are revoked after reset.
- The old password fails after reset and the new password succeeds.
- Password endpoints remain rate-limited outside automated test mode.

## Changed files

- `src/app/core/services/fleetline-title-strategy.service.ts`
- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/index.html`
- `src/app/features/auth/pages/forgot-password/*`
- `src/app/features/auth/pages/reset-password/*`
- `src/app/features/auth/components/password-field/password-field.component.html`
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/shared/icons/icon.component.ts`
- `server/src/controllers/auth.controller.ts`
- `server/src/services/auth.service.ts`
- `server/src/services/email.service.ts`
- `server/src/config/env.ts`
- `server/src/middleware/rate-limit.middleware.ts`
- `server/src/test/auth.integration.spec.ts`
- `e2e/app.spec.ts`

## Verification results

- Angular production build: passed.
- Backend TypeScript build: passed.
- Angular unit tests: 5 passed.
- Backend integration tests: 11 passed with expanded recovery assertions.
- Playwright desktop/mobile suite: title, authentication, accessibility, responsive, navigation, and CRUD regression coverage passed.
- Live local PostgreSQL-backed recovery check:
  - registration: 201
  - registered and unregistered forgot requests: 200 with matching messages
  - token verification: 200
  - reset: 200
  - old-password login: 401
  - new-password login: 200
  - reset-token reuse: 400

## Outstanding external verification

Configure a controlled SMTP test account, set `EXPOSE_DEVELOPMENT_RESET_TOKEN=false`, request a reset for that mailbox, and confirm both provider delivery events and actual inbox receipt. No arbitrary user account should be used for this check.
