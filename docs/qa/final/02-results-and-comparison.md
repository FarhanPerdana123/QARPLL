# 02. Hasil Eksperimen dan Analisis Komparatif

Dokumen ini menyajikan rekapitulasi data empiris hasil validasi statis dan runtime dari seluruh fase pengujian, perbandingan komparatif antargenerasi script (V1–V3 dan revisi dialog), serta audit matematis terhadap durasi eksekusi.

---

## 1. Pemisahan Hasil Statis dan Hasil Runtime

Dalam pengujian perangkat lunak berbasis TypeScript modern, kelulusan eksekusi runtime tidak selalu mencerminkan kualitas kode statis yang bebas dari cacat sintaksis. Tabel berikut memisahkan status validasi statis (*compile-time*) dari status eksekusi runtime Playwright:

| Versi Eksperimen | Validasi Statis (TypeScript Compiler) | Status Runtime Playwright | Catatan Kualitas Terpadu |
|---|---|---|---|
| **Baseline V1** | **Belum Diverifikasi Khusus** (Skrip monolitik dijalankan via Babel transpiler tanpa konfigurasi `tsconfig.v1.json` terpisah) | **2/3 Passed (66,67%)** | Kegagalan runtime akibat actionability timeout pada Skenario 2. |
| **Baseline V2** | **Exit Code 2 (FAILED)** — 6 error `TS2339: Property ... does not exist on type 'never'` | **3/3 Passed (100%)** | Runtime lulus karena Playwright mengeksekusi via bundler on-the-fly, namun skrip cacat secara statis di bawah `strictNullChecks`. |
| **Baseline V3 (First Run)** | **Exit Code 0 (PASSED)** — Bersih (*0 errors, 0 warnings*) di bawah `strict: true` | **3/3 Passed (100%)** | Lolos statis dan runtime pada satu kali eksekusi awal. |
| **Baseline V3 (Repeat Run)** | **Exit Code 0 (PASSED)** | **14/15 Passed (93,33%)** — 1 timedOut pada Skenario 3 | Mengungkap cacat tersembunyi (*intermittent deadlock*) yang lolos pada *first run*. |
| **V3 Dialog Fix (Repeat Run)** | **Exit Code 0 (PASSED)** | **15/15 Passed (100%)** | Lolos statis dan seluruh 15 pengulangan runtime berhasil tanpa timeout. |

---

## 2. Tabel Komparasi Eksekusi Pertama (*First Run*): V1 vs V2 vs V3

Seluruh data pada tabel ini diekstraksi langsung dari artefak bukti `report.json` masing-masing run:
* V1 First Run: `artifacts/execution/v1/20261115-212611/report.json`
* V2 First Run: `artifacts/execution/v2/20261115-213902/report.json`
* V3 First Run: `artifacts/execution/v3/20261115-221843/report.json`

| Parameter / Metrik | Baseline V1 (Run `20261115-212611`) | Baseline V2 (Run `20261115-213902`) | Baseline V3 (Run `20261115-221843`) |
|---|---|---|---|
| **Skenario 1 (Happy Path)** | **PASSED** — 5,861 s (5.861 ms) | **PASSED** — 6,554 s (6.554 ms) | **PASSED** — 6,761 s (6.761 ms) |
| **Skenario 2 (Kursi Booked)** | **TIMED OUT** — 46,435 s (46.435 ms) | **PASSED** — 1,981 s (1.981 ms) | **PASSED** — 1,586 s (1.586 ms) |
| **Skenario 3 (HTTP 504)** | **PASSED** — 1,712 s (1.712 ms) | **PASSED** — 2,204 s (2.204 ms) | **PASSED** — 1,711 s (1.711 ms) |
| **Jumlah Test Passed** | 2 / 3 | 3 / 3 | 3 / 3 |
| **Pass Rate (Denominator: 3)** | **66,67%** (2 passed, 1 timedOut) | **100%** (3 passed, 0 failed) | **100%** (3 passed, 0 failed) |
| **Jumlah Durasi Test Individual** | 54,008 s (54.008 ms) | 10,739 s (10.739 ms) | 10,058 s (10.058 ms) |
| **Wall-Clock Suite (`stats.duration`)** | 56,330 s (56.330 ms) | 11,787 s (11.787 ms) | 11,332 s (11.332 ms) |
| **Runner Exit Code** | `1` (kegagalan timeout) | `0` (sukses runtime) | `0` (sukses runtime) |
| **Status Validasi Statis** | Belum diverifikasi khusus | **Exit Code 2 (TS2339)** | **Exit Code 0 (Passed)** |

---

## 3. Tabel Komparasi Pengujian Berulang: Baseline V3 vs V3 Dialog Fix

Kedua eksperimen pengujian berulang dieksekusi dengan konfigurasi setara: 1 worker sekuensial, `repeatEach: 5` (15 instance total), timeout 45 detik per test, global timeout 300 detik.

* Baseline V3 Repeat: `artifacts/execution/v3-repeat/20261115-234716/report.json`
* V3 Dialog Fix Repeat: `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/report.json`

### A. Rincian Durasi dan Status 15 Instance (Urutan Eksekusi Runner)

| No | Skenario | `repeatEachIndex` | Baseline V3 Repeat (`20261115-234716`) | Revisi V3 Dialog Fix (`20261116-001934`) |
|---|---|---|---|---|
| 1 | Skenario 1 (Happy Path) | 0 | **PASSED** — 6,417 s (6.417 ms) | **PASSED** — 5,740 s (5.740 ms) |
| 2 | Skenario 2 (Kursi Booked) | 0 | **PASSED** — 1,540 s (1.540 ms) | **PASSED** — 1,332 s (1.332 ms) |
| 3 | Skenario 3 (HTTP 504) | 0 | **PASSED** — 2,299 s (2.299 ms) | **PASSED** — 1,540 s (1.540 ms) |
| 4 | Skenario 1 (Happy Path) | 1 | **PASSED** — 4,096 s (4.096 ms) | **PASSED** — 4,239 s (4.239 ms) |
| 5 | Skenario 2 (Kursi Booked) | 1 | **PASSED** — 1,671 s (1.671 ms) | **PASSED** — 1,778 s (1.778 ms) |
| 6 | Skenario 3 (HTTP 504) | 1 | **TIMED OUT** — 56,875 s (56.875 ms) *(Deadlock)* | **PASSED** — 1,675 s (1.675 ms) *(Unblocked)* |
| 7 | Skenario 1 (Happy Path) | 2 | **PASSED** — 2,825 s (2.825 ms) | **PASSED** — 2,480 s (2.480 ms) |
| 8 | Skenario 2 (Kursi Booked) | 2 | **PASSED** — 1,440 s (1.440 ms) | **PASSED** — 1,239 s (1.239 ms) |
| 9 | Skenario 3 (HTTP 504) | 2 | **PASSED** — 1,912 s (1.912 ms) | **PASSED** — 1,464 s (1.464 ms) |
| 10 | Skenario 1 (Happy Path) | 3 | **PASSED** — 2,823 s (2.823 ms) | **PASSED** — 3,326 s (3.326 ms) |
| 11 | Skenario 2 (Kursi Booked) | 3 | **PASSED** — 1,337 s (1.337 ms) | **PASSED** — 1,393 s (1.393 ms) |
| 12 | Skenario 3 (HTTP 504) | 3 | **PASSED** — 1,720 s (1.720 ms) | **PASSED** — 1,692 s (1.692 ms) |
| 13 | Skenario 1 (Happy Path) | 4 | **PASSED** — 2,475 s (2.475 ms) | **PASSED** — 5,109 s (5.109 ms) |
| 14 | Skenario 2 (Kursi Booked) | 4 | **PASSED** — 1,391 s (1.391 ms) | **PASSED** — 1,540 s (1.540 ms) |
| 15 | Skenario 3 (HTTP 504) | 4 | **PASSED** — 1,695 s (1.695 ms) | **PASSED** — 1,704 s (1.704 ms) |

### B. Ringkasan Statistik Distribusi Durasi Per Skenario

Distribusi statistik durasi (Minimum, Median, Maksimum) dihitung khusus untuk instance yang berstatus **Passed**:

| Skenario Pengujian | Baseline V3 Repeat (Passed / Dimulai) | V3 Repeat: Min / Med / Max (s) | V3 Dialog Fix (Passed / Dimulai) | V3 Dialog Fix: Min / Med / Max (s) |
|---|---|---|---|---|
| **Skenario 1** (Happy Path) | 5 / 5 (100%) | 2,475 / 2,825 / 6,417 | 5 / 5 (100%) | 2,480 / 4,239 / 5,740 |
| **Skenario 2** (Kursi Booked) | 5 / 5 (100%) | 1,337 / 1,440 / 1,671 | 5 / 5 (100%) | 1,239 / 1,393 / 1,778 |
| **Skenario 3** (HTTP 504) | **4 / 5 (80%)** | 1,695 / 1,816 / 2,299 | **5 / 5 (100%)** | **1,464 / 1,675 / 1,704** |

---

## 4. Audit Matematis Durasi Revisi V3 Dialog Fix (Penyelesaian Isu 36.251 ms vs 37.252 ms)

Pada pelaporan sebelumnya, muncul pertanyaan mengenai kesesuaian antara daftar 15 angka durasi individual dengan total durasi suite. Berikut adalah hasil audit verifikasi langsung terhadap artefak bukti `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/report.json`:

1. **Daftar Nilai Integer Aktual dari `report.json`:**
   * Skenario 1: `5740`, `4239`, `2480`, `3326`, `5109` ms → **Subtotal: 20.894 ms (20,894 s)**
   * Skenario 2: `1332`, `1778`, `1239`, `1393`, `1540` ms → **Subtotal: 7.282 ms (7,282 s)**
   * Skenario 3: `1540`, `1675`, `1464`, `1692`, `1704` ms → **Subtotal: 8.075 ms (8,075 s)**
2. **Perhitungan Penjumlahan:**
   $$\text{Grand Total} = 20.894 + 7.282 + 8.075 = \mathbf{36.251\text{ ms}} = \mathbf{36,251\text{ detik}}$$
3. **Penyebab Ketidaksesuaian:**
   * Angka **36.251 ms** adalah hasil penjumlahan matematis yang **benar dan terverifikasi secara presisi** dari file `report.json`.
   * Angka **37.252 ms** yang sempat dipertanyakan berasal dari kesalahan penjumlahan manual di sisi penanya ($37.252 - 36.251 = 1.001\text{ ms}$, terjadi *carry-over* berlebih pada digit ribuan).
4. **Perbandingan Wall-Clock vs Jumlah Durasi Test:**
   * **Jumlah durasi test murni:** 36.251 ms (36,251 detik).
   * **Wall-clock duration suite (`stats.duration`):** 41.426,699 ms (41,427 detik).
   * **Overhead infrastruktur:** $41.427 - 36.251 = 5.176\text{ detik}$ (digunakan Playwright untuk inisialisasi browser context Chromium, fixture setup, dan penulisan artefak report).

---

## 5. Temuan Utama Berdasarkan Bukti Nyata

1. **Timeout Test Bukan Otomatis Bug Aplikasi:**
   * Pada V1, Skenario 2 mengalami timeout 45 detik saat memanggil `locator.click()` pada kursi yang memiliki style CSS `pointer-events: none`. Ini bukan bug aplikasi bioskop, melainkan kesalahan strategi script Playwright yang memaksakan *actionability wait* pada elemen yang sengaja dinonaktifkan oleh CSS aplikasi.
   * Pada V3 Repeat, Skenario 3 mengalami timeout 45 detik bukan karena server gagal merespons, melainkan karena pola script menunggu `submitPayment()` resolve sebelum memanggil `dialog.accept()`, padahal dialog modal alert membekukan browser dan menahan `submitPayment()`.
2. **Efektivitas Pola Konkuren (`Promise.all`):**
   * Dengan mengeksekusi `page.waitForEvent('dialog').then(d => d.accept())` secara konkuren dengan `submitPayment()`, Skenario 3 pada revisi dialog fix mencapai kelulusan 5/5 dengan rentang waktu yang sangat stabil (1,46 s – 1,70 s).
3. **Durasi Lebih Cepat Tidak Membuktikan Aplikasi Lebih Cepat:**
   * Penurunan waktu total suite dari V1 (56,33 s) ke V2 (11,79 s) dan V3 Repeat (96,03 s) ke V3 Dialog Fix (41,43 s) terjadi murni karena **eliminasi penalti timeout 45 detik**, bukan percepatan performa aplikasi bioskop.
