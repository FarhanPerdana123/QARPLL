import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Booking Success & Confirmation Page (/booking-success)
 * File: experiments/v3-dialog-fix/pages/booking-success.page.ts
 */
export class BookingSuccessPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly confirmationText: Locator;
  readonly refText: Locator;
  readonly refNumberSpan: Locator;
  readonly backHomeButton: Locator;
  readonly myBookingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'BOOKING SUCCESSFUL!' });
    this.confirmationText = page.getByText('Your tickets have been confirmed.');
    this.refText = page.locator('.ref-text');
    this.refNumberSpan = page.locator('.ref-text span');
    this.backHomeButton = page.locator('button.confirm-btn', { hasText: 'BACK TO HOME' });
    this.myBookingsButton = page.locator('button.history-btn', { hasText: 'VIEW MY BOOKINGS' });
  }

  async verifySuccessPage() {
    await expect(this.page).toHaveURL(/\/booking-success/);
    await expect(this.heading).toBeVisible();
    await expect(this.confirmationText).toBeVisible();
    await expect(this.refText).toBeVisible();
    await expect(this.backHomeButton).toBeVisible();
    await expect(this.myBookingsButton).toBeVisible();
  }

  /**
   * Verifikasi format referensi tiket berdasarkan pola implementasi aktual frontend
   * (Math.random() menghasilkan angka 1-6 digit didahului '#').
   * Catatan: Ini memvalidasi struktur teks, bukan keunikan atau keterikatan ke backend payment ID.
   */
  async verifyTicketReferencePattern() {
    await expect(this.refText).toBeVisible();
    await expect(this.refText).toHaveText(/^Booking Ref:\s*#\d{1,6}$/);
    await expect(this.refNumberSpan).toHaveText(/^#\d{1,6}$/);
  }
}
