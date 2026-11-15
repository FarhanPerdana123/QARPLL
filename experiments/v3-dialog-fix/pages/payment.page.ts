import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Payment Checkout Page (/payment/checkout)
 * File: experiments/v3-dialog-fix/pages/payment.page.ts
 */
export class PaymentPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly amountBox: Locator;
  readonly seatsInfo: Locator;
  readonly cardNameInput: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly payButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Secure Checkout' });
    this.amountBox = page.locator('.amount-box');
    this.seatsInfo = page.locator('.payment-card');
    this.cardNameInput = page.locator('input[placeholder="Name"]');
    this.cardNumberInput = page.locator('input[placeholder="0000 0000 0000 0000"]');
    this.expiryInput = page.locator('input[placeholder="MM/YY"]');
    this.cvvInput = page.locator('input[placeholder="123"]');
    this.payButton = page.locator('button.pay-btn');
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/payment\/checkout/);
    await expect(this.heading).toBeVisible();
  }

  async verifyPaymentDetails(amountText: string, seatText: string) {
    await expect(this.amountBox).toContainText(amountText);
    await expect(this.seatsInfo).toContainText(seatText);
  }

  async fillCardDetails(details: { name: string; number: string; expiry: string; cvv: string }) {
    await this.cardNameInput.fill(details.name);
    await this.cardNumberInput.fill(details.number);
    await this.expiryInput.fill(details.expiry);
    await this.cvvInput.fill(details.cvv);
  }

  async submitPayment() {
    await expect(this.payButton).toBeEnabled();
    await this.payButton.click();
  }
}
