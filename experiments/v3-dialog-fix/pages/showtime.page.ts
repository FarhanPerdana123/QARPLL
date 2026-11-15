import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Showtime Selection Page (/buy-tickets/:movieId)
 * File: experiments/v3-dialog-fix/pages/showtime.page.ts
 */
export class ShowtimeSelectionPage {
  readonly page: Page;
  readonly pageContainer: Locator;
  readonly headerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('.selection-page');
    this.headerTitle = page.locator('.header-content h1');
  }

  async verifyPageLoaded(movieId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/buy-tickets/${movieId}`));
    await expect(this.pageContainer).toBeVisible();
  }

  async verifyMovieInfo(title: string, duration: number, rating: number) {
    await expect(this.headerTitle).toHaveText(title);
    await expect(this.page.locator('.header-content .meta-tags')).toContainText(`${duration} mins`);
    await expect(this.page.locator('.header-content .meta-tags')).toContainText(`${rating}`);
  }

  async selectShowtime(hallName: string, startTime: string) {
    const hallRow = this.page.locator('.scope-hall-row', { hasText: hallName });
    await expect(hallRow).toBeVisible();
    const timeBtn = hallRow.locator('.scope-time-btn', { hasText: startTime });
    await expect(timeBtn).toBeVisible();
    await timeBtn.click();
  }
}
