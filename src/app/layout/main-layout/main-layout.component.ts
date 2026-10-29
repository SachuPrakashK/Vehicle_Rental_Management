import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent, IconName } from '../../shared/icons/icon.component';
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeMenus()' },
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly navigation: {
    label: string;
    path: string;
    icon: IconName;
    section?: string;
    superAdmin?: boolean;
  }[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', section: 'RENTALS' },
    { label: 'Book vehicle', path: '/book-vehicle', icon: 'bookVehicle' },
    { label: 'Vehicles', path: '/vehicles', icon: 'vehicle' },
    { label: 'Bookings', path: '/bookings', icon: 'booking' },
    { label: 'Customers', path: '/customers', icon: 'customer' },
    { label: 'Customer ledger', path: '/customer-ledger', icon: 'ledger' },
    {
      label: 'Admin users',
      path: '/admin-users',
      icon: 'shield',
      section: 'MANAGEMENT',
      superAdmin: true,
    },
  ];
  constructor() {
    const router = inject(Router);
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenus());
  }
  toggleSidebar(): void {
    if (window.matchMedia('(max-width: 850px)').matches) this.mobileOpen.update((value) => !value);
    else this.collapsed.update((value) => !value);
  }

  closeMobileNavigation(): void {
    this.mobileOpen.set(false);
  }

  toggleProfileMenu(): void {
    this.profileOpen.update((value) => !value);
  }

  closeMenus(): void {
    this.mobileOpen.set(false);
    this.profileOpen.set(false);
  }

  signOut(): void {
    this.profileOpen.set(false);
    void this.auth.logout();
  }
}
