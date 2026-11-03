# Smart Fleet Intelligence Architecture

## Modules

- Angular feature: `src/app/features/fleet-intelligence`
- API routes: `/api/fleet-intelligence`
- Backend services: deterministic fleet service and optional Traccar adapter
- Persistence: migration `005_smart_fleet_intelligence.sql`
- Authorization: database permissions evaluated by existing authentication middleware

## Data flow

Angular calls typed fleet endpoints through the existing authenticated HTTP pipeline. The backend validates DTOs, enforces permissions, stores operational records in PostgreSQL, and returns sanitized response models. Health and forecast calculations are deterministic and contain method/version metadata.

Tracking uses one normalized location model. Development positions enter through the simulator endpoint and are permanently marked `SIMULATOR`. Optional Traccar positions enter through the server-side adapter and are marked `TRACCAR`. Angular never receives provider credentials.

Geofences are circular boundaries evaluated with a Haversine distance calculation as positions are ingested. Alert uniqueness combines event and geofence identity, preventing duplicate insertion for a single location event.

## Feature flags

Maintenance, health, tracking, geofencing, forecasting, and simulation can be enabled independently through server environment variables. The capabilities endpoint allows the UI to present only configured features. Simulation is rejected in production even if accidentally enabled.
