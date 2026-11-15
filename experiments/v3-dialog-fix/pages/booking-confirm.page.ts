import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Booking Confirmation Page (/create-booking)
 * File: experiments/v3-dialog-fix/pages/booking-confirm.page.ts
 */
export class BookingConfirmPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly summaryDetails: Locator;
  readonly priceSection: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'CONFIRM BOOKING' });
    this.summaryDetails = page.locator('.summary-details');
    this.priceSection = page.locator('.price-section');
    this.confirmButton = page.locator('button.confirm-btn', { hasText: 'CONFIRM & PAY NOW' });
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/create-booking/);
    await expect(this.heading).toBeVisible();
  }

  async verifyBookingDetails(movieTitle: string, seatLabel: string, totalPrice: string) {
    await expect(this.summaryDetails).toContainText(movieTitle);
    await expect(this.summaryDetails).toContainText(seatLabel);
    await expect(this.priceSection).toContainText(totalPrice);
  }

  async confirmBooking() {
    await expect(this.confirmButton).toBeVisible();
    await this.confirmButton.click();
  }
}
