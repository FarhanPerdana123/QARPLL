# Laporan Validasi Pengujian Berulang Terbatas: Baseline V3

Laporan ini mendokumentasikan hasil pengujian berulang terbatas (*repeat execution*) terhadap baseline V3 (`experiments/v3/cinema-booking.v3.spec.ts` beserta seluruh modul Page Object-nya di `experiments/v3/pages/`). Tujuan eksperimen ini adalah mengamati konsistensi hasil pengujian secara empiris dalam kondisi terkontrol tanpa memodifikasi kode pengujian, kode aplikasi, maupun konfigurasi utama.

---

## A. Lingkungan dan Konfigurasi Eksperimen

| Komponen / Parameter | Nilai / Spesifikasi Aktual |
|---|---|
| **Sistem Operasi** | Microsoft Windows NT 10.0.26300.0 (Windows 11) |
| **Node.js** | v20.19.5 |
| **npm** | 10.8.2 |
| **Playwright** | Version 1.65.1 |
| **TypeScript Compiler** | Version 5.9.3 |
| **Browser Runner** | Chromium Headless (Viewport: 1280x720) |
| **Frontend Server** | `http://localhost:3000` (server React aktif di host, diverifikasi HTTP 200 OK) |
| **File Konfigurasi** | `experiments/playwright.v3.repeat.config.ts` |
| **Workers** | `1` (eksekusi sekuensial) |
| **Retries** | `0` (tanpa retry otomatis) |
| **Repeat Each** | `5` (5 kali per skenario = 15 instance eksekusi yang direncanakan) |
| **Timeout per Test** | 45 detik (45.000 ms) |
| **Global Timeout** | 300 detik (300.000 ms) |
| **WebServer Block** | Dinonaktifkan (`null`, menggunakan frontend eksternal aktif) |
| **Koleksi Artefak** | `screenshot: only-on-failure`, `trace: retain-on-failure`, `video: retain-on-failure` |
| **Folder Artefak Run** | `artifacts/execution/v3-repeat/20261115-234716/` |
| **Timestamp Eksekusi** | 2026-11-15T23:47:16+07:00 (WIB) |

---

## B. Verifikasi Integritas File V3 (Sebelum vs Sesudah Eksekusi)

Integritas baseline V3 diaudit dengan membandingkan hash SHA-256 seluruh file TypeScript terhadap manifest *first run* V3 (`artifacts/execution/v3/20261115-221843/manifest.json`) serta diverifikasi kembali pasca-eksekusi:

| Path File V3 | Hash SHA-256 Sebelum Eksekusi | Hash SHA-256 Setelah Eksekusi | Status Integritas |
|---|---|---|---|
| `experiments/v3/cinema-booking.v3.spec.ts` | `5B93945A8247A6AF7B4FBCA6C18A9887AB9B307D5D8FE610CD2DCE8398322E40` | `5B93945A8247A6AF7B4FBCA6C18A9887AB9B307D5D8FE610CD2DCE8398322E40` | **Identik** |
| `experiments/v3/pages/booking-confirm.page.ts` | `6804FDD57D967A1B89CCBB9EBB88381215563445FF909210EA1224C302DB3BFD` | `6804FDD57D967A1B89CCBB9EBB88381215563445FF909210EA1224C302DB3BFD` | **Identik** |
| `experiments/v3/pages/booking-success.page.ts` | `877760AD1723F60A9336F32F730AA764131E6BDDB0B1B834D556F8933E41B5FD` | `877760AD1723F60A9336F32F730AA764131E6BDDB0B1B834D556F8933E41B5FD` | **Identik** |
| `experiments/v3/pages/movie-list.page.ts` | `1110599B6C65D8B71884D193CD764FE92DB4DC17947D0CF9670C382AD845628F` | `1110599B6C65D8B71884D193CD764FE92DB4DC17947D0CF9670C382AD845628F` | **Identik** |
| `experiments/v3/pages/payment.page.ts` | `E3F556283D69168D3334448A9D4A306621AD348B2BBB0ABBD6D324130FF4D4FE` | `E3F556283D69168D3334448A9D4A306621AD348B2BBB0ABBD6D324130FF4D4FE` | **Identik** |
| `experiments/v3/pages/seat-selection.page.ts` | `0D8C8FF8D3F93A1F204502C270EEAD92B83627FBB0793385FAE6E85C361D1259` | `0D8C8FF8D3F93A1F204502C270EEAD92B83627FBB0793385FAE6E85C361D1259` | **Identik** |
| `experiments/v3/pages/showtime.page.ts` | `82CE2888B33295E07B7C0BC0F6B343D89C02C75D5FD691AC6A5F24627906EF1C` | `82CE2888B33295E07B7C0BC0F6B343D89C02C75D5FD691AC6A5F24627906EF1C` | **Identik** |

---

## C. Discovery Pengujian

* **Perintah Discovery:** `npx playwright test --config experiments/playwright.v3.repeat.config.ts --list`
* **Exit Code:** `0`
* **Hasil:** Konfigurasi mendeteksi tepat **3 skenario unik** yang diekspansi oleh parameter `repeatEach: 5` menjadi total **15 instance eksekusi**.

---

## D. Perintah Runtime dan Exit Code

* **Run ID:** `20261115-234716`
* **Perintah Eksekusi:**
  ```powershell
  $env:V3_REPEAT_RUN_ID = "20261115-234716"; $env:V3_REPEAT_ARTIFACTS_DIR = (Resolve-Path "artifacts\execution\v3-repeat\20261115-234716").Path; $logPath = "artifacts\execution\v3-repeat\20261115-234716\execution.log"; npx playwright test --config experiments/playwright.v3.repeat.config.ts *>&1 | Tee-Object -FilePath $logPath; $exitCode = $LASTEXITCODE; "PLAYWRIGHT_EXIT_CODE: $exitCode" | Add-Content -Path $logPath; Write-Output "PLAYWRIGHT_EXIT_CODE: $exitCode"
  ```
* **Exit Code Asli Runner:** `1` (**Terdapat 1 kegagalan/timeout pada instance tertentu**)

---

## E. Tabel Hasil Setiap Instance Eksekusi

Runner Playwright mengeksekusi ke-15 instance secara bergantian (*interleaved*) dengan 1 worker. Berikut adalah rekapitulasi data empiris seluruh instance sesuai urutan eksekusi:

| No Urut Eksekusi | Skenario | `repeatEachIndex` | Status | Durasi | Error | Path Bukti |
|---|---|---|---|---|---|---|
| 1 | Skenario 1: Happy Path | 0 | **PASSED** | 6.42s (6417 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 2 | Skenario 2: Kursi Booked | 0 | **PASSED** | 1.54s (1540 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 3 | Skenario 3: HTTP 504 | 0 | **PASSED** | 2.30s (2299 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 4 | Skenario 1: Happy Path | 1 | **PASSED** | 4.10s (4096 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 5 | Skenario 2: Kursi Booked | 1 | **PASSED** | 1.67s (1671 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 6 | Skenario 3: HTTP 504 | 1 | **TIMED OUT** | 56.88s (56875 ms) | `Test timeout of 45000ms exceeded. Error: dialog.accept: Target page, context or browser has been closed` | [error-context.md](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/error-context.md)<br>[trace.zip](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/trace.zip)<br>[video.webm](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/video.webm) |
| 7 | Skenario 1: Happy Path | 2 | **PASSED** | 2.83s (2825 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 8 | Skenario 2: Kursi Booked | 2 | **PASSED** | 1.44s (1440 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 9 | Skenario 3: HTTP 504 | 2 | **PASSED** | 1.91s (1912 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 10 | Skenario 1: Happy Path | 3 | **PASSED** | 2.82s (2823 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 11 | Skenario 2: Kursi Booked | 3 | **PASSED** | 1.34s (1337 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 12 | Skenario 3: HTTP 504 | 3 | **PASSED** | 1.72s (1720 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 13 | Skenario 1: Happy Path | 4 | **PASSED** | 2.48s (2475 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 14 | Skenario 2: Kursi Booked | 4 | **PASSED** | 1.39s (1391 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |
| 15 | Skenario 3: HTTP 504 | 4 | **PASSED** | 1.70s (1695 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log) |

---

## F. Ringkasan Per Skenario

Distribusi statistik durasi dihitung khusus untuk instance yang **Passed**:

| Skenario Pengujian | Jumlah Dimulai | Passed | Failed / TimedOut | Skipped / Interrupted | Durasi Min (Passed) | Durasi Median (Passed) | Durasi Max (Passed) |
|---|---|---|---|---|---|---|---|
| **Skenario 1:** Pemesanan tiket berhasil (Happy Path) | 5 | 5 | 0 | 0 | 2.48s (2475 ms) | 2.83s (2825 ms) | 6.42s (6417 ms) |
| **Skenario 2:** Kursi booked tidak dapat dipilih | 5 | 5 | 0 | 0 | 1.34s (1337 ms) | 1.44s (1440 ms) | 1.67s (1671 ms) |
| **Skenario 3:** Pembayaran gagal HTTP 504 | 5 | 4 | 1 (TimedOut) | 0 | 1.70s (1695 ms) | 1.82s (1816 ms) | 2.30s (2299 ms) |

---

## G. Total Hasil dan Durasi

* **Total Instance Direncanakan:** 15 instance (3 skenario × 5 pengulangan).
* **Total Instance Dimulai:** 15 instance.
* **Total Instance Selesai:** 15 instance (14 passed, 1 timedOut).
* **Pass Rate:** **14/15 Passed (93.33%)**
  * *Denominator:* Dihitung dari 15 instance eksekusi aktual yang dijalankan oleh runner (14 passed, 1 timedOut, 0 failed assertion biasa, 0 skipped).
* **Jumlah Durasi Test Individual:** 90.52 detik (90.516 ms)
  * Rincian: Skenario 1 (18.64s) + Skenario 2 (7.38s) + Skenario 3 (64.50s termasuk 56.88s timeout).
* **Durasi Wall-Clock Suite:** 96.03 detik (96.033 ms, ~1.6 menit).
* **Runner Exit Code:** `1`

---

## H. Temuan Variasi Hasil (Analisis Empiris Insiden Timeout Skenario 3)

Pada pengulangan kedua Skenario 3 (`repeatEachIndex: 1`, eksekusi urutan ke-6), terjadi variasi hasil (*flaky behavior*) di mana test mengalami **timeout 45 detik**.

Berdasarkan analisis artefak trace Playwright (`trace.zip`) dan log konsol internal:
1. **Bukti Trace:**
   * Pada timestamp `20826 ms`, Playwright memicu `Frame.click` pada elemen `button.pay-btn` (`<button type="submit" class="pay-btn">`).
   * Tombol tersebut adalah tombol submit formulir HTML (`<form onSubmit={handlePayment}>`).
   * Di Playwright, aksi `click` pada tombol submit formulir secara internal menyertakan penungguan:
     `waiting for scheduled navigations to finish`.
   * Pada saat yang sama (`20880 ms`), rute mock mengembalikan response `HTTP 504 Gateway Timeout`.
   * Komponen React `PaymentPage.js` (baris 121) menangkap error tersebut dan secara sinkron memanggil `alert('Payment Failed: ...')`.
   * Pemanggilan `window.alert()` membuka dialog modal browser dan membekukan thread eksekusi JavaScript jendela peramban.
2. **Akar Masalah Asinkronitas (Deadlock Pola Interaksi):**
   * Skrip pengujian V3 mengimplementasikan alur berikut:
     ```typescript
     const dialogPromise = page.waitForEvent('dialog');
     await paymentPage.submitPayment(); // Menunggu click action selesai
     const dialog = await dialogPromise;
     await dialog.accept();
     ```
   * Jika response API 504 tiba sangat cepat sehingga `window.alert` muncul sebelum Playwright menyelesaikan verifikasi `waiting for scheduled navigations to finish`, aksi `click` dari `submitPayment()` tidak pernah resolve (tergantung penutupan dialog modal).
   * Sebaliknya, skrip pengujian tidak dapat mengeksekusi `await dialog.accept()` karena masih tertahan menunggu `await submitPayment()` selesai.
   * Terjadilah kondisi **deadlock asinkron** antara Playwright actionability wait dan browser modal alert, yang tertahan hingga batas waktu timeout test (45 detik) habis.
   * Ketika timeout 45 detik tercapai, runner menutup context browser, memicu error:
     `Error: dialog.accept: Target page, context or browser has been closed`.
3. **Mengapa 4 dari 5 Pengulangan Berhasil Lolos?**
   * Pada 4 pengulangan lainnya (`repeatEachIndex` 0, 2, 3, 4), terdapat selisih waktu mikrodetik di mana *tick* event loop Playwright menyelesaikan penanganan klik formulir sesaat sebelum `alert` memblokir thread, sehingga `await submitPayment()` berhasil resolve tepat sebelum pemanggilan `dialog.accept()`.
   * Ini membuktikan bahwa variasi ini bukan disebabkan oleh kegagalan aplikasi bioskop, melainkan karena **pola penanganan event dialog yang dilakukan secara sekuensial setelah `await click()` pada elemen submit**, alih-alih mendaftarkan handler dialog konkuren (`page.on('dialog')` atau `Promise.all([page.waitForEvent('dialog').then(d => d.accept()), submitPayment()])`).

---

## I. Path Bukti Aktual

* **Konfigurasi Repeat:** [playwright.v3.repeat.config.ts](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/experiments/playwright.v3.repeat.config.ts)
* **Log Eksekusi Terminal:** [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/execution.log)
* **Laporan JSON Runner:** [report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/report.json)
* **Laporan HTML Runner:** [index.html](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/html-report/index.html)
* **Manifest Integritas SHA-256:** [manifest.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/manifest.json)
* **Artefak Kegagalan (Skenario 3 Repeat 1):**
  * Konteks Error: [error-context.md](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/error-context.md)
  * Rekaman Trace: [trace.zip](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/trace.zip)
  * Rekaman Video: [video.webm](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/video.webm)

---

## J. Batasan Kesimpulan

* Hasil ini diperoleh dari **15 instance eksekusi terkontrol dalam 1 batch pengulangan sekuensial**.
* Eksperimen ini **secara objektif menunjukkan**:
  * Baseline V3 memiliki stabilitas tinggi pada Skenario 1 (5/5 passed) dan Skenario 2 (5/5 passed).
  * Skenario 3 menunjukkan **kerentanan *timing hazard*** (4/5 passed, 1/5 timedOut) akibat sinkronisasi antara aksi klik form submit dan dialog modal native.
* Temuan ini membuktikan pentingnya pengujian berulang (*repeat testing*): satu kali eksekusi berhasil (*single green run*) belum tentu menjamin ketiadaan kondisi *race condition* atau *flakiness* pada otomasi pengujian browser modern.
* Hasil ini **tidak membuktikan**:
  * Kestabilan universal 100% pada berbagai beban sistem atau lingkungan CI/CD.
  * Ketiadaan bug pada backend nyata, database, atau gateway pembayaran eksternal.
