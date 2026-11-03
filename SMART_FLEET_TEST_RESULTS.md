# Smart Fleet Verification

## Automated commands

```text
npx tsc -p tsconfig.app.json --noEmit
cd server
npx tsc -p tsconfig.json --noEmit
npm test
npm run build
cd ..
npm run build
```

TypeScript checks pass. The fleet rule suite verifies deterministic service dates/odometers, absent-history behavior, and explainable health scoring.

## Functional checklist

- Maintenance creation validates vehicle, type, description, date, and odometer.
- Health exposes score, status, factors, rule version, and completeness.
- Simulation is visibly labelled and unavailable in production.
- Leaflet preserves configured tile attribution.
- Traccar credentials remain server-side and partial configuration is rejected.
- Geofence event insertion is idempotent for a position/geofence event.
- Routes and navigation honor database permissions.
- Empty states, responsive tabs/tables/forms, and map sizing use the existing design system.

## Security checklist

- Authentication and server-side permissions apply to every route.
- Zod validates mutation payloads.
- No paid or external AI API is called.
- No raw provider credential is returned or logged.
- Simulation and live-provider sources are stored and displayed distinctly.
