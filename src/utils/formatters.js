// ========================================
// FORMATTING UTILITIES
// ========================================

import config from '../config/environment';

// Format currency in Indonesian Rupiah
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = 'IDR',
    locale = config.datetime.locale,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

// Format number with thousand separators
export const formatNumber = (number, options = {}) => {
  const {
    locale = config.datetime.locale,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(number);
};

// Format date
export const formatDate = (date, format = config.datetime.dateFormat) => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '-';

  // Simple format mapping
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD MMM YYYY':
      return dateObj.toLocaleDateString(config.datetime.locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    case 'DD MMMM YYYY':
      return dateObj.toLocaleDateString(config.datetime.locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    default:
      return `${day}/${month}/${year}`;
  }
};

// Format datetime
export const formatDateTime = (datetime, format = config.datetime.datetimeFormat) => {
  if (!datetime) return '-';
  
  const dateObj = new Date(datetime);
  if (isNaN(dateObj.getTime())) return '-';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'DD/MM/YYYY HH:mm:ss':
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    case 'DD/MM/YYYY HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    default:
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
};

// Format time
export const formatTime = (time) => {
  if (!time) return '-';
  
  const timeObj = new Date(`2000-01-01T${time}`);
  if (isNaN(timeObj.getTime())) return '-';

  const hours = String(timeObj.getHours()).padStart(2, '0');
  const minutes = String(timeObj.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

// Format payroll period (YYYYMM to readable format)
export const formatPayrollPeriod = (period) => {
  const normalized = String(period || '').trim();

  if (!/^\d{6}$/.test(normalized)) return '-';
  
  const year = normalized.substring(0, 4);
  const month = normalized.substring(4, 6);
  const monthIndex = parseInt(month, 10) - 1;
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthName = monthNames[monthIndex];
  if (!monthName) return normalized;
  
  return `${monthName} ${year}`;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Indonesian phone number
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+62${cleaned.substring(1)}`;
  } else if (cleaned.startsWith('8')) {
    return `+62${cleaned}`;
  }
  
  return phone;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

// Format status badge text
export const formatStatus = (status) => {
  if (!status) return '-';
  
  const statusMap = {
    'active': 'Aktif',
    'inactive': 'Tidak Aktif',
    'true': 'Ya',
    'false': 'Tidak',
    'printed': 'Sudah Dicetak',
    'not_printed': 'Belum Dicetak',
    'admin': 'Administrator',
    'user': 'User',
    'hr': 'HR',
    'finance': 'Finance',
    'manager': 'Manager',
    'Earning': 'Pendapatan',
    'Deduction': 'Potongan',
    'fixed': 'Tetap',
    'auto': 'Otomatis',
    'percentage': 'Persentase',
    'custom': 'Custom'
  };
  
  return statusMap[status] || status;
};

// Format component type badge
export const getStatusBadgeVariant = (status) => {
  const variantMap = {
    'active': 'success',
    'inactive': 'secondary',
    'true': 'success',
    'false': 'secondary',
    'printed': 'success',
    'not_printed': 'warning',
    'admin': 'danger',
    'user': 'primary',
    'hr': 'info',
    'finance': 'warning',
    'manager': 'dark',
    'Earning': 'success',
    'Deduction': 'danger',
    'fixed': 'primary',
    'auto': 'info',
    'percentage': 'warning',
    'custom': 'dark'
  };
  
  return variantMap[status] || 'secondary';
};

// Parse payroll period from readable format
export const parsePayrollPeriod = (year, month) => {
  const paddedMonth = String(month).padStart(2, '0');
  return `${year}${paddedMonth}`;
};

// Get current payroll period
export const getCurrentPayrollPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

// Convert payroll period (YYYYMM) to month picker value (YYYY-MM)
export const payrollPeriodToPickerValue = (period) => {
  const normalized = String(period || '').trim();

  if (!/^\d{6}$/.test(normalized)) {
    return '';
  }

  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}`;
};

// Convert month picker value (YYYY-MM) to payroll period (YYYYMM)
export const pickerValueToPayrollPeriod = (value) => {
  const normalized = String(value || '').trim();

  if (/^\d{6}$/.test(normalized)) {
    return normalized;
  }

  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    return '';
  }

  return normalized.replace('-', '');
};

// Get current month picker value from current payroll period
export const getCurrentPayrollPickerValue = () => {
  return payrollPeriodToPickerValue(getCurrentPayrollPeriod());
};

// Format validation errors
export const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object') {
    return Object.values(errors).flat().join(', ');
  }
  
  return errors || 'Validation error';
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatTime,
  formatPayrollPeriod,
  formatFileSize,
  formatPercentage,
  formatPhoneNumber,
  truncateText,
  formatStatus,
  getStatusBadgeVariant,
  parsePayrollPeriod,
  getCurrentPayrollPeriod,
  payrollPeriodToPickerValue,
  pickerValueToPayrollPeriod,
  getCurrentPayrollPickerValue,
  formatValidationErrors
};
