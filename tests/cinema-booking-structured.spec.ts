import { test, expect } from '@playwright/test';
import { MoviePage } from '../pages/MoviePage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage';
import { PaymentPage } from '../pages/PaymentPage';
import { TicketPage } from '../pages/TicketPage';

/**
 * Enterprise QA Test Suite: Cinema Booking System E2E Automation (Versi 3 - Production Ready)
 * Architect: Principal QA Automation Engineer & Code Auditor
 * 
 * Cakupan Pengujian:
 * 1. Skenario 1: Positive Test (Happy Path Transaksi Lengkap)
 * 2. Skenario 2: Negative Test (Seat Conflict / Concurrency Race Condition)
 * 3. Skenario 3: Edge Case / Fault Injection (Payment Gateway Timeout 504 & Double-Charge Guard)
 */
test.describe('Cinema Booking System - Enterprise E2E Test Suite (POM v3)', () => {

  const MOCK_USER_ID = 'usr_principal_qa_01';
  const MOCK_MOVIE_ID = 'mov_inception_001';
  const MOCK_SHOWTIME_ID = 'st_1900_hall1';
  const MOVIE_TITLE = 'Inception (Re-Release)';
  const SHOWTIME_HOUR = '19:00';

  /**
   * Helper: Generate Mock Data Kursi Bioskop (Baris A-C, Nomor 1-10)
   */
  const generateMockSeats = (bookedSeatRow?: string, bookedSeatNum?: number) => {
    const rows = ['A', 'B', 'C'];
    const seatsList = [];

    for (const r of rows) {
      for (let n = 1; n <= 10; n++) {
        const isTargetBooked = bookedSeatRow === r && bookedSeatNum === n;
        seatsList.push({
          _id: `seat_${r}_${n}`,
          row: r,
          number: n,
          price: 50000,
          status: isTargetBooked ? 'booked' : 'available',
          isBooked: isTargetBooked,
          booked: isTargetBooked
        });
      }
    }
    return seatsList;
  };

  test.beforeEach(async ({ context, page }) => {
    // -------------------------------------------------------------------------
    // PRECONDITION: Injeksi Sesi Terotentikasi ke LocalStorage
    // -------------------------------------------------------------------------
    await context.addInitScript(({ userId }) => {
      window.localStorage.setItem('token', 'enterprise-jwt-qa-token');
      window.localStorage.setItem('role', 'customer');
      window.localStorage.setItem('user', JSON.stringify({
        _id: userId,
        name: 'Principal QA Engineer',
        email: 'principal.qa@cinemax.id'
      }));
    }, { userId: MOCK_USER_ID });

    // -------------------------------------------------------------------------
    // ISOLATED MOCKING: Master Data Film & Jadwal
    // -------------------------------------------------------------------------
    const today = new Date().toISOString();

    await page.route(`**/movies/${MOCK_MOVIE_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: MOCK_MOVIE_ID,
          title: MOVIE_TITLE,
          posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
          rating: 8.8,
          duration: 148,
          genre: ['Sci-Fi', 'Action']
        })
      });
    });

    await page.route(`**/showtimes**`, async (route) => {
      if (route.request().url().includes(MOCK_SHOWTIME_ID)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: MOCK_SHOWTIME_ID,
            movie: { _id: MOCK_MOVIE_ID, title: MOVIE_TITLE },
            date: today,
            startTime: SHOWTIME_HOUR,
            price: 50000,
            hall: { _id: 'hall_01', name: 'Studio 1 IMAX' }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              _id: MOCK_SHOWTIME_ID,
              movie: MOCK_MOVIE_ID,
              date: today,
              startTime: SHOWTIME_HOUR,
              price: 50000,
              hall: { _id: 'hall_01', name: 'Studio 1 IMAX' }
            }]
          })
        });
      }
    });

    await page.route('**/halls', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ _id: 'hall_01', name: 'Studio 1 IMAX' }] })
      });
    });
  });

  /**
   * Diagnostic & Failure Hook: Otomatis lampirkan screenshot dan log jika test gagal
   */
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = testInfo.outputPath(`failure-${testInfo.title.replace(/\s+/g, '_')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({
        name: 'Failure Artifact (Full Page Screenshot)',
        path: screenshotPath,
        contentType: 'image/png'
      });
      console.error(`[DIAGNOSTIC] Test "${testInfo.title}" failed. Screenshot captured at: ${screenshotPath}`);
    }
  });

  // ===========================================================================
  // SKENARIO 1: POSITIVE TEST (End-to-End Happy Path)
  // ===========================================================================
  test('Skenario 1: POSITIVE TEST - Alur Transaksi Lengkap (Film -> Jadwal 19:00 -> Kursi C5 & C6 -> Transfer Bank -> E-Ticket)', async ({ page }) => {
    const moviePage = new MoviePage(page);
    const seatPage = new SeatSelectionPage(page);
    const paymentPage = new PaymentPage(page);
    const ticketPage = new TicketPage(page);

    // Mocking Kursi: Seluruh kursi available
    await page.route(`**/seats/${MOCK_SHOWTIME_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generateMockSeats())
      });
    });

    // Mocking Pembayaran: 200 OK
    const mockPaymentId = 'PAY-TRX-SUCCESS-9988';
    await page.route('**/payments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Payment verified successfully via Bank Transfer',
          payment: { _id: mockPaymentId, amount: 100000, status: 'Completed' }
        })
      });
    });

    await page.route('**/seats/book-seats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.route(`**/bookings/user/${MOCK_USER_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bookings: [{
            _id: mockPaymentId,
            createdAt: new Date().toISOString(),
            totalPrice: 100000,
            showtimeId: {
              movie: { title: MOVIE_TITLE },
              date: new Date().toISOString(),
              startTime: SHOWTIME_HOUR
            },
            seatIds: [{ row: 'C', number: 5 }, { row: 'C', number: 6 }]
          }]
        })
      });
    });

    // 1. Pilih Film
    await test.step('Langkah 1: Navigasi dan pilih film pertama', async () => {
      await moviePage.navigate();
      const selectedTitle = await moviePage.selectFirstNowShowingMovie();
      expect(selectedTitle).toBe(MOVIE_TITLE);
    });

    // 2. Pilih Jadwal 19:00
    await test.step('Langkah 2: Pilih jadwal tayang jam 19:00', async () => {
      await moviePage.selectShowtime('19:00');
    });

    // 3. Pilih Kursi C5 dan C6
    await test.step('Langkah 3: Pilih kursi C5 & C6 serta verifikasi subtotal', async () => {
      await seatPage.expectSeatMapLoaded();
      await seatPage.selectSeat('C', 5);
      await seatPage.selectSeat('C', 6);
      await seatPage.expectSummary(2);
      await seatPage.proceedToPayment();
    });

    // 4. Konfirmasi & Checkout Pembayaran
    await test.step('Langkah 4: Konfirmasi pesanan dan submit pembayaran', async () => {
      await paymentPage.confirmBookingDetails(MOVIE_TITLE, ['C5', 'C6']);
      await paymentPage.submitPayment();
    });

    // 5. Penerbitan E-Ticket
    await test.step('Langkah 5: Verifikasi terbitnya E-Ticket pada Booking Success & My Bookings', async () => {
      const bookingRef = await ticketPage.expectBookingSuccess();
      expect(bookingRef).toContain('#');

      await ticketPage.openMyBookings();
      await ticketPage.expectETicketDetails(MOVIE_TITLE, ['C5', 'C6']);
    });
  });

  // ===========================================================================
  // SKENARIO 2: NEGATIVE TEST (Seat Conflict / Race Condition)
  // ===========================================================================
  test('Skenario 2: NEGATIVE TEST - Pencegahan Kursi Bentrok (Seat C5 Already Booked via Natural Click)', async ({ page }) => {
    const moviePage = new MoviePage(page);
    const seatPage = new SeatSelectionPage(page);

    // Mocking: Kursi C5 berstatus 'booked'
    await page.route(`**/seats/${MOCK_SHOWTIME_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generateMockSeats('C', 5))
      });
    });

    await test.step('Navigasi ke denah kursi jadwal jam 19:00', async () => {
      await moviePage.navigate();
      await moviePage.selectFirstNowShowingMovie();
      await moviePage.selectShowtime('19:00');
      await seatPage.expectSeatMapLoaded();
    });

    await test.step('Mencoba memilih kursi C5 yang sudah booked (Natural User Interaction)', async () => {
      const seatC5 = seatPage.getSeatLocator('C', 5);

      // Verifikasi status awal
      await expect(seatC5).toHaveClass(/booked/);
      await expect(seatC5).toHaveCSS('cursor', 'not-allowed');

      // Eksekusi natural click tanpa { force: true }
      await seatPage.trySelectBookedSeat('C', 5);

      // Expected Result 1: Kursi C5 tidak mengalami mutasi state menjadi 'selected'
      await expect(seatC5).not.toHaveClass(/selected/);

      // Expected Result 2: Checkout tetap diblokir (summary-bar tidak di-render)
      await seatPage.expectCheckoutPrevented();
    });
  });

  // ===========================================================================
  // SKENARIO 3: EDGE CASE (Fault Injection - Payment Gateway Timeout 504)
  // ===========================================================================
  test('Skenario 3: EDGE CASE - Pembayaran Mengalami Gateway Timeout (504) & Proteksi Double-Charge', async ({ page }) => {
    const moviePage = new MoviePage(page);
    const seatPage = new SeatSelectionPage(page);
    const paymentPage = new PaymentPage(page);

    // Mocking Kursi: Tersedia
    await page.route(`**/seats/${MOCK_SHOWTIME_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generateMockSeats())
      });
    });

    // FAULT INJECTION: Simulasi Gateway Timeout 504 dan pencatatan Request Counter
    let paymentRequestCount = 0;
    await page.route('**/payments', async (route) => {
      paymentRequestCount++;
      // Simulasi delay gateway 1 detik sebelum merespons 504 Gateway Timeout
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Gateway Timeout: Issuing bank failed to respond within timeout window'
        })
      });
    });

    // Guard Monitoring: Pastikan endpoint lock/book kursi TIDAK PERNAH dipanggil saat bayar gagal
    let seatBookApiInvoked = false;
    await page.route('**/seats/book-seats', async (route) => {
      seatBookApiInvoked = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    // 1. Navigasi dan pemilihan kursi normal
    await test.step('Navigasi dan pemilihan kursi C5 & C6 hingga checkout', async () => {
      await moviePage.navigate();
      await moviePage.selectFirstNowShowingMovie();
      await moviePage.selectShowtime('19:00');
      await seatPage.expectSeatMapLoaded();
      await seatPage.selectSeat('C', 5);
      await seatPage.selectSeat('C', 6);
      await seatPage.proceedToPayment();
      await paymentPage.confirmBookingDetails(MOVIE_TITLE, ['C5', 'C6']);
    });

    // 2. Eksekusi Pembayaran dengan Fault Injection
    await test.step('Submit pembayaran dan tangkap kegagalan Gateway Timeout', async () => {
      await paymentPage.fillPaymentForm();

      // Submit dan tangkap native alert dialog yang dipicu oleh PaymentPage.js
      const alertMsg = await paymentPage.submitPaymentExpectingFailure();

      console.log(`[FAULT INJECTION] Alert ditangkap: "${alertMsg}"`);

      // Expected Result 1: Pesan error informatif mengenai kegagalan pembayaran
      expect(alertMsg).toMatch(/Payment Failed.*Gateway Timeout/i);

      // Expected Result 2: Proteksi Double-Charge - Request hanya dikirim tepat 1 kali
      expect(paymentRequestCount).toBe(1);

      // Expected Result 3: Kursi TIDAK ter-booking secara keliru di backend
      expect(seatBookApiInvoked).toBe(false);

      // Expected Result 4: Pengguna TIDAK dialihkan ke halaman booking-success
      await paymentPage.expectRemainsOnCheckoutPage();
      expect(page.url()).not.toContain('booking-success');
    });
  });

});
