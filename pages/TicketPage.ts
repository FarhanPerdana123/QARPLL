import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model untuk Halaman Bukti Transaksi (Booking Success)
 * dan Riwayat E-Ticket (My Bookings).
 * 
 * Merepresentasikan interaksi pada:
 * - frontend/src/pages/BookingSuccess.js
 * - frontend/src/pages/MyBookingsPage.js
 */
export class TicketPage {
  readonly page: Page;

  // Locators: Booking Success Page (/booking-success)
  readonly successCard: Locator;
  readonly successHeading: Locator;
  readonly bookingRefText: Locator;
  readonly viewMyBookingsButton: Locator;

  // Locators: My Bookings Page (/my-bookings)
  readonly historyWrapper: Locator;
  readonly historyTitle: Locator;
  readonly latestHistoryItem: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sesuai BookingSuccess.js:
    this.successCard = page.locator('.booking-card.success-card');
    this.successHeading = this.successCard.locator('h1', { hasText: 'BOOKING SUCCESSFUL!' });
    this.bookingRefText = this.successCard.locator('.ref-text');
    this.viewMyBookingsButton = this.successCard.locator('button.history-btn', { hasText: 'VIEW MY BOOKINGS' });

    // Sesuai MyBookingsPage.js:
    this.historyWrapper = page.locator('.history-page-wrapper');
    this.historyTitle = page.locator('.history-title');
    this.latestHistoryItem = page.locator('.history-list .history-item').first();
  }

  /**
   * Langkah 5a: Verifikasi keberhasilan penerbitan pada halaman Booking Success
   * @returns Booking Reference string
   */
  async expectBookingSuccess(): Promise<string> {
    await expect(this.page).toHaveURL(/.*booking-success/, { timeout: 15000 });
    await expect(this.successCard).toBeVisible();
    await expect(this.successHeading).toBeVisible();
    await expect(this.bookingRefText).toBeVisible();

    const refContent = (await this.bookingRefText.textContent())?.trim() || '';
    expect(refContent).toMatch(/Booking Ref:\s*#\w+/i);

    return refContent;
  }

  /**
   * Langkah 5b: Navigasi ke halaman riwayat tiket pemesanan
   */
  async openMyBookings(): Promise<void> {
    await expect(this.viewMyBookingsButton).toBeVisible();
    await this.viewMyBookingsButton.click();
    await expect(this.page).toHaveURL(/.*my-bookings/);
  }

  /**
   * Langkah 5c: Verifikasi kelengkapan detail e-ticket pada riwayat tiket
   * @param expectedMovieTitle Judul film yang harus tertera
   * @param expectedSeats Daftar kursi yang harus tertera (cth: ['C5', 'C6'])
   */
  async expectETicketDetails(expectedMovieTitle: string, expectedSeats: string[]): Promise<void> {
    await expect(this.historyWrapper).toBeVisible({ timeout: 10000 });
    await expect(this.latestHistoryItem).toBeVisible();

    // Verifikasi judul film pada e-ticket
    await expect(this.latestHistoryItem).toContainText(expectedMovieTitle);

    // Verifikasi nomor kursi C5 dan C6 pada e-ticket
    for (const seat of expectedSeats) {
      await expect(this.latestHistoryItem).toContainText(seat);
    }
  }
}
