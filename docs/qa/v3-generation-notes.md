# Catatan Pembuatan Script V3 (Refined Baseline): AI-Assisted Automated Testing

Dokumen ini mendokumentasikan temuan audit terarah atas baseline V2, analisis akar masalah typing TypeScript, perbaikan arsitektur dan assertion pada V3, serta batasan metodologis eksperimen.

---

## A. Temuan Audit Terarah V2

Berdasarkan tinjauan statis dan log eksekusi V2 (`artifacts/execution/v2/20261115-213902/typecheck.log` dan `execution.log`):

1. **Deklarasi Variabel Payload dan Mutasi Callback (`cinema-booking.v2.spec.ts` baris 185–236):**
   * Variabel `capturedPaymentPayload` dan `bookSeatsPayload` dideklarasikan dengan nilai awal `null` di luar callback `page.route()`.
   * Mutasi variabel terjadi di dalam callback asinkron route handler (`route.request().postDataJSON()`).
   * Pada baris 274–283, dilakukan assertion:
     ```typescript
     expect(capturedPaymentPayload).not.toBeNull();
     expect(capturedPaymentPayload?.showtimeId).toBe(dummyShowtime._id);
     ```
   * **Fakta:** Assertion Playwright `expect(x).not.toBeNull()` tidak berfungsi sebagai *type guard* bagi TypeScript Control-Flow Analysis (CFA).
2. **Kelemahan Assertion Referensi Tiket (`booking-success.page.ts` baris 33):**
   * Di V2, assertion hanya memeriksa `expect(refText).toContainText('#')`.
   * **Fakta Kode Frontend (`frontend/src/pages/BookingSuccess.js` baris 57):**
     Elemen tiket dirender sebagai:
     ```jsx
     <div className="ref-text">
       Booking Ref: <span>#{Math.floor(Math.random() * 1000000)}</span>
     </div>
     ```
     Assertion `toContainText('#')` terlalu longgar dan dapat lolos hanya dengan karakter pagar tanpa memvalidasi struktur string nomor referensi.
3. **Pemeriksaan Konsistensi Header Jadwal:**
   * Di V2, halaman `/buy-tickets/:movieId` belum memvalidasi apakah judul film, durasi, dan rating yang ditampilkan di header konsisten dengan data film yang dipilih.
4. **Verifikasi Identitas Kursi pada Summary Bar:**
   * Di V2, assertion Skenario 2 hanya memverifikasi string teks `'1 Seats'`. Belum ada assertion eksplisit bahwa jumlah kursi yang berstatus `.seat.selected` di seluruh DOM tepat berjumlah 1.

---

## B. Akar Masalah Typing Berdasarkan Kode Aktual

Pada validasi statis V2, compiler mengeluarkan 6 error:
```text
experiments/v2/cinema-booking.v2.spec.ts(275,36): error TS2339: Property 'showtimeId' does not exist on type 'never'.
experiments/v2/cinema-booking.v2.spec.ts(276,36): error TS2339: Property 'amount' does not exist on type 'never'.
experiments/v2/cinema-booking.v2.spec.ts(277,36): error TS2339: Property 'paymentMethod' does not exist on type 'never'.
experiments/v2/cinema-booking.v2.spec.ts(278,36): error TS2339: Property 'cardLast4' does not exist on type 'never'.
experiments/v2/cinema-booking.v2.spec.ts(279,36): error TS2339: Property 'seats' does not exist on type 'never'.
experiments/v2/cinema-booking.v2.spec.ts(283,30): error TS2339: Property 'seatIds' does not exist on type 'never'.
```

### Mekanisme Terjadinya Error (TypeScript Control-Flow Analysis):
1. **Scope Closure:** TypeScript tidak dapat menjamin secara statis bahwa callback `page.route` telah dieksekusi sebelum baris assertion dijalankan.
2. **Ketiadaan Assertion Type Guard Signature:** Signature Playwright `expect(actual: unknown): Matchers<...>` mengembalikan object matcher dan tidak memiliki penanda pengubah tipe `asserts actual is NonNullable<T>`.
3. **Penyempitan ke Tipe `never`:** Ketika TypeScript mengevaluasi `capturedPaymentPayload?.showtimeId`, compiler melihat variabel masih bernilai pasti `null` pada alur sinkron scope luar. Akses properti opsional pada nilai yang diyakini compiler sebagai `null` menghasilkan tipe `never`, sehingga setiap akses properti turunan memicu `error TS2339`.

---

## C. Perubahan V2 → V3 dan Alasannya

| Komponen / Bagian | Implementasi di V2 | Solusi / Perbaikan di V3 | Alasan & Manfaat Teknis |
|---|---|---|---|
| **Penangkapan Payload Request** | Variabel closure diubah di dalam `page.route` callback | Menggunakan `page.waitForRequest(...)` yang dipasang sebelum aksi submit | Mengembalikan `Promise<Request>` secara idiomatis; eliminasi mutasi variabel closure; menjamin type safety penuh tanpa narrowing ke `never`. |
| **Validasi Tipe Data Runtime** | Optional chaining `capturedPaymentPayload?.prop` | Validasi runtime tipe `typeof data === 'object'` dan casting aman ke `Record<string, unknown>` | Menghindari penggunaan `any`, `@ts-ignore`, atau casting sembarangan sambil tetap memvalidasi skema payload di runtime. |
| **Validasi Referensi Tiket** | `expect(refText).toContainText('#')` | Regex matching pola lengkap: `/^Booking Ref:\s*#\d{1,6}$/` dan span `/^#\d{1,6}$/` | Menguji struktur format tiket secara presisi sesuai implementasi generator `Math.random()` di frontend. |
| **Konsistensi Info Film di Jadwal** | Hanya mengecek container terlihat | Memvalidasi judul, durasi (`... mins`), dan rating pada header seleksi jadwal | Memastikan integritas data film tidak berubah saat transisi halaman. |
| **Presisi Geometri Pointer (Skenario 2)** | Mengambil bounding box dan langsung klik tengah | Menambahkan validasi bahwa koordinat klik berada dalam rentang bounding box dan dalam batas viewport browser | Menjamin integritas klik pointer fisik benar-benar mengenai target visual tanpa overflow layar. |
| **Verifikasi Kuantitas Kursi (Skenario 2)** | Hanya memvalidasi teks `.summary-bar` | Memvalidasi teks summary bar DAN memverifikasi jumlah elemen `.seat.selected` di DOM tepat 1 | Menutup celah di mana summary bar benar tetapi DOM memiliki kursi terpilih tersembunyi. |

---

## D. Pemetaan Requirement ke Assertion V3

| Skenario | Requirement Bisnis & Pengujian | Langkah Pengujian | Assertion Kunci di V3 |
|---|---|---|---|
| **Skenario 1: Pemesanan Berhasil** | Alur lengkap, konsistensi data antar-layar, validasi kontrak payload backend, dan format e-ticket | 1. Buka `/movies`<br>2. Verifikasi & pilih film *Inception*<br>3. Verifikasi info film di `/buy-tickets/:id`<br>4. Pilih kursi A1<br>5. Verifikasi ringkasan di `/create-booking`<br>6. Isi pembayaran & pasang `waitForRequest`<br>7. Submit bayar<br>8. Verifikasi e-ticket & payload request | - `showtimePage.verifyMovieInfo('Inception', 148, 8.8)`<br>- `seatPage.getSelectedSeatsCount() === 1`<br>- `confirmPage.verifyBookingDetails(...)`<br>- `paymentPage.verifyPaymentDetails('Rs. 500', 'A1')`<br>- `successPage.verifyTicketReferencePattern()` (Regex `/^Booking Ref:\s*#\d{1,6}$/`)<br>- `paymentBody.showtimeId === dummyShowtime._id`<br>- `paymentBody.seats === ['seat-A1']`<br>- `bookSeatsBody.seatIds === ['seat-A1']` |
| **Skenario 2: Kursi Booked Tidak Terpilih** | Kursi berstatus booked tidak dapat dipilih melalui interaksi pointer fisik browser nyata, dan tidak mencemari ringkasan | 1. Buka `/booking/:showtimeId`<br>2. Verifikasi status `booked`<br>3. Verifikasi computed style `pointer-events: none` & `cursor: not-allowed`<br>4. Validasi koordinat bounding box & klik tengah via `page.mouse.click()`<br>5. Verifikasi kursi tetap unselected & summary hidden<br>6. Kontrol positif: klik kursi available (1)<br>7. Verifikasi summary bar & hitung DOM `.seat.selected` | - `seatPage.verifySeatState(2, 'booked')`<br>- `seatPage.verifySeatComputedStyle(2, 'pointer-events', 'none')`<br>- `seatPage.verifySeatComputedStyle(2, 'cursor', 'not-allowed')`<br>- Bounding box bounds check: `clickX >= box.x && clickX <= box.x + box.width`<br>- `bookedSeat.not.toHaveClass(/selected/)`<br>- `seatPage.verifySummaryHidden()`<br>- Kontrol positif: `seatPage.verifySummary('1 Seats', 'Rs. 500')`<br>- DOM count check: `getSelectedSeatsCount() === 1` |
| **Skenario 3: Pembayaran HTTP 504** | Tangani kegagalan pembayaran 504 tanpa crash, tangkap dialog alert, tombol kembali aktif, rute tidak berpindah, dan endpoint pasca-bayar tidak dipanggil | 1. Flow kursi & booking konfirmasi<br>2. Mock `POST /api/payments` 504<br>3. Pantau pemanggilan `POST /api/seats/book-seats`<br>4. Pasang `waitForEvent('dialog')` sebelum submit<br>5. Submit bayar & tangkap dialog<br>6. Tunggu tombol bayar re-enabled (`PAY NOW`)<br>7. Verifikasi rute tetap di checkout & sukses tidak tampil<br>8. Verifikasi counter pemanggilan endpoint pasca-bayar | - `dialog.message() contains 'Payment Failed'` & `'Gateway Timeout'`<br>- `paymentPage.payButton.toBeEnabled()`<br>- `paymentPage.payButton.toHaveText('PAY NOW')`<br>- `page.url() not.toContain('/booking-success')`<br>- `page.url() matches /\/payment\/checkout/`<br>- `bookSeatsCallCount === 0` |

---

## E. Perubahan Fixture atau Cakupan

* **Fixture Data:** Tidak ada perubahan pada nilai fixture (`dummyMovie`, `dummyShowtime`, `dummySeats`, `dummyHalls`). Hal ini menjamin konsistensi perbandingan antar-versi (V1, V2, dan V3).
* **Cakupan Pengujian:**
  * Diperluas dengan validasi konsistensi metadata film di header halaman jadwal (Skenario 1).
  * Diperketat dengan validasi regex pola referensi tiket lengkap (Skenario 1).
  * Diperkuat dengan validasi jumlah elemen terpilih pada DOM (Skenario 2).

---

## F. Batas Validasi Referensi Tiket dan Mock API

1. **Batas Validasi Referensi Tiket:**
   * Assertion regex `/^Booking Ref:\s*#\d{1,6}$/` memverifikasi kepatuhan format output teks frontend.
   * **Batasan Penting:** Pola yang valid **tidak membuktikan keunikan nomor tiket** maupun **keterikatan tiket ke ID transaksi backend**. Pada kode frontend (`BookingSuccess.js`), angka tersebut dihasilkan dari `Math.random() * 1000000`, sehingga secara arsitektural terputus dari objek `Payment` database.
2. **Batas Validasi Endpoint Mock (Skenario 3):**
   * Verifikasi `expect(bookSeatsCallCount).toBe(0)` membuktikan bahwa frontend tidak memicu request lanjutan `book-seats` selama jendela pengamatan test case berjalan.
   * **Batasan Penting:** Ketiadaan request dalam test window ini bukan jaminan universal bahwa endpoint tidak akan pernah dipanggil di latar belakang (misalnya oleh retry timer tidak terduga). Selain itu, ini tidak membuktikan idempotensi database backend asli.

---

## G. Risiko yang Masih Perlu Diuji

1. **Aksesibilitas Keyboard (A11y):** Kursi yang memiliki CSS `pointer-events: none` mencegah interaksi mouse, namun belum teruji apakah elemen tersebut masih dapat dijangkau via tombol `Tab` atau dipilih menggunakan `Enter/Space`.
2. **Koneksi WebSocket / Socket.IO:** Topbar menginisialisasi socket client di background yang saat ini diabaikan pada mock testing.
3. **Kesesuaian Resolusi Layar (Responsiveness):** Pengujian dijalankan pada resolusi 1280x720. Bounding box pada layar mobile atau tablet berpotensi memiliki layout wrapping yang berbeda.

---

## H. Catatan Metodologi Eksperimen

1. **Status Validasi V1:** Script V1 yang monolitik secara teoritis dapat diperiksa oleh TypeScript, namun typecheck khusus V1 belum dilakukan pada tahap sebelumnya karena fokus V1 adalah pengujian fungsional dasar.
2. **Durasi Runtime:** Selisih durasi antara V1 (56.33s) dan V2 (11.79s) terjadi semata-mata karena eliminasi penalti timeout 45 detik pada Skenario 2, bukan karena overhead arsitektur Page Object Model (POM).
3. **Sifat Iterasi V3:** V3 merupakan hasil perbaikan terarah berbasis audit empiris atas kelemahan tipe data dan assertion V2, bukan eksperimen terkontrol yang hanya menguji variasi format penulisan prompt.

---

## I. Status Eksperimen V3

* **Status:** **Generated, belum divalidasi secara statis (typecheck) maupun runtime (eksekusi pengujian).**
* Sesuai batasan instruksi, pada tahap ini belum dijalankan `tsc`, `playwright test --list`, maupun `playwright test`.
