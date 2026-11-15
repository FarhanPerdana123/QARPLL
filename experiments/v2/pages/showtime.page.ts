import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Showtime Selection Page (/buy-tickets/:movieId)
 * File: experiments/v2/pages/showtime.page.ts
 */
export class ShowtimeSelectionPage {
  readonly page: Page;
  readonly pageContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('.selection-page');
  }

  async verifyPageLoaded(movieId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/buy-tickets/${movieId}`));
    await expect(this.pageContainer).toBeVisible();
  }

  async selectShowtime(hallName: string, startTime: string) {
    const hallRow = this.page.locator('.scope-hall-row', { hasText: hallName });
    await expect(hallRow).toBeVisible();
    const timeBtn = hallRow.locator('.scope-time-btn', { hasText: startTime });
    await expect(timeBtn).toBeVisible();
    await timeBtn.click();
  }
}
