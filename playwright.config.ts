import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 3,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'msedge' } },
  ],
  webServer: {
    command: 'npm.cmd run start:web -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
