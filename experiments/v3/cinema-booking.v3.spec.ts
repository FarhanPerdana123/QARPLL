import { test, expect, Page } from '@playwright/test';
import { MovieListPage } from './pages/movie-list.page';
import { ShowtimeSelectionPage } from './pages/showtime.page';
import { SeatSelectionPage } from './pages/seat-selection.page';
import { BookingConfirmPage } from './pages/booking-confirm.page';
import { PaymentPage } from './pages/payment.page';
import { BookingSuccessPage } from './pages/booking-success.page';

/**
 * Eksperimen V3: AI-Assisted Automated Testing (Refined Baseline)
 * File: experiments/v3/cinema-booking.v3.spec.ts
 *
 * Perbaikan utama atas temuan V1 & V2:
 * 1. Type Safety Ketat: Menggunakan page.waitForRequest eksplisit untuk menangkap payload
 *    tanpa closure-reassignment yang memicu error TS2339 (type 'never').
 * 2. Penguatan Assertion Skenario 1: Validasi konsistensi info film di header, verifikasi
 *    kontraktual payload request pembayaran, dan validasi pola format e-ticket regex.
 * 3. Presisi Interaksi Skenario 2: Validasi posisi koordinat fisik berada di dalam
 *    bounding box dan viewport sebelum mouse click, verifikasi identitas & kuantitas kursi.
 * 4. Siklus Dialog Skenario 3: Penanganan dialog asinkron tanpa deadlock, verifikasi restorasi
 *    state tombol, dan pengujian bahwa endpoint pasca-bayar (book-seats) tidak dipanggil.
 */

// --- DUMMY FIXTURES (KONSISTEN DENGAN V1 & V2) ---

const dummyMovie = {
  _id: 'movie-1',
  title: 'Inception',
  genre: ['Action', 'Sci-Fi'],
  duration: 148,
  rating: 8.8,
  description: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
  posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
  status: 'now',
};

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
    status: 'booked',
  },
];

async function setupStandardMocks(page: Page) {
  // Injeksi state autentikasi dummy ke localStorage
  await page.addInitScript(() => {
    localStorage.setItem('token', 'dummy-jwt-auth-token-v3');
    localStorage.setItem('role', 'customer');
    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'user-001',
        name: 'Tester V3 Mahasiswa',
        email: 'tester.v3@example.com',
        role: 'customer',
      })
    );
  });

  // Mock Notifications unread count
  await page.route('**/api/notifications/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0 }),
    });
  });

  // Mock Single Movie (Rute spesifik dipasang sebelum rute umum)
  await page.route('**/api/movies/movie-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dummyMovie),
    });
  });

  // Mock Movie List
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
}

test.describe('Eksperimen V3 - Pengujian Pemesanan Tiket Bioskop (Refined)', () => {

  test('Skenario 1: Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket', async ({ page }) => {
    await setupStandardMocks(page);

    const movieListPage = new MovieListPage(page);
    const showtimePage = new ShowtimeSelectionPage(page);
    const seatPage = new SeatSelectionPage(page);
    const confirmPage = new BookingConfirmPage(page);
    const paymentPage = new PaymentPage(page);
    const successPage = new BookingSuccessPage(page);

    // Mock API Payment Berhasil (HTTP 201)
    await page.route('**/api/payments', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            payment: {
              _id: 'pay-v3-success-12345',
              amount: 500,
              paymentMethod: 'Credit Card',
              cardLast4: '3456',
              status: 'Completed',
            },
            booking: {
              _id: 'book-v3-success-12345',
              status: 'Confirmed',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Bulk Book Seats
    await page.route('**/api/seats/book-seats', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Seats marked as booked',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // 1. Buka daftar film dan pilih film fixture
    await movieListPage.goto();
    await movieListPage.selectMovieAndBook(dummyMovie.title);

    // 2. Pilih jadwal dan verifikasi konsistensi info film
    await showtimePage.verifyPageLoaded(dummyMovie._id);
    await showtimePage.verifyMovieInfo(dummyMovie.title, dummyMovie.duration, dummyMovie.rating);
    await showtimePage.selectShowtime('Hall 1', dummyShowtime.startTime);

    // 3. Pilih kursi available (A1)
    await seatPage.selectAvailableSeat(1);
    await seatPage.verifySummary('1 Seats', 'Rs. 500');
    expect(await seatPage.getSelectedSeatsCount()).toBe(1);
    await seatPage.proceedToBooking();

    // 4. Verifikasi ringkasan pemesanan di /create-booking
    await confirmPage.verifyPageLoaded();
    await confirmPage.verifyBookingDetails(dummyMovie.title, 'A1', 'Rs. 500');
    await confirmPage.confirmBooking();

    // 5. Isi form pembayaran di /payment/checkout
    await paymentPage.verifyPageLoaded();
    await paymentPage.verifyPaymentDetails('Rs. 500', 'A1');
    await paymentPage.fillCardDetails({
      name: 'Tester V3 Mahasiswa',
      number: '9876543210123456',
      expiry: '09/29',
      cvv: '888',
    });

    // 6. Pasang listener waitForRequest eksplisit sebelum submit payment
    //    Pendekatan ini menjamin type-safety tanpa assignment closure yang memicu TS2339
    const paymentRequestPromise = page.waitForRequest((req) => {
      return req.url().includes('/api/payments') && req.method() === 'POST';
    });

    const bookSeatsRequestPromise = page.waitForRequest((req) => {
      return req.url().includes('/api/seats/book-seats') && req.method() === 'POST';
    });

    // Submit pembayaran
    await paymentPage.submitPayment();

    // 7. Verifikasi halaman sukses dan pola format referensi e-ticket
    await successPage.verifySuccessPage();
    await successPage.verifyTicketReferencePattern();

    // 8. Verifikasi kontrak data bisnis pada payload request backend
    const paymentRequest = await paymentRequestPromise;
    const rawPaymentData: unknown = paymentRequest.postDataJSON();

    expect(rawPaymentData).not.toBeNull();
    expect(typeof rawPaymentData).toBe('object');

    const paymentBody = rawPaymentData as Record<string, unknown>;
    expect(paymentBody.showtimeId).toBe(dummyShowtime._id);
    expect(paymentBody.amount).toBe(500);
    expect(paymentBody.paymentMethod).toBe('Credit Card');
    expect(paymentBody.cardLast4).toBe('3456');
    expect(Array.isArray(paymentBody.seats)).toBe(true);
    expect(paymentBody.seats as string[]).toEqual(['seat-A1']);

    // 9. Verifikasi endpoint pasca-bayar menandai kursi yang tepat
    const bookSeatsRequest = await bookSeatsRequestPromise;
    const rawBookSeatsData: unknown = bookSeatsRequest.postDataJSON();

    expect(rawBookSeatsData).not.toBeNull();
    expect(typeof rawBookSeatsData).toBe('object');

    const bookSeatsBody = rawBookSeatsData as Record<string, unknown>;
    expect(Array.isArray(bookSeatsBody.seatIds)).toBe(true);
    expect(bookSeatsBody.seatIds as string[]).toEqual(['seat-A1']);
  });

  test('Skenario 2: Kursi yang sudah booked tidak dapat dipilih', async ({ page }) => {
    await setupStandardMocks(page);

    const seatPage = new SeatSelectionPage(page);

    // 1. Buka halaman pemilihan kursi
    await seatPage.goto(dummyShowtime._id);

    // 2. Identifikasi kursi 2 (berstatus booked) secara spesifik
    await seatPage.verifySeatState(2, 'booked');

    // 3. Verifikasi computed style visual dan atribut CSS
    //    Memastikan pointer-events: none diterapkan oleh CSS aplikasi
    await seatPage.verifySeatComputedStyle(2, 'pointer-events', 'none');
    await seatPage.verifySeatComputedStyle(2, 'cursor', 'not-allowed');

    // 4. Interaksi pointer nyata pada posisi visual kursi booked (koordinat bounding box)
    //    Tidak menggunakan force: true atau evaluate dispatchEvent
    await seatPage.clickSeatByPhysicalMouse(2);

    // 5. Verifikasi kursi booked tetap tidak terpilih dan summary bar tetap tersembunyi
    await seatPage.verifySeatState(2, 'booked');
    const bookedSeat = seatPage.getSeat(2);
    await expect(bookedSeat).not.toHaveClass(/selected/);
    await seatPage.verifySummaryHidden();

    // 6. Kontrol Positif: Pilih kursi available (kursi 1)
    await seatPage.selectAvailableSeat(1);

    // 7. Verifikasi summary bar hanya memuat 1 kursi yang sah
    await seatPage.verifySummary('1 Seats', 'Rs. 500');
    expect(await seatPage.getSelectedSeatsCount()).toBe(1);
  });

  test('Skenario 3: Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses', async ({ page }) => {
    await setupStandardMocks(page);

    const seatPage = new SeatSelectionPage(page);
    const confirmPage = new BookingConfirmPage(page);
    const paymentPage = new PaymentPage(page);

    // Pantau pemanggilan endpoint pasca-bayar (book-seats)
    let bookSeatsCallCount = 0;
    await page.route('**/api/seats/book-seats', async (route) => {
      bookSeatsCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Seats marked as booked' }),
      });
    });

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

    // 1. Alur pemilihan kursi menuju checkout untuk menjaga location.state React Router
    await seatPage.goto(dummyShowtime._id);
    await seatPage.selectAvailableSeat(1);
    await seatPage.proceedToBooking();

    await confirmPage.verifyPageLoaded();
    await confirmPage.confirmBooking();

    await paymentPage.verifyPageLoaded();
    await paymentPage.fillCardDetails({
      name: 'Tester V3 Mahasiswa',
      number: '9876543210123456',
      expiry: '09/29',
      cvv: '888',
    });

    // 2. Daftarkan penanganan dialog secara asinkron sebelum submit
    const dialogPromise = page.waitForEvent('dialog');

    // 3. Submit pembayaran yang akan gagal
    await paymentPage.submitPayment();

    // 4. Tangkap pesan dialog dan lakukan accept
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Payment Failed');
    expect(dialog.message()).toContain('Gateway Timeout');
    await dialog.accept();

    // 5. Tunggu bukti bahwa penanganan kegagalan UI selesai (tombol kembali aktif)
    await expect(paymentPage.payButton).toBeEnabled();
    await expect(paymentPage.payButton).toHaveText('PAY NOW');

    // 6. Verifikasi pengguna tetap berada di halaman pembayaran dan tidak ke halaman sukses
    expect(page.url()).not.toContain('/booking-success');
    await expect(page).toHaveURL(/\/payment\/checkout/);
    await expect(paymentPage.heading).toBeVisible();
    await expect(page.getByRole('heading', { name: 'BOOKING SUCCESSFUL!' })).not.toBeVisible();

    // 7. Verifikasi bahwa endpoint pasca-bayar TIDAK PERNAH dipanggil selama jendela pengamatan test
    expect(bookSeatsCallCount).toBe(0);
  });

});
