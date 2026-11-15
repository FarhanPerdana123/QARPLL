import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: Movie List Page (/movies)
 * File: experiments/v2/pages/movie-list.page.ts
 */
export class MovieListPage {
  readonly page: Page;
  readonly nowShowingHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nowShowingHeading = page.getByRole('heading', { name: 'Now Showing' });
  }

  async goto() {
    await this.page.goto('/movies');
    await expect(this.nowShowingHeading).toBeVisible();
  }

  getMovieCard(title: string): Locator {
    return this.page.locator('.movie-card', { hasText: title });
  }

  async selectMovieAndBook(title: string) {
    const card = this.getMovieCard(title);
    await expect(card).toBeVisible();
    await card.hover();
    const bookBtn = card.getByRole('button', { name: 'Book Now' });
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();
  }
}
