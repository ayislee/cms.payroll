// ========================================
// PAYROLL SYSTEM CONSTANTS
// ========================================

export const COMPONENT_TYPES = {
  EARNING: 'Earning',
  DEDUCTION: 'Deduction'
};

export const CALCULATION_TYPES = {
  FIXED: 'fixed',
  AUTO: 'auto',
  PERCENTAGE: 'percentage',
  CUSTOM: 'custom'
};

export const PTKP_OPTIONS = [
  { value: 'TK0', label: 'TK/0 - Tidak Kawin tanpa tanggungan' },
  { value: 'TK1', label: 'TK/1 - Tidak Kawin dengan 1 tanggungan' },
  { value: 'TK2', label: 'TK/2 - Tidak Kawin dengan 2 tanggungan' },
  { value: 'TK3', label: 'TK/3 - Tidak Kawin dengan 3 tanggungan' },
  { value: 'K0', label: 'K/0 - Kawin tanpa tanggungan' },
  { value: 'K1', label: 'K/1 - Kawin dengan 1 tanggungan' },
  { value: 'K2', label: 'K/2 - Kawin dengan 2 tanggungan' },
  { value: 'K3', label: 'K/3 - Kawin dengan 3 tanggungan' }
];

export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  CALCULATED: 'calculated',
  APPROVED: 'approved',
  PRINTED: 'printed',
  PAID: 'paid'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LEAVE: 'leave',
  SICK: 'sick',
  PERMISSION: 'permission'
};

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
};

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_OPTIONS = MONTH_NAMES.map((month, index) => ({
  value: String(index + 1).padStart(2, '0'),
  label: month
}));

export const YEAR_OPTIONS = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  return years;
};

export const PAYROLL_PERIOD_FORMAT = 'YYYYMM';

export const DEFAULT_COMPONENTS = {
  EARNINGS: [
    { code: 'GP', name: 'Gaji Pokok', type: COMPONENT_TYPES.EARNING, calculation_type: CALCULATION_TYPES.FIXED },
    { code: 'TJ_JABATAN', name: 'Tunjangan Jabatan', type: COMPONENT_TYPES.EARNING, calculation_type: CALCULATION_TYPES.FIXED },
    { code: 'TJ_TRANSPORT', name: 'Tunjangan Transport', type: COMPONENT_TYPES.EARNING, calculation_type: CALCULATION_TYPES.FIXED },
    { code: 'TJ_MAKAN', name: 'Tunjangan Makan', type: COMPONENT_TYPES.EARNING, calculation_type: CALCULATION_TYPES.FIXED },
    { code: 'LEMBUR', name: 'Lembur', type: COMPONENT_TYPES.EARNING, calculation_type: CALCULATION_TYPES.AUTO }
  ],
  DEDUCTIONS: [
    { code: 'BPJS_TK', name: 'BPJS Tenaga Kerja', type: COMPONENT_TYPES.DEDUCTION, calculation_type: CALCULATION_TYPES.AUTO },
    { code: 'BPJS_K', name: 'BPJS Kesehatan', type: COMPONENT_TYPES.DEDUCTION, calculation_type: CALCULATION_TYPES.AUTO },
    { code: 'PPH21', name: 'PPh 21', type: COMPONENT_TYPES.DEDUCTION, calculation_type: CALCULATION_TYPES.AUTO },
    { code: 'ALPHA', name: 'Potongan Alpha', type: COMPONENT_TYPES.DEDUCTION, calculation_type: CALCULATION_TYPES.AUTO },
    { code: 'PINJAMAN', name: 'Pinjaman Karyawan', type: COMPONENT_TYPES.DEDUCTION, calculation_type: CALCULATION_TYPES.FIXED }
  ]
};

export const TABLE_COLUMNS = {
  EMPLOYEES: [
    { key: 'nik', label: 'NIK', sortable: true },
    { key: 'name', label: 'Nama Karyawan', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'company_name', label: 'Perusahaan', sortable: true },
    { key: 'ptkp', label: 'PTKP', sortable: false },
    { key: 'hire_date', label: 'Tanggal Masuk', sortable: true },
    { key: 'actions', label: 'Aksi', sortable: false }
  ],
  COMPANIES: [
    { key: 'code', label: 'Kode', sortable: true },
    { key: 'name', label: 'Nama Perusahaan', sortable: true },
    { key: 'address', label: 'Alamat', sortable: false },
    { key: 'phone', label: 'Telepon', sortable: false },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'is_active', label: 'Status', sortable: true },
    { key: 'actions', label: 'Aksi', sortable: false }
  ],
  COMPONENTS: [
    { key: 'code', label: 'Kode', sortable: true },
    { key: 'name', label: 'Nama Komponen', sortable: true },
    { key: 'type', label: 'Tipe', sortable: true },
    { key: 'calculation_type', label: 'Tipe Kalkulasi', sortable: true },
    { key: 'attendance_based', label: 'Berbasis Absensi', sortable: true },
    { key: 'is_active', label: 'Status', sortable: true },
    { key: 'actions', label: 'Aksi', sortable: false }
  ],
  PAYROLL: [
    { key: 'employee_name', label: 'Nama Karyawan', sortable: true },
    { key: 'payroll_periode', label: 'Periode', sortable: true },
    { key: 'gross_pay', label: 'Gaji Kotor', sortable: true },
    { key: 'total_deduction', label: 'Total Potongan', sortable: true },
    { key: 'net_pay', label: 'Gaji Bersih', sortable: true },
    { key: 'is_printed', label: 'Status Print', sortable: true },
    { key: 'actions', label: 'Aksi', sortable: false }
  ],
  USERS: [
    { key: 'firstname', label: 'Nama Depan', sortable: true },
    { key: 'lastname', label: 'Nama Belakang', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'type', label: 'Tipe User', sortable: true },
    { key: 'is_active', label: 'Status', sortable: true },
    { key: 'actions', label: 'Aksi', sortable: false }
  ]
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+62|62|0)8[1-9][0-9]{6,9}$/,
  NIK: /^[0-9]{16}$/,
  EMPLOYEE_CODE: /^[A-Z0-9]{3,10}$/,
  COMPANY_CODE: /^[A-Z0-9]{2,5}$/,
  COMPONENT_CODE: /^[A-Z_0-9]{2,10}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

export const ERROR_MESSAGES = {
  REQUIRED: 'Field ini wajib diisi',
  EMAIL_INVALID: 'Format email tidak valid',
  PHONE_INVALID: 'Format nomor telepon tidak valid',
  NIK_INVALID: 'NIK harus 16 digit angka',
  PASSWORD_WEAK: 'Password minimal 8 karakter dengan kombinasi huruf besar, kecil, dan angka',
  CODE_INVALID: 'Kode hanya boleh mengandung huruf dan angka',
  DATE_INVALID: 'Format tanggal tidak valid',
  NUMBER_INVALID: 'Harus berupa angka',
  MIN_LENGTH: (min) => `Minimal ${min} karakter`,
  MAX_LENGTH: (max) => `Maksimal ${max} karakter`,
  DUPLICATE_DATA: 'Data sudah ada sebelumnya',
  NETWORK_ERROR: 'Terjadi kesalahan koneksi',
  SERVER_ERROR: 'Terjadi kesalahan server',
  UNAUTHORIZED: 'Anda tidak memiliki akses untuk melakukan aksi ini',
  NOT_FOUND: 'Data tidak ditemukan'
};

export default {
  COMPONENT_TYPES,
  CALCULATION_TYPES,
  PTKP_OPTIONS,
  PAYROLL_STATUS,
  ATTENDANCE_STATUS,
  EXPORT_FORMATS,
  MONTH_NAMES,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  PAYROLL_PERIOD_FORMAT,
  DEFAULT_COMPONENTS,
  TABLE_COLUMNS,
  VALIDATION_RULES,
  ERROR_MESSAGES
};
