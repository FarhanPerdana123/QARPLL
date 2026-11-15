import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Konfigurasi Eksekusi Terisolasi untuk Baseline V1
 * File: experiments/playwright.v1.config.ts
 *
 * Mengisolasi target pengujian ke experiments/v1/cinema-booking.v1.spec.ts
 * Menggunakan frontend server yang sudah aktif di http://localhost:3000 (webServer dinonaktifkan).
 * Menyimpan report HTML, JSON, log, screenshot, dan trace ke folder artifacts ber-timestamp.
 */

const runId = process.env.V1_RUN_ID || 'run-initial';
const artifactsDir = process.env.V1_ARTIFACTS_DIR || path.resolve(__dirname, '..', 'artifacts', 'execution', 'v1', runId);

export default defineConfig({
  testDir: path.resolve(__dirname, 'v1'),
  testMatch: 'cinema-booking.v1.spec.ts',
  globalTimeout: 180 * 1000,
  timeout: 45 * 1000,
  expect: {
    timeout: 8 * 1000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  repeatEach: 1,
  outputDir: path.join(artifactsDir, 'test-results'),
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(artifactsDir, 'html-report'), open: 'never' }],
    ['json', { outputFile: path.join(artifactsDir, 'report.json') }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
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
  // webServer dinonaktifkan karena frontend telah dijalankan manual di http://localhost:3000
});
