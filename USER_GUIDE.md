# User Guide Frontend CMS Payroll

Dokumen ini menjelaskan cara menggunakan frontend `cms.payroll` untuk operasional payroll. Nama menu dan tombol mengikuti tampilan aplikasi. Menu yang muncul dapat berbeda sesuai role dan permission user.

## 1. Ringkasan Aplikasi

Frontend CMS Payroll digunakan untuk:

- Mengelola data perusahaan.
- Mengelola data karyawan.
- Mengelola komponen payroll.
- Mengelola company benefit dan assignment benefit per karyawan.
- Mengelola attendance.
- Generate payroll, generate slip, download payroll, dan kirim slip melalui email.
- Melakukan pengecekan manual payroll sebelum payroll dianggap final.
- Mengelola user dan system settings.

Backend utama aplikasi adalah `core.payroll`, sedangkan frontend adalah `cms.payroll`.

## 2. Login dan Navigasi

1. Buka aplikasi frontend.
2. Masukkan email dan password.
3. Klik `Login`.
4. Setelah masuk, gunakan sidebar untuk membuka menu:
   - `Dashboard`
   - `Employee Management`
   - `Company Management`
   - `User Management`
   - `Payroll Components`
   - `Payroll Management`
   - `Attendance`
   - `Reports`
   - `System Settings`

Jika menu tidak muncul, kemungkinan user tidak memiliki permission untuk modul tersebut.

## 3. Format Data Umum

| Data | Format | Contoh |
| --- | --- | --- |
| Payroll period | `YYYYMM` | `202606` |
| Tampilan periode payroll | `MMM YYYY` | `Jun 2026` |
| Persentase benefit | Angka persen | `4`, `0.24`, `0.0001` |
| Percentage pada formula otomatis | Desimal | `0.01` berarti 1% |
| Amount | Nominal rupiah tanpa pemisah ribuan saat input | `5000000` |
| Password slip PDF | NIK karyawan | `317xxxxxxxxxxxxx` |

## 4. Alur Kerja Payroll Bulanan

Alur yang direkomendasikan:

1. Pastikan master company sudah benar di `Company Management`.
2. Pastikan payroll components sudah benar di `Payroll Components`.
3. Atur company benefit di detail company.
4. Pastikan employee sudah lengkap di `Employee Management`.
5. Aktifkan benefit karyawan yang berhak menerima benefit di tab `Benefit` pada detail employee.
6. Sync attendance untuk periode payroll di `Attendance`.
7. Generate payroll di `Payroll Management`.
8. Review hasil payroll di detail payroll.
9. Generate slip jika hasil payroll sudah benar.
10. Download payroll XLSX bila perlu untuk review.
11. Tandai payroll sebagai `Checked` secara manual setelah payroll divalidasi.
12. Kirim slip melalui email setelah payroll `Checked` dan slip file tersedia.

Catatan penting: download payroll tidak otomatis mengubah status menjadi `Checked`. Status `Checked` harus dilakukan manual oleh user.

## 5. Dashboard

Menu `Dashboard` menampilkan ringkasan aplikasi. Gunakan dashboard sebagai halaman awal untuk melihat kondisi umum data payroll.

## 6. Company Management

Menu: `/companies`

### 6.1 Melihat Daftar Company

Halaman daftar company menampilkan:

- ID company.
- Nama company.
- Kontak company.
- Status aktif/nonaktif.
- Tanggal dibuat dan tanggal diperbarui.

Gunakan pencarian dan filter status untuk menemukan company tertentu.

### 6.2 Sync Company

Klik tombol `Sync` untuk menarik data company dari sistem eksternal.

Setelah sync selesai:

- Company baru akan dibuat.
- Company existing akan diperbarui.
- Status company dapat ikut diperbarui sesuai response backend.

### 6.3 Tambah atau Edit Company

Gunakan tombol `Add Company` untuk membuat company baru jika tombol tersedia sesuai permission. Gunakan tombol edit pada baris company untuk mengubah data.

Data yang umum dikelola:

- Nama company.
- Alamat.
- Email.
- Telepon.
- Status aktif/nonaktif.

### 6.4 Company Benefit

Buka detail company, lalu gunakan panel `Company Benefits`.

Company benefit adalah benefit perusahaan seperti:

- `JKK`
- `JKM`
- `JHT Company`
- `BPJS Kesehatan Company`

Benefit ini akan masuk ke section `Benefits` pada payslip saat payroll digenerate, selama benefit aktif di company dan diaktifkan juga pada employee.

### 6.5 Field Company Benefit

| Field | Fungsi |
| --- | --- |
| `Benefit Name` | Label benefit yang tampil di payslip, contoh `JKK`. |
| `Benefit Type` | Kategori benefit untuk pengelompokan, contoh `BPJS`. Field ini tidak mengubah rumus. |
| `Base Component` | Dasar perhitungan benefit. Jika kosong, sistem memakai total earnings payroll. |
| `Employee %` | Porsi iuran karyawan. Nilainya disimpan sebagai employee amount. |
| `Employer %` | Porsi iuran perusahaan. Nilainya tampil sebagai benefit perusahaan di payslip. |
| `Max Base` | Batas maksimum dasar perhitungan. Kosong berarti tanpa plafon. |
| `Effective Date` | Tanggal mulai aturan benefit sebagai referensi konfigurasi. |
| `Expired Date` | Tanggal akhir aturan benefit sebagai referensi konfigurasi. |
| `Active` | Hanya benefit aktif yang bisa dihitung saat payroll digenerate. |
| `Taxable for PPH21` | Jika aktif, employer amount benefit menjadi tambahan bruto PPh21. |

### 6.6 Default Benefit untuk Employee

Ketika company benefit dibuat, sistem menyiapkan assignment benefit untuk employee di company tersebut dengan default `Inactive` atau `Disabled`.

Ketika employee baru dibuat atau disync, sistem juga menyiapkan daftar benefit company untuk employee tersebut dengan default `Inactive` atau `Disabled`.

Artinya:

- Company benefit adalah master aturan.
- Employee benefit menentukan apakah employee tersebut menerima benefit.
- Payroll hanya menghitung benefit yang aktif di company dan enabled di employee.

## 7. Employee Management

Menu: `/employees`

### 7.1 Melihat Daftar Employee

Daftar employee menampilkan data karyawan aktif secara operasional. Employee yang sudah dihapus dengan soft delete tidak ditampilkan di daftar ini dan tidak muncul di attendance.

Filter yang tersedia:

- Search berdasarkan nama, NIK, atau email.
- Company.
- PTKP yang sudah terisi pada data employee.

Gunakan tombol `Search` untuk menerapkan filter dan `Reset` untuk menghapus filter.

### 7.2 Sync Employee

Klik tombol `Sync` untuk menarik data employee dari sistem eksternal.

Saat sync:

- Employee baru akan dibuat.
- Employee existing akan diperbarui.
- Employee baru akan mendapatkan default payroll component dan default company benefit assignment.
- Company benefit assignment default adalah inactive sampai diaktifkan di tab `Benefit`.

### 7.3 Tambah dan Edit Employee

Gunakan `Add Employee` untuk membuat employee manual. Gunakan tombol edit pada detail employee untuk memperbarui data.

Data yang penting untuk payroll:

- Nama.
- NIK.
- Email.
- Company.
- Status active/inactive.
- PTKP.
- NPWP jika digunakan dalam perhitungan pajak.
- Komponen payroll employee.

### 7.4 Soft Delete Employee

Delete employee bersifat soft delete. Data tidak dihapus permanen dari database, tetapi employee tidak lagi ditampilkan pada list employee dan attendance.

Gunakan delete hanya jika employee tidak boleh ikut proses operasional payroll berikutnya.

### 7.5 Detail Employee

Menu detail employee memiliki tab:

- `Details`
- `Benefit`
- `Settings`

### 7.6 Tab Details

Tab `Details` menampilkan informasi utama employee.

Status employee dapat diubah langsung menggunakan switch active/inactive tanpa masuk ke mode edit.

### 7.7 Tab Benefit

Tab `Benefit` menampilkan company benefit yang tersedia untuk company employee tersebut.

Kolom penting:

- `Benefit`: nama benefit.
- `Base`: dasar perhitungan.
- `Employee %`: porsi karyawan.
- `Employer %`: porsi perusahaan.
- `Max Base`: plafon perhitungan.
- `Taxable`: apakah employer amount menjadi bruto PPh21.
- `Status`: enabled atau disabled untuk employee tersebut.

Gunakan toggle pada kolom `Status` untuk menentukan apakah employee menerima benefit tersebut.

Catatan:

- Jika company benefit inactive, toggle employee benefit tidak bisa digunakan.
- Benefit disabled tidak dihitung saat generate payroll.
- Benefit enabled baru masuk ke payroll setelah payroll digenerate ulang.

### 7.8 Tab Settings

Tab `Settings` menampilkan employee payroll components.

Komponen diurutkan:

1. `Earning`
2. `Deduction`

Penggunaan:

- Toggle status component untuk mengaktifkan atau menonaktifkan component pada employee.
- Component manual dapat diedit nominalnya.
- Component dengan calculation type `Automatic` tidak bisa diedit nominalnya dari employee settings. Nilainya dihitung sistem saat generate payroll.

## 8. Payroll Components

Menu: `/components`

Payroll component adalah master komponen payroll, seperti gaji pokok, tunjangan, potongan, BPJS, PPh21, bonus, atau incentive.

### 8.1 Daftar Component

Halaman daftar component mendukung:

- Search berdasarkan code, name, atau description.
- Filter type.
- Filter status.
- Filter category.
- View detail.
- Edit.
- Delete.

Jika component sudah dipakai pada payroll detail, employee component, atau relasi lain, delete dapat gagal karena foreign key. Untuk kasus tersebut, nonaktifkan component daripada menghapusnya.

### 8.2 Membuat Component

Buka `/components/create`, lalu isi data component.

Field umum:

| Field | Fungsi |
| --- | --- |
| `Code` | Kode unik component, contoh `GP`, `PPH21`, `BPJS-K`. |
| `Name` | Nama component yang mudah dibaca. |
| `Type` | `Earning` untuk penghasilan atau `Deduction` untuk potongan. |
| `Category` | Pengelompokan component. |
| `Amount` | Default nominal untuk component manual. |
| `Calculation Type` | `Manual` atau `Automatic`. |
| `Calculation Formula` | Rumus otomatis yang sudah didefinisikan. Muncul saat type automatic. |
| `Calculation Parameters` | Form parameter sesuai formula yang dipilih. |
| `Attendance Based` | Menandai component yang bergantung attendance jika tersedia. |
| `Active` | Hanya component aktif yang digunakan secara operasional. |

### 8.3 Calculation Type

`Manual`:

- Nominal berasal dari amount component atau employee component.
- Nominal bisa diedit pada employee settings.

`Automatic`:

- Nominal dihitung oleh sistem saat generate payroll.
- Field `Calculation Formula` wajib dipilih.
- Field `Calculation Parameters` berubah sesuai formula.
- Nominal tidak bisa diedit manual dari employee settings.

### 8.4 Base Components

Beberapa formula memiliki field `Base Components`.

Penggunaan:

- Pilih satu atau beberapa payroll component yang menjadi dasar perhitungan.
- Pilihan berasal dari payroll component yang sudah ada di master component.
- Sistem tidak menyediakan component dummy seperti `BONUS`, `BPJS-K`, atau lainnya jika component tersebut belum dibuat.
- Jika daftar kosong, buat payroll component yang dibutuhkan terlebih dahulu.

### 8.5 Formula: PPH 21

Formula: `PPH 21`

Parameter:

| Parameter | Fungsi |
| --- | --- |
| `Tax Method` | `TER` memakai tabel TER berdasarkan PTKP dan bruto bulanan. `Progressive` menghitung pajak tahunan dengan PTKP dan tarif progresif. |
| `Base Components` | Komponen earning yang menjadi dasar bruto PPh21, contoh gaji pokok, tunjangan tetap, bonus, overtime. |
| `Rounding` | Cara pembulatan pajak bulanan: `Nearest`, `Up`, atau `Down`. |
| `Apply NPWP Penalty` | Aktifkan jika karyawan tanpa NPWP dikenakan penalti 20%. |
| `NPWP Registered` | Status NPWP. Field muncul jika NPWP penalty aktif. Pilih `No` agar penalti diterapkan. |
| `Deductible Components` | Komponen deduction yang mengurangi bruto pada mode `Progressive`. |
| `Pension Components` | Komponen iuran pensiun tambahan pada mode `Progressive`. |
| `Additional Deduction` | Nominal pengurang bulanan tambahan pada mode `Progressive`. |
| `Months In Year` | Jumlah bulan annualisasi pada mode `Progressive`, biasanya `12`. |
| `Job Expense Max` | Batas biaya jabatan bulanan pada mode `Progressive`, default backend `500000`. |

Catatan PPh21:

- Pada mode `TER`, kategori PTKP employee menentukan tarif TER yang digunakan.
- Pada mode `Progressive`, sistem menghitung bruto tahunan, mengurangi PTKP, lalu menerapkan tarif progresif.
- Company benefit dengan `Taxable for PPH21` aktif akan menambah bruto PPh21 sebesar employer amount.
- PPh21 hanya dihitung jika component PPh21 aktif dan assigned pada employee.

### 8.6 Formula: BPJS Kesehatan

Formula: `BPJS Kesehatan`

Parameter:

| Parameter | Fungsi |
| --- | --- |
| `Base Components` | Komponen earning yang menjadi dasar iuran BPJS Kesehatan. Umumnya gaji pokok atau penghasilan tetap. |
| `Percentage` | Tarif iuran dalam format desimal. Contoh `0.01` berarti 1%. |
| `Max Base` | Plafon dasar perhitungan. Jika base melebihi nilai ini, sistem memakai `Max Base`. |

### 8.7 Formula: BPJS Ketenagakerjaan

Formula: `BPJS Ketenagakerjaan`

Parameter:

| Parameter | Fungsi |
| --- | --- |
| `Base Components` | Komponen earning yang menjadi dasar BPJS Ketenagakerjaan. Umumnya gaji pokok atau penghasilan tetap. |
| `Percentage` | Tarif iuran dalam format desimal. Contoh `0.02` berarti 2%. |
| `Max Base` | Plafon dasar perhitungan. Jika base melebihi nilai ini, sistem memakai `Max Base`. |

### 8.8 Formula: OT MDS Horeca Internet Allowance

Formula: `OT MDS Horeca Internet Allowance`

Parameter:

| Parameter | Fungsi |
| --- | --- |
| `Minimum Working Days` | Minimum actual working days dalam periode payroll agar allowance dibayarkan. Jika kurang, hasil 0. |
| `Override Amount` | Nominal allowance saat syarat terpenuhi. Kosongkan untuk memakai amount dari employee component. |

### 8.9 Formula: Sampling Incentive

Formula: `Sampling Incentive`

Parameter:

| Parameter | Fungsi |
| --- | --- |
| `Daily Cap` | Batas maksimum incentive per hari. |
| `General Threshold` | Minimum jumlah produk unik sampling harian agar incentive general diberikan. |
| `Relaunch Threshold` | Minimum total sampling produk relaunch harian agar incentive relaunch diberikan. |
| `Relaunch Unique Min` | Minimum produk relaunch unik harian yang harus terpenuhi bersama relaunch threshold. |

## 9. Attendance

Menu: `/attendance`

Attendance digunakan sebagai data dasar komponen yang membutuhkan hari kerja, hadir, absen, atau izin.

### 9.1 Daftar Attendance

Halaman attendance mendukung:

- Search.
- Filter payroll period.
- Filter employee.
- Add attendance manual jika permission tersedia.
- Edit attendance.
- Delete attendance.
- Sync attendance dari sistem eksternal.

Employee yang sudah soft delete tidak ditampilkan pada attendance.

### 9.2 Field Attendance

| Field | Fungsi |
| --- | --- |
| `Employee` | Karyawan pemilik attendance. |
| `Payroll Period` | Periode payroll format `YYYYMM`. |
| `Total Working Days` | Jumlah hari kerja standar. |
| `Actual Working Days` | Jumlah hari hadir aktual. |
| `Absent Days` | Jumlah hari absen. |
| `Permit Days` | Jumlah hari izin jika tersedia dari data backend. |

### 9.3 Sync External Attendance

1. Klik `Sync External` atau tombol sync attendance.
2. Masukkan payroll period, contoh `202606`.
3. Klik submit.
4. Aplikasi menampilkan konfirmasi periode.
5. Konfirmasi sync.

Validasi:

- Payroll period wajib diisi.
- Format harus `YYYYMM`.

Jika hasil sync sukses tetapi data tidak muncul:

- Pastikan filter periode di halaman attendance sesuai.
- Pastikan employee tidak soft delete.
- Pastikan backend menerima data attendance, bukan hanya status sync eksternal.
- Cek log backend untuk payload attendance bulk jika diperlukan.

## 10. Payroll Management

Menu: `/payroll`

Payroll Management digunakan untuk generate payroll, review hasil, generate slip, download payroll, dan kirim email slip.

### 10.1 Filter Payroll

Filter yang tersedia:

- Search berdasarkan nama, email, atau NIK employee.
- Company dropdown.
- Period dropdown.

Klik `Search` untuk menerapkan filter. Klik reset untuk menghapus filter.

### 10.2 Generate Payroll Individual

1. Klik `Generate Payroll`.
2. Cari employee berdasarkan nama, email, atau NIK.
3. Pilih employee dari suggestion.
4. Isi payroll period format `YYYYMM`.
5. Klik generate.

Jika payroll sudah `Checked`, generate ulang akan ditolak sampai payroll dibuka kembali untuk koreksi.

### 10.3 Generate Payroll dari Baris Payroll

Pada baris payroll tertentu, gunakan tombol generate/regenerate jika tersedia.

Fungsi ini berguna untuk:

- Generate ulang employee tertentu.
- Memperbarui hasil setelah ada perubahan component, attendance, benefit, atau data employee.

### 10.4 Generate Mass Payroll

1. Klik `Generate Mass Payroll`.
2. Isi payroll period.
3. Jalankan proses.

Catatan:

- Mass generate hanya menyimpan payroll yang hasil net pay-nya lebih dari 0.
- Employee dengan net pay 0 atau minus akan dilewati sesuai aturan backend.
- Employee yang payroll-nya sudah `Checked` tidak boleh digenerate ulang.

### 10.5 Generate Slip

Gunakan `Generate Slip` untuk membuat PDF payslip.

Slip PDF diproteksi dengan password NIK employee. Jika NIK kosong, backend dapat menolak pembuatan slip karena slip harus diproteksi.

### 10.6 Generate Mass Slip

Gunakan `Generate Mass Slip` untuk membuat slip banyak employee pada periode tertentu.

Pastikan payroll sudah digenerate sebelum menjalankan mass slip.

### 10.7 Download Slip

Download slip tersedia jika payroll sudah memiliki `slip_url`.

Jika tombol download belum aktif:

- Generate slip terlebih dahulu.
- Pastikan file slip berhasil dibuat di backend.

### 10.8 Download Payroll XLSX

Gunakan `Download Payroll` untuk mengunduh file payroll.

Input yang dibutuhkan:

- Company.
- Payroll period.

Catatan penting:

- Download payroll tidak mengubah `is_printed` menjadi true.
- Download payroll bukan tanda final.
- Finalisasi dilakukan dengan manual check oleh user.

### 10.9 Manual Check Payroll

Status payroll:

| Status | Arti |
| --- | --- |
| `Needs check` | Payroll belum divalidasi manual. |
| `Checked` | Payroll sudah divalidasi manual dan terkunci dari regenerate. |
| `Emailed` | Slip sudah dikirim email. |

Gunakan tombol check pada baris payroll untuk menandai payroll sebagai `Checked`.

Gunakan tombol reopen jika payroll perlu diperbaiki dan status masih boleh dibuka. Setelah reopen, lakukan generate ulang bila ada perubahan data.

Aturan operasional:

- Review detail payroll sebelum `Checked`.
- Jangan email slip sebelum payroll benar.
- Email slip membutuhkan payroll `Checked` dan slip file tersedia.
- Download XLSX tidak otomatis membuat payroll `Checked`.

### 10.10 Email Slip Individual

Gunakan tombol email pada baris payroll atau detail payroll.

Syarat umum:

- Payroll sudah `Checked`.
- Slip file tersedia.
- Employee memiliki email.

Email slip menyertakan informasi password slip. Password slip adalah NIK employee.

### 10.11 Send Mass Email

Gunakan `Send Mass Email` untuk mengirim slip banyak employee pada company dan periode tertentu.

Sebelum mass email:

- Pastikan payroll sudah benar.
- Pastikan payroll yang akan dikirim sudah `Checked`.
- Pastikan slip file sudah digenerate.
- Pastikan email employee terisi.

### 10.12 Payroll Detail

Buka detail payroll untuk melihat:

- Nama employee.
- NIK.
- Company.
- Email employee.
- Company email.
- Status payroll.
- Earnings.
- Deductions.
- Benefits.
- Summary.
- Net pay.

Section `Benefits` menampilkan:

- Nama benefit.
- Type.
- Base amount.
- Employee percentage.
- Employer percentage.
- Employee amount.
- Employer amount.
- Taxable amount.
- Total benefit.

Total benefit pada payslip dan detail ditampilkan sebagai ringkasan benefit perusahaan/karyawan sesuai hasil generate payroll.

## 11. Reports

Menu `Reports`, `Payroll Report`, dan `Employee Report` masih berupa placeholder di frontend saat dokumen ini dibuat. Gunakan `Payroll Management`, `Download Payroll`, dan detail payroll sebagai alur laporan operasional utama.

## 12. User Management

Menu: `/users`

User Management digunakan untuk mengelola akun aplikasi.

Fitur umum:

- Melihat daftar user.
- Membuat user.
- Melihat detail user.
- Edit user.
- Aktif/nonaktifkan user.
- Mengubah password user.

Field penting:

| Field | Fungsi |
| --- | --- |
| `Firstname` | Nama depan user. |
| `Lastname` | Nama belakang user. |
| `Email` | Digunakan untuk login. |
| `Phone` | Nomor telepon user. |
| `Role` | `Administrator` atau `Member`. |
| `Company` | Company user, terutama untuk role member jika dibatasi company. |
| `Status Account` | Aktif/nonaktif user. |
| `Password` | Wajib saat membuat user baru. |

Password user minimal mengikuti validasi frontend, yaitu minimal 8 karakter pada form user.

## 13. System Settings

Menu: `/settings`

System Settings digunakan oleh admin untuk mengelola konfigurasi aplikasi.

Fitur:

- Search setting berdasarkan key.
- Filter status.
- Tambah setting.
- Edit value dan deskripsi setting.
- Aktif/nonaktifkan setting.
- Delete setting.

Field:

| Field | Fungsi |
| --- | --- |
| `Key` | Nama konfigurasi, contoh `payroll.cutoff_date`. Tidak bisa diubah saat edit. |
| `Value` | Nilai konfigurasi. |
| `Description` | Penjelasan setting. |
| `Status` | Aktif/nonaktif setting. |

Ubah setting hanya jika memahami dampaknya ke proses payroll.

## 14. PPh21 dan Company Benefit

Perhitungan PPh21 pada payroll memperhatikan:

- Base components dari formula PPh21.
- PTKP employee.
- Tax method yang dipilih.
- Rounding.
- NPWP penalty jika diaktifkan.
- Deductible dan pension components jika memakai mode progressive.
- Company benefit yang `Taxable for PPH21` dan enabled pada employee.

Company benefit taxable akan masuk sebagai tambahan bruto PPh21 sebesar employer amount. Company benefit non-taxable tetap bisa tampil pada benefit, tetapi tidak menambah bruto PPh21.

## 15. Kapan Payroll Benefits Terisi

Tabel payroll benefits terisi saat payroll digenerate.

Data yang disalin ke payroll benefits berasal dari:

- Company benefit aktif.
- Employee benefit assignment yang enabled.
- Base component atau total earnings sebagai dasar perhitungan.
- Persentase employee dan employer.
- Max base jika diisi.
- Taxable setting.

Jika benefit baru dibuat atau status benefit employee diubah, generate ulang payroll agar hasil payroll benefits ikut berubah.

## 16. Istilah Penting

| Istilah | Arti |
| --- | --- |
| `Employee %` | Persentase porsi karyawan untuk benefit. |
| `Employer %` | Persentase porsi perusahaan untuk benefit. |
| `Taxable for PPH21` | Employer benefit menjadi tambahan bruto PPh21. |
| `Base Component` | Component yang menjadi dasar hitung formula atau benefit. |
| `Manual Component` | Component dengan nominal manual. |
| `Automatic Component` | Component yang dihitung sistem berdasarkan formula. |
| `Needs check` | Payroll belum divalidasi manual. |
| `Checked` | Payroll sudah divalidasi manual dan terkunci dari regenerate. |
| `Soft delete` | Data tidak dihapus permanen, tetapi disembunyikan dari proses operasional. |

## 17. Troubleshooting

### 17.1 Component Tidak Bisa Dihapus

Penyebab umum:

- Component sudah dipakai pada payroll details.
- Component sudah dipakai pada employee component.
- Component menjadi base component formula atau benefit.

Solusi:

- Nonaktifkan component jika tidak ingin dipakai ke depan.
- Hindari menghapus component yang sudah pernah masuk payroll.

### 17.2 Benefit Tidak Muncul di Payslip

Cek:

- Company benefit active.
- Employee benefit enabled pada tab `Benefit`.
- Payroll sudah digenerate setelah benefit diaktifkan.
- Employee berada pada company yang benar.
- Base component memiliki amount atau total earnings tersedia.

### 17.3 PPh21 Bernilai 0

Cek:

- Component PPh21 aktif.
- Component PPh21 assigned dan enabled pada employee.
- Formula PPh21 sudah dipilih.
- Base components PPh21 terisi.
- Employee memiliki PTKP.
- Bruto berada pada lapisan tarif yang memang menghasilkan PPh21.
- Company benefit taxable sudah aktif jika benefit harus masuk bruto PPh21.

### 17.4 Search Payroll Tidak Menemukan Nama

Cek:

- Search diketik di field search utama.
- Klik tombol `Search`.
- Filter company atau period tidak membatasi hasil.
- Nama, email, atau NIK employee sesuai data backend.

### 17.5 Attendance Sync Sukses tetapi Data Tidak Muncul

Cek:

- Period filter di attendance sesuai periode sync.
- Data attendance benar-benar masuk ke backend.
- Employee tidak soft delete.
- Employee masih aktif secara operasional.
- Payload external attendance menggunakan array data yang diterima backend.

### 17.6 Slip Tidak Bisa Dibuka

Gunakan NIK employee sebagai password PDF slip.

Jika tetap gagal:

- Pastikan NIK tidak kosong.
- Generate slip ulang setelah data NIK diperbaiki.
- Pastikan file slip yang dibuka adalah file terbaru.

### 17.7 Payroll Sudah Checked tetapi Perlu Diperbaiki

Gunakan reopen jika tombol tersedia dan backend mengizinkan. Setelah reopen:

1. Perbaiki data sumber, seperti attendance, component, benefit, atau employee.
2. Generate payroll ulang.
3. Review detail payroll.
4. Generate slip ulang jika diperlukan.
5. Tandai `Checked` kembali setelah valid.

## 18. Checklist Operasional Sebelum Email Slip

Sebelum mengirim slip:

- Payroll period benar.
- Company benar.
- Employee benar.
- Earnings sudah sesuai.
- Deductions sudah sesuai.
- Benefits sudah sesuai.
- PPh21 sudah sesuai.
- Net pay sudah sesuai.
- Slip PDF sudah digenerate.
- Payroll sudah `Checked`.
- Email employee terisi.

Setelah semua poin terpenuhi, gunakan email individual atau mass email sesuai kebutuhan.
