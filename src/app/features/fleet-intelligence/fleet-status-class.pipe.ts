import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fleetStatusClass', standalone: true, pure: true })
export class FleetStatusClassPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (['HEALTHY', 'COMPLETED', 'RESOLVED', 'ACTIVE', 'PASSED', 'ONLINE'].includes(value ?? '')) return 'fleet-status--success';
    if (['DUE', 'DUE_SOON', 'ATTENTION', 'ATTENTION_RECOMMENDED', 'ACKNOWLEDGED', 'WARNING', 'STALE'].includes(value ?? '')) return 'fleet-status--warning';
    if (['OVERDUE', 'CRITICAL', 'MAINTENANCE_REQUIRED', 'FAILED'].includes(value ?? '')) return 'fleet-status--danger';
    if (['IN_PROGRESS', 'SCHEDULED', 'PLANNED', 'INFORMATION', 'OPEN'].includes(value ?? '')) return 'fleet-status--info';
    return 'fleet-status--neutral';
  }
}
