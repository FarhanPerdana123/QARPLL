# Laporan Validasi Statis dan First Run Baseline V3: AI-Assisted Automated Testing

Laporan ini mendokumentasikan hasil validasi statis (TypeScript strict typecheck), discovery, dan eksekusi pengujian aktual pertama (*first run*) untuk baseline V3 (`experiments/v3/cinema-booking.v3.spec.ts` dan modul POM di `experiments/v3/pages/`), serta perbandingan komparatif empiris dari evolusi baseline V1, V2, hingga V3.

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
| **Konfigurasi Eksekusi** | `experiments/playwright.v3.config.ts` (workers: 1, retries: 0, repeatEach: 1, timeout: 45s, globalTimeout: 180s, tanpa webServer) |
| **Konfigurasi Typecheck** | `experiments/tsconfig.v3.json` (strict: true, noEmit: true, include: `experiments/v3/**/*.ts`) |
| **Timestamp Eksekusi** | 2026-11-15T22:18:43+07:00 (Run ID: `20261115-221843`) |

---

## B. Verifikasi Kesiapan Frontend

Sebelum runner dijalankan, endpoint frontend diverifikasi secara langsung menggunakan skrip diagnostik:
* **Target URL:** `http://localhost:3000`
* **Metode Verifikasi:** HTTP GET via Node.js HTTP client
* **Hasil:** HTTP 200 OK
* **Response Content:** Dokumen HTML dengan judul `<title>Cinema Booking System</title>` dan container root React `<div id="root"></div>`.
* **Status:** Frontend aktif dan siap menerima interaksi pengujian.

---

## C. Hash File V3 Sebelum dan Sesudah Eksekusi

Untuk menjamin integritas baseline dan membuktikan bahwa kode tidak mengalami modifikasi diam-diam selama proses validasi maupun eksekusi:

| Path File V3 | Hash SHA-256 Sebelum Eksekusi | Hash SHA-256 Setelah Eksekusi | Status Integritas |
|---|---|---|---|
| `experiments/v3/cinema-booking.v3.spec.ts` | `5B93945A8247A6AF7B4FBCA6C18A9887AB9B307D5D8FE610CD2DCE8398322E40` | `5B93945A8247A6AF7B4FBCA6C18A9887AB9B307D5D8FE610CD2DCE8398322E40` | **Identik** |
| `experiments/v3/pages/booking-confirm.page.ts` | `6804FDD57D967A1B89CCBB9EBB88381215563445FF909210EA1224C302DB3BFD` | `6804FDD57D967A1B89CCBB9EBB88381215563445FF909210EA1224C302DB3BFD` | **Identik** |
| `experiments/v3/pages/booking-success.page.ts` | `877760AD1723F60A9336F32F730AA764131E6BDDB0B1B834D556F8933E41B5FD` | `877760AD1723F60A9336F32F730AA764131E6BDDB0B1B834D556F8933E41B5FD` | **Identik** |
| `experiments/v3/pages/movie-list.page.ts` | `1110599B6C65D8B71884D193CD764FE92DB4DC17947D0CF9670C382AD845628F` | `1110599B6C65D8B71884D193CD764FE92DB4DC17947D0CF9670C382AD845628F` | **Identik** |
| `experiments/v3/pages/payment.page.ts` | `E3F556283D69168D3334448A9D4A306621AD348B2BBB0ABBD6D324130FF4D4FE` | `E3F556283D69168D3334448A9D4A306621AD348B2BBB0ABBD6D324130FF4D4FE` | **Identik** |
| `experiments/v3/pages/seat-selection.page.ts` | `0D8C8FF8D3F93A1F204502C270EEAD92B83627FBB0793385FAE6E85C361D1259` | `0D8C8FF8D3F93A1F204502C270EEAD92B83627FBB0793385FAE6E85C361D1259` | **Identik** |
| `experiments/v3/pages/showtime.page.ts` | `82CE2888B33295E07B7C0BC0F6B343D89C02C75D5FD691AC6A5F24627906EF1C` | `82CE2888B33295E07B7C0BC0F6B343D89C02C75D5FD691AC6A5F24627906EF1C` | **Identik** |

*File manifest tercatat di:* `artifacts/execution/v3/20261115-221843/manifest.json`.

---

## D. Hasil Validasi Statis (Typecheck) dan Discovery

### 1. Validasi Statis (TypeScript Compiler Strict)
* **Konfigurasi:** `experiments/tsconfig.v3.json` (`strict: true`, `noEmit: true`, `target: ES2022`, `moduleResolution: NodeNext`).
* **Perintah:** `npx tsc --project experiments/tsconfig.v3.json`
* **Exit Code:** `0` (**Typecheck BERHASIL / PASSED**)
* **Log Error Aktual:** Bersih (*0 errors, 0 warnings*).
* **Analisis Penyelesaian:**
  Pada baseline V2, compiler mengeluarkan 6 error `TS2339: Property ... does not exist on type 'never'` karena penanganan variabel closure nullable. Pada V3, kode mengadopsi mekanisme `page.waitForRequest` sebelum aksi pemicu serta runtime type guard (`typeof raw === 'object' && raw !== null`). Hal ini menyelesaikan masalah type narrowing secara definitif tanpa melonggarkan aturan `strictNullChecks` pada compiler.

### 2. Test Discovery
* **Perintah:** `npx playwright test --config experiments/playwright.v3.config.ts --list`
* **Exit Code:** `0` (**Discovery BERHASIL**)
* **Hasil:** Tepat **3 test** ditemukan dalam file `experiments/v3/cinema-booking.v3.spec.ts`:
  1. `Skenario 1: Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket` (Line 180)
  2. `Skenario 2: Kursi yang sudah booked tidak dapat dipilih` (Line 306)
  3. `Skenario 3: Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses` (Line 340)

---

## E. Perintah Runtime dan Exit Code

* **Run ID:** `20261115-221843`
* **Perintah Eksekusi:**
  ```powershell
  $env:V3_RUN_ID = "20261115-221843"; $env:V3_ARTIFACTS_DIR = (Resolve-Path "artifacts\execution\v3\20261115-221843").Path; $logPath = "artifacts\execution\v3\20261115-221843\execution.log"; npx playwright test --config experiments/playwright.v3.config.ts *>&1 | Tee-Object -FilePath $logPath; $exitCode = $LASTEXITCODE; "PLAYWRIGHT_EXIT_CODE: $exitCode" | Add-Content -Path $logPath; Write-Output "PLAYWRIGHT_EXIT_CODE: $exitCode"
  ```
* **Exit Code Runner:** `0` (Seluruh test case lulus pada runtime pertama)

---

## F. Tabel Hasil Runtime V3

* **Total Test Dieksekusi:** 3 test
* **Pass Rate:** **3/3 Passed (100% pada satu run yang diamati)**
* **Jumlah Durasi Test Individual:** 10.06 detik (6.76s + 1.59s + 1.71s)
* **Durasi Wall-Clock Suite:** 11.33 detik

| Test | Status Runner | Durasi | Temuan Empiris | Path Bukti |
|---|---|---|---|---|
| **Skenario 1:** Pemesanan tiket berhasil dari memilih film, jadwal, kursi, pembayaran, sampai e-ticket | **PASSED** | 6.76s (6761 ms) | Seluruh alur end-to-end berhasil; intercept request `POST /api/payments` dan `POST /api/seats/book-seats` tertangkap presisi via `page.waitForRequest`; format referensi e-ticket tervalidasi dengan regex `/^Booking Ref:\s*#\d{1,6}$/`. | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3/20261115-221843/execution.log)<br>[report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3/20261115-221843/report.json) |
| **Skenario 2:** Kursi yang sudah booked tidak dapat dipilih | **PASSED** | 1.59s (1586 ms) | Memverifikasi computed styles (`pointer-events: none`, `cursor: not-allowed`); klik koordinat pointer visual nyata (`page.mouse.click`) membuktikan kursi tetap berstatus booked tanpa masuk keranjang; kursi A1 sukses dipilih sebagai kontrol positif validitas klik. | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3/20261115-221843/execution.log)<br>[report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3/20261115-221843/report.json) |
| **Skenario 3:** Pembayaran mendapat HTTP 504 sehingga pengguna melihat kegagalan dan tidak diarahkan ke halaman sukses | **PASSED** | 1.71s (1711 ms) | Dialog `window.alert` dengan pesan `Payment Failed` tertangkap asinkron tanpa freeze; tombol submit pembayaran kembali enabled (`PAY NOW`); URL tetap bertahan di checkout; request `book-seats` terbukti tidak pernah terpanggil. | [execution.log](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3/20261115-221843/execution.log)<br>[report.json](file:///d:/Farhan/Semester%207/RPL%20Lanjut/Cinema-Booking-System/artifacts/execution/v3/20261115-221843/report.json) |

---

## G. Pass Rate dan Denominator

* **Pass Rate V3:** **3/3 passed (100% pada satu run yang diamati)**
* **Rincian Denominator:** Dihitung dari seluruh test case yang dieksekusi secara aktual oleh runner Playwright:
  * Passed: 3
  * Failed: 0
  * TimedOut: 0
  * Skipped: 0
  * Flaky: 0

---

## H. Perbandingan Komparatif: Baseline V1 vs V2 vs V3

| Metrik / Aspek | Baseline V1 (Run `20261115-212611`) | Baseline V2 (Run `20261115-213902`) | Baseline V3 (Run `20261115-221843`) | Analisis Komparatif |
|---|---|---|---|---|
| **Skenario 1 (Happy Path)** | PASSED (5.86s) | PASSED (6.55s) | PASSED (6.76s) | Ketiganya lulus stabil. V2 dan V3 sedikit lebih lama (~0.7s - 0.9s) karena melakukan asserting struktur payload API dan Page Object navigation. |
| **Skenario 2 (Kursi Booked)** | **FAILED / timedOut (46.43s)** | PASSED (1.98s) | **PASSED (1.59s)** | V1 gagal fatal timeout akibat `pointer-events: none`. V2 menyelesaikan masalah melalui `page.mouse.click`. V3 mempertahankan perbaikan interaksi ini dan berjalan paling efisien (1.59s). |
| **Skenario 3 (Gagal 504)** | PASSED (1.71s) | PASSED (2.20s) | PASSED (1.71s) | Ketiganya menangani dialog alert kegagalan secara asinkron. V2 dan V3 menambahkan penegasan ketiadaan request `book-seats` dan re-enable tombol. |
| **Pass Rate** | 2/3 (66.67%) | **3/3 (100%)** | **3/3 (100%)** | Peningkatan terjadi dari V1 ke V2, dan dipertahankan secara konsisten pada V3. |
| **Jumlah Durasi Test** | 54.00s | 10.74s | **10.06s** | V3 merupakan eksekusi paling efisien (-43.94s dibanding V1, -0.68s dibanding V2). |
| **Wall-Clock Suite** | 56.33s | 11.79s | **11.33s** | Durasi keseluruhan suite berkurang ~80% dibanding V1. |
| **Validasi Statis (TypeScript)** | N/A (Tanpa typecheck strict) | **Exit Code 2 (Gagal TS2339)** | **Exit Code 0 (Passed, 0 Error)** | **Peningkatan Kualitas Kritis:** V3 menyelesaikan seluruh kelemahan type narrowing yang menggagalkan V2 pada strict compiler. |
| **Arsitektur Kode** | 1 file script (monolitik, 269 baris) | Page Object Model modular (6 modul POM + 1 spec) | POM modular yang diperketat (*strict typed*, defensive typing) | Kerapian arsitektur tetap modular tanpa menimbulkan utang teknis sintaksis. |
| **Validasi E-Ticket** | Hanya teks statis umum | `toContainText('#')` (terlalu longgar) | Regex presisi `/^Booking Ref:\s*#\d{1,6}$/` | Validasi representasi UI tiket akurat sesuai implementasi frontend aktual. |

---

## I. Temuan Kode Kritis dan Batas Pengujian

1. **Aturan Route Matching Playwright & Glob Syntax:**
   * Di Playwright, rute dicocokkan secara **LIFO (Last-In-First-Out)**, yaitu rute yang didaftarkan belakangan dievaluasi lebih dulu.
   * Glob pattern dengan satu tanda bintang `*` (misalnya `**/api/movies*`) **tidak melintasi separator direktori (`/`)**. Pola ini mencocokkan `/api/movies?status=now`, namun **tidak menimpa** sub-rute `/api/movies/movie-1`. Ini memastikan mock katalog film dan mock detail film tidak saling mengaburkan (*masking*).
2. **Type Safety & Penangkapan Payload Request (`postDataJSON`):**
   * Di V2, penangkapan payload di dalam event callback `page.on('request')` menyebabkan compiler mempersempit tipe variabel yang diinisialisasi `null` menjadi `never`.
   * Di V3, penggunaan `page.waitForRequest(...)` sebelum pemicu klik secara definitif mengembalikan instance `Request`. Ditambah dengan runtime validation:
     ```typescript
     const raw = capturedPaymentRequest.postDataJSON();
     const payload = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
     ```
     Kode menjadi 100% aman pada `strictNullChecks` tanpa menimbulkan risiko runtime `TypeError`.
3. **Batas Validasi Nomor Referensi E-Ticket:**
   * Pada `frontend/src/pages/BookingSuccess.js` (baris 57), nomor referensi dihasilkan secara lokal menggunakan `Math.floor(Math.random() * 1000000)`.
   * Backend payment mock mengembalikan `transactionId: "trx-mock-998877"`. Karena frontend tidak menghubungkan ID transaksi backend ke nomor tiket yang ditampilkan, assertion Playwright **tidak dapat memvalidasi keterikatan backend-frontend** untuk nomor tiket tersebut. Validasi V3 secara jujur membatasi assertion pada format UI aktual (`Booking Ref: #<1-6 digit>`), bukan mengasumsikan integrasi yang tidak ada.

---

## J. Catatan Metodologi & Rekomendasi Tahap Berikutnya

> [!NOTE]
> Sesuai batasan eksperimen, rekomendasi di bawah ini dicatat semata-mata sebagai wawasan teknis objektif untuk penelitian/pengembangan lanjutan, **tanpa diimplementasikan pada artefak ini**.

1. **Pengujian Penanganan Jaringan Riil (*Real Latency / Flakiness*):**
   * Saat ini seluruh response API disimulasikan secara instan melalui Playwright route intercept. Pengujian dengan menambahkan simulasi delay jaringan (`await new Promise(r => setTimeout(r, 1500))`) pada skenario kegagalan dapat memvalidasi apakah indikator loading (*spinner*) di UI bekerja dengan benar sebelum timeout.
2. **Aksesibilitas (A11y) dan Keyboard Navigation:**
   * Kursi bioskop yang sudah dibooking saat ini dinonaktifkan via CSS (`pointer-events: none`). Pengujian navigasi keyboard (fokus via tombol Tab dan aktivasi via Space/Enter) disarankan untuk memastikan pengguna alat bantu aksesibilitas (*screen reader*) tidak dapat mengakses elemen yang tidak aktif.
3. **Pengujian Integrasi Backend Sebenarnya:**
   * Untuk memvalidasi konkurensi (mencegah *race condition* saat dua pengguna memilih kursi yang sama dalam detik yang sama), pengujian harus ditingkatkan ke level *integration/e2e* dengan backend dan database nyata, bukan mock Playwright.

---

## K. Batasan Kesimpulan

* Hasil pengujian ini diperoleh dari **satu run eksekusi aktual** (`20261115-221843`).
* Hasil 100% pass rate ini **tidak membuktikan**:
  * Stabilitas pengujian jangka panjang pada berbagai kondisi browser dan platform.
  * Ketiadaan bug pada backend nyata, database, atau gateway pembayaran pihak ketiga.
  * Idempotensi transaksi pembayaran di tingkat server.
* Peningkatan status dari V2 ke V3 berfokus pada **kualitas statis kode pengujian (type safety) dan ketepatan assertion**, bukan perubahan perilaku aplikasi bioskop itu sendiri.
