import { test, expect, Page } from '@playwright/test';
import { MovieListPage } from './pages/movie-list.page';
import { ShowtimeSelectionPage } from './pages/showtime.page';
import { SeatSelectionPage } from './pages/seat-selection.page';
import { BookingConfirmPage } from './pages/booking-confirm.page';
import { PaymentPage } from './pages/payment.page';
import { BookingSuccessPage } from './pages/booking-success.page';

/**
 * Eksperimen V2: AI-Assisted Automated Testing
 * File: experiments/v2/cinema-booking.v2.spec.ts
 *
 * Versi perbaikan berbasis Page Object Model sederhana dan hasil evaluasi V1:
 * 1. Skenario 1: Verifikasi kontraktual payload API payment, detail tiket, dan e-ticket.
 * 2. Skenario 2: Simulasi klik koordinat pointer nyata pada posisi visual kursi booked (tanpa force: true).
 * 3. Skenario 3: Sinkronisasi penanganan dialog secara asinkron, pemantauan status re-enable tombol,
 *                dan verifikasi bahwa endpoint pasca-bayar (book-seats) tidak dipanggil.
 */

// --- DUMMY DATA FIXTURE (KONSISTEN DENGAN V1) ---

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
    localStorage.setItem('token', 'dummy-jwt-auth-token-v2');
    localStorage.setItem('role', 'customer');
    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'user-001',
        name: 'Tester V2 Mahasiswa',
        email: 'tester.v2@example.com',
        role: 'customer',
      })
    );
  });

  // Mock Notifications
  await page.route('**/api/notifications/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0 }),
    });
  });

  // Mock Movies
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
}

test.describe('Eksperimen V2 - Pengujian Pemesanan Tiket Bioskop', () => {

  test('Skenario 1: Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket', async ({ page }) => {
    await setupStandardMocks(page);

    const movieListPage = new MovieListPage(page);
    const showtimePage = new ShowtimeSelectionPage(page);
    const seatPage = new SeatSelectionPage(page);
    const confirmPage = new BookingConfirmPage(page);
    const paymentPage = new PaymentPage(page);
    const successPage = new BookingSuccessPage(page);

    // Variabel penampung payload pembayaran aktual untuk validasi kontrak data bisnis
    let capturedPaymentPayload: {
      showtimeId?: string;
      seats?: string[];
      amount?: number;
      paymentMethod?: string;
      cardLast4?: string;
    } | null = null;

    // Mock API Payment Berhasil (HTTP 201)
    await page.route('**/api/payments', async (route) => {
      if (route.request().method() === 'POST') {
        capturedPaymentPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            payment: {
              _id: 'pay-v2-success-98765',
              amount: 500,
              paymentMethod: 'Credit Card',
              cardLast4: '3456',
              status: 'Completed',
            },
            booking: {
              _id: 'book-v2-success-98765',
              status: 'Confirmed',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Bulk Book Seats
    let bookSeatsPayload: { seatIds?: string[] } | null = null;
    await page.route('**/api/seats/book-seats', async (route) => {
      if (route.request().method() === 'POST') {
        bookSeatsPayload = route.request().postDataJSON();
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

    // 2. Pilih jadwal penayangan pada Hall 1
    await showtimePage.verifyPageLoaded(dummyMovie._id);
    await showtimePage.selectShowtime('Hall 1', dummyShowtime.startTime);

    // 3. Pilih kursi available (A1)
    await seatPage.selectAvailableSeat(1);
    await seatPage.verifySummary('1 Seats', 'Rs. 500');
    await seatPage.proceedToBooking();

    // 4. Verifikasi ringkasan pemesanan di /create-booking
    await confirmPage.verifyPageLoaded();
    await confirmPage.verifyBookingDetails(dummyMovie.title, 'A1', 'Rs. 500');
    await confirmPage.confirmBooking();

    // 5. Isi form pembayaran di /payment/checkout
    await paymentPage.verifyPageLoaded();
    await paymentPage.verifyPaymentDetails('Rs. 500', 'A1');
    await paymentPage.fillCardDetails({
      name: 'Tester V2 Mahasiswa',
      number: '9876543210123456',
      expiry: '09/29',
      cvv: '888',
    });

    // 6. Submit pembayaran
    await paymentPage.submitPayment();

    // 7. Verifikasi halaman sukses dan komponen e-ticket
    await successPage.verifySuccessPage();

    // 8. Verifikasi kontrak data bisnis pada payload request backend
    expect(capturedPaymentPayload).not.toBeNull();
    expect(capturedPaymentPayload?.showtimeId).toBe(dummyShowtime._id);
    expect(capturedPaymentPayload?.amount).toBe(500);
    expect(capturedPaymentPayload?.paymentMethod).toBe('Credit Card');
    expect(capturedPaymentPayload?.cardLast4).toBe('3456');
    expect(capturedPaymentPayload?.seats).toContain('seat-A1');

    // Verifikasi endpoint pasca-bayar menandai kursi yang tepat
    expect(bookSeatsPayload).not.toBeNull();
    expect(bookSeatsPayload?.seatIds).toContain('seat-A1');
  });

  test('Skenario 2: Kursi yang sudah booked tidak dapat dipilih', async ({ page }) => {
    await setupStandardMocks(page);

    const seatPage = new SeatSelectionPage(page);

    // 1. Buka halaman pemilihan kursi
    await seatPage.goto(dummyShowtime._id);

    // 2. Identifikasi kursi booked (kursi 2) secara spesifik
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
  });

  test('Skenario 3: Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses', async ({ page }) => {
    await setupStandardMocks(page);

    const seatPage = new SeatSelectionPage(page);
    const confirmPage = new BookingConfirmPage(page);
    const paymentPage = new PaymentPage(page);

    // Pantau apakah endpoint pasca-bayar (book-seats) dipanggil
    let bookSeatsCalled = false;
    await page.route('**/api/seats/book-seats', async (route) => {
      bookSeatsCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
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
      name: 'Tester V2 Mahasiswa',
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

    // 5. Tunggu sampai aplikasi selesai menangani kegagalan (tombol kembali aktif)
    await expect(paymentPage.payButton).toBeEnabled();
    await expect(paymentPage.payButton).toHaveText('PAY NOW');

    // 6. Verifikasi pengguna tetap berada di halaman pembayaran dan tidak ke halaman sukses
    expect(page.url()).not.toContain('/booking-success');
    await expect(page).toHaveURL(/\/payment\/checkout/);
    await expect(paymentPage.heading).toBeVisible();
    await expect(page.getByRole('heading', { name: 'BOOKING SUCCESSFUL!' })).not.toBeVisible();

    // 7. Verifikasi bahwa endpoint pasca-bayar TIDAK PERNAH dipanggil akibat kegagalan pembayaran
    expect(bookSeatsCalled).toBe(false);
  });

});
