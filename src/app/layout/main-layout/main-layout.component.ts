import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent, IconName } from '../../shared/icons/icon.component';
import type { PermissionCode } from '../../core/models/rbac.models';
import { PermissionService } from '../../core/services/permission.service';
import { FeedbackService } from '../../core/services/feedback.service';
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMenus()',
    '(window:focus)': 'refreshAuthorization()',
    '(document:visibilitychange)': 'visibilityChanged()',
  },
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  readonly permissions = inject(PermissionService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(FeedbackService);
  readonly refreshingAuthorization = signal(false);
  readonly roleLabel = computed(() => {
    const labels = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      STAFF: 'Staff',
    } as const;
    const role = this.auth.user()?.role;
    return role ? labels[role] : '';
  });
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
    this.router.events
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

  visibilityChanged(): void {
    if (this.document.visibilityState === 'visible') void this.refreshAuthorization();
  }

  async refreshAuthorization(): Promise<void> {
    if (this.refreshingAuthorization()) return;
    this.refreshingAuthorization.set(true);
    const before = [...this.permissions.permissions()];
    try {
      await firstValueFrom(this.auth.refreshAuthorization());
      const after = this.permissions.permissions();
      if (
        before.length === after.length &&
        before.every((permission) => after.includes(permission))
      )
        return;
      this.feedback.toast(
        'Your access permissions have been updated. Some modules or actions may no longer be available.',
        'info',
      );
      let active = this.route;
      while (active.firstChild) active = active.firstChild;
      const required = active.snapshot.data['permission'] as PermissionCode | undefined;
      if (required && !this.permissions.has(required))
        await this.router.navigateByUrl(this.firstAuthorizedRoute());
    } catch {
      return;
    } finally {
      this.refreshingAuthorization.set(false);
    }
  }

  private firstAuthorizedRoute(): string {
    return (
      this.navigation.find((item) => this.permissions.has(item.permission))?.path ?? '/profile'
    );
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
