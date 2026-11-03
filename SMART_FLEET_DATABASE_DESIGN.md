# Smart Fleet Database Design

Migration `005_smart_fleet_intelligence.sql` adds maintenance records, recurring schedules, inspections, telematics device mappings, append-only positions, circular geofences, deduplicated alerts, and versioned health assessments.

Cars remain owned by CarRentalApp and bikes by Fleetline's bike API. Fleet tables use `vehicle_ref`, `vehicle_type`, and a registration snapshot so the module does not fabricate a conflicting local vehicle master. UUID primary keys are used for operational records; high-volume location rows use `bigserial`. Foreign keys protect user/device relationships, checks constrain states and numeric ranges, and indexes cover vehicle/time, due-date, location, and alert queries.

Sensitive Traccar credentials are environment configuration, not database data. Location retention is configurable and must be enforced by an operator-approved scheduled cleanup process in production.
