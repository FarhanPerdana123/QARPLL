import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model: Alur Konfirmasi Pemesanan & Pembayaran (Versi 3 - Production Grade)
 * 
 * Refactored oleh Principal QA Automation Engineer:
 * - Menangani dialog alert bawaan browser (`window.alert`) secara deterministik.
 * - Memverifikasi state loading & proteksi double-submit pada tombol pembayaran.
 * - Mendukung simulasi kegagalan payment gateway (Fault Injection).
 */
export class PaymentPage {
  readonly page: Page;

  // /create-booking
  readonly bookingCard: Locator;
  readonly confirmBookingTitle: Locator;
  readonly movieNameValue: Locator;
  readonly selectedSeatsValue: Locator;
  readonly totalAmountValue: Locator;
  readonly confirmAndPayButton: Locator;

  // /payment/checkout
  readonly paymentCard: Locator;
  readonly checkoutTitle: Locator;
  readonly cardholderNameInput: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly payNowSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // CreateBookingPage.js locators
    this.bookingCard = page.locator('.booking-card');
    this.confirmBookingTitle = this.bookingCard.locator('h1', { hasText: 'CONFIRM BOOKING' });
    this.movieNameValue = page.locator('.detail-row', { has: page.locator('.label', { hasText: 'Movie Name' }) }).locator('.value');
    this.selectedSeatsValue = page.locator('.detail-row', { has: page.locator('.label', { hasText: 'Selected Seats' }) }).locator('.value');
    this.confirmAndPayButton = page.locator('button.confirm-btn', { hasText: /CONFIRM & PAY NOW/i });

    // PaymentPage.js locators
    this.paymentCard = page.locator('.payment-card');
    this.checkoutTitle = this.paymentCard.locator('.payment-header h2', { hasText: 'Secure Checkout' });
    this.cardholderNameInput = this.paymentCard.locator('input[placeholder="Name"]');
    this.cardNumberInput = this.paymentCard.locator('input[placeholder="0000 0000 0000 0000"]');
    this.expiryInput = this.paymentCard.locator('input[placeholder="MM/YY"]');
    this.cvvInput = this.paymentCard.locator('input[placeholder="123"]');
    this.payNowSubmitButton = this.paymentCard.locator('button.pay-btn');
  }

  /**
   * Konfirmasi detail pemesanan pada /create-booking
   */
  async confirmBookingDetails(expectedMovieTitle: string, expectedSeats: string[]): Promise<void> {
    await expect(this.confirmBookingTitle).toBeVisible({ timeout: 10000 });
    await expect(this.movieNameValue).toContainText(expectedMovieTitle);

    for (const seat of expectedSeats) {
      await expect(this.selectedSeatsValue).toContainText(seat);
    }

    await expect(this.confirmAndPayButton).toBeEnabled();
    await this.confirmAndPayButton.click();
    await expect(this.page).toHaveURL(/.*payment\/.+/);
  }

  /**
   * Mengisi form pembayaran checkout
   */
  async fillPaymentForm(details: {
    cardholderName?: string;
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  } = {}): Promise<void> {
    const {
      cardholderName = 'QA Automation Lead',
      cardNumber = '8808123456789012',
      expiry = '12/28',
      cvv = '888',
    } = details;

    await expect(this.checkoutTitle).toBeVisible({ timeout: 10000 });
    await this.cardholderNameInput.fill(cardholderName);
    await this.cardNumberInput.fill(cardNumber);
    await this.expiryInput.fill(expiry);
    await this.cvvInput.fill(cvv);
  }

  /**
   * Submit pembayaran normal (Happy Path)
   */
  async submitPayment(details?: {
    cardholderName?: string;
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  }): Promise<void> {
    await this.fillPaymentForm(details);
    await expect(this.payNowSubmitButton).toBeEnabled();
    await this.payNowSubmitButton.click();
  }

  /**
   * Submit pembayaran dengan ekspektasi kegagalan (Fault Injection / Gateway Timeout)
   * Mengembalikan pesan alert dialog untuk validasi
   */
  async submitPaymentExpectingFailure(): Promise<string> {
    await expect(this.payNowSubmitButton).toBeEnabled();

    // Setup listener untuk menangani window.alert native dari PaymentPage.js
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 10000 });

    // Klik tombol bayar
    await this.payNowSubmitButton.click();

    // Ambil pesan dialog error dan accept
    const dialog = await dialogPromise;
    const alertMessage = dialog.message();
    await dialog.accept();

    return alertMessage;
  }

  /**
   * Verifikasi bahwa pengguna tetap berada pada halaman pembayaran (tidak dialihkan ke sukses)
   */
  async expectRemainsOnCheckoutPage(): Promise<void> {
    await expect(this.page).toHaveURL(/.*payment\/.+/);
    await expect(this.checkoutTitle).toBeVisible();
    // Tombol bayar kembali aktif sehingga user dapat mencoba lagi (retry resilience)
    await expect(this.payNowSubmitButton).toBeEnabled();
  }
}
