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
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  await page.goto('/auth/register');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();
  await page.goto('/auth/forgot-password');
  await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
  await page.goto('/auth/reset-password?token=test-token');
  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible();
});

test('mobile navigation opens and reaches customers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await signIn(page);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  const customerLink = page
    .locator('#main-navigation')
    .getByRole('link', { name: 'Customers', exact: true });
  await expect(customerLink).toBeVisible();
  await customerLink.click();
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
});
