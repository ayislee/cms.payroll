# Issue: Ubah Input Payroll Period Menjadi Date Picker

## Informasi Umum

- Backend: `core.payroll`
- Frontend: `cms.payroll`
- Area kerja utama: frontend
- Halaman terdampak:
  - `/dashboard`
  - `/payroll`

## Tujuan

Mengganti input periode payroll yang saat ini masih berupa text/manual `YYYYMM` menjadi date picker agar user tidak perlu mengetik format periode secara manual.

Secara backend, format periode yang dikirim tetap mengikuti kontrak existing yaitu `YYYYMM`, misalnya `202608`. Perubahan ini diutamakan di sisi frontend dengan konversi nilai date picker sebelum request dikirim ke API.

## Latar Belakang

Saat ini beberapa input periode masih memakai text input dengan instruksi format `YYYYMM`. Ini rawan salah input, misalnya user mengetik jumlah digit kurang, urutan bulan salah, atau karakter selain angka.

Dengan date picker, user cukup memilih periode melalui UI. Aplikasi tetap menyimpan dan mengirim periode ke backend dalam format yang sudah dipakai sistem.

## Scope Implementasi

### 1. Dashboard `/dashboard`

File utama yang perlu dicek:

- `src/modules/dashboard/pages/Dashboard.js`
- `src/utils/formatters.js`

Perubahan yang diharapkan:

1. Input `Periode Mulai` dan `Periode Akhir` pada filter dashboard diganti dari text input menjadi date picker periode.
2. Karena periode payroll berbentuk bulanan, implementer disarankan memakai picker bulan, misalnya native input `type="month"` jika tetap menggunakan `CFormInput`.
3. Nilai default `Periode Mulai` dan `Periode Akhir` menggunakan periode berjalan.
4. Periode berjalan mengikuti bulan dan tahun tanggal saat user membuka halaman, lalu dikonversi menjadi format payroll period `YYYYMM`.
5. Saat klik `Terapkan`, value yang dikirim ke endpoint dashboard tetap:
   - `period_start=YYYYMM`
   - `period_end=YYYYMM`
6. Saat klik `Reset`, filter kembali ke default periode berjalan, bukan dikosongkan.
7. Label/ringkasan periode dashboard tetap tampil user-friendly, misalnya memakai helper `formatPayrollPeriod`.

Catatan teknis:

- `src/utils/formatters.js` sudah memiliki helper `getCurrentPayrollPeriod()`, `formatPayrollPeriod()`, dan `parsePayrollPeriod()`.
- Jika input UI memakai format native `YYYY-MM`, siapkan helper kecil untuk konversi:
  - date picker value `YYYY-MM` ke API value `YYYYMM`
  - API value `YYYYMM` ke date picker value `YYYY-MM`
- Hindari mengubah kontrak API dashboard kecuali benar-benar diperlukan.

### 2. Payroll `/payroll`

File utama yang perlu dicek:

- `src/modules/payroll/pages/PayrollList.js`
- `src/modules/payroll/services/payrollService.js`
- `src/utils/formatters.js`

Flow yang wajib diubah field `Payroll Period`-nya menjadi date picker:

1. Tombol `Generate Payroll`
   - Modal generate payroll dari tombol utama.
   - Field `Payroll Period` saat ini memakai text input.
   - Saat submit, payload ke `payrollService.generatePayroll(...)` tetap memakai format `YYYYMM`.

2. Tombol `Generate Mass Payroll`
   - Modal mass generate payroll.
   - Field `Payroll Period` diganti menjadi date picker.
   - Saat submit, payload ke `payrollService.generateMassPayroll(...)` tetap memakai format `YYYYMM`.

3. Tombol `Generate Mass Slip`
   - Modal mass slip.
   - Field `Payroll Period` diganti menjadi date picker.
   - Saat submit, payload ke `payrollService.generateMassSlip(...)` tetap memakai format `YYYYMM`.

4. Tombol `Download Payroll`
   - Modal download payroll.
   - Field `Payroll Period` diganti menjadi date picker.
   - Saat download, parameter periode ke `payrollService.downloadPayroll(...)` tetap memakai format `YYYYMM`.

Perilaku default yang diharapkan:

- Saat modal dibuka dari tombol utama, field `Payroll Period` default ke periode berjalan.
- Jika modal ditutup lalu dibuka lagi, periode kembali ke periode berjalan kecuali ada alasan UX yang lebih tepat untuk mempertahankan input terakhir.
- Untuk flow yang dibuka dari row payroll existing, jika periode row sudah tersedia, gunakan periode row tersebut sebagai nilai awal.

Catatan scope:

- Permintaan utama hanya mencakup `Generate Payroll`, `Generate Mass Payroll`, `Generate Mass Slip`, dan `Download Payroll`.
- Jika implementer menemukan field periode lain di `/payroll`, seperti generate slip per row atau mass email, boleh dibuat konsisten memakai helper yang sama, tetapi jangan memperbesar scope jika tidak diperlukan.
- Filter period di tabel payroll saat ini menggunakan dropdown period options. Tidak wajib diubah kecuali ada instruksi lanjutan.

## Rekomendasi Pendekatan

1. Buat helper konversi periode agar logic tidak tersebar:
   - `payrollPeriodToPickerValue(period)` untuk `YYYYMM` menjadi `YYYY-MM`.
   - `pickerValueToPayrollPeriod(value)` untuk `YYYY-MM` menjadi `YYYYMM`.
   - `getCurrentPayrollPickerValue()` jika diperlukan untuk default date picker.
2. Simpan state sesuai kebutuhan UI:
   - Boleh menyimpan state dalam format picker `YYYY-MM`, lalu konversi saat submit.
   - Atau tetap menyimpan format `YYYYMM`, lalu konversi saat render input. Pilih salah satu dan jaga konsistensi.
3. Validasi tetap memastikan periode yang dikirim ke service adalah `YYYYMM`.
4. Jangan mengubah `payrollService` jika service sudah menerima periode `YYYYMM` dengan benar.
5. Pastikan loading/disabled state existing tetap berjalan saat request diproses.
6. Update helper text di UI agar tidak lagi meminta user mengetik `YYYYMM`.

## Acceptance Criteria

1. Di `/dashboard`, field `Periode Mulai` dan `Periode Akhir` menggunakan date picker/periode picker, bukan text input manual.
2. Di `/dashboard`, default `Periode Mulai` dan `Periode Akhir` adalah periode berjalan.
3. Di `/dashboard`, request ke backend tetap mengirim `period_start` dan `period_end` dalam format `YYYYMM`.
4. Di `/dashboard`, tombol `Reset` mengembalikan periode ke periode berjalan.
5. Di `/payroll`, modal `Generate Payroll` memakai date picker untuk `Payroll Period`.
6. Di `/payroll`, modal `Generate Mass Payroll` memakai date picker untuk `Payroll Period`.
7. Di `/payroll`, modal `Generate Mass Slip` memakai date picker untuk `Payroll Period`.
8. Di `/payroll`, modal `Download Payroll` memakai date picker untuk `Payroll Period`.
9. Semua request payroll tetap mengirim periode dalam format `YYYYMM`.
10. Error handling, loading state, disabled state, dan toast existing tetap berjalan seperti sebelumnya.
11. Tidak ada perubahan kontrak backend yang tidak diperlukan.

## Skenario Test

Detail implementasi test tidak perlu dibuat terlalu rinci. Minimal skenario yang harus dicek:

1. Buka `/dashboard`, pastikan periode mulai dan akhir otomatis terisi periode berjalan.
2. Ubah periode dashboard melalui date picker, klik `Terapkan`, pastikan data dashboard dimuat dengan periode yang dipilih.
3. Klik `Reset` di dashboard, pastikan periode kembali ke periode berjalan.
4. Buka modal `Generate Payroll`, pilih employee, pilih periode melalui date picker, lalu generate payroll.
5. Buka modal `Generate Mass Payroll`, pilih periode melalui date picker, lalu jalankan mass generate.
6. Buka modal `Generate Mass Slip`, pilih periode melalui date picker, lalu generate slip massal.
7. Buka modal `Download Payroll`, pilih periode dan company, lalu download payroll.
8. Pastikan periode yang diterima backend di semua flow tetap berbentuk `YYYYMM`.
9. Pastikan validasi required tetap muncul jika periode belum dipilih.
10. Pastikan UI tetap normal saat request loading dan setelah request selesai.

## Catatan untuk Implementer

- Jangan mengirim format `YYYY-MM` ke backend.
- Jangan mengubah endpoint backend hanya untuk kebutuhan date picker.
- Jangan hardcode periode berjalan. Gunakan tanggal saat runtime.
- Pastikan perubahan tetap mengikuti gaya komponen CoreUI yang sudah dipakai di project.
- Jika memakai native `type="month"`, browser akan menampilkan picker bulan sesuai dukungan browser masing-masing.
