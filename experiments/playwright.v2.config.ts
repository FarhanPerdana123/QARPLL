import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Konfigurasi Eksekusi Terisolasi untuk Baseline V2
 * File: experiments/playwright.v2.config.ts
 *
 * Mengisolasi target pengujian ke experiments/v2/cinema-booking.v2.spec.ts
 * Menggunakan frontend server yang sudah aktif di http://localhost:3000 (tanpa webServer).
 * Menggunakan parameter yang setara dengan eksekusi V1:
 * - Chromium headless
 * - Viewport: 1280x720
 * - workers: 1, retries: 0, repeatEach: 1
 * - timeout per test: 45 detik, globalTimeout: 180 detik
 * - screenshot: only-on-failure, trace: retain-on-failure, video: retain-on-failure
 * - reporter: list, HTML, JSON
 */

const runId = process.env.V2_RUN_ID || 'run-initial';
const artifactsDir = process.env.V2_ARTIFACTS_DIR || path.resolve(__dirname, '..', 'artifacts', 'execution', 'v2', runId);

export default defineConfig({
  testDir: path.resolve(__dirname, 'v2'),
  testMatch: 'cinema-booking.v2.spec.ts',
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
