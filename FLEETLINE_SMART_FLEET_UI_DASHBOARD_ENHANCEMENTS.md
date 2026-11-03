# Fleetline Smart Fleet UI and Dashboard Enhancements

## Issues identified

- The Add Maintenance panel needed an explicit header/body/footer contract and final action copy.
- Admin Users and Roles & Permissions shared the same sidebar icon.
- The overview contained development-oriented copy instead of operational intelligence.
- The main dashboard did not surface urgent maintenance, critical alerts, or assessed fleet health.
- Detailed maintenance rows needed to remain protected independently from aggregate overview access.

## Files modified

Key frontend files include the Smart Fleet overview and maintenance-dialog components, dashboard component, new dashboard Smart Fleet summary component, shared SVG icon registry, global fleet styles, and sidebar navigation configuration. The backend fleet controller/service and typed fleet models were extended for the aggregate response.

## Add Maintenance layout correction

The panel now uses a column layout with:

1. A fixed header containing “Add Maintenance,” its description, and the close action.
2. One flexible, vertically scrollable form-content region.
3. A fixed footer containing only Cancel and Add Maintenance.

Existing validation, Reactive Forms state, vehicle selection, loading prevention, and API submission remain unchanged. Fleetline currently has create/complete maintenance operations but no Edit Maintenance dialog, so there was no separate edit layout to modify.

## Sidebar icon changes

- Admin Users uses the `usersSettings` SVG.
- Roles & Permissions uses the `shieldCheck` SVG.

Both use the existing `currentColor` icon component and inherit expanded, collapsed, active, hover, focus, and mobile navigation styles.

## Smart Fleet overview

The Zero Cost Development card was removed. Its replacement contains:

- A CSS donut chart using actual aggregate counts.
- Mutually exclusive Healthy, Due Soon, Overdue, and Under Maintenance categories.
- A health aggregate showing assessed vehicle count and average data completeness.
- An urgency-sorted upcoming-maintenance table limited by the backend.
- Loading-compatible and truthful empty states.

No sample operational values are inserted. Remaining kilometres stays unavailable until a current odometer source exists; the API returns `null` rather than deriving an incorrect value.

## Main dashboard integration

The dashboard now contains a Fleet Health & Maintenance section with permission-aware cards for:

- Vehicles due for service.
- Vehicles under maintenance.
- Critical unresolved alerts.
- Assessed fleet health and assessment completeness.

The Maintenance Attention Required table shows the five most urgent schedules and links to the protected Smart Fleet routes. Smart Fleet loading/error state is independent from the existing rental dashboard, so a fleet API failure does not remove booking or vehicle statistics.

## API changes

`GET /api/fleet-intelligence/overview` now returns:

- Existing overview counts.
- `maintenanceStatus` with mutually exclusive vehicle counts.
- `upcomingMaintenance`, limited to eight urgency-sorted schedules.
- `fleetHealth` with average score, assessed count, and average completeness.

The endpoint uses aggregate SQL and does not fetch complete telemetry, maintenance, or vehicle collections. Upcoming record details are returned only when the authenticated user also has `fleet.maintenance.view`.

## RBAC verification

- The dashboard does not call the fleet endpoint without `fleet.overview.view`.
- Maintenance cards, table, and links require `fleet.maintenance.view`.
- Alert navigation requires `fleet.alerts.view`.
- Health navigation and aggregate presentation require `fleet.health.view`.
- Backend route authorization remains the security boundary.
- No role assignments were changed.

## Responsive behavior

Styles cover narrow mobile, tablet, laptop, and desktop layouts. KPI grids wrap, the two-column overview becomes one column below 720px, chart content stacks, tables scroll within their own containers, and modal/drawer content uses controlled scrolling without moving the header or footer.

The production compilation validates all responsive templates and SCSS. Automated visual screenshots at every requested width were not available in the current test environment, so those viewport-specific visual checks remain a recommended browser QA step.

## Verification results

- Angular TypeScript check: passed.
- Backend TypeScript check: passed.
- Angular production build: passed.
- Backend production build: passed.
- Backend Vitest suite: 17 tests passed across 2 files.
- Local PostgreSQL aggregate execution: passed and returned the expected typed empty-state response.
- `git diff --check`: no patch whitespace errors.

Angular reports non-blocking CommonJS optimization warnings for Leaflet and existing Vercel dependencies.

## Outstanding limitations

- Current odometer telemetry is not yet authoritative enough to calculate remaining kilometres, so it is intentionally shown as unavailable.
- Fleet-wide health is displayed only when stored assessments exist and always communicates assessment count/completeness.
- Cars and bookings remain owned by the external CarRentalApp API, preventing transactional booking/maintenance enforcement without support from that backend.
- Manual cross-browser screenshots at every requested viewport remain outstanding.
