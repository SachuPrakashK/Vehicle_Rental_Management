# Fleetline RBAC Permission Matrix

Permission codes are lowercase stable identifiers. UI labels may use title case.

## Default roles

| Permission            | Staff | Admin | Super Admin |
| --------------------- | :---: | :---: | :---------: |
| `dashboard.view`      |  Yes  |  Yes  |     Yes     |
| `vehicles.view`       |  Yes  |  Yes  |     Yes     |
| `vehicles.create`     |  No   |  Yes  |     Yes     |
| `vehicles.edit`       |  No   |  Yes  |     Yes     |
| `vehicles.delete`     |  No   |  Yes  |     Yes     |
| `bookings.view`       |  Yes  |  Yes  |     Yes     |
| `bookings.create`     |  Yes  |  Yes  |     Yes     |
| `bookings.edit`       |  Yes  |  Yes  |     Yes     |
| `bookings.cancel`     |  No   |  Yes  |     Yes     |
| `bookings.delete`     |  No   |  Yes  |     Yes     |
| `customers.view`      |  Yes  |  Yes  |     Yes     |
| `customers.create`    |  Yes  |  Yes  |     Yes     |
| `customers.edit`      |  Yes  |  Yes  |     Yes     |
| `customers.delete`    |  No   |  Yes  |     Yes     |
| `ledger.view`         |  No   |  Yes  |     Yes     |
| `ledger.create`       |  No   |  Yes  |     Yes     |
| `ledger.edit`         |  No   |  Yes  |     Yes     |
| `ledger.export`       |  No   |  Yes  |     Yes     |
| `reports.view`        |  No   |  Yes  |     Yes     |
| `reports.export`      |  No   |  Yes  |     Yes     |
| `users.*`             |  No   |  No   |     Yes     |
| `roles.*`             |  No   |  No   |     Yes     |
| `authorization.audit` |  No   |  No   |     Yes     |

## Dependencies

Create, edit, delete, cancel, and export permissions should be assigned with the corresponding view permission. The Roles & Permissions UI groups actions by module. The backend remains deny-by-default and never derives an unrelated permission from another permission.

Super Admin receives the full registry and its core authority is protected from permission editing. Custom roles receive only explicitly assigned permissions. Inactive roles grant nothing.
