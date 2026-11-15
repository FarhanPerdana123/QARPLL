import { test, expect, Page } from '@playwright/test';

/**
 * Baseline Eksperimen V1: AI-Assisted Automated Testing
 * Target File: experiments/v1/cinema-booking.v1.spec.ts
 *
 * Menguji alur pemesanan tiket bioskop menggunakan frontend React
 * dengan mocking API network Playwright (tanpa backend/database nyata).
 */

// --- DUMMY DATA YANG SESUAI DENGAN SOURCE CODE FRONTEND ---

const dummyMovie = {
  _id: 'movie-1',
  title: 'Inception',
  genre: ['Action', 'Sci-Fi'],
  duration: 148,
  rating: 8.8,
  description: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
  posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
  status: 'now', // Diperlukan agar tampil pada bagian "Now Showing" di MovieList.jsx
};

// Jadwal dibuat untuk tanggal masa depan (besok) agar lolos filter tanggal (>= today)
// dan waktu tidak dianggap lampau (isPast = false) pada ShowtimeSelection.jsx
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 1);
const futureDateISO = futureDate.toISOString();

const dummyShowtime = {
  _id: 'showtime-1',
  movie: 'movie-1',
  hall: {
    _id: 'hall-1',
    name: 'Hall 1',
  },
  date: futureDateISO,
  startTime: '10:00 AM',
  price: 500,
};

const dummyHalls = [
  {
    _id: 'hall-1',
    name: 'Hall 1',
  },
];

const dummySeats = [
  {
    _id: 'seat-A1',
    showtimeId: 'showtime-1',
    row: 'A',
    number: 1,
    price: 500,
    status: 'available',
  },
  {
    _id: 'seat-A2',
    showtimeId: 'showtime-1',
    row: 'A',
    number: 2,
    price: 500,
    status: 'booked', // Kursi terisi untuk pengujian validasi kursi booked
  },
];

/**
 * Helper untuk menyetel mock API dan autentikasi localStorage sebelum setiap uji
 */
async function setupStandardMocks(page: Page) {
  // Injeksi state login ke localStorage (dibutuhkan oleh ProtectedRoute, SeatSelection, CreateBooking, Payment)
  await page.addInitScript(() => {
    localStorage.setItem('token', 'dummy-jwt-auth-token-12345');
    localStorage.setItem('role', 'customer');
    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'user-001',
        name: 'Tester Mahasiswa',
        email: 'tester@example.com',
        role: 'customer',
      })
    );
  });

  // Mock endpoint unread notifications untuk mencegah error Topbar polling
  await page.route('**/api/notifications/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0 }),
    });
  });

  // Mock Movies: single detail & list
  await page.route('**/api/movies/movie-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dummyMovie),
    });
  });

  await page.route('**/api/movies*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([dummyMovie]),
      });
    } else {
      await route.continue();
    }
  });

  // Mock Showtimes by Movie
  await page.route('**/api/showtimes/movie/movie-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [dummyShowtime],
      }),
    });
  });

  // Mock Single Showtime
  await page.route('**/api/showtimes/showtime-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          ...dummyShowtime,
          movie: {
            _id: dummyMovie._id,
            title: dummyMovie.title,
          },
        },
      }),
    });
  });

  // Mock Halls
  await page.route('**/api/halls*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: dummyHalls,
      }),
    });
  });

  // Mock Seats
  await page.route('**/api/seats/showtime-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dummySeats),
    });
  });

  // Mock Bulk Book Seats
  await page.route('**/api/seats/book-seats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Seats marked as booked',
      }),
    });
  });
}

test.describe('Baseline Eksperimen V1 - Pengujian Pemesanan Tiket Bioskop', () => {

  test('Skenario 1: Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket', async ({ page }) => {
    await setupStandardMocks(page);

    // Mock API Payment Berhasil (HTTP 201)
    await page.route('**/api/payments', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            payment: {
              _id: 'pay-baseline-12345',
              amount: 500,
              paymentMethod: 'Credit Card',
              cardLast4: '5678',
              status: 'Completed',
            },
            booking: {
              _id: 'book-baseline-12345',
              status: 'Confirmed',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // 1. Memilih Film di halaman daftar film (/movies)
    await page.goto('/movies');
    await expect(page.getByRole('heading', { name: 'Now Showing' })).toBeVisible();

    const movieCard = page.locator('.movie-card', { hasText: 'Inception' });
    await expect(movieCard).toBeVisible();

    // Hover kartu film untuk memunculkan overlay tombol navigasi
    await movieCard.hover();
    const bookNowButton = movieCard.getByRole('button', { name: 'Book Now' });
    await expect(bookNowButton).toBeVisible();
    await bookNowButton.click();

    // 2. Memilih Jadwal di halaman /buy-tickets/:movieId
    await expect(page).toHaveURL(/\/buy-tickets\/movie-1/);
    await expect(page.locator('.selection-page')).toBeVisible();

    // Klik tombol jadwal penayangan yang tersedia
    const timeButton = page.locator('.scope-time-btn', { hasText: '10:00 AM' });
    await expect(timeButton).toBeVisible();
    await timeButton.click();

    // 3. Memilih Kursi di halaman /booking/:showtimeId
    await expect(page).toHaveURL(/\/booking\/showtime-1/);
    await expect(page.getByRole('heading', { name: 'SELECT YOUR SEATS' })).toBeVisible();

    // Klik kursi A1 (available)
    const seatA1 = page.locator('.seat.available', { hasText: '1' });
    await expect(seatA1).toBeVisible();
    await seatA1.click();

    // Verifikasi kursi berubah menjadi status selected dan summary bar muncul
    await expect(page.locator('.seat.selected', { hasText: '1' })).toBeVisible();
    const summaryBar = page.locator('.summary-bar');
    await expect(summaryBar).toBeVisible();
    await expect(summaryBar).toContainText('1 Seats');
    await expect(summaryBar).toContainText('Rs. 500');

    // Lanjutkan ke konfirmasi pemesanan
    await summaryBar.getByRole('button', { name: 'PAY NOW' }).click();

    // 4. Konfirmasi Pemesanan di halaman /create-booking
    await expect(page).toHaveURL(/\/create-booking/);
    await expect(page.getByRole('heading', { name: 'CONFIRM BOOKING' })).toBeVisible();
    await expect(page.locator('.summary-details')).toContainText('Inception');
    await expect(page.locator('.summary-details')).toContainText('A1');
    await expect(page.locator('.price-section')).toContainText('Rs. 500');

    // Klik konfirmasi untuk lanjut ke pembayaran
    const confirmButton = page.locator('button.confirm-btn', { hasText: 'CONFIRM & PAY NOW' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 5. Formulir Pembayaran di halaman /payment/checkout
    await expect(page).toHaveURL(/\/payment\/checkout/);
    await expect(page.getByRole('heading', { name: 'Secure Checkout' })).toBeVisible();
    await expect(page.locator('.amount-box')).toContainText('Rs. 500');

    // Input data pembayaran kartu dummy
    await page.locator('input[placeholder="Name"]').fill('Budi Santoso');
    await page.locator('input[placeholder="0000 0000 0000 0000"]').fill('1234567812345678');
    await page.locator('input[placeholder="MM/YY"]').fill('12/28');
    await page.locator('input[placeholder="123"]').fill('999');

    // Eksekusi pembayaran
    const paySubmitButton = page.locator('button.pay-btn', { hasText: 'PAY NOW' });
    await expect(paySubmitButton).toBeEnabled();
    await paySubmitButton.click();

    // 6. Konfirmasi E-Ticket di halaman /booking-success
    await expect(page).toHaveURL(/\/booking-success/);
    await expect(page.getByRole('heading', { name: 'BOOKING SUCCESSFUL!' })).toBeVisible();
    await expect(page.getByText('Your tickets have been confirmed.')).toBeVisible();
    await expect(page.locator('.ref-text')).toBeVisible();
  });

  test('Skenario 2: Kursi yang sudah booked tidak dapat dipilih', async ({ page }) => {
    await setupStandardMocks(page);

    // Kunjungi langsung halaman pemilihan kursi dengan showtime dummy
    await page.goto('/booking/showtime-1');
    await expect(page.getByRole('heading', { name: 'SELECT YOUR SEATS' })).toBeVisible();

    // Kursi A2 berstatus booked pada data mock
    const bookedSeatA2 = page.locator('.seat.booked', { hasText: '2' });
    await expect(bookedSeatA2).toBeVisible();

    // Klik pada kursi yang sudah booked
    await bookedSeatA2.click();

    // Verifikasi: kursi tetap berstatus booked dan TIDAK mendapatkan class 'selected'
    await expect(bookedSeatA2).not.toHaveClass(/selected/);
    await expect(bookedSeatA2).toHaveClass(/booked/);

    // Verifikasi: summary bar tidak ditampilkan karena tidak ada kursi yang berhasil dipilih
    await expect(page.locator('.summary-bar')).toBeHidden();

    // Verifikasi pembanding: saat kursi available (A1) diklik, hanya 1 kursi yang tercatat
    const availableSeatA1 = page.locator('.seat.available', { hasText: '1' });
    await availableSeatA1.click();
    await expect(page.locator('.seat.selected', { hasText: '1' })).toBeVisible();

    const summaryBar = page.locator('.summary-bar');
    await expect(summaryBar).toBeVisible();
    await expect(summaryBar).toContainText('1 Seats');
  });

  test('Skenario 3: Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses', async ({ page }) => {
    await setupStandardMocks(page);

    // Mock API Payment dengan kegagalan HTTP 504 Gateway Timeout
    await page.route('**/api/payments', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Gateway Timeout: Payment processing took too long',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Masuk ke flow booking melalui pemilihan kursi agar react-router location.state terisi
    await page.goto('/booking/showtime-1');
    await expect(page.getByRole('heading', { name: 'SELECT YOUR SEATS' })).toBeVisible();

    // Pilih kursi available
    await page.locator('.seat.available', { hasText: '1' }).click();
    await page.locator('.summary-bar').getByRole('button', { name: 'PAY NOW' }).click();

    // Konfirmasi pemesanan
    await expect(page).toHaveURL(/\/create-booking/);
    await page.locator('button.confirm-btn', { hasText: 'CONFIRM & PAY NOW' }).click();

    // Tiba di halaman pembayaran
    await expect(page).toHaveURL(/\/payment\/checkout/);
    await expect(page.getByRole('heading', { name: 'Secure Checkout' })).toBeVisible();

    // Input data pembayaran
    await page.locator('input[placeholder="Name"]').fill('Budi Santoso');
    await page.locator('input[placeholder="0000 0000 0000 0000"]').fill('1234567812345678');
    await page.locator('input[placeholder="MM/YY"]').fill('12/28');
    await page.locator('input[placeholder="123"]').fill('999');

    // Tangkap dialog alert browser yang dipicu oleh PaymentPage.js saat catch error
    let alertMessage = '';
    page.once('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Klik bayar
    const payButton = page.locator('button.pay-btn', { hasText: 'PAY NOW' });
    await expect(payButton).toBeEnabled();
    await payButton.click();

    // Verifikasi alert pesan kegagalan muncul ke pengguna
    await expect.poll(() => alertMessage).toContain('Payment Failed');

    // Verifikasi bahwa pengguna TIDAK diarahkan ke halaman sukses
    expect(page.url()).not.toContain('/booking-success');
    await expect(page).toHaveURL(/\/payment\/checkout/);

    // Verifikasi halaman pembayaran tetap aktif dan heading konfirmasi sukses tidak muncul
    await expect(page.getByRole('heading', { name: 'Secure Checkout' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'BOOKING SUCCESSFUL!' })).not.toBeVisible();
  });

});
