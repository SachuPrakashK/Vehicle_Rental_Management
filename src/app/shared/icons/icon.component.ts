import { ChangeDetectionStrategy, Component, input } from '@angular/core';
export const iconPaths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  vehicle: 'M5 17H3v-6l2-6h14l2 6v6h-2 M5 17h14 M5 17v3 M19 17v3 M3 11h18 M6 14h2 M16 14h2',
  customer:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.9',
  booking: 'M5 4h14v17H5z M9 2v4 M15 2v4 M8 11h8 M8 15h5',
  ledger: 'M4 3h15v18H4z M8 3v18 M11 8h5 M11 12h5 M11 16h3',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2',
  edit: 'm16 3 5 5-12 12-6 1 1-6z M14 5l5 5',
  delete: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  view: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  add: 'M12 5v14 M5 12h14',
  close: 'm6 6 12 12 M6 18 18 6',
  back: 'm12 5-7 7 7 7 M5 12h15',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  logout: 'M9 3H3v18h6 M10 12h11 M16 7l5 5-5 5',
  calendar: 'M3 5h18v16H3z M7 2v6 M17 2v6 M3 10h18 M7 14h3 M14 14h3',
  upload: 'M12 16V3 M7 8l5-5 5 5 M3 16v5h18v-5',
  success: 'M9 12l2 2 4-4 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  warning: 'm12 3 10 18H2z M12 9v5 M12 17v1',
  error: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M8 8l8 8 M8 16l8-8',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 11v6 M12 7v1',
  chevron: 'm9 5 7 7-7 7',
  money: 'M3 5h18v14H3z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M6 12h.1 M18 12h.1',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',
  moreVertical: 'M12 5h.01 M12 12h.01 M12 19h.01',
  bookVehicle:
    'M3 16v-5l2-5h10l2 5v5 M3 12h14 M6 15h2 M13 15h2 M5 16v3 M15 16v3 M18 4h4v5h-4z M20 2v4 M18 6h4',
} as const;
export type IconName = keyof typeof iconPaths;
@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input<IconName>('vehicle');
  readonly paths = iconPaths;
}
