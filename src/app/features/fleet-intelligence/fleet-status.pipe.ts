import { Pipe, PipeTransform } from '@angular/core';

/** Presentation only: preserve API status codes for logic and persistence. */
@Pipe({ name: 'fleetStatus', standalone: true, pure: true })
export class FleetStatusPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return 'Unknown';
    const labels: Record<string, string> = {
      DUE: 'Due for Service', DUE_SOON: 'Due Soon', IN_PROGRESS: 'In Progress',
      ATTENTION_RECOMMENDED: 'Attention Recommended', MAINTENANCE_REQUIRED: 'Maintenance Required',
      PLANNED: 'Planned', INFORMATION: 'Information', ACKNOWLEDGED: 'Acknowledged',
      OPEN: 'Open', RESOLVED: 'Resolved', SCHEDULED: 'Scheduled', COMPLETED: 'Completed',
      CANCELLED: 'Cancelled', HEALTHY: 'Healthy', ACTIVE: 'Active', INACTIVE: 'Inactive',
      OVERDUE: 'Overdue', CRITICAL: 'Critical', WARNING: 'Warning',
      PASSED: 'Passed', FAILED: 'Failed', ATTENTION: 'Attention',
      ONLINE: 'Online', OFFLINE: 'Offline', STALE: 'Stale', UNKNOWN: 'Unknown',
    };
    return labels[value] ?? value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
