# Smart Fleet Intelligence — Zero-Cost Implementation

## Scope and cost boundary

Smart Fleet Intelligence can be developed and demonstrated locally without paid APIs, subscriptions, credit-card registration, GPS hardware, or an external AI model. It reuses Fleetline's Angular 22, Node.js, PostgreSQL, Signals, RxJS, shared UI, authentication, and database-driven RBAC architecture.

The development software and third-party licence cost is ₹0. Production is not guaranteed to have zero operating cost: servers, storage, bandwidth, tile capacity, email delivery, backups, domains, TLS certificates, GPS hardware, and mobile connectivity may create operating costs at production scale.

## Open-source dependencies

| Component | Purpose | Licence | Local requirement |
| --- | --- | --- | --- |
| Leaflet 1.9.4 | Interactive maps | BSD-2-Clause | Installed npm package |
| OpenStreetMap data | Base-map data | ODbL | Attribution must remain visible |
| OpenStreetMap standard tiles | Development map tiles | OSM tile policy | Internet connection; not for bulk/offline/high-volume use |
| Traccar Community Edition | Optional GPS provider | Apache-2.0 | Self-managed server; not required for simulation |
| PostgreSQL | Fleet persistence | PostgreSQL Licence | Existing local database |
| Node.js and Angular | API and UI | Open-source licences | Existing project toolchain |

No commercial chart, mapping, GPS, AI, or UI package was added.

## Local setup

1. Install dependencies with `npm install` in the repository root and `server` directory.
2. Configure `server/.env` from `server/.env.example`.
3. Run `npm run db:migrate` in `server` to apply migration `005_smart_fleet_intelligence.sql`.
4. Run the API with `npm run dev` in `server`.
5. Run Angular with `npm start` in the repository root.
6. Assign Smart Fleet permissions from Roles & Permissions if an existing custom role needs access.

The default development configuration enables the local simulator. Every simulated position is stored with source `SIMULATOR` and the UI displays a persistent simulation warning. Production configuration disables simulation by default.

## Mapping and tile compliance

Leaflet reads its tile URL and attribution from Angular environment configuration. The default points to the OpenStreetMap standard tile service and retains the required OpenStreetMap attribution. Do not scrape, prefetch, bulk download, or remove attribution. A production deployment with meaningful volume should configure a policy-compliant third-party tile source or self-host tiles and update both `tileUrl` and `tileAttribution`.

## Optional Traccar setup

Run Traccar Community Edition locally or on infrastructure controlled by the operator. Configure these server-only values:

```text
TRACCAR_BASE_URL=http://localhost:8082
TRACCAR_USERNAME=
TRACCAR_PASSWORD=
```

All three values are required together. Credentials remain in the backend environment and are never returned to Angular. Map a Traccar numeric device ID to `fleet_telematics_devices.external_device_id` with provider `TRACCAR`. The backend normalizes Traccar positions into the same location model used by the simulator.

## Deterministic intelligence

- Maintenance due dates are `last service date + interval days`.
- Maintenance due odometers are `last service odometer + interval kilometres`.
- Health starts at 100 and deducts 25 per overdue maintenance record and 20 per open inspection defect. Missing maintenance history deducts 15.
- Health output includes its rule version, factors, and data-completeness indicator.
- Forecasts use active schedule intervals and are labelled `DETERMINISTIC_INTERVAL`.

These outputs are decision support only. They do not diagnose mechanical condition or replace inspection by a qualified person.

## Data, privacy, and retention

Location data is protected by server-side permissions. Precise tracking and history permissions should be assigned only to operational roles that need them. `TELEMETRY_RETENTION_DAYS` documents the intended retention window and defaults to 90 days; deployments should run a controlled retention job appropriate to their audit obligations before handling production telemetry. Do not expose location history publicly.

## Email and notifications

Due maintenance and geofence events use the existing in-app alert system. Email is optional and uses the existing SMTP configuration. Local testing can use a locally hosted SMTP capture tool; no paid email provider is required.

## Verification

- Angular TypeScript check: passed with `npx tsc -p tsconfig.app.json --noEmit`.
- Backend TypeScript check: passed with `npx tsc -p tsconfig.json --noEmit`.
- Rule tests cover service intervals, missing history, and explainable health scores.
- Full build and integration verification commands are listed in `SMART_FLEET_TEST_RESULTS.md`.

## Known boundaries

Cars remain sourced from the documented CarRentalApp API and bikes from Fleetline's custom API. Smart Fleet records therefore use a stable `vehicle_ref`, vehicle type, and registration snapshot instead of fabricating a duplicate vehicle master. Booking conflict enforcement across the third-party CarRentalApp cannot be made transactional without control of that backend; Fleetline can warn from local maintenance records, but the third-party service remains the booking source of truth.
