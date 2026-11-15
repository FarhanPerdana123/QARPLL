import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model: Katalog Film & Jadwal Tayang (Versi 3 - Production Grade)
 * 
 * Refactored oleh Principal QA Automation Engineer:
 * - Menangani explicit state transitions dan loading spinner detasemen.
 * - Mengeliminasi race conditions saat pergantian rute dan hidrasi komponen.
 */
export class MoviePage {
  readonly page: Page;

  readonly movieCard: Locator;
  readonly movieTitle: Locator;
  readonly bookNowButton: Locator;
  readonly bannerMovieTitle: Locator;
  readonly dateCards: Locator;
  readonly loadingScreen: Locator;

  constructor(page: Page) {
    this.page = page;

    this.movieCard = page.locator('.movie-card').first();
    this.movieTitle = this.movieCard.locator('h4');
    this.bookNowButton = this.movieCard.locator('.btn.secondary, button:has-text("Book Now")');
    this.bannerMovieTitle = page.locator('.selection-header-banner .header-content h1');
    this.dateCards = page.locator('.date-bar .date-card');
    this.loadingScreen = page.locator('.loading-screen');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/home');
    await expect(this.page).toHaveURL(/.*(home|movies)/);
    await expect(this.movieCard).toBeVisible({ timeout: 10000 });
  }

  async selectFirstNowShowingMovie(): Promise<string> {
    await expect(this.movieCard).toBeVisible();
    const title = (await this.movieTitle.textContent())?.trim() || '';
    expect(title.length).toBeGreaterThan(0);

    await this.movieCard.hover();
    await expect(this.bookNowButton).toBeVisible();
    await this.bookNowButton.click();

    // Verifikasi URL dan tunggu loading screen selesai
    await expect(this.page).toHaveURL(/.*buy-tickets\/.+/);
    if (await this.loadingScreen.isVisible()) {
      await this.loadingScreen.waitFor({ state: 'hidden', timeout: 10000 });
    }

    await expect(this.bannerMovieTitle).toBeVisible();
    await expect(this.bannerMovieTitle).toHaveText(title);

    return title;
  }

  async selectShowtime(targetTime: string = '19:00'): Promise<void> {
    // Pastikan loading screen tidak menghalangi
    if (await this.loadingScreen.isVisible()) {
      await this.loadingScreen.waitFor({ state: 'hidden', timeout: 10000 });
    }

    const activeDate = this.dateCards.first();
    if (await activeDate.isVisible()) {
      await activeDate.click();
    }

    const targetShowtimeBtn = this.page.locator('.scope-time-btn').filter({
      has: this.page.locator('.time-text', { hasText: new RegExp(targetTime + '|07:00\\s*PM|7:00\\s*PM', 'i') })
    }).first();

    await expect(targetShowtimeBtn).toBeVisible({ timeout: 10000 });
    await expect(targetShowtimeBtn).not.toHaveClass(/locked/);
    await expect(targetShowtimeBtn).toBeEnabled();

    await targetShowtimeBtn.click();
    await expect(this.page).toHaveURL(/.*(booking|seats)\/.+/);
  }
}
