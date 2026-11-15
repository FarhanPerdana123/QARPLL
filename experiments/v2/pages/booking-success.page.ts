import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Booking Success & Confirmation Page (/booking-success)
 * File: experiments/v2/pages/booking-success.page.ts
 */
export class BookingSuccessPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly confirmationText: Locator;
  readonly refText: Locator;
  readonly backHomeButton: Locator;
  readonly myBookingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'BOOKING SUCCESSFUL!' });
    this.confirmationText = page.getByText('Your tickets have been confirmed.');
    this.refText = page.locator('.ref-text');
    this.backHomeButton = page.locator('button.confirm-btn', { hasText: 'BACK TO HOME' });
    this.myBookingsButton = page.locator('button.history-btn', { hasText: 'VIEW MY BOOKINGS' });
  }

  async verifySuccessPage() {
    await expect(this.page).toHaveURL(/\/booking-success/);
    await expect(this.heading).toBeVisible();
    await expect(this.confirmationText).toBeVisible();
    await expect(this.refText).toBeVisible();
    await expect(this.refText).toContainText('#');
    await expect(this.backHomeButton).toBeVisible();
    await expect(this.myBookingsButton).toBeVisible();
  }
}
