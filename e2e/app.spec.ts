import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const api = '**/api/CarRentalApp/**';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => process.stderr.write(error.message + '\n'));
  let authenticated = false;
  const user = {
    id: 'user-1',
    firstName: 'Fleet',
    lastName: 'Manager',
    email: 'manager@example.com',
    phone: '9876543210',
    role: 'ADMIN',
    profileImage: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
    roles: [],
    permissions: [
      'dashboard.view',
      'vehicles.view',
      'vehicles.create',
      'vehicles.edit',
      'bookings.view',
      'bookings.create',
      'customers.view',
      'customers.create',
      'customers.edit',
      'ledger.view',
      'users.view',
      'users.create',
      'users.edit',
      'users.deactivate',
      'users.assign_role',
      'roles.view',
      'roles.create',
      'roles.edit',
      'roles.delete',
      'roles.assign_permissions',
    ],
  };
  await page.route('**/api/auth/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/login')) {
      authenticated = true;
      await route.fulfill({
        json: {
          success: true,
          message: 'Login successful.',
          data: { user, accessToken: 'test-access-token' },
        },
      });
      return;
    }
    if (path.endsWith('/refresh-token') && !authenticated) {
      await route.fulfill({
        status: 401,
        json: { success: false, message: 'Invalid refresh session.', errors: [] },
      });
      return;
    }
    if (path.endsWith('/bikes')) {
      await route.fulfill({ json: { success: true, message: 'Success.', data: [] } });
      return;
    }
    if (path.endsWith('/me/permissions')) {
      await route.fulfill({
        json: {
          success: true,
          message: 'Permissions loaded.',
          data: { roles: user.roles ?? [], permissions: user.permissions },
        },
      });
      return;
    }
    await route.fulfill({
      json: {
        success: true,
        message: 'Success.',
        data: path.endsWith('/me') ? user : { user, accessToken: 'test-access-token' },
      },
    });
  });
  await page.route('**/api/bikes', async (route) => {
    await route.fulfill({ json: { success: true, message: 'Success.', data: [] } });
  });
  const permissions = [
    {
      id: 'permission-1',
      module: 'Dashboard',
      action: 'View',
      code: 'dashboard.view',
      description: 'View the dashboard.',
    },
    {
      id: 'permission-2',
      module: 'Vehicles',
      action: 'View',
      code: 'vehicles.view',
      description: 'View vehicles.',
    },
    {
      id: 'permission-3',
      module: 'Vehicles',
      action: 'Create',
      code: 'vehicles.create',
      description: 'Create vehicles.',
    },
    {
      id: 'permission-4',
      module: 'Vehicles',
      action: 'Edit',
      code: 'vehicles.edit',
      description: 'Edit vehicles.',
    },
    {
      id: 'permission-5',
      module: 'Bookings',
      action: 'View',
      code: 'bookings.view',
      description: 'View bookings.',
    },
    {
      id: 'permission-6',
      module: 'Bookings',
      action: 'Create',
      code: 'bookings.create',
      description: 'Create bookings.',
    },
  ];
  const roles = [
    {
      id: 'role-admin',
      name: 'Admin',
      code: 'ADMIN',
      description: 'Rental operations administrator.',
      isSystemRole: true,
      isActive: true,
      version: 1,
      assignedUsers: 2,
      permissions: [permissions[0], permissions[1], permissions[4]],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'role-super-admin',
      name: 'Super Admin',
      code: 'SUPER_ADMIN',
      description: 'Protected system administration role.',
      isSystemRole: true,
      isActive: true,
      version: 1,
      assignedUsers: 1,
      permissions,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];
  await page.route('**/api/authorization/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'PUT' && path.endsWith('/role-admin/permissions')) {
      const body = route.request().postDataJSON() as { permissionIds: string[] };
      roles[0] = {
        ...roles[0],
        version: roles[0].version + 1,
        permissions: permissions.filter((permission) => body.permissionIds.includes(permission.id)),
      };
      await route.fulfill({ json: { success: true, message: 'Saved.', data: roles[0] } });
      return;
    }
    if (path === '/api/authorization/permissions') {
      await route.fulfill({ json: { success: true, message: 'Success.', data: permissions } });
      return;
    }
    await route.fulfill({ json: { success: true, message: 'Success.', data: roles } });
  });
  await page.route(api, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/GetDashboardData')
      ? [
          {
            totalCars: 2,
            totalCustomers: 3,
            totalBookings: 4,
            todaysBooking: 1,
            todayTotalAmount: 1200,
            totalAmount: 8900,
          },
        ]
      : path.endsWith('/GetCars')
        ? [
            {
              carId: 1,
              brand: 'Tata',
              model: 'Nexon',
              year: 2025,
              color: 'Blue',
              dailyRate: 2200,
              carImage: null,
              regNo: 'MH01AB1234',
            },
          ]
        : path.endsWith('/GetCustomers')
          ? [
              {
                customerId: 1,
                customerName: 'Aarav Shah',
                customerCity: 'Pune',
                mobileNo: '9876543210',
                email: 'aarav@example.com',
              },
            ]
          : path.endsWith('/geAllBookings')
            ? [
                {
                  bookingId: 1,
                  bookingDate: '2026-09-24T00:00:00',
                  discount: 0,
                  totalBillAmount: 2200,
                  customerName: 'Aarav Shah',
                  mobileNo: '9876543210',
                  brand: 'Tata',
                  model: 'Nexon',
                  bookingUid: 'Rent-1001',
                },
              ]
            : [];
    await route.fulfill({ json: { message: '', result: true, data } });
  });
});

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill('manager@example.com');
  await page.locator('#auth-password').fill('StrongPassword@123');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/dashboard/);
}

test('signs in and renders dashboard data', async ({ page }) => {
  await signIn(page);
  await expect(page.getByText('Total vehicles')).toBeVisible();
  await expect(page).toHaveTitle('Dashboard | Fleetline');
  await expect(page.getByText('Rent-1001')).toBeVisible();
  const period = page.getByLabel('Booking overview period');
  await expect(period).toHaveValue('6');
  await expect(period.locator('option:checked')).toHaveText('Last 6 months');
  const results = await new AxeBuilder({ page }).exclude('.chart-container').analyze();
  expect(results.violations).toEqual([]);
});

test('shows required validation and opens vehicle drawer', async ({ page }) => {
  await signIn(page);
  if (test.info().project.name === 'mobile') {
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
  }
  await page
    .locator('#main-navigation')
    .getByRole('link', { name: 'Vehicles', exact: true })
    .click();
  await expect(page.getByText('Tata')).toBeVisible();
  await page.getByRole('button', { name: 'Add vehicle' }).click();
  await expect(page.getByRole('button', { name: 'Create vehicle' })).toBeDisabled();
  const dimensions = await page.locator('dialog.drawer').evaluate((drawer) => {
    const content = drawer.querySelector('.drawer-content') as HTMLElement;
    const footer = drawer.querySelector('.drawer-footer') as HTMLElement;
    return {
      drawerClientWidth: drawer.clientWidth,
      drawerScrollWidth: drawer.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      contentOverflowY: getComputedStyle(content).overflowY,
      footerBottom: footer.getBoundingClientRect().bottom,
      viewportHeight: innerHeight,
    };
  });
  expect(dimensions.drawerScrollWidth).toBe(dimensions.drawerClientWidth);
  expect(dimensions.bodyScrollWidth).toBe(dimensions.bodyClientWidth);
  expect(dimensions.contentOverflowY).toBe('auto');
  expect(Math.round(dimensions.footerBottom)).toBe(dimensions.viewportHeight);
});

test('customer rows navigate while actions stay on the listing', async ({ page }) => {
  await signIn(page);
  await page.goto('/customers');
  await page
    .getByRole('row', { name: /Aarav Shah/ })
    .getByRole('cell')
    .first()
    .click();
  await expect(page).toHaveURL(/\/customers\/1$/);
  await expect(page.getByRole('heading', { name: 'Customer details' })).toBeVisible();
  await page.goto('/customers');
  await page.getByRole('button', { name: 'Actions for Aarav Shah' }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
});

test('booking rows navigate while actions stay on the listing', async ({ page }) => {
  await signIn(page);
  await page.goto('/bookings');
  await page
    .getByRole('row', { name: /Rent-1001/ })
    .getByRole('cell')
    .first()
    .click();
  await expect(page).toHaveURL(/\/bookings\/1$/);
  await expect(page.getByRole('heading', { name: 'Booking details' })).toBeVisible();
  await page.goto('/bookings');
  await page.getByRole('button', { name: 'Actions for booking 1' }).click();
  await expect(page).toHaveURL(/\/bookings$/);
  await expect(page.getByRole('menuitem', { name: 'View' })).toBeVisible();
});

test('authentication pages retain focused forms and shared layout', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page).toHaveTitle('Login | Fleetline');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  await page.goto('/auth/register');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect(page).toHaveTitle('Register | Fleetline');
  await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();
  await page.goto('/auth/forgot-password');
  await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
  await expect(page).toHaveTitle('Forgot Password | Fleetline');
  await page.goto('/auth/reset-password?token=test-token');
  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible();
  await expect(page).toHaveTitle('Reset Password | Fleetline');
});

test('password recovery presents confirmation and validates reset form', async ({ page }) => {
  await page.goto('/auth/forgot-password');
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeDisabled();
  await page.getByLabel('Email address').fill('manager@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.locator('.notice[role="status"]')).toContainText(
    'If an account exists with this email address, you will receive a password reset link shortly.',
  );

  await page.goto('/auth/reset-password?token=' + 'x'.repeat(64));
  await expect(page.getByLabel('New password')).toBeVisible();
  await page.getByLabel('New password').fill('UpdatedPassword@123');
  await page.getByLabel('Confirm password').fill('DifferentPassword@123');
  await expect(page.getByText('Passwords must match.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset password' })).toBeDisabled();
  await page.getByLabel('Confirm password').fill('UpdatedPassword@123');
  await page.getByRole('button', { name: 'Show password' }).first().click();
  await expect(page.getByLabel('New password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page).toHaveTitle('Login | Fleetline');
});

test('browser titles follow direct, nested, and history navigation', async ({ page }) => {
  await signIn(page);
  const routes: Array<[string, string]> = [
    ['/vehicles', 'Vehicles | Fleetline'],
    ['/customers', 'Customers | Fleetline'],
    ['/customers/1', 'Customer Details | Fleetline'],
    ['/book-vehicle', 'Book Vehicle | Fleetline'],
    ['/bookings', 'Bookings | Fleetline'],
    ['/bookings/1', 'Booking Details | Fleetline'],
    ['/customer-ledger', 'Customer Ledger | Fleetline'],
    ['/profile', 'My Profile | Fleetline'],
  ];
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
  }
  await page.goBack();
  await expect(page).toHaveTitle('Customer Ledger | Fleetline');
  await page.goForward();
  await expect(page).toHaveTitle('My Profile | Fleetline');
});

test('primary routes do not create page-level horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const viewports = [
    { width: 320, height: 720 },
    { width: 375, height: 812 },
    { width: 425, height: 860 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(overflow.page).toBeLessThanOrEqual(overflow.viewport);
    if (viewport.width === 768) {
      const visualHeight = await page
        .locator('.auth-story')
        .evaluate((element) => Math.round(element.getBoundingClientRect().height));
      expect(visualHeight).toBe(viewport.height);
    }
  }
  await page.setViewportSize({ width: 320, height: 720 });
  await signIn(page);
  for (const route of [
    '/dashboard',
    '/vehicles',
    '/bookings',
    '/customers',
    '/book-vehicle',
    '/customer-ledger',
    '/profile',
  ]) {
    await page.goto(route);
    await expect(page.locator('#main-content')).toBeVisible();
    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(overflow.page, `${route} overflowed at 320px`).toBeLessThanOrEqual(overflow.viewport);
  }
});

test('authentication pages keep scrolling inside a hidden-scrollbar form pane', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const routes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password?token=' + 'x'.repeat(64),
  ];
  const viewports = [
    { width: 375, height: 667 },
    { width: 768, height: 600 },
    { width: 1366, height: 650 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('app-auth-layout')).toBeVisible();
      const dimensions = await page.evaluate(() => {
        const pane = document.querySelector<HTMLElement>('.auth-form-side');
        return {
          documentHeight: document.documentElement.scrollHeight,
          viewportHeight: document.documentElement.clientHeight,
          paneOverflow: pane ? getComputedStyle(pane).overflowY : '',
          paneScrollbarWidth: pane ? getComputedStyle(pane).scrollbarWidth : '',
        };
      });
      expect(dimensions.documentHeight, `${route} created a page scrollbar`).toBeLessThanOrEqual(
        dimensions.viewportHeight,
      );
      expect(dimensions.paneOverflow).toBe('auto');
      expect(dimensions.paneScrollbarWidth).toBe('none');
    }
  }
});

test('register form uses two columns when space permits', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/auth/register');
  const form = page.locator('.auth-register-form');
  await expect(form).toBeVisible();
  await expect
    .poll(() =>
      form.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
    )
    .toBe(2);
  await page.setViewportSize({ width: 768, height: 800 });
  await expect
    .poll(() =>
      form.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
    )
    .toBe(1);
});

test('permission editor supports grouped responsive selection and protected roles', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await signIn(page);
  await page.goto('/roles-permissions');
  await expect(page.getByRole('heading', { name: 'Roles & permissions' })).toBeVisible();
  await page.getByRole('button', { name: 'Permissions' }).first().click();
  const drawer = page.getByRole('dialog', { name: /Permissions · Admin/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('3', { exact: true })).toBeVisible();
  const globalSelectAll = drawer.locator('.permission-select-all input');
  await expect(globalSelectAll).toHaveJSProperty('indeterminate', true);
  const vehicles = drawer.locator('.permission-group').filter({ hasText: 'Vehicles' });
  await expect(vehicles.locator('.permission-module-all input')).toHaveJSProperty(
    'indeterminate',
    true,
  );
  const createVehicle = vehicles
    .locator('.permission-option')
    .filter({ hasText: 'vehicles.create' });
  await createVehicle.click();
  await expect(drawer.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  await drawer.getByRole('button', { name: 'Save changes' }).click();
  await expect(drawer).toBeHidden();
  await page.getByRole('button', { name: 'Permissions' }).first().click();
  await expect(
    page
      .getByRole('dialog', { name: /Permissions · Admin/ })
      .locator('.permission-option')
      .filter({ hasText: 'vehicles.create' })
      .locator('input'),
  ).toBeChecked();
  for (const width of [320, 375, 425, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: width < 768 ? 720 : 800 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      drawerWidth:
        document.querySelector<HTMLDialogElement>('.drawer.wide')?.getBoundingClientRect().width ??
        0,
    }));
    expect(dimensions.drawerWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  }
  await page
    .getByRole('dialog', { name: /Permissions · Admin/ })
    .getByRole('button', { name: 'Cancel' })
    .click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'Permissions' }).nth(1).click();
  const protectedDrawer = page.getByRole('dialog', { name: /Permissions · Super Admin/ });
  await expect(protectedDrawer.getByText(/protected and shown as read-only/)).toBeVisible();
  await expect(protectedDrawer.locator('.permission-option input').first()).toBeDisabled();
});

test('mobile navigation opens and reaches customers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await signIn(page);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
    .toBe('hidden');
  const customerLink = page
    .locator('#main-navigation')
    .getByRole('link', { name: 'Customers', exact: true });
  await expect(customerLink).toBeVisible();
  await customerLink.click();
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
    .not.toBe('hidden');
});
