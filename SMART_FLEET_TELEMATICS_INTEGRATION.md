# Smart Fleet Telematics Integration

## Modes

- `SIMULATION`: local development input, explicitly marked in storage, API output, map popups, and page banner.
- `TRACCAR`: optional positions fetched by the backend from a self-managed Traccar Community Edition server.

The backend adapter normalizes latitude, longitude, speed, heading, accuracy, ignition, and timestamp. Traccar speed in knots is converted to kilometres per hour. Device mappings associate a Traccar device ID with Fleetline's stable vehicle reference. Unmapped provider devices are ignored.

Provider credentials are validated as an all-or-nothing server configuration, transmitted only from the backend, and never included in frontend responses. Fetch calls have an eight-second timeout. Devices older than fifteen minutes are marked offline.

Each accepted position is unique by device and recorded timestamp. Active circular geofences are evaluated with the Haversine formula. One exit alert can be created for a location/geofence pair, enforced by a unique source-event index.

The default OpenStreetMap standard tile source is intended for interactive local development. Production operators must follow the tile service policy or configure/self-host an appropriate tile source while retaining attribution.
