import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration File
 * Standardized for Cinema Booking System E2E Automation
 */
export default defineConfig({
  testDir: './tests',
  /* Timeout per test: 45 detik */
  timeout: 45 * 1000,
  expect: {
    timeout: 8 * 1000,
  },
  /* Eksekusi berurutan untuk menjaga kebersihan state */
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    /* Base URL aplikasi React frontend */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    /* Kumpulkan trace jika test gagal untuk analisis akar masalah */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
