# 01. Metodologi Eksperimen AI-Assisted Automated Testing

Dokumen ini mendokumentasikan metodologi formal, arsitektur pengujian, batasan desain eksperimen, dan tata kelola integritas yang diterapkan dalam penelitian pengujian otomasi berbantuan AI (*AI-Assisted Automated Testing*) pada sistem pemesanan tiket bioskop (*Cinema Booking System*).

---

## 1. Tujuan Eksperimen

Eksperimen ini dirancang untuk:
1. Menghasilkan dan mengevaluasi kualitas skrip pengujian fungsional *End-to-End* (E2E) berbasis Playwright TypeScript yang digenerate oleh AI secara iteratif.
2. Menguji tiga skenario bisnis kritis aplikasi pemesanan tiket bioskop:
   * **Skenario 1 (Happy Path):** Pemesanan tiket lengkap dari pemilihan film, pemilihan jadwal, penentuan kursi, pengisian pembayaran, hingga penerbitan e-ticket.
   * **Skenario 2 (Negative Seat Selection):** Validasi bahwa kursi bioskop berstatus *booked* tidak dapat dipilih oleh pengguna.
   * **Skenario 3 (Negative Payment Failure):** Simulasi kegagalan pembayaran gerbang timeout (HTTP 504) untuk memastikan pengguna melihat notifikasi kegagalan, tombol pembayaran dipulihkan, dan pengguna tidak diarahkan ke halaman sukses.
3. Mengukur efektivitas validasi statis (*strict TypeScript compiler*), eksekusi pengujian aktual (*first run*), dan pengujian berulang (*repeat testing*) dalam menemukan kelemahan kode pengujian yang tidak terdeteksi pada *single pass run*.
4. Membandingkan secara empiris evolusi script dari versi baseline awal (V1), perbaikan terstruktur (V2), penyempurnaan tipe dan assertion (V3), hingga penanganan sinkronisasi dialog konkuren (V3 Dialog Fix).

---

## 2. Definisi Tiga Skenario Pengujian

| ID Skenario | Nama Skenario | Alur Pengujian Utama | Ekspektasi Keberhasilan |
|---|---|---|---|
| **Skenario 1** | Pemesanan Tiket Lengkap (Happy Path) | Navigasi `/movies` → Pilih film "Inception" → Pilih jadwal "Hall 1, 10:00 AM" → Pilih kursi A1 (available) → Konfirmasi di `/create-booking` → Checkout `/payment/checkout` → Verifikasi e-ticket di `/booking-success`. | E-ticket tampil dengan format `Booking Ref: #<1-6 digit>`, request `POST /api/payments` memuat payload bisnis yang valid, dan request `POST /api/seats/book-seats` dipanggil. |
| **Skenario 2** | Pencegahan Pemilihan Kursi Booked | Navigasi `/booking/showtime-1` → Identifikasi kursi 2 (booked) → Verifikasi CSS computed style `pointer-events: none` dan `cursor: not-allowed` → Klik koordinat fisik pointer pada bounding box visual kursi booked → Kontrol positif: klik kursi 1 (available). | Kursi booked tidak masuk keranjang (tidak memiliki class `.selected`), *summary bar* hanya memuat 1 kursi yang sah (A1), dan harga total sesuai. |
| **Skenario 3** | Penanganan Kegagalan Pembayaran (HTTP 504) | Navigasi `/booking/showtime-1` → Pilih kursi A1 → Konfirmasi → Isi data pembayaran → Submit pembayaran saat API `/api/payments` dimock mengembalikan HTTP 504 Gateway Timeout. | Dialog alert muncul dengan pesan `Payment Failed`, dialog dapat di-accept/dismiss, tombol bayar kembali aktif (`PAY NOW`), URL tetap di `/payment/checkout`, dan endpoint `book-seats` tidak pernah dipanggil. |

---

## 3. Lingkungan Pengujian dan Konfigurasi Sistem

Seluruh tahap validasi statis dan runtime dieksekusi pada lingkungan lokal terkontrol dengan spesifikasi aktual:

* **Sistem Operasi:** Microsoft Windows NT 10.0.26300.0 (Windows 11 Pro 64-bit).
* **Runtime Node.js:** v20.19.5.
* **Manajer Paket npm:** 10.8.2.
* **TypeScript Compiler (tsc):** Version 5.9.3.
* **Playwright Test Runner:** Version 1.65.1.
* **Browser Engine:** Chromium Headless (Viewport standar: 1280 × 720 piksel).
* **Frontend Aplikasi:** React Single Page Application aktif di `http://localhost:3000` (dijalankan manual oleh pengguna di host Windows).
* **Backend & Database:** **Dinonaktifkan total**. Seluruh komunikasi jaringan eksternal disimulasikan menggunakan fitur *network interception & route mocking* bawaan Playwright (`page.route()`).

---

## 4. Urutan Iterasi Eksperimen

Eksperimen dilaksanakan melalui lima tahap berurutan:

```
[Tahap 1: Baseline V1]
  └─ Generasi skrip monolitik 1 file (experiments/v1/)
  └─ First Run Aktual (Run ID: 20261115-212611) -> 2/3 Passed, 1 TimedOut

[Tahap 2: Baseline V2]
  └─ Generasi Page Object Model modular (experiments/v2/)
  └─ Validasi Statis (TypeScript strict) -> Exit Code 2 (Gagal TS2339)
  └─ First Run Aktual (Run ID: 20261115-213902) -> 3/3 Passed

[Tahap 3: Baseline V3 (Refined)]
  └─ Perbaikan Type Safety & Pengetatan Assertion (experiments/v3/)
  └─ Validasi Statis (TypeScript strict) -> Exit Code 0 (Passed)
  └─ First Run Aktual (Run ID: 20261115-221843) -> 3/3 Passed

[Tahap 4: Pengujian Berulang Baseline V3]
  └─ Pengulangan Terbatas (repeatEach: 5, 15 instance) (Run ID: 20261115-234716)
  └─ Runtime -> 14/15 Passed, 1 TimedOut (Deadlock Sinkronisasi Dialog Skenario 3)

[Tahap 5: Revisi Terisolasi V3 Dialog Fix]
  └─ Rekonstruksi Sinkronisasi Dialog Konkuren via Promise.all (experiments/v3-dialog-fix/)
  └─ Validasi Statis (TypeScript strict) -> Exit Code 0 (Passed)
  └─ Repeat Run Aktual (repeatEach: 5, 15 instance) (Run ID: 20261116-001934) -> 15/15 Passed
```

---

## 5. Tata Kelola Protokol Integritas Kode

Untuk menjamin keabsahan ilmiah dan mencegah bias pengujian:
1. **Aturan Anti-Modifikasi Diam-Diam (*Immutable Baseline*):**
   * Setiap versi baseline yang telah dibuat disimpan secara permanen.
   * Sebelum dan sesudah eksekusi, hash kriptografis SHA-256 seluruh file TypeScript dihitung dan dicatat ke dalam file `manifest.json`.
   * Tidak ada perbaikan kode yang dilakukan langsung pada baseline lama setelah kegagalan teramati. Setiap perbaikan diwujudkan dalam direktori baru terisolasi.
2. **Aturan Satu Perintah (*Single-Command Execution*):**
   * Tidak ada mekanisme *automatic retry* (`retries: 0`).
   * Tidak ada *rerun* tersembunyi untuk mencari hasil hijau (*green run*).
3. **Pemisahan Pengujian Awal dan Pengujian Berulang:**
   * Hasil eksekusi pertama (*first run*) dilaporkan terpisah dari hasil pengujian berulang (*repeat run*).
   * Metrik utama keduanya tidak digabungkan.

---

## 6. Arsitektur Simulasi Jaringan (API Mocking)

Karena eksperimen menguji frontend tanpa backend nyata, Playwright dikonfigurasikan untuk mengintersepsi seluruh panggilan REST API:
* `**/api/movies*` dan `**/api/movies/movie-1`: Mengembalikan data dummy film "Inception".
* `**/api/showtimes/**`: Mengembalikan jadwal tayang dummy di "Hall 1" pada harga Rp 500.
* `**/api/halls*`: Mengembalikan data kapasitas hall dummy.
* `**/api/seats/showtime-1`: Mengembalikan daftar kursi dummy (Kursi 1: available, Kursi 2: booked).
* `**/api/payments`: Mengembalikan status HTTP 201 (sukses) pada Skenario 1, dan status HTTP 504 Gateway Timeout pada Skenario 3.
* `**/api/seats/book-seats`: Mengembalikan HTTP 200 konfirmasi booking kursi.
* `**/api/notifications/**`: Mengembalikan status notifikasi kosong.

### Aturan Pencocokan Rute (Route Matching Rules):
* Playwright mengevaluasi rute yang terdaftar secara LIFO (*Last-In, First-Out*).
* Pola glob bintang tunggal `**/api/movies*` tidak mencocokkan karakter pemisah direktori (`/`), sehingga tidak menimpa (*masking*) rute spesifik `**/api/movies/movie-1`.

---

## 7. Variabel yang Berubah dan Keterbatasan Desain Eksperimen

1. **Variabel Bebas Iterasi:**
   * V1 ke V2: Perubahan arsitektur dari monolitik ke Page Object Model (POM), perbaikan metode klik kursi dari `locator.click()` ke simulasi pointer mouse fisik `page.mouse.click()`.
   * V2 ke V3: Perbaikan tipe data closure variabel dari callback route menjadi `page.waitForRequest()`, pengetatan assertion format e-ticket regex.
   * V3 ke V3 Dialog Fix: Perubahan urutan eksekusi penanganan dialog modal dari sekuensial menjadi konkuren via `Promise.all`.
2. **Keterbatasan Desain Eksperimen:**
   * **Bukan Isolasi Variabel Tunggal:** Eksperimen ini adalah studi perbaikan terarah dengan penambahan konteks (*iterative refinement*), bukan eksperimen laboratorium dengan isolasi pengaruh format prompt (*prompt engineering ablation*).
   * **Bukan Uji Acak Terkontrol (Non-RCT):** Pengujian berulang dilakukan dalam batch sekuensial, bukan pengacakan urutan uji antar-versi.
   * **Cakupan Pengujian Mock:** Mocking UI tidak memvalidasi konkurensi database nyata (*race condition* pemilihan kursi oleh dua pengguna bersamaan) maupun transaksi perbankan riil.
