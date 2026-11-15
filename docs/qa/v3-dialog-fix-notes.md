# Catatan Teknis Revisi Terisolasi: Penanganan Sinkronisasi Dialog (V3 Dialog Fix)

Dokumen ini mencatat dasar bukti empiris, diagnosis teknis, perubahan kode, dan batasan validasi untuk revisi terisolasi di direktori `experiments/v3-dialog-fix/`.

---

## A. Status Dokumen dan Artefak

* **Status:** Generated, **belum divalidasi statis (typecheck) maupun runtime (eksekusi pengujian)**.
* **Target Direktori:** `experiments/v3-dialog-fix/`
* **File Utama:** `experiments/v3-dialog-fix/cinema-booking.v3-dialog-fix.spec.ts` beserta modul POM di `experiments/v3-dialog-fix/pages/`.
* **Prinsip Isolasi:** Direktori `experiments/v3/`, `experiments/v2/`, dan `experiments/v1/` tidak diubah sama sekali.

---

## B. Bukti Kegagalan Empiris yang Menjadi Dasar Revisi

Pada pengujian berulang terbatas (*repeat run*, Run ID: `20261115-234716`) dengan konfigurasi `repeatEach: 5`, diperoleh hasil:
* **Total Instance:** 15 eksekusi.
* **Hasil:** 14 passed, 1 timedOut (Skenario 3, `repeatEachIndex: 1`, eksekusi urutan ke-6).
* **Gejala Kegagalan:** Test melampaui batas waktu 45 detik (*timeout 45000ms exceeded*).
* **Pesan Error Runner:**
  ```text
  Test timeout of 45000ms exceeded.
  Error: dialog.accept: Target page, context or browser has been closed
    at experiments/v3/cinema-booking.v3.spec.ts:399:18
  ```
* **Bukti Rekaman Artefak:**
  * File trace: `artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/trace.zip`
  * Konteks error: `artifacts/execution/v3-repeat/20261115-234716/test-results/cinema-booking.v3-Eksperim-7df99-diarahkan-ke-halaman-sukses-Chromium-repeat1/error-context.md`

---

## C. Diagnosis Teknis dan Tingkat Kepastian

### 1. Bukti dari Trace Log
Dari analisis log aksi internal pada file `trace.zip` (`1-trace.trace`):
1. Aksi `Frame.click` dipanggil pada elemen `button.pay-btn` (`<button type="submit" class="pay-btn">PAY NOW</button>`).
2. Log Playwright mencatat:
   ```text
   performing click action
   click action done
   waiting for scheduled navigations to finish
   ```
3. Mock route mengembalikan respons `HTTP 504 Gateway Timeout`.
4. Komponen React `PaymentPage.js` (baris 121) menangkap error pada blok catch dan secara sinkron memanggil `alert('Payment Failed: ...')`.
5. Event dialog native browser tercatat:
   ```json
   {
     "type": "event",
     "method": "dialog",
     "params": {
       "type": "alert",
       "message": "Payment Failed: Gateway Timeout: Payment processing took too long"
     }
   }
   ```
6. Setelah event dialog muncul, thread JavaScript halaman browser membeku (*paused*) oleh dialog modal alert.
7. Aksi `Frame.click` yang sedang menunggu `waiting for scheduled navigations to finish` tidak dapat selesai sebelum dialog modal ditutup.
8. Tidak ada aktivitas pengujian lanjutan yang terekam hingga *After Hooks* menutup context browser saat timeout 45 detik tercapai.

### 2. Diagnosis Mekanisme Deadlock (Tingkat Kepastian: Tinggi)
* Pada implementasi V3 asli:
  ```typescript
  // 1. Waiter dipasang
  const dialogPromise = page.waitForEvent('dialog');

  // 2. Klik tombol submit ditunggu sampai selesai
  await paymentPage.submitPayment();

  // 3. Dialog diambil dan di-accept
  const dialog = await dialogPromise;
  await dialog.accept();
  ```
* **Mekanisme Deadlock:**
  * Pemanggilan `await paymentPage.submitPayment()` (yang membungkus `await payButton.click()`) menunggu konfirmasi bahwa navigasi yang dipicu oleh form submit telah selesai atau dibatalkan.
  * Ketika `window.alert()` terbuka, dialog modal tersebut mencegah event loop halaman memproses status navigasi tersebut.
  * Akibatnya, `submitPayment()` tidak pernah resolve, dan baris berikutnya (`const dialog = await dialogPromise; await dialog.accept();`) tidak pernah dieksekusi.
  * Terjadi kondisi saling tunggu: Playwright menunggu dialog ditutup agar klik submit selesai, sementara skrip pengujian menunggu klik submit selesai sebelum menutup dialog.

---

## D. Mengapa Waiter Dialog Saja Belum Cukup

Pola `const dialogPromise = page.waitForEvent('dialog')` memang mencegah event dialog terlewat (*missed event*). Namun, jika pemanggilan `await dialogPromise` dan `await dialog.accept()` ditempatkan secara **sekuensial setelah** `await paymentPage.submitPayment()`, waiter tersebut tetap tidak aktif menyelesaikan dialog selama eksekusi terhenti di baris `await paymentPage.submitPayment()`.

Oleh karena itu, penanganan dialog (`dialog.accept()`) harus mampu berjalan **secara konkuren saat aksi klik masih berada dalam status pending**.

---

## E. Perubahan Kode dan Rationale Sinkronisasi Konkuren

Pada file `experiments/v3-dialog-fix/cinema-booking.v3-dialog-fix.spec.ts`, baris penanganan dialog direvisi sebagai berikut:

```typescript
// 1. Siapkan penanganan dialog secara asinkron dan konkuren sebelum aksi submit
let capturedDialogMessage = '';
const dialogHandlerPromise = page.waitForEvent('dialog').then(async (dialog) => {
  try {
    capturedDialogMessage = dialog.message();
  } finally {
    await dialog.accept();
  }
  return dialog;
});

// 2. Jalankan submit pembayaran dan penanganan dialog secara bersamaan (konkuren)
await Promise.all([
  dialogHandlerPromise,
  paymentPage.submitPayment(),
]);

// 3. Verifikasi pesan dialog setelah dialog aman ditutup
expect(capturedDialogMessage).toContain('Payment Failed');
expect(capturedDialogMessage).toContain('Gateway Timeout');
```

### Rationale Teknis:
1. **Konkurensi Aksi:** Dengan melampirkan rantai `.then(async (dialog) => ...)` pada `page.waitForEvent('dialog')`, segera setelah browser memancarkan event `dialog`, handler langsung membaca pesan dan mengeksekusi `await dialog.accept()`, meskipun `paymentPage.submitPayment()` masih berada dalam fase `waiting for scheduled navigations to finish`.
2. **Pelepasan Deadlock:** Segera setelah `dialog.accept()` menutup modal alert, event loop halaman browser kembali aktif, Playwright menyelesaikan verifikasi navigasi form submit, dan `submitPayment()` resolve. Keduanya selesai melalui `Promise.all`.
3. **Pencegahan Modal Menggantung (*Fail-safe Cleanup*):** Pembacaan pesan dibungkus dalam blok `try ... finally { await dialog.accept(); }`. Jika assertion pesan ditempatkan setelah `Promise.all`, kegagalan assertion teks tidak akan meninggalkan modal dialog terbuka di browser.
4. **Propagasi Error yang Bersih:** Tidak ada penanganan error kosong (`catch {}`). Jika terjadi timeout atau error pada event dialog maupun klik submit, `Promise.all` akan langsung melempar error asli ke test runner.
5. **Cakupan Terisolasi:** `page.waitForEvent('dialog')` hanya mendengarkan satu kali kemunculan dialog dan otomatis membersihkan listener-nya, mencegah efek samping (*leakage*) ke pengujian berikutnya.

---

## F. Daftar Seluruh Perbedaan dari V3 Asli

| Lokasi / File | Implementasi V3 Asli | Implementasi V3 Dialog Fix | Rationale |
|---|---|---|---|
| **Direktori Modul** | `experiments/v3/pages/` | `experiments/v3-dialog-fix/pages/` | Isolasi total; file Page Object disalin mandiri agar tidak bergantung pada direktori V3. |
| **Import Spec** | `from './pages/...'` di `experiments/v3/` | `from './pages/...'` di `experiments/v3-dialog-fix/` | Resolusi lokal ke modul POM di dalam `experiments/v3-dialog-fix/pages/`. |
| **Deskripsi Suite** | `'Eksperimen V3 - Pengujian Pemesanan Tiket Bioskop (Refined)'` | `'Eksperimen V3 (Dialog Fix) - Pengujian Pemesanan Tiket Bioskop'` | Membedakan pelaporan eksekusi pada runner Playwright. |
| **Skenario 1 (Happy Path)** | Identik | Identik | Tidak ada dialog; seluruh alur, mock, dan assertion dipertahankan persis. |
| **Skenario 2 (Kursi Booked)** | Identik | Identik | Tidak ada dialog; seluruh interaksi koordinat mouse fisik dipertahankan persis. |
| **Skenario 3 (HTTP 504): Penanganan Dialog** | Sekuensial: `const dialog = await dialogPromise; await dialog.accept();` dipanggil setelah `await paymentPage.submitPayment();` | Konkuren: `Promise.all([dialogHandlerPromise, paymentPage.submitPayment()])` dengan `finally { await dialog.accept(); }` | Mengeliminasi deadlock saat tombol submit form memicu modal alert sebelum klik submit selesai. |
| **Skenario 3: Assertion UI & Endpoint** | Dipertahankan identik | Dipertahankan identik | Assertion tombol kembali enabled (`PAY NOW`), URL tetap di checkout, heading sukses tersembunyi, dan `bookSeatsCallCount === 0` tidak diubah. |

---

## G. Mengapa Revisi Belum Boleh Dianggap Berhasil Sebelum Diuji

1. **Hipotesis vs Bukti Empiris:** Perubahan ini didasarkan pada analisis log trace dan pemahaman teoritis arsitektur Playwright. Namun, tanpa validasi runtime dan pengujian berulang aktual pada peramban, efektivitas perbaikan ini masih berstatus **hipotesis yang terarah**, bukan fakta empiris terverifikasi.
2. **Potensi Efek Samping Runtime:** Meskipun secara konseptual `Promise.all` menyelesaikan deadlock klik vs dialog, pengujian aktual tetap diperlukan untuk memastikan tidak ada perubahan perilaku pada event loop React atau Playwright di lingkungan Windows headless.
3. **Integritas Batasan Eksperimen:** Sesuai batasan instruksi, tahap ini dibatasi secara ketat pada **generasi kode dan dokumentasi**. Validasi statis (*typecheck*) dan runtime tidak dijalankan pada turn ini.
