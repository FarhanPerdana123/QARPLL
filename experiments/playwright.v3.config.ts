import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Konfigurasi Eksekusi Terisolasi untuk Baseline V3
 * File: experiments/playwright.v3.config.ts
 *
 * Mengisolasi target pengujian ke experiments/v3/cinema-booking.v3.spec.ts
 * Menggunakan frontend server yang sudah aktif di http://localhost:3000 (tanpa webServer).
 * Parameter setara dengan run V2:
 * - Chromium headless
 * - Viewport: 1280x720
 * - workers: 1, retries: 0, repeatEach: 1
 * - timeout: 45s per test, globalTimeout: 180s
 * - screenshot: only-on-failure, trace: retain-on-failure, video: retain-on-failure
 * - reporter: list, HTML, JSON
 */

const runId = process.env.V3_RUN_ID || 'run-initial';
const artifactsDir = process.env.V3_ARTIFACTS_DIR || path.resolve(__dirname, '..', 'artifacts', 'execution', 'v3', runId);

export default defineConfig({
  testDir: path.resolve(__dirname, 'v3'),
  testMatch: 'cinema-booking.v3.spec.ts',
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
});
