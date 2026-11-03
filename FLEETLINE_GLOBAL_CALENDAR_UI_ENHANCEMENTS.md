# Fleetline Global Calendar UI Enhancements

## Calendar inventory

The audit found six date-only controls and no date-time, time-only, month-only, third-party, or authentication calendar controls.

| Location | Purpose | Binding | Value/API representation | Existing rule preserved |
| --- | --- | --- | --- | --- |
| Book Vehicle | Booking date | Reactive Form | `YYYY-MM-DD`; booking request appends `T00:00:00` | Required |
| Book Vehicle | Planned return date | Reactive Form | `YYYY-MM-DD`; client-side planning field | Required, minimum is booking date, group range validation |
| Booking Listing | Booking-date filter | Signal | `YYYY-MM-DD`; client-side `startsWith` filter | Optional and clearable |
| Dashboard Custom Period | From date | Reactive Form | `YYYY-MM-DD`; chart filtering | Required, cannot follow To date |
| Dashboard Custom Period | To date | Reactive Form | `YYYY-MM-DD`; chart filtering | Required, cannot precede From date |
| Smart Fleet Maintenance | Scheduled date | Reactive Form | Existing date-only form value passed to the existing maintenance flow | Required |

No date inputs were found in Authentication, Vehicles, Customers, Customer Ledger, Admin Users, Roles & Permissions, Profile, Geofencing, or the current telemetry/analytics filters.

## Shared date picker

`DatePickerComponent` is a standalone ControlValueAccessor supporting:

- Reactive Forms and standalone signal/value usage.
- Date-only `YYYY-MM-DD` values without `Date.toISOString()` conversion.
- Minimum and maximum dates.
- Explicit disabled-date values.
- Required and optional fields.
- Optional clearing.
- Range start/end presentation.
- Disabled state propagation.
- Touched and change propagation.
- `dd-mm-yyyy` display while retaining the original form value type.

The application did not require a date-time or month/year picker, so unused variants were not introduced.

## Calendar design and popup behavior

The shared calendar uses Fleetline theme tokens, a white surface, subtle border/shadow, rounded date cells, primary selected dates, a today indicator, muted outside-month dates, disabled-date styling, and visible keyboard focus.

The popup uses viewport-fixed positioning to avoid drawer/table overflow clipping. It flips above the control when there is insufficient space below, clamps horizontally to the viewport, repositions on resize/scroll, closes on outside click or Escape, and restores focus after keyboard closure. On viewports up to 480px it becomes a viewport-safe bottom presentation with touch-friendly date cells.

## Accessibility

- Explicit accessible names are supplied for every date control.
- Existing labels target the shared picker button through its configurable ID.
- Calendar heading changes use a polite live region.
- Previous/next month and clear actions have accessible names.
- Date buttons expose gridcell, selected, disabled, and date-label semantics.
- Arrow keys move by day/week; Enter/Space activate native buttons.
- Focus indicators use the existing accessible primary focus treatment.
- Reduced-motion preferences are respected.

## Booking and maintenance regression protection

Booking form control names, validators, return-date minimum, group range validation, duration behavior, billing calculations, and request mapping were not changed. The shared component returns the same `YYYY-MM-DD` string previously produced by native date inputs.

Maintenance retains its existing `scheduledDate` form control, required validation, and save mapping. The picker performs no UTC conversion, preventing a UI-driven one-day shift.

## Timezone validation

The component parses and formats date-only strings by numeric year/month/day parts instead of UTC conversion. Unit coverage verifies that a year-boundary date remains the same displayed calendar date. This is stable for Asia/Kolkata, UTC boundaries, leap dates, and daylight-saving locales because no instant is created for the form value.

## Years dropdown correction

The Your Fleet year filter now derives a computed, normalized set from loaded vehicles. String-like API years are converted to numbers, duplicates are removed, invalid/out-of-range values are excluded, and results are sorted newest first. Existing filtering and API behavior remain unchanged.

## Verification results

- Angular unit tests: 8 passed across 4 files.
- Shared picker tests cover date-only preservation, minimum-date enforcement, and ControlValueAccessor change propagation.
- Angular production build passed.
- Backend TypeScript build passed.
- Backend tests: 17 passed across 2 files.
- Backend date contracts and database columns were not modified.

## Remaining limitations

- Automated browser screenshots at every requested viewport are not part of the current test environment.
- There are currently no date-time or month/year use cases to validate.
- Native browser locale text is no longer used; the shared display is intentionally standardized to `dd-mm-yyyy` while form values remain ISO date-only strings.
