import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent, IconName } from '../../shared/icons/icon.component';
import type { PermissionCode } from '../../core/models/rbac.models';
import { PermissionService } from '../../core/services/permission.service';
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeMenus()' },
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  readonly permissions = inject(PermissionService);
  private readonly document = inject(DOCUMENT);
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly navigation: {
    label: string;
    path: string;
    icon: IconName;
    section?: string;
    permission: PermissionCode;
  }[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard',
      section: 'RENTALS',
      permission: 'dashboard.view',
    },
    {
      label: 'Book vehicle',
      path: '/book-vehicle',
      icon: 'bookVehicle',
      permission: 'bookings.create',
    },
    { label: 'Vehicles', path: '/vehicles', icon: 'vehicle', permission: 'vehicles.view' },
    { label: 'Bookings', path: '/bookings', icon: 'booking', permission: 'bookings.view' },
    { label: 'Customers', path: '/customers', icon: 'customer', permission: 'customers.view' },
    {
      label: 'Customer ledger',
      path: '/customer-ledger',
      icon: 'ledger',
      permission: 'ledger.view',
    },
    {
      label: 'Admin users',
      path: '/admin-users',
      icon: 'shield',
      section: 'MANAGEMENT',
      permission: 'users.view',
    },
    {
      label: 'Roles & permissions',
      path: '/roles-permissions',
      icon: 'shield',
      permission: 'roles.view',
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
    effect(() => {
      this.document.body.classList.toggle('navigation-open', this.mobileOpen());
      return () => this.document.body.classList.remove('navigation-open');
    });
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
