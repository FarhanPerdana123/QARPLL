# Laporan First Run Baseline V1: AI-Assisted Automated Testing

Laporan ini mendokumentasikan hasil pengujian baseline pertama (First Run) untuk script pengujian `experiments/v1/cinema-booking.v1.spec.ts` tanpa perbaikan atau modifikasi pada script pengujian itu sendiri.

---

## A. Lingkungan dan Versi Aktual

| Komponen | Spesifikasi / Versi |
|---|---|
| **Sistem Operasi** | Microsoft Windows NT 10.0.26300.0 (Windows 11) |
| **Node.js** | v20.19.5 |
| **npm** | 10.8.2 |
| **Playwright Test Runner** | Version 1.65.1 |
| **Browser Project** | Chromium (Headless: true, Viewport: 1280x720) |
| **Base URL** | `http://localhost:3000` |
| **API Mode** | Mock Playwright network interception (`page.route()`) |
| **Status Frontend** | Dijalankan secara mandiri oleh pengguna di host `http://localhost:3000` (HTTP 200 terverifikasi sebelum eksekusi aktual) |

---

## B. Perintah Eksekusi dan Exit Code

Terdapat 3 percobaan dalam proses pencapaian eksekusi aktual:

### 1. Percobaan 1 - First Launch / Setup Error (Run ID: `20261115-205145`)
* **Waktu Mulai:** Minggu, 15 November 2026, 20:52:05 WIB
* **Perintah:**
  ```powershell
  $env:V1_RUN_ID = "20261115-205145"; $env:V1_ARTIFACTS_DIR = (Resolve-Path "artifacts\execution\v1\20261115-205145").Path; $logPath = "artifacts\execution\v1\20261115-205145\execution.log"; npx playwright test --config experiments/playwright.v1.config.ts *>&1 | Tee-Object -FilePath $logPath; $exitCode = $LASTEXITCODE; "PLAYWRIGHT_EXIT_CODE: $exitCode" | Add-Content -Path $logPath; Write-Output "PLAYWRIGHT_EXIT_CODE: $exitCode"
  ```
* **Exit Code Aktual:** `1`
* **Status:** **Infrastructure / Setup Error**
* **Hasil:** Proses gagal saat menginisialisasi `webServer` karena working directory relatif Playwright mencari `experiments/frontend/package.json` yang tidak ada (`ENOENT`). Pengujian belum sempat berjalan (0 test executed).

### 2. Percobaan 2 - Interrupted saat Startup (Run ID: `20261115-205233`)
* **Perubahan Konfigurasi:** Menambahkan properti `cwd: path.resolve(__dirname, '..')` pada blok `webServer` di `experiments/playwright.v1.config.ts` agar server React dieksekusi dari direktori root proyek.
* **Waktu Mulai:** Minggu, 15 November 2026, 20:52:39 WIB
* **Perintah:**
  ```powershell
  $env:V1_RUN_ID = "20261115-205233"; $env:V1_ARTIFACTS_DIR = (Resolve-Path "artifacts\execution\v1\20261115-205233").Path; $logPath = "artifacts\execution\v1\20261115-205233\execution.log"; npx playwright test --config experiments/playwright.v1.config.ts *>&1 | Tee-Object -FilePath $logPath; $exitCode = $LASTEXITCODE; "PLAYWRIGHT_EXIT_CODE: $exitCode" | Add-Content -Path $logPath; Write-Output "PLAYWRIGHT_EXIT_CODE: $exitCode"
  ```
* **Exit Code Aktual:** `Interrupted / Canceled` (Task dibatalkan pada 21:13:16 WIB saat prompt pengguna masuk)
* **Status:** **Interrupted saat Startup (Dugaan kendala binding port sandbox)**
* **Hasil:** Webpack development server React berhasil dipanggil (memunculkan log webpack deprecation warning), namun kesiapan port `http://localhost:3000` belum tercapai dan proses runner terhenti sebelum mengeksekusi test case. Pengujian belum sempat berjalan (0 test executed).

### 3. Percobaan 3 - First Actual Test Execution (Run ID: `20261115-212611`)
* **Perubahan Konfigurasi:** Menonaktifkan blok `webServer` pada `experiments/playwright.v1.config.ts` karena pengguna telah menyalakan server frontend secara mandiri di terminal terpisah pada `http://localhost:3000`. Menambahkan `globalTimeout: 180 * 1000`. Script V1 (`cinema-booking.v1.spec.ts`) tetap murni tanpa modifikasi.
* **Waktu Mulai:** Minggu, 15 November 2026, 21:26:23 WIB
* **Perintah:**
  ```powershell
  $env:V1_RUN_ID = "20261115-212611"; $env:V1_ARTIFACTS_DIR = (Resolve-Path "artifacts\execution\v1\20261115-212611").Path; $logPath = "artifacts\execution\v1\20261115-212611\execution.log"; npx playwright test --config experiments/playwright.v1.config.ts *>&1 | Tee-Object -FilePath $logPath; $exitCode = $LASTEXITCODE; "PLAYWRIGHT_EXIT_CODE: $exitCode" | Add-Content -Path $logPath; Write-Output "PLAYWRIGHT_EXIT_CODE: $exitCode"
  ```
* **Exit Code Aktual:** `1` (1 dari 3 test gagal)
* **Status:** **Completed with Test Failure (2 Passed, 1 Failed)**
* **Hasil:** Seluruh 3 skenario berhasil dieksekusi secara aktual oleh Chromium Playwright.

---

## C. Hash File V1 Sebelum dan Sesudah Eksekusi

Untuk membuktikan integritas baseline dan memastikan script mentah AI V1 tidak dimodifikasi sama sekali:

| Status Pengukuran | Nilai Hash SHA-256 |
|---|---|
| **Sebelum Eksekusi** | `166BE009A05AC302FB4DCB709F3C6393C607A9E1499918D4DE2BC3200FE3AC1F` |
| **Setelah Percobaan 1, 2, & 3** | `166BE009A05AC302FB4DCB709F3C6393C607A9E1499918D4DE2BC3200FE3AC1F` |
| **Kesimpulan Hash** | **Identik (100% Tidak Berubah)** |

---

## D. Tabel Hasil Eksekusi Aktual (Percobaan 3)

* **Total Test Discovery:** 3 test
* **Total Test Dieksekusi:** 3 test
* **Pass Rate:** **2/3 Passed (66.67%)** (Denominator = 3 test dieksekusi pada 1 suite run)
* **Wall-Clock Suite Duration:** 56.33 detik

| Test | Status Aktual | Durasi Runner | Expected Result | Temuan | Path Bukti |
|---|---|---|---|---|---|
| **Skenario 1:** Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket | **PASSED** | 5.86s | Berhasil menyelesaikan flow dari pemilihan film, jadwal, kursi, pembayaran hingga tiba di `/booking-success` | Seluruh assertion visual dan rute berhasil terpenuhi sesuai data mock | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v1/20261115-212611/execution.log) & [report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v1/20261115-212611/report.json) |
| **Skenario 2:** Kursi yang sudah booked tidak dapat dipilih | **FAILED (timedOut)** | 46.43s | Kursi booked tidak berstatus `selected`, *summary bar* tersembunyi | `Test timeout of 45000ms exceeded`. Script macet saat mencoba mengklik kursi booked | [test-failed-1.png](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v1/20261115-212611/test-results/cinema-booking.v1-Baseline-ec038--booked-tidak-dapat-dipilih-Chromium/test-failed-1.png), [trace.zip](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v1/20261115-212611/test-results/cinema-booking.v1-Baseline-ec038--booked-tidak-dapat-dipilih-Chromium/trace.zip), [video.webm](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v1/20261115-212611/test-results/cinema-booking.v1-Baseline-ec038--booked-tidak-dapat-dipilih-Chromium/video.webm) |
| **Skenario 3:** Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses | **PASSED** | 1.71s | Muncul dialog alert error, URL tetap di `/payment/checkout`, tidak diarahkan ke `/booking-success` | Dialog `Payment Failed` tertangkap, rute tidak berpindah, heading sukses tidak muncul | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v1/20261115-212611/execution.log) & [report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v1/20261115-212611/report.json) |

---

## E. Analisis Kegagalan Skenario 2

### Akar Masalah: Bug pada Script Pengujian V1 (Actionability vs CSS)
1. **Penyelidikan Source Code Aplikasi (`frontend/src/SeatMap.css` baris 220–224):**
   ```css
   .seat.booked {
       background-color: #ef4444 !important; /* Red */
       cursor: not-allowed;
       pointer-events: none; /* Prevents clicking */
   }
   ```
2. **Mekanisme Kegagalan Playwright:**
   * Script V1 menulis baris:
     ```typescript
     await bookedSeatA2.click();
     ```
   * Playwright memiliki mekanisme pengecekan kelayakan aksi (*actionability check*). Sebelum melakukan klik, Playwright memastikan elemen dapat menerima pointer event.
   * Karena elemen `.seat.booked` memiliki aturan CSS `pointer-events: none`, Playwright menolak mengeksekusi klik dan terus menunggu elemen tersebut menjadi interaktif hingga batas waktu pengujian (`timeout 45000ms`) terlampaui.
3. **Kesimpulan Kategori:** **Murni Bug Script V1**. Script yang dihasilkan AI tidak memperhitungkan keberadaan properti CSS `pointer-events: none` pada elemen yang berstatus booked.

---

## F. Daftar Kelemahan Assertion dan Cakupan yang Ditemukan

1. **Skenario 1 (Happy Path):**
   * Assertion pada `/booking-success` memverifikasi keberadaan elemen teks konfirmasi dan nomor referensi acak (`.ref-text`), namun belum memvalidasi apakah nomor referensi tersebut benar-benar cocok dengan ID pembayaran yang dikembalikan oleh mock API backend.
2. **Skenario 2 (Negative Test Kursi):**
   * Script mengasumsikan elemen non-interaktif dapat diklik dengan metode standar Playwright `.click()`. Pengujian kursi non-aktif memerlukan teknik alternatif (seperti dispatch event DOM langsung, pengecekan properti CSS pointer-events, atau `{ force: true }`).
3. **Skenario 3 (Negative Test Pembayaran):**
   * Menggunakan `page.once('dialog')` secara sekuensial sebelum klik. Pada koneksi atau mesin yang lebih lambat, jika event dialog tertrigger secara asinkron setelah render, pola ini rentan mengalami race condition dibandingkan `Promise.all([page.waitForEvent('dialog'), payButton.click()])`.

---

## G. Usulan Perbaikan untuk Tahap Berikutnya (Tanpa Diterapkan di V1)

1. **Perbaikan Interaksi Kursi Booked:** Menggunakan `bookedSeatA2.click({ force: true })` atau memverifikasi atribut/kelas tanpa mencoba klik fisik yang dicegah oleh CSS browser.
2. **Sinkronisasi Event Dialog Paralel:** Mengubah pola penangkapan dialog browser menjadi `Promise.all` paralel.
3. **Validasi Detail E-Ticket:** Memverifikasi kesesuaian data film, nomor kursi, dan ID transaksi antara payload request dengan teks yang dirender pada halaman ringkasan e-ticket.

---

## H. Batasan Kesimpulan

* Hasil ini diperoleh dari **1 kali eksekusi suite lengkap** pada lingkungan browser lokal dengan backend mock (`page.route()`).
* Tingkat kelulusan 2/3 (66.67%) mencerminkan kualitas mentah prompt baseline pertama tanpa iterasi revisi.
* Laporan ini **tidak membuktikan**:
  * Stabilitas pengujian jangka panjang (0% flakiness belum teruji).
  * Keamanan transaksi pembayaran riil (gateway pembayaran eksternal tidak diuji).
  * Penanganan konkurensi database atau pencegahan *double-booking* antar dua pengguna nyata di backend.
