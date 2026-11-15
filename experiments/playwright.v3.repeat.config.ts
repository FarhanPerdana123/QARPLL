import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Konfigurasi Eksekusi Terisolasi untuk Eksperimen Pengulangan Terbatas Baseline V3
 * File: experiments/playwright.v3.repeat.config.ts
 *
 * Parameter:
 * - Target: experiments/v3/cinema-booking.v3.spec.ts
 * - Frontend aktif di http://localhost:3000 (tanpa webServer)
 * - workers: 1, retries: 0
 * - repeatEach: 5 (5 kali per skenario = 15 instance eksekusi)
 * - timeout: 45s per test, globalTimeout: 300s
 * - Chromium headless (Viewport: 1280x720)
 * - screenshot: only-on-failure, trace: retain-on-failure, video: retain-on-failure
 * - reporter: terminal list, HTML (open: never), JSON
 */

const runId = process.env.V3_REPEAT_RUN_ID || 'run-repeat-initial';
const artifactsDir = process.env.V3_REPEAT_ARTIFACTS_DIR || path.resolve(__dirname, '..', 'artifacts', 'execution', 'v3-repeat', runId);

export default defineConfig({
  testDir: path.resolve(__dirname, 'v3'),
  testMatch: 'cinema-booking.v3.spec.ts',
  globalTimeout: 300 * 1000,
  timeout: 45 * 1000,
  expect: {
    timeout: 8 * 1000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  repeatEach: 5,
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
