# Smart Fleet RBAC Matrix

| Capability | Super Admin | Admin default | Staff default |
| --- | --- | --- | --- |
| Overview | Full | View | View |
| Maintenance | Full | View/create/edit/complete | View/create |
| Vehicle health | Full | View/assess | View |
| Precise tracking | Full | Not assigned by default | Not assigned |
| Device mapping | Full | Not assigned by default | Not assigned |
| Geofences | Full | Not assigned by default | Not assigned |
| Alerts | Full | View/acknowledge/resolve | View/acknowledge |
| Analytics/forecasting | Full | View/export/view | View/view |

Super Admin can change assignments through the existing database-driven Roles & Permissions module. Angular permission checks provide UX only; every API route independently enforces authorization.
