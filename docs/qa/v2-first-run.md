# Laporan Validasi Statis dan First Run Baseline V2: AI-Assisted Automated Testing

Laporan ini mendokumentasikan hasil validasi statis (TypeScript typecheck) dan eksekusi pengujian aktual pertama (*first run*) untuk baseline V2 (`experiments/v2/cinema-booking.v2.spec.ts` dan modul POM di `experiments/v2/pages/`), serta perbandingannya secara objektif dengan baseline V1.

---

## A. Lingkungan dan Konfigurasi

| Komponen | Spesifikasi / Konfigurasi Aktual |
|---|---|
| **Sistem Operasi** | Microsoft Windows NT 10.0.26300.0 (Windows 11) |
| **Node.js** | v20.19.5 |
| **npm** | 10.8.2 |
| **Playwright** | Version 1.65.1 |
| **TypeScript Compiler** | Version 5.9.3 |
| **Browser Runner** | Chromium Headless (Viewport: 1280x720) |
| **Frontend Server** | `http://localhost:3000` (dijalankan manual oleh pengguna di host, diverifikasi HTTP 200 OK) |
| **Konfigurasi Eksekusi** | `experiments/playwright.v2.config.ts` (workers: 1, retries: 0, repeatEach: 1, timeout: 45s, globalTimeout: 180s, tanpa webServer) |
| **Timestamp Eksekusi** | 2026-11-15T21:39:02+07:00 (Run ID: `20261115-213902`) |

---

## B. Hash File V2 Sebelum dan Sesudah Eksekusi

Untuk menjamin integritas baseline dan membuktikan bahwa kode tidak diubah secara diam-diam:

| Path File V2 | Hash SHA-256 Sebelum Eksekusi | Hash SHA-256 Setelah Eksekusi | Status Integritas |
|---|---|---|---|
| `experiments/v2/cinema-booking.v2.spec.ts` | `990ADCF2385C6690062CB7A791542EB674B968E55B27D5087D0BA3692B3F7D4C` | `990ADCF2385C6690062CB7A791542EB674B968E55B27D5087D0BA3692B3F7D4C` | **Identik** |
| `experiments/v2/pages/booking-confirm.page.ts` | `A6DD30C49306C006B8BEEBC769535E5AB43CB17323EFD393BFB386F750FED330` | `A6DD30C49306C006B8BEEBC769535E5AB43CB17323EFD393BFB386F750FED330` | **Identik** |
| `experiments/v2/pages/booking-success.page.ts` | `D707E054F3F16E02875C54F7B78FA0EA7A0905159A139D1BAC028BA3785865A1` | `D707E054F3F16E02875C54F7B78FA0EA7A0905159A139D1BAC028BA3785865A1` | **Identik** |
| `experiments/v2/pages/movie-list.page.ts` | `163E6569689670A1CB628B95DD42BD44BE1B65E77B515D237A165EA7C127C83D` | `163E6569689670A1CB628B95DD42BD44BE1B65E77B515D237A165EA7C127C83D` | **Identik** |
| `experiments/v2/pages/payment.page.ts` | `4621701FD89248D930D64BC1616D6654960BA5A0E7A190110FC2675305B77409` | `4621701FD89248D930D64BC1616D6654960BA5A0E7A190110FC2675305B77409` | **Identik** |
| `experiments/v2/pages/seat-selection.page.ts` | `DF5C7EF3BA8FA3E65DB85106C654D0F2D8220E9577D11DE4FF7BFF5ED5ABF4DC` | `DF5C7EF3BA8FA3E65DB85106C654D0F2D8220E9577D11DE4FF7BFF5ED5ABF4DC` | **Identik** |
| `experiments/v2/pages/showtime.page.ts` | `39ED26084C7FC5BCCFD0D3C48909A02F4732C8F3EBD50D78B252A2476D7ED936` | `39ED26084C7FC5BCCFD0D3C48909A02F4732C8F3EBD50D78B252A2476D7ED936` | **Identik** |

*File manifest tersimpan di:* `artifacts/execution/v2/20261115-213902/manifest.json`.

---

## C. Hasil Validasi Statis (Typecheck) dan Discovery

### 1. Validasi Statis (TypeScript Compiler)
* **Konfigurasi:** `experiments/tsconfig.v2.json` (strict checking, `noEmit: true`, hanya mencakup V2 dan POM-nya).
* **Perintah:** `npx tsc --project experiments/tsconfig.v2.json`
* **Exit Code:** `2` (**Typecheck GAGAL**)
* **Log Error Aktual:**
  ```text
  experiments/v2/cinema-booking.v2.spec.ts(275,36): error TS2339: Property 'showtimeId' does not exist on type 'never'.
  experiments/v2/cinema-booking.v2.spec.ts(276,36): error TS2339: Property 'amount' does not exist on type 'never'.
  experiments/v2/cinema-booking.v2.spec.ts(277,36): error TS2339: Property 'paymentMethod' does not exist on type 'never'.
  experiments/v2/cinema-booking.v2.spec.ts(278,36): error TS2339: Property 'cardLast4' does not exist on type 'never'.
  experiments/v2/cinema-booking.v2.spec.ts(279,36): error TS2339: Property 'seats' does not exist on type 'never'.
  experiments/v2/cinema-booking.v2.spec.ts(283,30): error TS2339: Property 'seatIds' does not exist on type 'never'.
  ```
* **Temuan Kualitas Output AI:**
  AI menggunakan `expect(capturedPaymentPayload).not.toBeNull()`. Fungsi assertion Playwright tidak dianggap sebagai custom type guard oleh TypeScript compiler. Akibatnya, pada mode `strictNullChecks`, variabel dengan tipe union nullable (`T | null`) yang diinisialisasi `null` dipersempit (*narrowed*) menjadi tipe `never`. Ini adalah kelemahan sintaksis khas kode TypeScript yang digenerate oleh LLM.
* **Tindakan:** Sesuai batasan eksperimen, kode **tidak diperbaiki**. Runtime tetap dilanjutkan karena Playwright menggunakan transpiler on-the-fly (Babel/ESBuild) tanpa blokade typecheck penuh.

### 2. Test Discovery
* **Perintah:** `npx playwright test --config experiments/playwright.v2.config.ts --list`
* **Exit Code:** `0` (**Discovery SUKSES**)
* **Hasil:** Tepat **3 test** ditemukan dalam 1 file:
  1. `Skenario 1: Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket`
  2. `Skenario 2: Kursi yang sudah booked tidak dapat dipilih`
  3. `Skenario 3: Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses`

---

## D. Perintah Runtime dan Exit Code

* **Run ID:** `20261115-213902`
* **Perintah:**
  ```powershell
  $env:V2_RUN_ID = "20261115-213902"; $env:V2_ARTIFACTS_DIR = (Resolve-Path "artifacts\execution\v2\20261115-213902").Path; $logPath = "artifacts\execution\v2\20261115-213902\execution.log"; npx playwright test --config experiments/playwright.v2.config.ts *>&1 | Tee-Object -FilePath $logPath; $exitCode = $LASTEXITCODE; "PLAYWRIGHT_EXIT_CODE: $exitCode" | Add-Content -Path $logPath; Write-Output "PLAYWRIGHT_EXIT_CODE: $exitCode"
  ```
* **Exit Code Runner:** `0` (Seluruh test case lulus pada runtime)

---

## E. Tabel Hasil Runtime V2

* **Total Test Dieksekusi:** 3 test
* **Pass Rate:** **3/3 Passed (100% pada satu run yang diamati)**
* **Jumlah Durasi Test Individual:** 10.74 detik (6.55s + 1.98s + 2.20s)
* **Durasi Wall-Clock Suite:** 11.79 detik

| Test | Status Runner | Durasi | Temuan Empiris | Path Bukti |
|---|---|---|---|---|
| **Skenario 1:** Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket | **PASSED** | 6.55s (6554 ms) | Alur navigasi lengkap, validasi UI konsisten, payload API `POST /api/payments` dan `POST /api/seats/book-seats` terverifikasi sesuai kontrak data bisnis | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v2/20261115-213902/execution.log)<br>[report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v2/20261115-213902/report.json) |
| **Skenario 2:** Kursi yang sudah booked tidak dapat dipilih | **PASSED** | 1.98s (1981 ms) | Computed style `pointer-events: none` & `cursor: not-allowed` terverifikasi; klik koordinat pointer fisik (`page.mouse.click`) pada bounding box visual tidak memicu seleksi; kontrol positif kursi A1 berhasil | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v2/20261115-213902/execution.log)<br>[report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v2/20261115-213902/report.json) |
| **Skenario 3:** Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses | **PASSED** | 2.20s (2204 ms) | Dialog alert `Payment Failed` tertangkap asinkron tanpa deadlock; tombol bayar kembali aktif (`PAY NOW`); rute tetap di checkout; endpoint `book-seats` terbukti tidak dipanggil | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v2/20261115-213902/execution.log)<br>[report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v2/20261115-213902/report.json) |

---

## F. Pass Rate

* **Pass Rate V2:** **3/3 passed (100% pada satu run yang diamati)**
* **Denominator:** Dihitung dari 3 test case yang dieksekusi secara aktual oleh runner (3 passed, 0 failed, 0 timedOut, 0 skipped).

---

## G. Perbandingan Komparatif: Baseline V1 vs Baseline V2

| Metrik / Parameter | Baseline V1 (Run `20261115-212611`) | Baseline V2 (Run `20261115-213902`) | Analisis Perbedaan |
|---|---|---|---|
| **Skenario 1 (Happy Path)** | PASSED (5.86s) | PASSED (6.55s) | Durasi relatif sebanding (+0.69s di V2 karena adanya Page Object lookup dan ekstra assertion kontraktual payload API). |
| **Skenario 2 (Kursi Booked)** | **FAILED / timedOut (46.43s)** | **PASSED (1.98s)** | **Perubahan Signifikan:** V1 gagal timeout karena Playwright menolak klik pada elemen dengan `pointer-events: none`. V2 berhasil dalam 1.98s berkat strategi klik koordinat pointer visual nyata (`page.mouse.click`). |
| **Skenario 3 (Gagal 504)** | PASSED (1.71s) | PASSED (2.20s) | Keduanya lulus; V2 menambahkan verifikasi re-enable tombol form dan pemantauan endpoint `book-seats`. |
| **Pass Rate** | 2/3 (66.67%) | **3/3 (100%)** | Peningkatan 1 test case (Skenario 2 terselesaikan). |
| **Jumlah Durasi Test** | 54.00s | **10.74s** | V2 lebih cepat ~43.26 detik karena hilangnya penalti timeout 45s pada Skenario 2 (bukan karena aplikasi lebih cepat). |
| **Wall-Clock Suite** | 56.33s | **11.79s** | Pengurangan waktu suite sebesar ~79% karena eliminasi timeout. |
| **Typecheck Status** | N/A (Monolitik, tanpa tsc strict) | **Exit Code 2 (Gagal TS2339)** | Menemukan keterbatasan AI dalam penanganan type narrowing TypeScript. |
| **Arsitektur Kode** | 1 file script (monolitik) | Page Object Model modular (6 modul POM) | Keterbacaan dan pemeliharaan lebih terstruktur. |

---

## H. Kelemahan Assertion dan Cakupan yang Tetap Ada (Walaupun Passed)

Meskipun ketiga pengujian V2 berstatus passed pada runtime, tinjauan kode mendalam mengidentifikasi beberapa kelemahan assertion:
1. **Validasi Nomor Referensi E-Ticket Bersifat Parsial:**
   * Assertion pada Skenario 1 hanya memeriksa `expect(refText).toContainText('#')`.
   * Pada implementasi aplikasi (`frontend/src/pages/BookingSuccess.js` baris 57), nomor referensi digenerate acak oleh frontend (`#{Math.floor(Math.random() * 1000000)}`) tanpa mengikat ID transaksi backend nyata. Assertion Playwright tidak dapat memvalidasi keterkaitan antara ID pembayaran mock dengan teks tiket di layar.
2. **Mocking Tanpa Validasi Header/Query Parameter:**
   * Endpoint `**/api/movies*` dan `**/api/seats/*` mengembalikan fixture langsung tanpa memvalidasi query parameter request atau keberadaan header Authorization Bearer token.
3. **Keterbatasan Pengujian Koordinat Pointer:**
   * `page.mouse.click(x, y)` memvalidasi bahwa klik mouse pengguna tidak memilih kursi booked akibat efek CSS browser. Namun, ini tidak menguji skenario jika pengguna mengakses aplikasi menggunakan navigasi keyboard (*accessibility focus/enter*) atau jika ada bypass manipulasi DOM via skrip console.

---

## I. Usulan Perbaikan untuk Tahap Berikutnya (Tanpa Diterapkan di V2)

1. **Perbaikan Type Narrowing pada TypeScript Spec:**
   * Mengganti `expect(val).not.toBeNull()` menjadi pengecekan eksplisit TypeScript:
     ```typescript
     if (!capturedPaymentPayload) throw new Error('Payload not captured');
     ```
     agar compiler mengenali tipe data secara aman dan typecheck keluar dengan kode 0.
2. **Validasi Strict pada API Mock:**
   * Menambahkan assertion pada router mock untuk memverifikasi bahwa token Authorization (`Bearer ...`) dikirimkan pada setiap request API yang terproteksi.
3. **Pengujian Aksesibilitas (A11y):**
   * Menguji interaksi tombol keyboard (Tab + Enter / Space) pada daftar kursi untuk memastikan kursi booked tidak dapat difokuskan atau dipilih oleh pembaca layar.

---

## J. Batasan Kesimpulan

* Hasil ini diperoleh dari **satu kali eksekusi suite V2** yang diamati.
* Laporan ini **tidak membuktikan**:
  * Stabilitas 100% jangka panjang lintas berbagai resolusi layar.
  * Keamanan transaksi finansial nyata atau pencegahan double-charge di sisi payment processor eksternal.
  * Concurrency backend (dua pengguna memilih kursi yang sama secara bersamaan di database nyata).
* Peningkatan performa waktu dari V1 ke V2 terjadi semata-mata karena perbaikan strategi interaksi yang mengeliminasi timeout 45 detik, bukan percepatan performa aplikasi bioskop.
