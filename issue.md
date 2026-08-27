# Issue: Persist Filter Dashboard dan List Page di Frontend

## Informasi Umum

- Backend: `core.payroll`
- Frontend: `cms.payroll`
- Area kerja utama: frontend
- Tujuan: filter pada dashboard dan halaman list tidak kembali ke default ketika user meninggalkan halaman lalu kembali lagi.

## Latar Belakang

Saat ini dashboard dan beberapa halaman list di frontend menyimpan filter hanya di state React halaman. Ketika user pindah halaman, misalnya masuk ke detail/form atau membuka menu lain, komponen halaman ter-mount ulang dan filter kembali ke nilai default.

Perubahan yang dibutuhkan adalah menyimpan filter terakhir per halaman, lalu memakainya lagi saat halaman tersebut dibuka kembali.

## Scope Halaman

### 1. Dashboard `/dashboard`

File utama yang perlu dicek:

- `src/modules/dashboard/pages/Dashboard.js`

Filter yang harus dipertahankan:

- Company
- Periode mulai
- Periode akhir

### 2. Employees `/employees`

File utama yang perlu dicek:

- `src/modules/employees/pages/EmployeeList.js`

Filter yang harus dipertahankan:

- Search
- Company
- Rows / jumlah data per halaman

### 3. Companies `/companies`

File utama yang perlu dicek:

- `src/modules/companies/pages/CompanyList.js`

Filter yang harus dipertahankan:

- Search
- Status: semua status, active, nonaktif
- Rows / jumlah data per halaman jika halaman sudah menyediakan pilihan rows

### 4. Users `/users`

File utama yang perlu dicek:

- `src/modules/users/pages/UserList.js`

Filter yang harus dipertahankan:

- Search
- Status: semua status, active, nonaktif
- Rows / jumlah data per halaman jika halaman sudah menyediakan pilihan rows

### 5. Components `/components`

File utama yang perlu dicek:

- `src/modules/components/pages/ComponentList.js`

Filter yang harus dipertahankan:

- Search
- Tipe component
- Status
- Kategori

### 6. Payroll `/payroll`

File utama yang perlu dicek:

- `src/modules/payroll/pages/PayrollList.js`

Filter yang harus dipertahankan:

- Search
- Company
- Period
- Rows / jumlah data per halaman jika halaman sudah menyediakan pilihan rows

### 7. Attendance `/attendance`

File utama yang perlu dicek:

- `src/modules/attendance/pages/AttendanceList.js`

Filter yang harus dipertahankan:

- Search
- Rows / jumlah data per halaman jika halaman sudah menyediakan pilihan rows

## Perilaku yang Diharapkan

1. Ketika user mengubah filter di halaman list, nilai filter tersebut disimpan.
2. Ketika user pindah ke halaman lain lalu kembali ke halaman list yang sama, filter terakhir otomatis terisi lagi.
3. Data list yang dimuat mengikuti filter terakhir, bukan filter default.
4. Filter setiap halaman harus terpisah. Contoh: filter `/employees` tidak boleh memengaruhi filter `/users`.
5. Tombol reset atau clear filter tetap mengembalikan filter halaman tersebut ke default dan ikut memperbarui penyimpanan filter.
6. Pagination sebaiknya kembali ke page pertama saat filter utama berubah, kecuali sudah ada behavior existing yang berbeda dan memang harus dipertahankan.

## Rekomendasi Pendekatan

Gunakan penyimpanan di sisi browser agar filter tetap ada selama user masih memakai aplikasi.

Pilihan yang disarankan:

- `sessionStorage` jika filter cukup bertahan selama tab browser masih terbuka.
- `localStorage` jika filter perlu tetap ada walaupun browser/tab ditutup dan dibuka lagi.

Rekomendasi awal: gunakan `sessionStorage`, karena kebutuhan yang disebutkan adalah meninggalkan halaman lalu kembali lagi dalam sesi penggunaan aplikasi.

Buat key storage yang spesifik per halaman, misalnya:

```text
cms.payroll.filters.employees
cms.payroll.filters.companies
cms.payroll.filters.users
cms.payroll.filters.components
cms.payroll.filters.payroll
cms.payroll.filters.attendance
cms.payroll.filters.dashboard
```

Jika pola penyimpanan filter akan dipakai di banyak halaman, implementer boleh membuat helper/hook kecil agar logic baca/tulis storage tidak berulang. Tetap ikuti gaya kode existing di project.

## Catatan Implementasi

1. Baca filter dari storage saat inisialisasi state halaman.
2. Validasi nilai dari storage sebelum dipakai, terutama untuk angka seperti `rows` atau `pageSize`.
3. Simpan hanya data filter yang dibutuhkan, jangan simpan response API atau data list.
4. Jangan menyimpan data sensitif.
5. Pastikan nilai default tetap dipakai jika storage kosong, rusak, atau berisi format lama.
6. Jika ada state input search dan state search yang sudah diterapkan, keduanya perlu diselaraskan agar input yang terlihat user sama dengan filter yang dipakai request.
7. Jangan mengubah kontrak API backend kecuali ditemukan bug yang memang berasal dari backend.

## Acceptance Criteria

1. Di `/dashboard`, filter company, periode mulai, dan periode akhir tetap ada setelah user meninggalkan halaman lalu kembali.
2. Di `/employees`, filter search, company, dan rows tetap ada setelah user meninggalkan halaman lalu kembali.
3. Di `/companies`, filter search dan status tetap ada setelah user meninggalkan halaman lalu kembali.
4. Di `/users`, filter search dan status tetap ada setelah user meninggalkan halaman lalu kembali.
5. Di `/components`, filter search, tipe component, status, dan kategori tetap ada setelah user meninggalkan halaman lalu kembali.
6. Di `/payroll`, filter search, company, dan period tetap ada setelah user meninggalkan halaman lalu kembali.
7. Di `/attendance`, filter search tetap ada setelah user meninggalkan halaman lalu kembali.
8. Reset filter pada masing-masing halaman mengembalikan nilai ke default dan filter lama tidak muncul lagi saat halaman dibuka kembali.
9. Filter antar halaman tidak saling tertukar atau saling memengaruhi.
10. Request data dashboard dan list tetap memakai parameter filter yang benar sesuai nilai terakhir.
11. Loading state, error handling, pagination, dan tampilan existing tetap berjalan normal.

## Skenario Test

Detail unit test tidak perlu terlalu rinci. Minimal skenario yang harus dicek:

1. Set filter company dan periode di `/dashboard`, pindah ke menu lain, lalu kembali ke `/dashboard`.
2. Set filter di `/employees`, pindah ke halaman detail/form atau menu lain, lalu kembali ke `/employees`.
3. Set filter status di `/companies`, pindah halaman, lalu kembali ke `/companies`.
4. Set filter status di `/users`, pindah halaman, lalu kembali ke `/users`.
5. Set kombinasi filter di `/components`, pindah halaman, lalu kembali ke `/components`.
6. Set filter company dan period di `/payroll`, pindah halaman, lalu kembali ke `/payroll`.
7. Set search di `/attendance`, pindah halaman, lalu kembali ke `/attendance`.
8. Klik reset filter di setiap halaman yang terdampak, pindah halaman, lalu kembali dan pastikan filter tetap default.
9. Pastikan filter `/dashboard` tidak muncul di `/employees`, `/companies`, `/users`, atau halaman lain.
10. Refresh browser setelah filter disimpan dan pastikan behavior sesuai pilihan storage yang digunakan.
11. Uji kondisi storage berisi data tidak valid dan pastikan halaman tetap memakai default tanpa crash.

## Batasan Scope

- Tidak perlu perubahan backend untuk requirement ini.
- Tidak perlu redesign UI.
- Tidak perlu membuat instruksi unit test terlalu detail; cukup pastikan skenario utama di atas tercakup.
- Tidak perlu menyimpan data tabel, cukup simpan filter dan pilihan pagination yang relevan.
