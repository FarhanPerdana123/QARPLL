# 04. Indeks Bukti dan Rekonsiliasi Ketidaksesuaian

Dokumen ini memetakan seluruh artefak bukti primer yang tersimpan di dalam repositori, menghubungkan setiap klaim teknis dengan sumber bukti langsung, serta mencatat rekonsiliasi formal atas ketidaksesuaian (*discrepancies*) yang teridentifikasi selama proses audit.

---

## 1. Indeks Jalur Bukti Primer (Path Relatif Repositori)

Seluruh bukti langsung disimpan di dalam repositori dengan struktur jalur relatif sebagai berikut:

### A. Kode Sumber Pengujian Eksperimen
* **Baseline V1:** `experiments/v1/cinema-booking.v1.spec.ts`
* **Baseline V2:**
  * Skrip Utama: `experiments/v2/cinema-booking.v2.spec.ts`
  * Modul POM: `experiments/v2/pages/` (6 modul POM)
* **Baseline V3:**
  * Skrip Utama: `experiments/v3/cinema-booking.v3.spec.ts`
  * Modul POM: `experiments/v3/pages/` (6 modul POM)
* **Revisi V3 Dialog Fix:**
  * Skrip Utama: `experiments/v3-dialog-fix/cinema-booking.v3-dialog-fix.spec.ts`
  * Modul POM: `experiments/v3-dialog-fix/pages/` (6 modul POM)

### B. File Konfigurasi Runner dan Compiler
* Konfigurasi V1: `experiments/playwright.v1.config.ts`
* Konfigurasi V2: `experiments/playwright.v2.config.ts`, `experiments/tsconfig.v2.json`
* Konfigurasi V3 (First Run): `experiments/playwright.v3.config.ts`, `experiments/tsconfig.v3.json`
* Konfigurasi V3 (Repeat): `experiments/playwright.v3.repeat.config.ts`
* Konfigurasi V3 Dialog Fix: `experiments/playwright.v3-dialog-fix.repeat.config.ts`, `experiments/tsconfig.v3-dialog-fix.json`

### C. Artefak Eksekusi (Log, JSON, HTML, Manifest, Trace)
* **V1 First Run (`20261115-212611`):**
  * Manifest: `artifacts/execution/v1/20261115-212611/manifest.json` *(Belum tercatat/tidak dibuat pada run V1 awal)*
  * Log Terminal: `artifacts/execution/v1/20261115-212611/execution.log`
  * Laporan JSON: `artifacts/execution/v1/20261115-212611/report.json`
  * Laporan HTML: `artifacts/execution/v1/20261115-212611/html-report/index.html`
  * Bukti Kegagalan (Skenario 2): `artifacts/execution/v1/20261115-212611/test-results/cinema-booking.v1-Baseline-ec038--booked-tidak-dapat-dipilih-Chromium/` (berisi `error-context.md`, `test-failed-1.png`, `trace.zip`, `video.webm`).
* **V2 First Run (`20261115-213902`):**
  * Manifest: `artifacts/execution/v2/20261115-213902/manifest.json`
  * Log Typecheck: `artifacts/execution/v2/20261115-213902/typecheck.log`
  * Log Terminal: `artifacts/execution/v2/20261115-213902/execution.log`
  * Laporan JSON: `artifacts/execution/v2/20261115-213902/report.json`
  * Laporan HTML: `artifacts/execution/v2/20261115-213902/html-report/index.html`
* **V3 First Run (`20261115-221843`):**
  * Manifest: `artifacts/execution/v3/20261115-221843/manifest.json`
  * Log Typecheck: `artifacts/execution/v3/20261115-221843/typecheck.log`
  * Log Terminal: `artifacts/execution/v3/20261115-221843/execution.log`
  * Laporan JSON: `artifacts/execution/v3/20261115-221843/report.json`
  * Laporan HTML: `artifacts/execution/v3/20261115-221843/html-report/index.html`
* **V3 Repeat Run (`20261115-234716`):**
  * Manifest: `artifacts/execution/v3-repeat/20261115-234716/manifest.json`
  * Log Terminal: `artifacts/execution/v3-repeat/20261115-234716/execution.log`
  * Laporan JSON: `artifacts/execution/v3-repeat/20261115-234716/report.json`
  * Laporan HTML: `artifacts/execution/v3-repeat/20261115-234716/html-report/index.html`
  * Bukti Kegagalan (Skenario 3 Repeat 1): `artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/` (berisi `error-context.md`, `trace.zip`, `video.webm`).
* **V3 Dialog Fix Repeat Run (`20261116-001934`):**
  * Manifest: `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/manifest.json`
  * Log Typecheck: `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/typecheck.log`
  * Log Terminal: `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/execution.log`
  * Laporan JSON: `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/report.json`
  * Laporan HTML: `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/html-report/index.html`

---

## 2. Pemetaan Klaim Teknis ke Bukti Langsung

| Klaim Teknis dalam Laporan | Kategori Bukti | Jalur Bukti Langsung (*Direct Evidence*) | Status Verifikasi |
|---|---|---|---|
| Skenario 2 V1 gagal timeout karena CSS `pointer-events: none` | Bukti Langsung | `artifacts/execution/v1/20261115-212611/test-results/.../error-context.md`<br>`frontend/src/pages/SeatSelection.css` | **Terverifikasi** |
| Typecheck V2 gagal dengan 6 error TS2339 | Bukti Langsung | `artifacts/execution/v2/20261115-213902/typecheck.log` | **Terverifikasi** |
| V3 First Run lulus 3/3 dan typecheck bersih | Bukti Langsung | `artifacts/execution/v3/20261115-221843/typecheck.log`<br>`artifacts/execution/v3/20261115-221843/report.json` | **Terverifikasi** |
| Skenario 3 V3 Repeat mengalami timeout akibat deadlock dialog | Bukti Langsung | `artifacts/execution/v3-repeat/20261115-234716/test-results/.../trace.zip` (`1-trace.trace`) | **Terverifikasi** |
| V3 Dialog Fix lulus 15/15 tanpa kegagalan | Bukti Langsung | `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/report.json` | **Terverifikasi** |
| Nomor referensi tiket adalah pseudorandom lokal | Bukti Langsung | `frontend/src/pages/BookingSuccess.js` (baris 57) | **Terverifikasi** |
| Hash seluruh baseline V3 tidak pernah termodifikasi | Bukti Langsung | `artifacts/execution/v3/20261115-221843/manifest.json` vs `Get-FileHash` | **Terverifikasi** |

---

## 3. Registri Ketidaksesuaian (*Discrepancy Registry*) dan Hasil Rekonsiliasi

Dokumen ini tidak mengubah artefak masa lalu, melainkan berfungsi sebagai **catatan koreksi resmi (*formal correction register*)**:

### Ketidaksesuaian 1: Perbedaan Penjumlahan Durasi Revisi Dialog (36.251 ms vs 37.252 ms)
* **Masalah yang Dipertanyakan:**
  Daftar durasi individual adalah: `5740, 1332, 1540, 4239, 1778, 1675, 2480, 1239, 1464, 3326, 1393, 1692, 5109, 1540, 1704 ms`. Ditanyakan mengapa ringkasan menyebut 36.251 ms sementara penjumlahan manual penanya menghasilkan 37.252 ms.
* **Audit Bukti Langsung (`report.json`):**
  Nilai integer durasi dari `report.json` pada run `20261116-001934` dihitung ulang menggunakan runtime mesin:
  $$5740 + 1332 + 1540 + 4239 + 1778 + 1675 + 2480 + 1239 + 1464 + 3326 + 1393 + 1692 + 5109 + 1540 + 1704 = \mathbf{36.251\text{ ms}}$$
* **Resolusi:** **Resolved.**
  Angka **36.251 ms (36,251 detik)** adalah nilai yang **benar secara matematis**. Angka 37.252 ms berasal dari kesalahan penjumlahan manual penanya (selisih tepat 1.001 ms akibat kesalahan penambahan nilai carry ribuan).

### Ketidaksesuaian 2: Mekanisme Callback Capture Payload pada Baseline V2
* **Masalah yang Dipertanyakan:**
  Beberapa teks naratif terdahulu menyebut penangkapan request V2 menggunakan `page.on('request')`, sementara dokumen lain menyebut `page.route()`.
* **Audit Bukti Langsung (`experiments/v2/cinema-booking.v2.spec.ts`):**
  Pemeriksaan baris 195 dan 214 membuktikan bahwa skrip V2 **sama sekali tidak memanggil `page.on('request')`**, melainkan menggunakan:
  ```typescript
  await page.route('**/api/payments', async (route) => {
    capturedPaymentPayload = route.request().postDataJSON();
    await route.fulfill({ ... });
  });
  ```
* **Resolusi:** **Resolved.**
  Penyebutan `page.on('request')` pada penjelasan masa lalu adalah ketidaktepatan deskriptif (*narrative inaccuracy*). Fakta implementasi V2 murni menggunakan callback `page.route()`, dan variabel closure di dalam callback itulah yang memicu kesalahan *type narrowing* TS2339.

### Ketidaksesuaian 3: Perbedaan Hash POM Baseline V3 vs Revisi V3 Dialog Fix
* **Masalah yang Dipertanyakan:**
  Mengapa hash SHA-256 modul POM di `experiments/v3-dialog-fix/pages/` berbeda dari `experiments/v3/pages/` jika keduanya diklaim sebagai salinan mandiri?
* **Audit Bukti Langsung (`git diff`):**
  Perbandingan diff antara kedua direktori menunjukkan bahwa seluruh kode eksekusi TypeScript (nama class, selector, locator, method, assertion) adalah **100% identik baris demi baris**. Satu-satunya perbedaan karakter fisik terdapat pada komentar header JSDoc:
  ```diff
  - * File: experiments/v3/pages/booking-confirm.page.ts
  + * File: experiments/v3-dialog-fix/pages/booking-confirm.page.ts
  ```
* **Resolusi:** **Resolved.**
  Kedua salinan POM adalah **setara secara fungsional (*functionally equivalent*)**, tetapi **berbeda secara kriptografis (*cryptographically distinct*)** karena pembaruan komentar jalur file pada header.

### Ketidaksesuaian 4: Percobaan Eksekusi Awal Baseline V1
* **Masalah yang Dipertanyakan:**
  Terdapat beberapa folder run pada V1 (`20261115-205145`, `20261115-205233`, `20261115-212611`).
* **Audit Bukti Langsung (`execution.log`):**
  * Run `205145`: Gagal startup saat runner Playwright mencoba menjalankan perintah `webServer` internal karena path resolusi sandbox Windows mengarah ke `experiments/frontend` (ENOENT).
  * Run `205233`: Gagal inisialisasi lingkungan runner.
  * Run `212611`: Run aktual pertama yang valid setelah blok `webServer` dinonaktifkan dan runner diarahkan ke frontend aktif pengguna pada `http://localhost:3000`.
* **Resolusi:** **Resolved.**
  Hanya run `20261115-212611` yang diakui sebagai eksekusi baseline V1 aktual. Percobaan sebelumnya dicatat sebagai kegagalan konfigurasi infrastruktur lingkungan Windows sandbox.

---

## 4. Informasi yang Belum Tercatat / Belum Diverifikasi

Untuk menjaga objektivitas dan mencegah fabrikasi data:
1. **Model AI Eksak untuk Prompt Awal Pengguna:** Model AI eksternal yang dipakai oleh pengguna saat menyusun prompt pertama kali di luar sesi tidak terekam dalam metadata workspace; dicatat sebagai **belum tercatat**.
2. **Durasi Penulisan Prompt Pengguna:** Waktu yang dihabiskan pengguna manusia dalam merancang prompt tidak diukur; dicatat sebagai **belum diverifikasi**.
3. **Fluktuasi Mikrodetik CPU Peramban:** Penjelasan mengapa dialog modal alert berhasil di-accept pada 4 instance V3 repeat namun deadlock pada 1 instance didasarkan pada karakteristik asinkron *event loop*, bukan pengukuran fisik waktu thread CPU per mikrodetik; dicatat sebagai **analisis arsitektur kualitatif, bukan metrik terukur**.
