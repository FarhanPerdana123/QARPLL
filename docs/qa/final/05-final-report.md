# Laporan Akhir Eksperimen: Evaluasi Kritis AI-Assisted Automated Testing pada Sistem Pemesanan Tiket Bioskop

---

## 1. Ringkasan Eksekutif

Eksperimen tugas kuliah ini mengevaluasi kapabilitas dan keandalan pembuatan skrip pengujian otomatis berbasis AI (*AI-Assisted Automated Testing*) menggunakan Playwright TypeScript pada sistem pemesanan tiket bioskop (*Cinema Booking System*). Pengujian difokuskan pada tiga skenario bisnis kritis: pemesanan tiket lengkap (*happy path*), pencegahan pemilihan kursi berstatus *booked*, dan penanganan kegagalan pembayaran gerbang timeout (HTTP 504).

Melalui empat generasi kode terisolasi (Baseline V1, V2, V3, dan V3 Dialog Fix), eksperimen ini mengungkap temuan fundamental: **skrip pengujian yang lulus 100% pada satu kali eksekusi awal (*single green run*) belum tentu berkualitas tinggi atau bebas dari cacat kritis**.
* Pada **V1**, skrip monolitik gagal pada pengujian kursi (*actionability timeout* 45 detik) karena memaksakan klik pada elemen yang dinonaktifkan oleh CSS `pointer-events: none` (Pass rate: 2/3 = 66,67%).
* Pada **V2**, arsitektur Page Object Model (POM) berhasil mencapai pass rate 3/3 (100%) pada runtime, namun **gagal total pada validasi statis TypeScript** dengan 6 error `TS2339` akibat kesalahan *type narrowing* pada variabel closure.
* Pada **V3**, penyempurnaan *type safety* dan pengetatan assertion menghasilkan kelulusan statis (*exit code 0*) dan runtime 3/3 (100%). Namun, ketika diuji melalui **pengujian berulang terbatas (5 pengulangan per skenario, total 15 instance)**, ditemukan *flakiness* laten di mana Skenario 3 mengalami *intermittent deadlock* akibat saling tunggu antara aksi klik tombol formulir submit dan dialog modal native (`window.alert`).
* Pada **Revisi V3 Dialog Fix**, rekonstruksi sinkronisasi dialog secara konkuren menggunakan `Promise.all` berhasil mengeliminasi deadlock, menghasilkan kelulusan **15/15 passed (100% pada sampel yang diamati)** dengan pengurangan waktu eksekusi suite sebesar ~57% (dari 96,03 detik menjadi 41,43 detik).

Kesimpulan utama eksperimen ini menegaskan bahwa: **Kualitas skrip otomasi yang digenerate AI harus dinilai melalui kombinasi berjenjang antara peninjauan kode manual, validasi statis ketat (*typecheck*), eksekusi runtime nyata, dan pengujian berulang (*repeat testing*); bukan semata-mata mengandalkan *pass rate* pada satu kali uji.**

---

## 2. Latar Belakang dan Tujuan

Penerapan Model AI (*Large Language Models*) dalam rekayasa pengujian perangkat lunak berkembang pesat untuk mempercepat penyusunan skenario uji *End-to-End* (E2E). Meskipun AI mampu memahami konteks alur pengguna (*user journey*) dan menghasilkan kode dengan cepat, pengujian otomatis menuntut determinisme, keakuratan penanganan event asinkron peramban, serta kepatuhan tipe data yang ketat.

Tujuan utama dari eksperimen ini adalah:
1. Membangun baseline pengujian E2E Playwright TypeScript yang jujur dan independen tanpa menyalin solusi yang sudah ada di repositori.
2. Mengamati secara empiris pola kesalahan umum yang dihasilkan AI dalam berinteraksi dengan DOM peramban, tipe data TypeScript, dan event modal.
3. Menguji efektivitas pengujian berulang dalam menyingkap kondisi *race condition* dan *deadlock* asinkron yang tersembunyi di balik kelulusan *single run*.
4. Mengukur dampak perbaikan terstruktur terhadap stabilitas runtime dan durasi eksekusi pengujian.

---

## 3. Metodologi Eksperimen

### A. Tiga Skenario Pengujian Kritis
1. **Skenario 1 (Happy Path):** Memilih film "Inception" di `/movies`, memilih jadwal di `/buy-tickets/movie-1`, memilih kursi A1 di `/booking/showtime-1`, mengonfirmasi ringkasan di `/create-booking`, mengisi detail kartu kredit di `/payment/checkout`, hingga menerima konfirmasi e-ticket di `/booking-success`.
2. **Skenario 2 (Negative Seat Selection):** Memverifikasi bahwa kursi berstatus *booked* memiliki computed style CSS `pointer-events: none` dan `cursor: not-allowed`, menguji klik pointer fisik pada koordinat visual kursi tersebut tidak memilih kursi, dan memvalidasi kontrol positif pada kursi *available*.
3. **Skenario 3 (Negative Payment Failure HTTP 504):** Mensimulasikan kegagalan gerbang pembayaran HTTP 504 Gateway Timeout, menangkap dialog modal alert `Payment Failed`, memverifikasi tombol pembayaran dipulihkan ke status aktif (`PAY NOW`), memastikan pengguna tetap di halaman checkout, serta memvalidasi endpoint pasca-bayar (`book-seats`) tidak pernah dipanggil.

### B. Lingkungan dan Protokol Tata Kelola
* **Lingkungan Sistem:** Windows 11 Pro 64-bit, Node.js v20.19.5, Playwright v1.65.1, TypeScript v5.9.3, Chromium Headless (Viewport: 1280×720).
* **Frontend:** Aplikasi React berjalan pada `http://localhost:3000`.
* **Backend:** Dinonaktifkan total; seluruh komunikasi REST API diintersepsi dan disimulasikan menggunakan `page.route()`.
* **Protokol Integritas:** Setiap versi pengujian disimpan dalam direktori terisolasi (`experiments/v1/`, `v2/`, `v3/`, `v3-dialog-fix/`). Hash kriptografis SHA-256 seluruh file dicatat dalam `manifest.json` sebelum dan setelah run untuk menjamin ketiadaan modifikasi diam-diam. Seluruh eksekusi menggunakan `workers: 1`, `retries: 0`, dan batas waktu 45 detik per test.

---

## 4. Hasil Eksperimen dan Rekapitulasi Data Terverifikasi

### A. Perbandingan Eksekusi Pertama (*First Run*): V1 vs V2 vs V3

Hasil eksekusi pertama diverifikasi langsung dari file artefak `report.json` primer:
* V1 First Run: `artifacts/execution/v1/20261115-212611/report.json`
* V2 First Run: `artifacts/execution/v2/20261115-213902/report.json`
* V3 First Run: `artifacts/execution/v3/20261115-221843/report.json`

| Parameter / Metrik | Baseline V1 (Run `20261115-212611`) | Baseline V2 (Run `20261115-213902`) | Baseline V3 (Run `20261115-221843`) |
|---|---|---|---|
| **Skenario 1 (Happy Path)** | **PASSED** (5,861 s) | **PASSED** (6,554 s) | **PASSED** (6,761 s) |
| **Skenario 2 (Kursi Booked)** | **TIMED OUT** (46,435 s) | **PASSED** (1,981 s) | **PASSED** (1,586 s) |
| **Skenario 3 (HTTP 504)** | **PASSED** (1,712 s) | **PASSED** (2,204 s) | **PASSED** (1,711 s) |
| **Pass Rate (Denominator: 3)** | **66,67%** (2 passed, 1 timedOut) | **100%** (3 passed, 0 failed) | **100%** (3 passed, 0 failed) |
| **Jumlah Durasi Test Individual** | 54,008 s | 10,739 s | 10,058 s |
| **Durasi Wall-Clock Suite** | 56,330 s | 11,787 s | 11,332 s |
| **Status Validasi Statis** | Belum diverifikasi khusus | **Exit Code 2 (Gagal TS2339)** | **Exit Code 0 (Passed)** |
| **Runner Exit Code** | `1` | `0` | `0` |

### B. Perbandingan Pengujian Berulang: Baseline V3 vs V3 Dialog Fix

Hasil pengujian berulang (5 pengulangan per skenario, 15 instance total) diverifikasi langsung dari artefak `report.json`:
* Baseline V3 Repeat: `artifacts/execution/v3-repeat/20261115-234716/report.json`
* V3 Dialog Fix Repeat: `artifacts/execution/v3-dialog-fix-repeat/20261116-001934/report.json`

| Parameter / Metrik | Baseline V3 Repeat (`20261115-234716`) | Revisi V3 Dialog Fix (`20261116-001934`) | Analisis Perbedaan Empiris |
|---|---|---|---|
| **Skenario 1 (Happy Path)** | 5/5 Passed (Min 2,475s, Med 2,825s, Max 6,417s) | 5/5 Passed (Min 2,480s, Med 4,239s, Max 5,740s) | Keduanya stabil dan konsisten. |
| **Skenario 2 (Kursi Booked)** | 5/5 Passed (Min 1,337s, Med 1,440s, Max 1,671s) | 5/5 Passed (Min 1,239s, Med 1,393s, Max 1,778s) | Keduanya stabil dan konsisten. |
| **Skenario 3 (HTTP 504)** | **4/5 Passed, 1 TimedOut (56,875s)** | **5/5 Passed (Min 1,464s, Med 1,675s, Max 1,704s)** | Eliminasi deadlock timeout; seluruh 5 repeat berjalan seragam di rentang 1,46s–1,70s. |
| **Pass Rate (Denominator: 15)** | **93,33%** (14 passed, 1 timedOut) | **100%** (15 passed, 0 failed pada sampel ini) | Peningkatan 1 instance yang sebelumnya gagal timeout. |
| **Jumlah Durasi Test Individual** | 90,516 s | **36,251 s** *(terverifikasi matematis)* | Pengurangan waktu uji murni sebesar ~60% akibat eliminasi timeout. |
| **Durasi Wall-Clock Suite** | 96,033 s (~1,6 menit) | **41,427 s (~0,7 menit)** | Eksekusi keseluruhan suite berkurang ~57% lebih cepat. |
| **Runner Exit Code** | `1` | **`0`** | Runner selesai dengan status sukses penuh. |

---

## 5. Pembahasan Kritis

### A. Anatomi Kegagalan Interaksi DOM (Kasus Actionability V1)
Pada V1, AI gagal memahami implikasi fungsional dari styling CSS. Penerapan `pointer-events: none` pada elemen HTML menyebabkan browser secara native mengabaikan event pointer. Ketika script memanggil `locator.click()`, protokol actionability Playwright menunggu elemen dapat menerima event pointer hingga batas timeout 45 detik. Kegagalan ini bukan bug aplikasi, melainkan bukti ketidakmampuan AI dalam membedakan antara elemen yang dapat diklik secara interaktif dengan elemen yang dinonaktifkan oleh CSS. Solusi visual melalui `page.mouse.click()` pada koordinat bounding box terbukti efektif menyelesaikan masalah ini pada V2 dan V3.

### B. Jebakan Type Narrowing pada TypeScript Strict (Kasus V2)
Pada V2, AI berusaha memvalidasi kontrak data backend dengan menangkap payload di dalam callback `page.route()`. Deklarasi variabel penampung `T | null` yang diperbarui di dalam closure callback menyebabkan TypeScript compiler menganggap pemanggilan `expect(val).not.toBeNull()` tidak mempersempit tipe data. Pada mode `strictNullChecks`, tipe variabel diinferensikan sebagai `never`, memicu error fatal `TS2339`. Fenomena ini menunjukkan bahwa AI kerap memindahkan pola idiomatis JavaScript tanpa mempertimbangkan batasan statis compiler TypeScript.

### C. Deadlock Asinkron pada Dialog Modal Native (Kasus V3 Repeat)
Kasus Skenario 3 pada pengulangan V3 menyingkap kelemahan krusial dalam orkestrasi asinkron:
1. Tombol checkout adalah tombol submit formulir HTML (`<button type="submit">`).
2. Aksi `click()` Playwright pada tombol submit formulir secara internal menyertakan penungguan `waiting for scheduled navigations to finish`.
3. Ketika respons HTTP 504 diterima, komponen React secara sinkron memanggil `window.alert()`.
4. Dialog modal alert membekukan event loop JavaScript peramban.
5. Akibatnya, `submitPayment()` tidak pernah resolve, sementara skrip pengujian tertahan di baris tersebut dan tidak dapat mencapai baris `dialog.accept()`.
6. Terjadi kondisi saling tunggu (*deadlock*) hingga batas waktu 45 detik habis.

Penggunaan pola konkuren pada revisi `v3-dialog-fix`:
```typescript
await Promise.all([
  page.waitForEvent('dialog').then(async (d) => {
    try { msg = d.message(); } finally { await d.accept(); }
  }),
  paymentPage.submitPayment(),
]);
```
berhasil membebaskan deadlock karena event dialog diterima dan ditutup saat aksi klik masih berada dalam fase pending.

---

## 6. Keterbatasan Eksperimen

1. **Sampel Terbatas dan Non-RCT:**
   * Hasil kelulusan 15/15 pada revisi dialog fix membuktikan bahwa **tidak ada kegagalan yang teramati pada sampel lima pengulangan ini**. Namun, ini bukan bukti matematis bahwa pengujian bebas dari *flakiness* secara universal di bawah beban CPU ekstrem atau platform peramban lain.
   * Eksperimen ini adalah studi perbaikan iteratif terarah, bukan uji acak terkontrol (*randomized controlled trial*).
2. **Batas Validasi Mocking:**
   * Penggunaan route mocking membuktikan alur UI frontend, namun **tidak membuktikan konkurensi backend, idempotensi transaksi pembayaran, atau penguncian kursi (*database locking*) nyata**.
3. **Keterbatasan Semantik Assertion:**
   * Pengujian format nomor referensi tiket dengan regex `/^Booking Ref:\s*#\d{1,6}$/` memvalidasi representasi teks di layar, namun tidak membuktikan keunikan nomor tiket atau keterikatannya dengan sistem backend karena nomor tersebut dihasilkan oleh `Math.random()` di sisi frontend.
4. **Bukan Mutation Testing:**
   * Eksperimen ini menguji stabilitas eksekusi, bukan ketahanan assertion terhadap perubahan kode (*mutation testing*); kemampuan skrip mendeteksi segala bentuk regresi belum teruji secara penuh.

---

## 7. Kesimpulan

Berdasarkan empat iterasi eksperimen dan audit data empiris menyeluruh, dapat disimpulkan bahwa:
1. **Pass Rate Single Run Bukan Tolok Ukur Kualitas yang Valid:** Skrip V2 lulus 3/3 pada runtime namun gagal kompilasi statis. Skrip V3 lulus 3/3 pada run pertama namun gagal timeout pada pengujian berulang. Mengukur kualitas skrip AI hanya dari satu kali eksekusi hijau adalah praktik yang menyesatkan (*false positive*).
2. **AI Memiliki Titik Buta Asinkronitas Peramban:** Model AI cenderung menyusun alur pengujian secara sekuensial linier dan kerap gagal mengantisipasi kondisi deadlock saat interaksi formulir berhadapan dengan dialog modal native peramban.
3. **Pentingnya Validasi Berjenjang:** Evaluasi skrip otomasi yang digenerate AI membutuhkan pendekatan terpadu:
   * **Review Kode Semantik:** Memastikan selector dan logika pengujian mencerminkan perilaku aplikasi yang sebenarnya.
   * **Validasi Statis Strict:** Memastikan integritas tipe data dan ketiadaan error kompilasi.
   * **Pengujian Berulang (*Repeat Testing*):** Menemukan *flakiness* dan *timing hazard* tersembunyi sebelum skrip diintegrasikan ke dalam pipeline repositori.

---

## 8. Rekomendasi untuk Pengujian Otomasi Berbantuan AI

1. **Wajibkan Validasi Statis Mandiri:** Setiap skrip TypeScript yang dihasilkan AI harus divalidasi menggunakan `npx tsc --noEmit` dalam mode strict sebelum diizinkan berjalan di lingkungan pengujian.
2. **Standarisasi Pola Interaksi Konkuren untuk Dialog:** Hindari pemanggilan `await locator.click()` yang diikuti secara sekuensial oleh penanganan dialog modal. Gunakan selalu pola `Promise.all` atau event listener konkuren dengan pembersihan terjamin (*fail-safe finally block*).
3. **Terapkan Kebijakan Pengujian Berulang pada Baseline Awal:** Skrip pengujian E2E baru sebaiknya diuji minimal 5 hingga 10 kali pengulangan berurutan (`repeatEach: 5-10`) untuk memastikan ketiadaan *race condition* sebelum disetujui sebagai baseline stabil.
4. **Inspeksi Kode Implementasi Frontend Sebelum Membuat Assertion:** Jangan mengasumsikan integrasi backend bekerja ideal; selalu periksa source code komponen UI untuk memastikan apakah data tampilan benar-benar terikat ke backend atau hanya nilai tiruan lokal (*mock/random*).
