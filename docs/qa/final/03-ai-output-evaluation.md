# 03. Evaluasi Kritis Output AI dalam Otomasi Pengujian

Dokumen ini menyajikan evaluasi analitis mendalam mengenai kapabilitas, keterbatasan sintaksis, kelemahan asinkronitas, dan kecenderungan klaim berlebih (*overclaiming*) pada kode pengujian otomatis yang digenerate oleh Model AI (*Large Language Models*).

---

## 1. Ringkasan Kekuatan dan Kelemahan Output AI

| Dimensi Evaluasi | Kekuatan Output AI (LLM) | Kelemahan & Blind Spot Output AI |
|---|---|---|
| **Pemahaman Domain Bisnis** | Mampu memetakan alur pemesanan tiket bioskop (katalog → jadwal → kursi → checkout → tiket) secara runtut dan masuk akal. | Cenderung mengasumsikan integrasi end-to-end ideal tanpa memeriksa apakah frontend benar-benar mengikat data backend (misal: ID transaksi vs nomor tiket acak). |
| **Arsitektur Kode & POM** | Mampu menghasilkan struktur Page Object Model (POM) yang rapi, modular, dan memisahkan locator dari alur uji. | Sering menghasilkan dependensi closure variabel yang merusak analisis aliran kendali (*control flow analysis*) TypeScript compiler. |
| **Pemilihan Selector & Mocking** | Mampu memanfaatkan CSS selector berbasis kelas aplikasi dan menyusun router mocking Playwright (`page.route()`). | Kerap mengabaikan aturan pencocokan Playwright (LIFO) dan sintaksis glob (perbedaan `*` dan `**` terhadap pemisah direktori). |
| **Penanganan Interaksi DOM** | Menguasai API Playwright standar (`fill`, `click`, `waitForURL`, `toBeVisible`). | Mengalami kegagalan fatal pada interaksi elemen ber-CSS khusus (`pointer-events: none`) dan *timing hazard* dialog modal native browser. |

---

## 2. Analisis Kasus 1: Masalah Actionability pada Elemen Non-Interaktif (V1)

### A. Gejala dan Manifestasi Kode
Pada baseline V1 (`experiments/v1/cinema-booking.v1.spec.ts`), AI menulis interaksi berikut untuk memverifikasi bahwa kursi booked tidak dapat dipilih:
```typescript
const bookedSeat = page.locator('.seat.booked').first();
await bookedSeat.click({ timeout: 5000 }); // Atau default click tanpa opsi force
```

### B. Akar Masalah Teknis
1. Aplikasi bioskop menerapkan aturan CSS pada kursi yang telah dipesan (`frontend/src/pages/SeatSelection.css`):
   ```css
   .seat.booked {
     background-color: #4b5563;
     cursor: not-allowed;
     pointer-events: none;
   }
   ```
2. Mekanisme internal Playwright memiliki protokol *actionability check*: sebelum melakukan klik, Playwright menunggu hingga elemen berstatus *visible*, *stable*, *enabled*, dan *receives pointer events*.
3. Keberadaan CSS `pointer-events: none` menyebabkan browser menolak menerima event pointer pada elemen tersebut.
4. Playwright terus melakukan polling menunggu elemen siap menerima event hingga batas waktu test habis (timeout 45 detik).

### C. Pembelajaran Teknis
AI sering memperlakukan `locator.click()` sebagai assertion implisit: "jika elemen tidak bisa diklik, maka pengujian berhasil". Padahal dalam framework modern, memaksa klik pada elemen yang dinonaktifkan oleh CSS browser akan membekukan test runner, bukan menghasilkan assertion gagal biasa. Solusi yang benar (diterapkan pada V2 dan V3) adalah memverifikasi computed style CSS dan melakukan klik koordinat mouse fisik visual (`page.mouse.click(x, y)`).

---

## 3. Analisis Kasus 2: Cacat *Type Narrowing* pada TypeScript Strict (V2)

### A. Gejala dan Manifestasi Kode
Pada baseline V2 (`experiments/v2/cinema-booking.v2.spec.ts`), AI mencoba memvalidasi payload request pembayaran backend:
```typescript
let capturedPaymentPayload: {
  showtimeId?: string;
  amount?: number;
  // ...
} | null = null;

await page.route('**/api/payments', async (route) => {
  capturedPaymentPayload = route.request().postDataJSON();
  await route.fulfill({ status: 201, ... });
});

// Pasca checkout:
expect(capturedPaymentPayload).not.toBeNull();
expect(capturedPaymentPayload.showtimeId).toBe(dummyShowtime._id);
```

### B. Akar Masalah Teknis
1. Variabel `capturedPaymentPayload` dideklarasikan dengan tipe union `T | null` dan diinisialisasi `null`.
2. Pengisian variabel terjadi di dalam closure callback `page.route()`, yang dianggap oleh compiler sebagai fungsi yang mungkin tidak dieksekusi secara sinkron dalam alur utama.
3. Ketika AI memanggil `expect(capturedPaymentPayload).not.toBeNull()`, compiler TypeScript tidak menganggap assertion Playwright sebagai *custom type guard* bawaan (seperti `typeof` atau `=== null`).
4. Pada mode `strictNullChecks`, compiler mempersempit tipe variabel menjadi `never`.
5. Akibatnya, pemanggilan properti `capturedPaymentPayload.showtimeId` memicu error fatal compiler:
   `error TS2339: Property 'showtimeId' does not exist on type 'never'`.

### C. Pembelajaran Teknis
Model AI sering memadukan pola assertion JavaScript dinamis ke dalam file TypeScript tanpa menyadari batasan sistem tipe statis (*flow-sensitive typing*). Pada V3, kelemahan ini diselesaikan dengan mengganti closure callback menjadi `page.waitForRequest()` sebelum aksi pemicu, ditambah type guard defensif eksplisit.

---

## 4. Analisis Kasus 3: Kelemahan Assertion Semantik pada Referensi Tiket

### A. Gejala dan Asumsi Semantik AI
Pada V1 dan V2, AI mengasumsikan bahwa nomor tiket yang ditampilkan pada halaman konfirmasi (`/booking-success`) terikat langsung dengan ID transaksi pembayaran yang dikembalikan oleh backend mock:
```typescript
// Asumsi AI V2:
await expect(successPage.refText).toContainText('#');
```

### B. Fakta Implementasi Frontend Aktual
Setelah source code aplikasi ditinjau (`frontend/src/pages/BookingSuccess.js` baris 57):
```javascript
<p className="ref-text">
  Booking Ref: <span>#{Math.floor(Math.random() * 1000000)}</span>
</p>
```
Nomor referensi tiket ternyata digenerate secara lokal menggunakan fungsi pseudorandom `Math.random()`, tanpa mengaitkan properti `_id` dari respons backend `/api/payments`.

### C. Pembelajaran Teknis
AI memiliki kecenderungan mengasumsikan sistem bekerja sesuai *best practice* industri (tiket terikat nomor transaksi database). Tanpa peninjauan kode manual, pengujian otomatis dapat memberikan ilusi kepatuhan (*false sense of security*). Di V3, assertion disesuaikan secara proporsional menggunakan regex `/^Booking Ref:\s*#\d{1,6}$/`, memvalidasi representasi visual riil tanpa mengklaim keunikan transaksi backend yang memang tidak ada.

---

## 5. Analisis Kasus 4: Deadlock Asinkron pada Dialog Modal Native (V3 Repeat)

### A. Gejala dan Manifestasi Kode
Pada baseline V3 (`experiments/v3/cinema-booking.v3.spec.ts`), AI menyusun penanganan dialog kegagalan HTTP 504:
```typescript
const dialogPromise = page.waitForEvent('dialog');
await paymentPage.submitPayment(); // Memanggil payButton.click()
const dialog = await dialogPromise;
await dialog.accept();
```

### B. Akar Masalah Teknis
1. Tombol `payButton` adalah elemen `<button type="submit">` di dalam formulir HTML.
2. Saat mengklik tombol submit formulir, Playwright secara internal menunggu status navigasi terjadwal tuntas: `waiting for scheduled navigations to finish`.
3. Karena mock API mengembalikan HTTP 504 secara instan, handler error React memicu `window.alert('Payment Failed: ...')`.
4. Dialog `alert` membekukan (*freeze*) thread peramban.
5. Akibatnya, `submitPayment()` tidak pernah resolve, dan baris `await dialog.accept()` di bawahnya tidak pernah dieksekusi.
6. Terjadi **kondisi deadlock**: runner menunggu dialog ditutup agar klik selesai, sementara script menunggu klik selesai sebelum menutup dialog.

### C. Mengapa Kegagalan Ini Lolos pada First Run?
Pada eksekusi pertama (*single run*), selisih mikrodetik *event loop* peramban memungkinkan pemeriksaan navigasi Playwright selesai tepat sebelum dialog membekukan thread. Cacat mematikan ini **hanya terdeteksi setelah dilakukan pengujian berulang (repeat testing)**. Solusi definitif adalah menjalankan penanganan dialog secara konkuren menggunakan `Promise.all`.

---

## 6. Peran Esensial Validasi Statis dan Peninjauan Manusia (*Human-in-the-Loop*)

Eksperimen ini membuktikan secara empiris bahwa otomasi berbantuan AI tidak dapat beroperasi secara otonom tanpa pengawasan teknis manusia (*human review*):

```
                   ALUR VALIDASI KUALITAS SKRIP AI
                   
 [Prompt Pengguna] ──> [Output Kode AI]
                              │
                              ▼
                 [Validasi Statis: tsc strict]
                     ├─ FAILED (Kasus V2: TS2339) ──> Perbaiki Pola Ketik
                     └─ PASSED ──┐
                                 ▼
                     [Runtime First Run: Playwright]
                         ├─ FAILED (Kasus V1: pointer-events) ──> Perbaiki Strategi Locator
                         └─ PASSED ──┐
                                     ▼
                         [Pengujian Berulang: 5-15x]
                             ├─ TIMEOUT (Kasus V3: Dialog Deadlock) ──> Perbaiki Asinkronitas
                             └─ PASSED ──┐
                                         ▼
                             [Review Semantik Manusia]
                                 └─ Validasi Kontrak Nyata (Kasus Regex Tiket Math.random)
```

---

## 7. Batasan Pernyataan dan Koreksi atas Klaim AI yang Berlebihan

Untuk menjaga standar kejujuran ilmiah:
1. **Tidak Ada Klaim "Zero Hallucination":** AI terbukti mengalami halusinasi perilaku pada Skenario 2 (mengasumsikan elemen `pointer-events: none` dapat diklik) dan Skenario 3 (mengasumsikan dialog modal dapat ditutup setelah `await click()` selesai).
2. **Tidak Ada Klaim "Production-Ready" atau "100% Bebas Flakiness":** Meskipun revisi V3 Dialog Fix lulus 15/15 pada sampel pengujian berulang, hal ini hanya membuktikan ketiadaan kegagalan pada sampel yang diamati, bukan jaminan stabilitas absolut di bawah variasi lingkungan lain.
3. **Pemisahan Dokumen AI dari Evaluasi Manusia:** Seluruh artefak dalam eksperimen ini dihasilkan dalam siklus berbantuan sistem AI dan dievaluasi berdasarkan data eksekusi aktual; dokumen ini mencatat fakta empiris tersebut tanpa menyamarkannya sebagai hasil audit manusia independen yang dilakukan di luar sesi ini.
