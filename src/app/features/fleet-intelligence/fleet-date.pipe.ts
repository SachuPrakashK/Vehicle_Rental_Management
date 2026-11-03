import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({ name: 'fleetDate', standalone: true, pure: true })
export class FleetDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly
      ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
      : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: dateOnly ? 'UTC' : 'Asia/Kolkata',
    }).format(date);
  }
}
