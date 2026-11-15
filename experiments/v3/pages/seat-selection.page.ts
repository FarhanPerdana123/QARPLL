import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Seat Selection Page (/booking/:showtimeId)
 * File: experiments/v3/pages/seat-selection.page.ts
 */
export class SeatSelectionPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly summaryBar: Locator;
  readonly payNowButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'SELECT YOUR SEATS' });
    this.summaryBar = page.locator('.summary-bar');
    this.payNowButton = this.summaryBar.getByRole('button', { name: 'PAY NOW' });
  }

  async goto(showtimeId: string) {
    await this.page.goto(`/booking/${showtimeId}`);
    await expect(this.heading).toBeVisible();
  }

  getSeat(number: number): Locator {
    return this.page.locator(`.seat:not(.gap)`, { hasText: new RegExp(`^${number}$`) });
  }

  async verifySeatState(number: number, state: 'available' | 'booked' | 'selected') {
    const seat = this.getSeat(number);
    await expect(seat).toBeVisible();
    await expect(seat).toHaveClass(new RegExp(`\\b${state}\\b`));
  }

  async verifySeatComputedStyle(number: number, property: string, expectedValue: string) {
    const seat = this.getSeat(number);
    await expect(seat).toBeVisible();
    const value = await seat.evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    }, property);
    expect(value).toBe(expectedValue);
  }

  /**
   * Melakukan klik menggunakan simulasi input pointer fisik (mouse coordinates)
   * tanpa bypass force: true atau evaluate dispatchEvent, untuk menguji
   * perilaku natural browser terhadap elemen pointer-events: none.
   */
  async clickSeatByPhysicalMouse(number: number) {
    const seat = this.getSeat(number);
    await seat.scrollIntoViewIfNeeded();

    // Dapatkan bounding box terbaru sebelum klik
    const box = await seat.boundingBox();
    expect(box).not.toBeNull();

    // Pastikan posisi bounding box valid di layar
    const viewport = this.page.viewportSize();
    expect(viewport).not.toBeNull();

    const clickX = box!.x + box!.width / 2;
    const clickY = box!.y + box!.height / 2;

    // Pastikan titik berada tepat di dalam batas bounding box elemen target
    expect(clickX).toBeGreaterThanOrEqual(box!.x);
    expect(clickX).toBeLessThanOrEqual(box!.x + box!.width);
    expect(clickY).toBeGreaterThanOrEqual(box!.y);
    expect(clickY).toBeLessThanOrEqual(box!.y + box!.height);

    // Pastikan titik berada di dalam viewport browser
    expect(clickX).toBeGreaterThanOrEqual(0);
    expect(clickX).toBeLessThanOrEqual(viewport!.width);
    expect(clickY).toBeGreaterThanOrEqual(0);
    expect(clickY).toBeLessThanOrEqual(viewport!.height);

    await this.page.mouse.click(clickX, clickY);
  }

  async selectAvailableSeat(number: number) {
    const seat = this.page.locator('.seat.available', { hasText: new RegExp(`^${number}$`) });
    await expect(seat).toBeVisible();
    await seat.click();
    await expect(this.page.locator('.seat.selected', { hasText: new RegExp(`^${number}$`) })).toBeVisible();
  }

  async verifySummaryHidden() {
    await expect(this.summaryBar).toBeHidden();
  }

  async verifySummary(seatCountText: string, priceText: string) {
    await expect(this.summaryBar).toBeVisible();
    await expect(this.summaryBar).toContainText(seatCountText);
    await expect(this.summaryBar).toContainText(priceText);
  }

  async getSelectedSeatsCount(): Promise<number> {
    return await this.page.locator('.seat.selected').count();
  }

  async proceedToBooking() {
    await expect(this.payNowButton).toBeVisible();
    await this.payNowButton.click();
  }
}
