# Laporan Validasi Statis dan Pengujian Berulang: Revisi V3 Dialog Fix

Laporan ini mendokumentasikan hasil validasi statis (strict TypeScript typecheck), discovery, dan eksekusi pengujian berulang terbatas (*repeat execution*, 5 pengulangan per skenario, total 15 instance) terhadap revisi `experiments/v3-dialog-fix/` untuk memverifikasi hipotesis perbaikan sinkronisasi dialog modal native.

---

## A. Hipotesis dan Perubahan yang Diuji

* **Hipotesis yang Diuji:**
  Kegagalan timeout pada Skenario 3 di baseline pengulangan V3 (`repeatEachIndex: 1`) disebabkan oleh kondisi *deadlock asinkron* di mana pemanggilan `await paymentPage.submitPayment()` (pada tombol form submit `<button type="submit">`) tertahan oleh penungguan internal Playwright (`waiting for scheduled navigations to finish`) saat dialog modal native `window.alert()` terbuka dan membekukan thread browser.
  Dengan menjalankan penanganan dialog (`dialog.accept()`) secara **konkuren** bersamaan dengan aksi klik submit menggunakan `Promise.all`, dialog dapat langsung ditutup saat event muncul tanpa harus menunggu aksi klik resolve terlebih dahulu, sehingga mengeliminasi kondisi saling tunggu.
* **Perubahan yang Diterapkan:**
  Mengganti pola sekuensial pada Skenario 3:
  ```typescript
  // SEBELUM (V3 Asli)
  const dialogPromise = page.waitForEvent('dialog');
  await paymentPage.submitPayment();
  const dialog = await dialogPromise;
  await dialog.accept();
  ```
  Menjadi pola konkuren asinkron:
  ```typescript
  // SESUDAH (V3 Dialog Fix)
  let capturedDialogMessage = '';
  const dialogHandlerPromise = page.waitForEvent('dialog').then(async (dialog) => {
    try {
      capturedDialogMessage = dialog.message();
    } finally {
      await dialog.accept();
    }
    return dialog;
  });

  await Promise.all([
    dialogHandlerPromise,
    paymentPage.submitPayment(),
  ]);

  expect(capturedDialogMessage).toContain('Payment Failed');
  expect(capturedDialogMessage).toContain('Gateway Timeout');
  ```

---

## B. Lingkungan serta Konfigurasi

| Komponen / Parameter | Spesifikasi / Konfigurasi Aktual |
|---|---|
| **Sistem Operasi** | Microsoft Windows NT 10.0.26300.0 (Windows 11) |
| **Node.js** | v20.19.5 |
| **npm** | 10.8.2 |
| **TypeScript Compiler** | Version 5.9.3 |
| **Playwright** | Version 1.65.1 |
| **Browser Runner** | Chromium Headless (Viewport: 1280x720) |
| **Frontend Server** | `http://localhost:3000` (terverifikasi HTTP 200 OK sebelum eksekusi) |
| **Konfigurasi Typecheck** | `experiments/tsconfig.v3-dialog-fix.json` (strict: true, noEmit: true) |
| **Konfigurasi Eksekusi** | `experiments/playwright.v3-dialog-fix.repeat.config.ts` |
| **Parameter Eksekusi** | `workers: 1`, `retries: 0`, `repeatEach: 5` (15 total instance), tanpa webServer |
| **Batas Waktu** | `timeout: 45s` per test, `globalTimeout: 300s` |
| **Koleksi Artefak** | `screenshot: only-on-failure`, `trace: retain-on-failure`, `video: retain-on-failure` |
| **Folder Artefak Run** | `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/` |
| **Timestamp Eksekusi** | 2026-11-16T00:19:34+07:00 (WIB) |

---

## C. Diff terhadap Baseline V3

1. **Perubahan Fungsional:**
   * Terbatas secara ketat pada baris penanganan dialog di **Skenario 3** (`experiments/v3-dialog-fix/cinema-booking.v3-dialog-fix.spec.ts` baris 386–410).
   * Seluruh alur navigasi, mock route API, pengujian payload `POST /api/payments` dan `book-seats`, kontrol positif kursi available, validasi regex e-ticket, serta assertion recovery UI dipertahankan 100% identik dengan V3.
2. **Perubahan Non-Fungsional / Struktural:**
   * File POM disalin secara mandiri ke `experiments/v3-dialog-fix/pages/` untuk menjamin isolasi penuh.
   * Import spec diarahkan ke modul POM lokal (`./pages/...`).
   * Judul suite diubah menjadi `'Eksperimen V3 (Dialog Fix) - Pengujian Pemesanan Tiket Bioskop'`.
   * Komentar header disesuaikan untuk mendokumentasikan fokus revisi.

---

## D. Hasil Typecheck dan Discovery

### 1. Validasi Statis (TypeScript Compiler Strict)
* **Perintah:** `npx tsc --project experiments/tsconfig.v3-dialog-fix.json`
* **Exit Code:** `0` (**PASSED**)
* **Log Error Aktual:** Bersih (**0 errors, 0 warnings**).
* **Catatan Bukti:** Tersimpan di `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/typecheck.log`.

### 2. Test Discovery
* **Perintah:** `npx playwright test --config experiments/playwright.v3-dialog-fix.repeat.config.ts --list`
* **Exit Code:** `0` (**PASSED**)
* **Hasil:** Tepat **3 skenario unik** terdeteksi dan diekspansi secara benar oleh `repeatEach: 5` menjadi **Total: 15 tests in 1 file**.

---

## E. Hasil Seluruh Instance Eksekusi

* **Run ID:** `20261116-001934`
* **Perintah Runtime:**
  ```powershell
  npx playwright test --config experiments/playwright.v3-dialog-fix.repeat.config.ts
  ```
* **Exit Code Runner:** `0` (Seluruh 15 instance lulus)

### Rekapitulasi Setiap Instance (Sesuai Urutan Eksekusi Runner):

| No Urut Eksekusi | Skenario | `repeatEachIndex` | Status | Durasi | Error | Path Bukti |
|---|---|---|---|---|---|---|
| 1 | Skenario 1: Happy Path | 0 | **PASSED** | 5.74s (5740 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 2 | Skenario 2: Kursi Booked | 0 | **PASSED** | 1.33s (1332 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 3 | Skenario 3: HTTP 504 | 0 | **PASSED** | 1.54s (1540 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 4 | Skenario 1: Happy Path | 1 | **PASSED** | 4.24s (4239 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 5 | Skenario 2: Kursi Booked | 1 | **PASSED** | 1.78s (1778 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 6 | Skenario 3: HTTP 504 | 1 | **PASSED** | 1.68s (1675 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 7 | Skenario 1: Happy Path | 2 | **PASSED** | 2.48s (2480 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 8 | Skenario 2: Kursi Booked | 2 | **PASSED** | 1.24s (1239 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 9 | Skenario 3: HTTP 504 | 2 | **PASSED** | 1.46s (1464 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 10 | Skenario 1: Happy Path | 3 | **PASSED** | 3.33s (3326 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 11 | Skenario 2: Kursi Booked | 3 | **PASSED** | 1.39s (1393 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 12 | Skenario 3: HTTP 504 | 3 | **PASSED** | 1.69s (1692 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 13 | Skenario 1: Happy Path | 4 | **PASSED** | 5.11s (5109 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 14 | Skenario 2: Kursi Booked | 4 | **PASSED** | 1.54s (1540 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |
| 15 | Skenario 3: HTTP 504 | 4 | **PASSED** | 1.70s (1704 ms) | None | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log) |

### Ringkasan Statistik Per Skenario:

| Skenario Pengujian | Dimulai | Passed | Failed / TimedOut | Durasi Min | Durasi Median | Durasi Max |
|---|---|---|---|---|---|---|
| **Skenario 1:** Pemesanan tiket berhasil (Happy Path) | 5 | 5 | 0 | 2.48s (2480 ms) | 4.24s (4239 ms) | 5.74s (5740 ms) |
| **Skenario 2:** Kursi booked tidak dapat dipilih | 5 | 5 | 0 | 1.24s (1239 ms) | 1.39s (1393 ms) | 1.78s (1778 ms) |
| **Skenario 3:** Pembayaran gagal HTTP 504 | 5 | **5** | **0** | 1.46s (1464 ms) | 1.68s (1675 ms) | 1.70s (1704 ms) |

---

## F. Perbandingan dengan Baseline Repeat V3

| Parameter / Metrik | Baseline Repeat V3 (`20261115-234716`) | Revisi V3 Dialog Fix (`20261116-001934`) | Analisis Perbedaan |
|---|---|---|---|
| **Skenario 1 (Happy Path)** | 5/5 Passed (Min 2.48s, Med 2.83s, Max 6.42s) | 5/5 Passed (Min 2.48s, Med 4.24s, Max 5.74s) | Keduanya stabil dan konsisten. |
| **Skenario 2 (Kursi Booked)** | 5/5 Passed (Min 1.34s, Med 1.44s, Max 1.67s) | 5/5 Passed (Min 1.24s, Med 1.39s, Max 1.78s) | Keduanya stabil dan konsisten. |
| **Skenario 3 (HTTP 504)** | **4/5 Passed, 1 TimedOut (56.88s)** | **5/5 Passed (Min 1.46s, Med 1.68s, Max 1.70s)** | **Perubahan Kritis:** Instance ke-6 yang sebelumnya mengalami timeout 45s kini lulus dalam 1.68s. Seluruh 5 pengulangan Skenario 3 berjalan seragam di rentang 1.46s–1.70s tanpa variasi ekstrim. |
| **Total Pass Rate** | 14/15 Passed (93.33%) | **15/15 Passed (100% pada sampel ini)** | Peningkatan 1 instance yang sebelumnya gagal akibat timeout. |
| **Jumlah Durasi Test** | 90.52 detik (terbebani penalti timeout 56.88s) | **36.25 detik** | Pengurangan waktu tes murni sebesar ~60% karena eliminasi timeout pada Skenario 3. |
| **Wall-Clock Suite** | 96.03 detik (~1.6 menit) | **41.43 detik (~0.7 menit)** | Eksekusi suite secara keseluruhan berkurang ~57% lebih cepat. |
| **Typecheck Status** | Strict Passed (Exit code 0) | Strict Passed (Exit code 0) | Integritas statis tipe data tetap terjaga. |
| **Runner Exit Code** | `1` | **`0`** | Runner selesai dengan status sukses penuh. |

---

## G. Path Bukti dan Integritas

### 1. File Bukti Aktual:
* **Log Typecheck:** [typecheck.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/typecheck.log)
* **Log Terminal Runner:** [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log)
* **Laporan JSON Runner:** [report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/report.json)
* **Laporan HTML Runner:** [index.html](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/html-report/index.html)
* **Manifest SHA-256 Run:** [manifest.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3-dialog-fix-repeat/20261116-001934/manifest.json)

### 2. Audit Integritas File (Sebelum vs Sesudah Run):
Seluruh file TypeScript pada `experiments/v3-dialog-fix/` dan `experiments/v3/` diverifikasi nilainya **100% identik** sebelum dan setelah eksekusi.

---

## H. Keterbatasan Kesimpulan

1. **Hasil Sampel Terbatas:**
   * Hasil **15/15 passed** menunjukkan bahwa **tidak ada kegagalan yang teramati dalam sampel lima pengulangan per skenario ini**.
   * Hasil empiris ini **mendukung hipotesis** bahwa penanganan dialog secara konkuren mengatasi kondisi saling tunggu (*deadlock*) pada form submit button.
   * Namun, hasil ini **bukan bukti matematis bahwa flakiness telah hilang secara universal** pada segala kondisi beban CPU, throttling jaringan, atau resolusi peramban lain.
2. **Karakteristik Komparasi:**
   * Perbandingan baseline V3 terhadap revisi ini adalah perbandingan eksperimen terisolasi sebelum/sesudah, **bukan uji acak terkontrol (randomized controlled trial)**.
3. **Batasan Cakupan:**
   * Pengujian ini **tidak membuktikan**:
     * Kesiapan produksi (*production-ready*) atau kesiapan pipeline CI/CD skala besar.
     * Idempotensi transaksi pembayaran di tingkat server atau database lock backend nyata (karena backend tetap disimulasikan menggunakan API route mock Playwright).
     * `Promise.all` tidak membatalkan promise pasangan secara otomatis jika salah satu tertolak (*reject*), sehingga penanganan cleanup bergantung pada lifecycle browser context per test Playwright.
