# Catatan Pembuatan Script V2: AI-Assisted Automated Testing

Dokumen ini mendokumentasikan proses perancangan dan implementasi script pengujian baseline V2 (`experiments/v2/cinema-booking.v2.spec.ts`) yang dibuat berdasarkan hasil evaluasi aktual dari eksekusi baseline V1.

---

## 1. Daftar File yang Dibuat

1. **Script Pengujian Utama:**
   * `experiments/v2/cinema-booking.v2.spec.ts`
2. **Modul Page Object Model (POM):**
   * `experiments/v2/pages/movie-list.page.ts` (Halaman daftar film `/movies`)
   * `experiments/v2/pages/showtime.page.ts` (Halaman pemilihan jadwal `/buy-tickets/:movieId`)
   * `experiments/v2/pages/seat-selection.page.ts` (Halaman pemilihan kursi `/booking/:showtimeId`)
   * `experiments/v2/pages/booking-confirm.page.ts` (Halaman konfirmasi pemesanan `/create-booking`)
   * `experiments/v2/pages/payment.page.ts` (Halaman checkout & pembayaran `/payment/checkout`)
   * `experiments/v2/pages/booking-success.page.ts` (Halaman e-ticket & konfirmasi sukses `/booking-success`)
3. **Dokumentasi:**
   * `docs/qa/v2-generation-notes.md`

> **Catatan:** Seluruh file POM baru ditempatkan secara terisolasi di `experiments/v2/pages/` dan tidak mengubah atau menambah file pada folder `pages/` existing.

---

## 2. Pemetaan Requirement ke Test dan Assertion

| Skenario | Requirement Bisnis & Pengujian | Langkah Pengujian | Assertion Kunci di V2 |
|---|---|---|---|
| **Skenario 1: Pemesanan Berhasil** | Alur lengkap pemesanan tiket dari pemilihan film, jadwal, kursi, konfirmasi, pembayaran, hingga tiket sukses beserta integritas payload API | 1. Buka `/movies`<br>2. Pilih film & klik Book Now<br>3. Pilih jadwal pada Hall 1<br>4. Pilih kursi A1<br>5. Verifikasi ringkasan booking<br>6. Isi kartu & submit bayar<br>7. Verifikasi halaman sukses & e-ticket | - `expect(capturedPaymentPayload.showtimeId).toBe(dummyShowtime._id)`<br>- `expect(capturedPaymentPayload.amount).toBe(500)`<br>- `expect(capturedPaymentPayload.seats).toContain('seat-A1')`<br>- `expect(bookSeatsPayload.seatIds).toContain('seat-A1')`<br>- `expect(successPage.heading).toBeVisible()`<br>- `expect(successPage.refText).toContainText('#')` |
| **Skenario 2: Kursi Booked Tidak Dapat Dipilih** | Kursi dengan status booked tidak dapat dipilih melalui interaksi visual pointer nyata, dan tidak masuk ke ringkasan belanja | 1. Buka `/booking/:showtimeId`<br>2. Verifikasi status UI kursi 2 (`booked`)<br>3. Verifikasi computed style `pointer-events: none` & `cursor: not-allowed`<br>4. Klik koordinat tengah bounding box menggunakan `page.mouse.click()`<br>5. Verifikasi kursi tetap unselected & summary hidden<br>6. Klik kursi 1 (available) sebagai kontrol positif | - `expect(seat).toHaveClass(/booked/)`<br>- `expect(seat).not.toHaveClass(/selected/)`<br>- `expect(computedStyle('pointer-events')).toBe('none')`<br>- `expect(summaryBar).toBeHidden()`<br>- Kontrol positif: `expect(summaryBar).toContainText('1 Seats')` |
| **Skenario 3: Pembayaran HTTP 504** | Tangani kegagalan pembayaran 504 tanpa crash, tampilkan alert dialog, tetap di halaman checkout, re-enable tombol, dan tidak memanggil endpoint booking kursi | 1. Buka checkout via pemilihan kursi & konfirmasi<br>2. Mock `POST /api/payments` 504<br>3. Pantau `POST /api/seats/book-seats`<br>4. Daftarkan `page.waitForEvent('dialog')`<br>5. Klik Pay Now & terima dialog<br>6. Verifikasi tombol kembali aktif & URL tetap di checkout | - `expect(dialog.message()).toContain('Payment Failed')`<br>- `expect(page.url()).not.toContain('/booking-success')`<br>- `expect(paymentPage.payButton).toBeEnabled()`<br>- `expect(paymentPage.payButton).toHaveText('PAY NOW')`<br>- `expect(bookSeatsCalled).toBe(false)` |

---

## 3. Perbedaan V1 dan V2 Beserta Alasannya

| Aspek | Implementasi di V1 | Perbaikan di V2 | Alasan Perubahan |
|---|---|---|---|
| **Struktur Kode** | Script monolitik (semua selector dan langkah di dalam 1 file) | Mengadopsi Page Object Model (POM) modular di `experiments/v2/pages/` | Meningkatkan pemeliharaan, keterbacaan, dan memisahkan logika UI dengan assertion uji |
| **Interaksi Kursi Booked (Skenario 2)** | Memanggil `locator.click()` standar Playwright | Memeriksa computed style `pointer-events: none` lalu melakukan klik koordinat visual fisik via `page.mouse.click(x, y)` | V1 mengalami timeout 45s karena Playwright actionability check menolak klik pada elemen dengan `pointer-events: none`. V2 menguji perilaku input pengguna nyata tanpa bypass `force: true` |
| **Validasi Kontrak Data Bisnis (Skenario 1)** | Hanya memeriksa keberadaan teks visual di UI browser | Menginspeksi payload HTTP request `POST /api/payments` dan `POST /api/seats/book-seats` | Memastikan data bisnis yang dikirim ke backend konsisten dengan kursi dan harga yang dipilih di layar |
| **Penanganan Dialog Browser (Skenario 3)** | Menggunakan `page.once('dialog')` sebelum klik | Menggunakan promise sinkronisasi paralel `page.waitForEvent('dialog')` | Mencegah potensi race condition antara pengiriman form Axios asinkron dengan penangkapan dialog Playwright |
| **Pengecekan Status Tombol (Skenario 3)** | Hanya mengecek bahwa tombol tidak hilang | Memverifikasi `payButton` kembali berstatus enabled dan label kembali ke `PAY NOW` (bukan macet di `PROCESSING...`) | Memastikan frontend merestorasi state form setelah error ditangani |
| **Pemantauan Endpoint Pasca-Bayar (Skenario 3)** | Tidak memantau endpoint sampingan | Memantau apakah `POST /api/seats/book-seats` dipanggil | Memastikan integritas alur: jika pembayaran gagal, kursi tidak boleh ditandai sebagai booked |

---

## 4. Penjelasan Strategi Interaksi Kursi Booked

### Masalah pada V1:
Pada CSS aplikasi (`frontend/src/SeatMap.css` baris 220–224):
```css
.seat.booked {
    background-color: #ef4444 !important;
    cursor: not-allowed;
    pointer-events: none; /* Prevents clicking */
}
```
Ketika Playwright menjalankan `locator.click()`, protokol aksi Playwright melakukan *actionability checks*, salah satunya memverifikasi bahwa elemen dapat menerima pointer event. Karena ada deklarasi `pointer-events: none`, Playwright menganggap elemen tersebut belum stabil/siap diklik dan menunggu hingga batas timeout 45 detik.

### Solusi V2:
1. **Verifikasi Deklaratif:** Mengambil computed style elemen untuk memastikan properti `pointer-events` bernilai `none` dan `cursor` bernilai `not-allowed`.
2. **Simulasi Pointer Nyata (Koordinat Bounding Box):**
   * Mengambil posisi fisik elemen di layar menggunakan `seat.boundingBox()`.
   * Menghitung titik tengah `(x + width/2, y + height/2)`.
   * Mengirim event hardware klik melalui `page.mouse.click(clickX, clickY)`.
   * Melalui cara ini, browser yang melakukan hit-testing secara alami. Karena elemen memiliki `pointer-events: none`, klik diteruskan ke layer di bawahnya dan tidak memicu event handler React, sehingga kursi tetap tidak terpilih tanpa memicu timeout Playwright.
   * **Batasan Strategi:** Klik koordinat ini memvalidasi perilaku pointer visual di browser; ini tidak membuktikan locking di sisi database backend atau aksesibilitas keyboard (a11y).

---

## 5. Perubahan Fixture atau Cakupan

* **Fixture Data:** Tidak ada perubahan pada skema data dummy. Nilai fixture film (`Inception`), jadwal (`Hall 1`, `10:00 AM`), dan kursi (`A1` available, `A2` booked) tetap identik 100% dengan V1 agar perbandingan hasil tetap valid dan terkontrol.
* **Cakupan Pengujian:**
  * Diperluas dengan verifikasi request payload backend pada Skenario 1.
  * Diperluas dengan verifikasi pencegahan pemanggilan endpoint pasca-bayar pada Skenario 3.

---

## 6. Asumsi dan Keterbatasan

1. **Asumsi Viewport:** Viewport diasumsikan 1280x720 (default Playwright config) sehingga tata letak grid kursi tidak mengalami overflow terpotong saat dihitung bounding box-nya.
2. **Keterbatasan Mock Network:** Pengujian V2 tetap merupakan pengujian UI berbasis mock API Playwright, bukan pengujian end-to-end fullstack dengan database PostgreSQL/MongoDB nyata.
3. **Penyelarasan Dialog Alert:** Penanganan `alert()` bergantung pada dialog bawaan window browser React.

---

## 7. Status Eksperimen V2

* **Status:** **Generated, belum divalidasi secara statis maupun runtime.**
* Sesuai batasan eksperimen, script V2 belum dijalankan, belum dilakukan discovery, dan belum dilakukan typecheck pada tahap ini.
