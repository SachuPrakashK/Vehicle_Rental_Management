# Smart Fleet Intelligence API

All routes are below `/api/fleet-intelligence`, require authentication, return the existing Fleetline response envelope, and enforce the listed permission.

| Method | Route | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/capabilities` | `fleet.overview.view` | Enabled features and provider mode |
| GET | `/overview` | `fleet.overview.view` | Fleet maintenance/alert summary |
| GET/POST | `/maintenance` | `fleet.maintenance.view/create` | Maintenance history and creation |
| POST | `/maintenance/:id/complete` | `fleet.maintenance.complete` | Complete maintenance with actual values |
| GET/POST | `/schedules` | `fleet.maintenance.view/create` | Deterministic recurring schedules |
| GET/POST | `/inspections` | `fleet.health.view/assess` | Vehicle inspections |
| GET | `/health` | `fleet.health.view` | Explainable rule-based health |
| GET | `/tracking` | `fleet.tracking.view` | Latest normalized positions |
| POST | `/tracking/simulate` | `fleet.tracking.devices.manage` | Development-only simulated position |
| GET | `/alerts` | `fleet.alerts.view` | Fleet alerts |
| PATCH | `/alerts/:id/acknowledge` | `fleet.alerts.acknowledge` | Acknowledge an alert |
| PATCH | `/alerts/:id/resolve` | `fleet.alerts.resolve` | Resolve an alert with notes |
| GET/POST | `/geofences` | `fleet.geofences.view/create` | Circular geofences |
| GET | `/analytics` | `fleet.analytics.view` | Local cost and downtime aggregation |
| GET | `/forecasts` | `fleet.predictions.view` | Deterministic maintenance forecasts |

Input is validated with Zod. Invalid authentication returns 401; insufficient permission returns 403; validation failures return 400 through the shared error envelope.
