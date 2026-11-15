import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model: Denah Kursi Bioskop (Versi 3 - Production Grade)
 * 
 * Refactored oleh Principal QA Automation Engineer:
 * - Menghilangkan `{ force: true }` anti-pattern.
 * - Menerapkan verifikasi computed CSS (`cursor: not-allowed`), visual state, dan DOM integrity.
 * - Memastikan interaksi mencerminkan perilaku user nyata (natural user event dispatch).
 */
export class SeatSelectionPage {
  readonly page: Page;

  // Container & Layout Elements
  readonly cinemaContainer: Locator;
  readonly screenElement: Locator;
  readonly seatGrid: Locator;
  readonly seatLegend: Locator;

  // Summary Bar & Checkout Triggers
  readonly summaryBar: Locator;
  readonly seatsCountSummary: Locator;
  readonly totalPriceSummary: Locator;
  readonly payNowButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.cinemaContainer = page.locator('.cinema-container');
    this.screenElement = page.locator('.screen');
    this.seatGrid = page.locator('.seat-grid');
    this.seatLegend = page.locator('.seat-legend');

    this.summaryBar = page.locator('.summary-bar');
    this.seatsCountSummary = this.summaryBar.locator('strong');
    this.totalPriceSummary = this.summaryBar.locator('div', { hasText: /Rs\./i });
    this.payNowButton = this.summaryBar.locator('button.btn-pay');
  }

  /**
   * Memastikan seluruh komponen denah kursi telah selesai di-render secara stabil
   */
  async expectSeatMapLoaded(): Promise<void> {
    await expect(this.cinemaContainer).toBeVisible({ timeout: 10000 });
    await expect(this.screenElement).toBeVisible();
    await expect(this.seatGrid).toBeVisible();
    await expect(this.page.locator('.seat-row').first()).toBeVisible();
  }

  /**
   * Mengambil locator elemen kursi spesifik berdasarkan baris dan nomor
   */
  getSeatLocator(row: string, seatNumber: number): Locator {
    const rowLocator = this.page.locator('.seat-row').filter({
      has: this.page.locator('.row-label', { hasText: new RegExp(`^${row}$`, 'i') })
    });

    return rowLocator.locator('.seat').filter({
      has: this.page.locator('small', { hasText: new RegExp(`^${seatNumber}$`) })
    }).first();
  }

  /**
   * Langkah 3 (Positive): Memilih kursi bioskop yang berstatus available
   */
  async selectSeat(row: string, seatNumber: number): Promise<void> {
    const seat = this.getSeatLocator(row, seatNumber);
    await expect(seat).toBeVisible();

    // Verifikasi kursi dalam status available dan siap diklik
    await expect(seat).toHaveClass(/available/);
    await expect(seat).not.toHaveClass(/booked|locked/);

    // Natural user click (tanpa force, mematuhi actionability checks)
    await seat.click();

    // Verifikasi transisi state ke 'selected'
    await expect(seat).toHaveClass(/selected/);
  }

  /**
   * Langkah Uji (Negative - Refactored):
   * Mencoba memilih kursi yang sudah berstatus booked secara natural.
   * Tidak lagi menggunakan { force: true }.
   */
  async trySelectBookedSeat(row: string, seatNumber: number): Promise<void> {
    const seat = this.getSeatLocator(row, seatNumber);
    await expect(seat).toBeVisible();

    // 1. Verifikasi visual & atribut status booked
    await expect(seat).toHaveClass(/booked/);
    
    // 2. Verifikasi CSS cursor sesuai SeatMap.css (.seat.BOOKED { cursor: not-allowed })
    await expect(seat).toHaveCSS('cursor', 'not-allowed');

    // 3. Natural click (tanpa force) - memvalidasi event handler komponen mengabaikan klik pada kursi booked
    await seat.click();

    // 4. Assert: State TIDAK boleh berubah menjadi 'selected'
    await expect(seat).not.toHaveClass(/selected/);
    await expect(seat).toHaveClass(/booked/);
  }

  /**
   * Verifikasi ringkasan pilihan kursi dan harga subtotal
   */
  async expectSummary(expectedCount: number): Promise<void> {
    await expect(this.summaryBar).toBeVisible();
    await expect(this.seatsCountSummary).toHaveText(new RegExp(`^${expectedCount}\\s*Seats$`, 'i'));
    await expect(this.payNowButton).toBeVisible();
    await expect(this.payNowButton).toBeEnabled();
  }

  /**
   * Verifikasi bahwa proses checkout dicegah saat kursi tidak terpilih
   */
  async expectCheckoutPrevented(): Promise<void> {
    // Sesuai SeatSelection.js: summary-bar tidak di-render jika selectedSeatIds.length === 0
    await expect(this.summaryBar).not.toBeVisible();
  }

  /**
   * Melanjutkan ke tahapan konfirmasi pemesanan (/create-booking)
   */
  async proceedToPayment(): Promise<void> {
    await expect(this.payNowButton).toBeVisible();
    await expect(this.payNowButton).toBeEnabled();
    await this.payNowButton.click();
    await expect(this.page).toHaveURL(/.*create-booking/);
  }
}
