// ========================================
// ATTENDANCE LIST PAGE
// ========================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CAlert,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CForm,
  CFormInput,
  CFormSelect,
  CFormLabel,
  CFormFeedback,
  CInputGroup,
  CInputGroupText,
  CListGroup,
  CListGroupItem,
  CCollapse,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge,
  CProgress,
  CProgressBar
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSearch,
  cilFilter,
  cilTrash,
  cilPen,
  cilPlus,
  cilCalendar,
  cilPeople,
  cilSpeedometer,
  cilWarning,
  cilLoopCircular
} from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import {
  formatPayrollPeriod,
  formatDate as formatDisplayDate,
  payrollPeriodToPickerValue,
  pickerValueToPayrollPeriod
} from '../../../utils/formatters';
import attendanceService from '../services/attendanceService';
import employeeService from '../../employees/services/employeeService';
import { readSessionFilter, writeSessionFilter, normalizePageSize } from '../../../utils/filterPersistence';

const ATTENDANCE_FILTER_STORAGE_KEY = 'cms.payroll.filters.attendance';
const ATTENDANCE_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const createDefaultAttendanceFilters = () => ({
  search: '',
  payroll_periode: '',
  employee_id: '',
  pageSize: 10,
  showFilters: false
});

const readAttendanceFilters = () =>
  readSessionFilter(ATTENDANCE_FILTER_STORAGE_KEY, createDefaultAttendanceFilters(), (filters, fallback) => {
    const payrollPeriod = String(filters.payroll_periode || '').trim();
    const employeeId = String(filters.employee_id || '').trim();

    return {
      search: String(filters.search || ''),
      payroll_periode: payrollPeriod === '' || /^\d{6}$/.test(payrollPeriod)
        ? payrollPeriod
        : fallback.payroll_periode,
      employee_id: employeeId === '' || /^\d+$/.test(employeeId)
        ? employeeId
        : fallback.employee_id,
      pageSize: normalizePageSize(filters.pageSize, fallback.pageSize, ATTENDANCE_PAGE_SIZE_OPTIONS),
      showFilters: Boolean(filters.showFilters || payrollPeriod || employeeId)
    };
  });

const normalizeDateInputValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return '';
  }

  const normalizedDate = stringValue.includes('T') || stringValue.includes(' ')
    ? new Date(stringValue)
    : new Date(`${stringValue}T00:00:00`);

  if (Number.isNaN(normalizedDate.getTime())) {
    return stringValue.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(stringValue)
      ? stringValue.slice(0, 10)
      : stringValue;
  }

  const localDate = new Date(normalizedDate.getTime() - (normalizedDate.getTimezoneOffset() * 60000));
  return localDate.toISOString().slice(0, 10);
};

const AttendanceList = () => {
  const persistedFilters = useMemo(() => readAttendanceFilters(), []);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(() => persistedFilters.pageSize);
  const [searchTerm, setSearchTerm] = useState(() => persistedFilters.search);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(() => persistedFilters.search);
  const [showFilters, setShowFilters] = useState(() => persistedFilters.showFilters);
  const [filters, setFilters] = useState({
    payroll_periode: persistedFilters.payroll_periode,
    employee_id: persistedFilters.employee_id
  });
  const [appliedFilters, setAppliedFilters] = useState({
    payroll_periode: persistedFilters.payroll_periode,
    employee_id: persistedFilters.employee_id
  });
  const initialFormState = {
    employee_id: '',
    payroll_periode: '',
    total_working_days: '',
    absent_days: '',
    actual_working_days: '',
    overtime_hour_days: '',
    overtime_hours: '',
    overtime_minutes: '',
    overtime_work_days: '',
    cutoff_start_date: '',
    cutoff_end_date: ''
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeFetchError, setEmployeeFetchError] = useState('');
  const [selectedEmployeeLabel, setSelectedEmployeeLabel] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeSearchContainerRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAttendanceId, setCurrentAttendanceId] = useState(null);
  const [deletingAttendanceId, setDeletingAttendanceId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteAttendance, setPendingDeleteAttendance] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncPeriod, setSyncPeriod] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [pendingSyncPeriod, setPendingSyncPeriod] = useState('');
  const searchInputRef = useRef(null);

  const summaryMetrics = useMemo(() => {
    if (!Array.isArray(attendances) || attendances.length === 0) {
      return {
        totalWorkingDays: 0,
        actualWorkingDays: 0,
        absentDays: 0,
        attendanceRate: 0,
        uniqueEmployees: 0
      };
    }

    const uniqueEmployeeIds = new Set();
    let totalWorkingDays = 0;
    let totalActualDays = 0;
    let totalAbsentDays = 0;

    attendances.forEach((attendance) => {
      uniqueEmployeeIds.add(attendance.employee_id);

      const workingDays = Number(attendance.total_working_days) || 0;
      const actualDays = Number(attendance.actual_working_days) || 0;
      const absentDays = Number(attendance.absent_days) || 0;

      totalWorkingDays += workingDays;
      totalActualDays += actualDays;
      totalAbsentDays += absentDays;
    });

    const attendanceRate =
      totalWorkingDays > 0 ? Math.round((totalActualDays / totalWorkingDays) * 100) : 0;

    return {
      totalWorkingDays,
      actualWorkingDays: totalActualDays,
      absentDays: totalAbsentDays,
      attendanceRate,
      uniqueEmployees: uniqueEmployeeIds.size
    };
  }, [attendances]);

  useDocumentTitle('Attendance List');

  const loadAttendances = async () => {
    try {
      setLoading(true);

      const trimmedSearch = appliedSearchTerm.trim();
      const trimmedPeriod = appliedFilters.payroll_periode.trim();
      const trimmedEmployeeId = appliedFilters.employee_id.trim();

      const serviceParams = {
        page: currentPage,
        rows: pageSize
      };

      if (trimmedSearch) {
        serviceParams.search = trimmedSearch;
      }
      if (trimmedPeriod) {
        serviceParams.payroll_periode = trimmedPeriod;
      }
      if (trimmedEmployeeId) {
        serviceParams.employee_id = trimmedEmployeeId;
      }

      const response = await attendanceService.getAttendances(serviceParams);
      
      if (response) {
        setAttendances(response.data || []);
        const pages = response.pages || 1;
        const total = response.total || 0;
        setTotalPages(pages);
        setTotalRecords(total);
      } else {
        setAttendances([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error loading attendances:', error);
      setError(error.message || 'Failed to load attendances');
      setAttendances([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Load attendances when page, page size, or applied search term changes
  useEffect(() => {
    loadAttendances();
  }, [
    currentPage,
    pageSize,
    appliedSearchTerm,
    appliedFilters.payroll_periode,
    appliedFilters.employee_id
  ]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle search input change without triggering immediate search
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleFilters = () => {
    const nextShowFilters = !showFilters;
    setShowFilters(nextShowFilters);
    writeSessionFilter(ATTENDANCE_FILTER_STORAGE_KEY, {
      search: appliedSearchTerm,
      ...appliedFilters,
      pageSize,
      showFilters: nextShowFilters
    });
  };

  const handleOpenSyncModal = () => {
    if (syncLoading) {
      return;
    }
    const defaultPeriod =
      (filters.payroll_periode || '').trim() ||
      (appliedFilters.payroll_periode || '').trim();

    setSyncPeriod(payrollPeriodToPickerValue(defaultPeriod));
    setSyncError('');
    setShowSyncModal(true);
    setShowSyncConfirm(false);
    setPendingSyncPeriod('');
  };

  const handleCloseSyncModal = () => {
    if (syncLoading) {
      return;
    }
    setShowSyncModal(false);
    setSyncError('');
    setPendingSyncPeriod('');
  };

  const handleSyncSubmit = (e) => {
    e.preventDefault();
    if (syncLoading) {
      return;
    }

    const trimmedPeriod = pickerValueToPayrollPeriod(syncPeriod);

    if (!trimmedPeriod) {
      setSyncError('Payroll period is required.');
      return;
    }

    if (!trimmedPeriod) {
      setSyncError('Please select a payroll period.');
      return;
    }

    setSyncError('');
    setPendingSyncPeriod(trimmedPeriod);
    setShowSyncModal(false);
    setShowSyncConfirm(true);
  };

  const handleCancelSyncConfirm = () => {
    if (syncLoading) {
      return;
    }

    setShowSyncConfirm(false);
    if (pendingSyncPeriod) {
      setSyncPeriod(payrollPeriodToPickerValue(pendingSyncPeriod));
    }
    setSyncError('');
    setPendingSyncPeriod('');
    setShowSyncModal(true);
  };

  const handleConfirmSync = async () => {
    const period = (pendingSyncPeriod || syncPeriod || '').trim();

    if (!period) {
      return;
    }

    try {
      setSyncLoading(true);
      await attendanceService.syncExternal({
        payroll_period: period
      });
      setSuccessMessage('Attendance synchronization requested successfully.');
      setPendingSyncPeriod('');
      setShowSyncConfirm(false);
      setSyncPeriod('');
      setSyncError('');
      await loadAttendances();
    } catch (error) {
      console.error('Error syncing attendance:', error);
      setSyncError(error.message || 'Failed to synchronize attendance.');
      setSyncPeriod(payrollPeriodToPickerValue(period));
      setPendingSyncPeriod('');
      setShowSyncConfirm(false);
      setShowSyncModal(true);
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle search form submission - only time we hit the API
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextSearch = searchTerm.trim();
    const nextFilters = {
      payroll_periode: filters.payroll_periode.trim(),
      employee_id: filters.employee_id.trim()
    };

    setSearchTerm(nextSearch);
    setFilters(nextFilters);
    setAppliedSearchTerm(nextSearch);
    setAppliedFilters(nextFilters);
    setCurrentPage(1);
    writeSessionFilter(ATTENDANCE_FILTER_STORAGE_KEY, {
      search: nextSearch,
      ...nextFilters,
      pageSize,
      showFilters
    });
  };

  // Remove the auto-search debounce effect completely
  // We only want to search when user explicitly submits

  const resetFilters = () => {
    const defaultFilters = createDefaultAttendanceFilters();
    setSearchTerm(defaultFilters.search);
    setAppliedSearchTerm(defaultFilters.search);
    setFilters({
      payroll_periode: defaultFilters.payroll_periode,
      employee_id: defaultFilters.employee_id
    });
    setAppliedFilters({
      payroll_periode: defaultFilters.payroll_periode,
      employee_id: defaultFilters.employee_id
    });
    setPageSize(defaultFilters.pageSize);
    setShowFilters(defaultFilters.showFilters);
    setCurrentPage(1);
    writeSessionFilter(ATTENDANCE_FILTER_STORAGE_KEY, defaultFilters);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
    writeSessionFilter(ATTENDANCE_FILTER_STORAGE_KEY, {
      search: appliedSearchTerm,
      ...appliedFilters,
      pageSize: size,
      showFilters
    });
  };

  const resolvePeriodLabel = (period) => {
    const normalized = String(period || '').trim();

    if (/^\d{6}$/.test(normalized)) {
      const formattedPeriod = formatPayrollPeriod(normalized);

      return {
        formatted: formattedPeriod && formattedPeriod !== '-' ? formattedPeriod : normalized,
        raw: normalized
      };
    }

    if (normalized) {
      return {
        formatted: normalized,
        raw: normalized
      };
    }

    return {
      formatted: '-',
      raw: '-'
    };
  };

  const formatCreatedAt = (timestamp) => {
    if (!timestamp) {
      return '-';
    }

    return formatDisplayDate(timestamp, 'DD MMM YYYY');
  };

  const calculateAttendanceRate = (attendance) => {
    const totalDays = Number(attendance?.total_working_days) || 0;
    const actualDays = Number(attendance?.actual_working_days) || 0;

    if (totalDays <= 0) {
      return 0;
    }

    return Math.round((actualDays / totalDays) * 100);
  };

  const resolveAttendanceRateColor = (rate) => {
    if (rate >= 90) {
      return 'success';
    }
    if (rate >= 75) {
      return 'warning';
    }
    return 'danger';
  };

  const handleEmployeeSearchChange = (event) => {
    const { value } = event.target;
    setEmployeeSearchTerm(value);
    setSelectedEmployeeLabel('');
    setIsEmployeeDropdownOpen(true);
    setAddFormData((prev) => ({
      ...prev,
      employee_id: ''
    }));
  };

  const handleOpenAddModal = () => {
    setAddFormData({ ...initialFormState });
    setFormErrors({});
    setModalError('');
    setEmployeeOptions([]);
    setEmployeeSearchTerm('');
    setEmployeeFetchError('');
    setSelectedEmployeeLabel('');
    setIsEmployeeDropdownOpen(false);
    setEmployeeLoading(false);
    setIsEditMode(false);
    setCurrentAttendanceId(null);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    if (formSubmitting) {
      return;
    }
    setShowAddModal(false);
    setFormErrors({});
    setModalError('');
    setEmployeeSearchTerm('');
    setEmployeeOptions([]);
    setEmployeeFetchError('');
    setSelectedEmployeeLabel('');
    setIsEmployeeDropdownOpen(false);
    setEmployeeLoading(false);
    setIsEditMode(false);
    setCurrentAttendanceId(null);
  };

  const resetDeleteState = () => {
    setShowDeleteModal(false);
    setPendingDeleteAttendance(null);
    setDeletingAttendanceId(null);
  };

  const syncConfirmPeriod = (pendingSyncPeriod || syncPeriod || '').trim();
  const syncConfirmPeriodInfo = syncConfirmPeriod
    ? resolvePeriodLabel(syncConfirmPeriod)
    : null;

  const handleOpenEditModal = (attendance) => {
    if (!attendance) {
      return;
    }

    setIsEditMode(true);
    setCurrentAttendanceId(attendance.attendance_id);
    setFormErrors({});
    setModalError('');
    setEmployeeFetchError('');
    setEmployeeSearchTerm('');
    setSelectedEmployeeLabel(attendance.employee?.name
      ? `${attendance.employee_id} - ${attendance.employee.name}`
      : attendance.employee_id?.toString() || '');
    setEmployeeOptions(attendance.employee_id
      ? [{
        value: attendance.employee_id.toString(),
        label: attendance.employee?.name
          ? `${attendance.employee_id} - ${attendance.employee.name}`
          : attendance.employee_id.toString()
      }]
      : []);
    setAddFormData({
      employee_id: attendance.employee_id?.toString() || '',
      payroll_periode: attendance.payroll_periode?.toString() || '',
      total_working_days: attendance.total_working_days?.toString() || '',
      absent_days: attendance.absent_days == null ? '0' : attendance.absent_days.toString(),
      actual_working_days: attendance.actual_working_days?.toString() || '',
      overtime_hour_days: attendance.overtime_hour_days?.toString() || '0',
      overtime_hours: attendance.overtime_hours?.toString() || '0',
      overtime_minutes: attendance.overtime_minutes?.toString() || '0',
      overtime_work_days: attendance.overtime_work_days?.toString() || '0',
      cutoff_start_date: normalizeDateInputValue(attendance.cutoff_start_date),
      cutoff_end_date: normalizeDateInputValue(attendance.cutoff_end_date)
    });
    setShowAddModal(true);
  };

  const handleAddInputChange = (event) => {
    const { name, value } = event.target;
    let sanitizedValue = value;

    if ([
      'employee_id',
      'total_working_days',
      'absent_days',
      'actual_working_days',
      'overtime_hour_days',
      'overtime_hours',
      'overtime_minutes',
      'overtime_work_days'
    ].includes(name)) {
      sanitizedValue = value.replace(/[^0-9]/g, '');
    }

    if (name === 'payroll_periode') {
      sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    }

    setAddFormData((prev) => {
      const updated = { ...prev, [name]: sanitizedValue };

      if (['total_working_days', 'absent_days'].includes(name)) {
        const total = parseInt(name === 'total_working_days' ? sanitizedValue : prev.total_working_days || '', 10);
        const absent = parseInt(name === 'absent_days' ? sanitizedValue : prev.absent_days || '', 10);

        if (!Number.isNaN(total) && !Number.isNaN(absent)) {
          updated.actual_working_days = Math.max(total - absent, 0).toString();
        }
      }

      return updated;
    });
  };

  useEffect(() => {
    if (!showAddModal) {
      return undefined;
    }

    let isMounted = true;

    const fetchEmployees = async () => {
      setEmployeeLoading(true);
      setEmployeeFetchError('');

      try {
        const searchParams = employeeSearchTerm?.trim()
          ? { search: employeeSearchTerm.trim() }
          : {};

        const employees = await employeeService.getAllEmployees(searchParams);

        if (!isMounted) {
          return;
        }

        const formattedOptions = (employees || [])
          .filter((employee) => employee && employee.employee_id)
          .map((employee) => {
            const id = employee.employee_id.toString();
            const name = employee.name || 'Tanpa nama';

            return {
              value: id,
              label: `${id} - ${name}`
            };
          });

        setEmployeeOptions((prevOptions) => {
          if (!addFormData.employee_id) {
            return formattedOptions;
          }

          const hasCurrentSelection = formattedOptions.some((option) => option.value === addFormData.employee_id);

          if (hasCurrentSelection) {
            return formattedOptions;
          }

          const existingSelection = prevOptions.find((option) => option.value === addFormData.employee_id);

          if (existingSelection) {
            return [existingSelection, ...formattedOptions];
          }

          return [
            {
              value: addFormData.employee_id,
              label: addFormData.employee_id ? `${addFormData.employee_id} - Selected employee` : 'Selected employee'
            },
            ...formattedOptions
          ];
        });

        if ((employeeSearchTerm || '').trim()) {
          setIsEmployeeDropdownOpen(true);
        }
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setEmployeeOptions([]);
        setEmployeeFetchError(fetchError.message || 'Gagal memuat daftar karyawan');
        setIsEmployeeDropdownOpen(false);
      } finally {
        if (isMounted) {
          setEmployeeLoading(false);
        }
      }
    };

    const debounceId = setTimeout(fetchEmployees, 400);

    return () => {
      isMounted = false;
      clearTimeout(debounceId);
    };
  }, [showAddModal, employeeSearchTerm, addFormData.employee_id]);

  useEffect(() => {
    if (!showAddModal) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (employeeSearchContainerRef.current && !employeeSearchContainerRef.current.contains(event.target)) {
        setIsEmployeeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddModal]);

  const handleSelectEmployee = (option) => {
    setAddFormData((prev) => ({
      ...prev,
      employee_id: option.value
    }));
    setSelectedEmployeeLabel(option.label);
    setEmployeeSearchTerm('');
    setIsEmployeeDropdownOpen(false);
    setFormErrors((prev) => ({
      ...prev,
      employee_id: undefined
    }));
    setEmployeeOptions((prevOptions) => {
      const filtered = prevOptions.filter((existing) => existing.value !== option.value);
      return [option, ...filtered];
    });
  };

  const validateAddForm = () => {
    const errors = {};

    if (!addFormData.employee_id) {
      errors.employee_id = 'Employee ID wajib diisi';
    }

    if (!addFormData.payroll_periode) {
      errors.payroll_periode = 'Periode payroll wajib diisi';
    } else if (!/^\d{6}$/.test(addFormData.payroll_periode)) {
      errors.payroll_periode = 'Format periode harus YYYYMM';
    }

    const totalWorkingDays = parseInt(addFormData.total_working_days, 10);
    const absentDays = parseInt(addFormData.absent_days, 10);
    const actualWorkingDays = parseInt(addFormData.actual_working_days, 10);

    if (Number.isNaN(totalWorkingDays) || totalWorkingDays <= 0) {
      errors.total_working_days = 'Total hari kerja wajib diisi dan harus lebih dari 0';
    }

    if (Number.isNaN(absentDays) || absentDays < 0) {
      errors.absent_days = 'Hari absen wajib diisi dan tidak boleh negatif';
    }

    if (Number.isNaN(actualWorkingDays) || actualWorkingDays < 0) {
      errors.actual_working_days = 'Hari kerja aktual wajib diisi dan tidak boleh negatif';
    }

    if (!errors.total_working_days && !errors.absent_days && absentDays > totalWorkingDays) {
      errors.absent_days = 'Hari absen tidak boleh melebihi total hari kerja';
    }

    const overtimeFields = [
      'overtime_hour_days',
      'overtime_hours',
      'overtime_minutes',
      'overtime_work_days'
    ];
    overtimeFields.forEach((field) => {
      if (addFormData[field] !== '' && (Number.isNaN(Number(addFormData[field])) || Number(addFormData[field]) < 0)) {
        errors[field] = 'Nilai overtime tidak boleh negatif';
      }
    });

    if (addFormData.cutoff_start_date && Number.isNaN(new Date(addFormData.cutoff_start_date).getTime())) {
      errors.cutoff_start_date = 'Tanggal cutoff mulai tidak valid';
    }
    if (addFormData.cutoff_end_date && Number.isNaN(new Date(addFormData.cutoff_end_date).getTime())) {
      errors.cutoff_end_date = 'Tanggal cutoff selesai tidak valid';
    }
    if (
      !errors.cutoff_start_date &&
      !errors.cutoff_end_date &&
      addFormData.cutoff_start_date &&
      addFormData.cutoff_end_date &&
      addFormData.cutoff_end_date < addFormData.cutoff_start_date
    ) {
      errors.cutoff_end_date = 'Tanggal cutoff selesai tidak boleh sebelum tanggal mulai';
    }

    return errors;
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    setFormErrors({});
    setModalError('');

    const errors = validateAddForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      employee_id: Number(addFormData.employee_id),
      payroll_periode: addFormData.payroll_periode,
      total_working_days: Number(addFormData.total_working_days),
      actual_working_days: Number(addFormData.actual_working_days),
      absent_days: Number(addFormData.absent_days),
      overtime_hour_days: Number(addFormData.overtime_hour_days || 0),
      overtime_hours: Number(addFormData.overtime_hours || 0),
      overtime_minutes: Number(addFormData.overtime_minutes || 0),
      overtime_work_days: Number(addFormData.overtime_work_days || 0),
      cutoff_start_date: addFormData.cutoff_start_date || null,
      cutoff_end_date: addFormData.cutoff_end_date || null
    };

    if (isEditMode && currentAttendanceId) {
      payload.attendance_id = Number(currentAttendanceId);
    }

    setFormSubmitting(true);
    try {
      let response;
      if (isEditMode) {
        response = await attendanceService.updateAttendance(payload);
      } else {
        response = await attendanceService.createAttendance(payload);
      }

      const fallbackMessage = isEditMode
        ? 'Attendance berhasil diperbarui'
        : 'Attendance berhasil ditambahkan';

      const message = response?.message || fallbackMessage;
      setSuccessMessage(message);
      setShowAddModal(false);
      setAddFormData({ ...initialFormState });
      setIsEditMode(false);
      setCurrentAttendanceId(null);
      await loadAttendances();
      setError('');
    } catch (err) {
      console.error('Error creating attendance:', err);
      const fallbackError = isEditMode
        ? 'Gagal memperbarui attendance'
        : 'Gagal menyimpan attendance';
      setModalError(err.message || fallbackError);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRequestDeleteAttendance = (attendance) => {
    if (!attendance) {
      return;
    }
    setPendingDeleteAttendance(attendance);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAttendance = async () => {
    if (!pendingDeleteAttendance?.attendance_id) {
      resetDeleteState();
      return;
    }

    const attendanceId = pendingDeleteAttendance.attendance_id;
    setDeletingAttendanceId(attendanceId);

    try {
      const response = await attendanceService.deleteAttendance(attendanceId);
      const message = response?.message || 'Attendance berhasil dihapus';
      setSuccessMessage(message);
      await loadAttendances();
    } catch (err) {
      console.error('Error deleting attendance:', err);
      setError(err.message || 'Gagal menghapus attendance');
    } finally {
      resetDeleteState();
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading attendances...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        <h4>Error Loading Attendances</h4>
        <p>{error}</p>
        <CButton color="primary" onClick={loadAttendances}>Retry</CButton>
      </CAlert>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="bg-white border-bottom-0 pb-0">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <h4 className="mb-1">Attendance Management</h4>
                <p className="text-medium-emphasis mb-0">
                  Track working days, identify gaps, and keep payroll inputs aligned.
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                <CButton color="primary" onClick={handleOpenAddModal}>
                  <CIcon icon={cilPlus} className="me-1" />
                  Add Attendance
                </CButton>
                <CButton
                  color="info"
                  variant="outline"
                  onClick={handleOpenSyncModal}
                >
                  <CIcon icon={cilLoopCircular} className="me-1" />
                  Sync External
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={handleToggleFilters}
                >
                  <CIcon icon={cilFilter} className="me-1" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </CButton>
              </div>
            </div>
          </CCardHeader>
          <CCardBody className="pt-4">
            <CRow className="g-3 mb-4">
              <CCol sm={6} lg={3}>
                <div className="border rounded-3 p-3 h-100 bg-light">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                      <CIcon icon={cilPeople} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-uppercase text-medium-emphasis small">Team Coverage</div>
                      <div className="fs-5 fw-semibold">
                        {summaryMetrics.uniqueEmployees.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="small text-medium-emphasis">
                    {totalRecords.toLocaleString('id-ID')} attendance entries recorded.
                  </div>
                </div>
              </CCol>
              <CCol sm={6} lg={3}>
                <div className="border rounded-3 p-3 h-100 bg-light">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="bg-info bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                      <CIcon icon={cilCalendar} className="text-info" />
                    </div>
                    <div>
                      <div className="text-uppercase text-medium-emphasis small">Working Days</div>
                      <div className="fs-5 fw-semibold">
                        {summaryMetrics.totalWorkingDays.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="small text-medium-emphasis">
                    {summaryMetrics.actualWorkingDays.toLocaleString('id-ID')} days confirmed as attended.
                  </div>
                </div>
              </CCol>
              <CCol sm={6} lg={3}>
                <div className="border rounded-3 p-3 h-100 bg-light">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="bg-success bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                      <CIcon icon={cilSpeedometer} className="text-success" />
                    </div>
                    <div>
                      <div className="text-uppercase text-medium-emphasis small">Attendance Rate</div>
                      <div className="fs-5 fw-semibold">
                        {summaryMetrics.attendanceRate}%
                      </div>
                    </div>
                  </div>
                  <div className="small text-medium-emphasis">
                    Actual vs scheduled presence across the current view.
                  </div>
                  <CProgress thin className="mt-2">
                    <CProgressBar color="success" value={summaryMetrics.attendanceRate} />
                  </CProgress>
                </div>
              </CCol>
              <CCol sm={6} lg={3}>
                <div className="border rounded-3 p-3 h-100 bg-light">
                  <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                      <CIcon icon={cilWarning} className="text-warning" />
                    </div>
                    <div>
                      <div className="text-uppercase text-medium-emphasis small">Absent Days</div>
                      <div className="fs-5 fw-semibold">
                        {summaryMetrics.absentDays.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="small text-medium-emphasis">
                    Monitor outstanding absences before payroll processing.
                  </div>
                </div>
              </CCol>
            </CRow>
            {successMessage && (
              <CAlert color="success" dismissible onClose={() => setSuccessMessage('')} className="mb-4">
                {successMessage}
              </CAlert>
            )}
            {/* Search Form */}
            <CForm onSubmit={handleSearchSubmit} className="mb-4">
              <CRow className="g-3 align-items-md-end">
                <CCol md={5}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      placeholder="Search by employee, period, or keyword"
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      ref={searchInputRef}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="attendance-period-filter" className="mb-1">Periode</CFormLabel>
                  <CFormInput
                    id="attendance-period-filter"
                    type="month"
                    value={payrollPeriodToPickerValue(filters.payroll_periode) || ''}
                    onChange={(e) => handleFilterChange('payroll_periode', pickerValueToPayrollPeriod(e.target.value))}
                  />
                </CCol>
                <CCol md={4}>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <CButton type="submit" color="primary">
                      <CIcon icon={cilSearch} className="me-1" />
                      Search
                    </CButton>
                    <CButton type="button" color="secondary" variant="outline" onClick={resetFilters}>
                      Reset
                    </CButton>
                  </div>
                </CCol>
              </CRow>

              <CCollapse visible={showFilters} className="mt-3">
                <div className="small text-medium-emphasis">
                  Filter tambahan tidak tersedia untuk tampilan ini.
                </div>
              </CCollapse>
            </CForm>

            {attendances.length > 0 ? (
              <>
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Employee</CTableHeaderCell>
                      <CTableHeaderCell>Period</CTableHeaderCell>
                      <CTableHeaderCell>Cutoff</CTableHeaderCell>
                      <CTableHeaderCell>Overtime</CTableHeaderCell>
                      <CTableHeaderCell>Scheduled Days</CTableHeaderCell>
                      <CTableHeaderCell>Actual Days</CTableHeaderCell>
                      <CTableHeaderCell>Absent Days</CTableHeaderCell>
                      <CTableHeaderCell>Attendance Rate</CTableHeaderCell>
                      <CTableHeaderCell>Recorded</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {attendances.map((attendance) => {
                      const scheduledDays = Number(attendance.total_working_days) || 0;
                      const actualDays = Number(attendance.actual_working_days) || 0;
                      const absentDays = Number(attendance.absent_days) || 0;
                      const periodLabel = resolvePeriodLabel(attendance.payroll_periode);
                      const attendanceRate = calculateAttendanceRate(attendance);
                      const attendanceRateColor = resolveAttendanceRateColor(attendanceRate);
                      const hasAbsence = absentDays > 0;
                      const employeeNik = attendance.employee?.nik;

                      return (
                        <CTableRow key={attendance.attendance_id}>
                          <CTableDataCell>
                            <div className="fw-semibold">{attendance.employee?.name || 'N/A'}</div>
                            <div className="small text-medium-emphasis">Employee ID: {attendance.employee_id}</div>
                            {employeeNik && (
                              <CBadge color="info" className="mt-2">
                                NIK {employeeNik}
                              </CBadge>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{periodLabel.formatted}</div>
                            <div className="small text-medium-emphasis">{periodLabel.raw}</div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="small">
                              {attendance.cutoff_start_date && attendance.cutoff_end_date
                                ? `${formatDisplayDate(attendance.cutoff_start_date)} - ${formatDisplayDate(attendance.cutoff_end_date)}`
                                : '-'}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="small">
                              {Number(attendance.overtime_work_days) || 0} work days
                            </div>
                            <div className="small text-medium-emphasis">
                              {Number(attendance.overtime_hours) || 0}h {Number(attendance.overtime_minutes) || 0}m
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{scheduledDays.toLocaleString('id-ID')}</div>
                            <div className="small text-medium-emphasis">Scheduled</div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold text-success">{actualDays.toLocaleString('id-ID')}</div>
                            <div className="small text-medium-emphasis">Recorded</div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{absentDays.toLocaleString('id-ID')}</div>
                            <CBadge color={hasAbsence ? 'warning' : 'success'} className="mt-2">
                              {hasAbsence ? 'Needs review' : 'Clear'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{attendanceRate}%</div>
                            <CProgress thin className="mt-2">
                              <CProgressBar color={attendanceRateColor} value={attendanceRate} />
                            </CProgress>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{formatCreatedAt(attendance.created_at)}</div>
                            {attendance.updated_at && (
                              <div className="small text-medium-emphasis">
                                Updated {formatCreatedAt(attendance.updated_at)}
                              </div>
                            )}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <CButton
                                size="sm"
                                color="info"
                                variant="outline"
                                onClick={() => handleOpenEditModal(attendance)}
                              >
                                <CIcon icon={cilPen} />
                                <span className="visually-hidden">Update attendance</span>
                              </CButton>
                              <CButton
                                size="sm"
                                color="danger"
                                variant="outline"
                                disabled={deletingAttendanceId === attendance.attendance_id}
                                onClick={() => handleRequestDeleteAttendance(attendance)}
                              >
                                <CIcon icon={cilTrash} />
                                <span className="visually-hidden">Delete attendance</span>
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      );
                    })}
                  </CTableBody>
                </CTable>
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                    </div>
                    <div className="d-flex align-items-center">
                      <label className="me-2">Rows per page:</label>
                      <CFormSelect
                        size="sm"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        style={{ width: 'auto' }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </CFormSelect>
                    </div>
                  </div>
                  <CPagination align="center" className="mb-0">
                    <CPaginationItem 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </CPaginationItem>
                    
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum >= 1 && pageNum <= totalPages) {
                        return (
                          <CPaginationItem 
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </CPaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <CPaginationItem 
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <p className="text-medium-emphasis mb-3">
                  No attendance records match the current filters. Adjust your criteria or add a new record.
                </p>
                <CButton color="primary" variant="outline" onClick={handleOpenAddModal}>
                  <CIcon icon={cilPlus} className="me-1" />
                  Create Attendance Record
                </CButton>
              </div>
            )}
          <CModal visible={showSyncModal} onClose={handleCloseSyncModal} backdrop="static">
            <CForm onSubmit={handleSyncSubmit}>
              <CModalHeader>
                <CModalTitle>Sync External Attendance</CModalTitle>
              </CModalHeader>
              <CModalBody>
                {syncError && (
                  <CAlert color="danger" className="mb-3">
                    {syncError}
                  </CAlert>
                )}
                <div className="mb-3">
                  <CFormLabel htmlFor="attendance-sync-period">Payroll Period</CFormLabel>
                  <CFormInput
                    id="attendance-sync-period"
                    type="month"
                    value={syncPeriod}
                    onChange={(e) => setSyncPeriod(e.target.value)}
                    disabled={syncLoading}
                    autoComplete="off"
                  />
                  <div className="small text-medium-emphasis mt-1">
                    Select the payroll month that you want to synchronize from the external system.
                  </div>
                </div>
              </CModalBody>
              <CModalFooter>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={handleCloseSyncModal}
                  disabled={syncLoading}
                >
                  Cancel
                </CButton>
                <CButton
                  color="info"
                  type="submit"
                  disabled={syncLoading}
                >
                  Continue
                </CButton>
              </CModalFooter>
            </CForm>
          </CModal>

          <CModal
            visible={showSyncConfirm}
            onClose={handleCancelSyncConfirm}
            backdrop="static"
          >
            <CModalHeader>
              <CModalTitle>Confirm Synchronization</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <p className="mb-3">
                Synchronize attendance data for period{' '}
                <strong>{syncConfirmPeriodInfo?.formatted || syncConfirmPeriod || '-'}</strong>?
              </p>
              <p className="text-medium-emphasis mb-0">
                This action will trigger an external sync request and may take a few moments to complete.
              </p>
            </CModalBody>
            <CModalFooter>
              <CButton
                color="secondary"
                variant="outline"
                onClick={handleCancelSyncConfirm}
                disabled={syncLoading}
              >
                Back
              </CButton>
              <CButton
                color="info"
                onClick={handleConfirmSync}
                disabled={syncLoading}
              >
                {syncLoading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Syncing...
                  </>
                ) : (
                  'Confirm & Sync'
                )}
              </CButton>
            </CModalFooter>
          </CModal>

          <CModal visible={showAddModal} onClose={handleCloseAddModal} backdrop="static">
            <CForm onSubmit={handleAddSubmit}>
              <CModalHeader>
                <CModalTitle>{isEditMode ? 'Update Attendance' : 'Tambah Attendance'}</CModalTitle>
              </CModalHeader>
              <CModalBody>
                {modalError && (
                  <CAlert color="danger">{modalError}</CAlert>
                )}
                <div className="mb-3">
                  <CFormLabel htmlFor="attendance-employee-search">Employee</CFormLabel>
                  <div ref={employeeSearchContainerRef} className="position-relative">
                    <CInputGroup className="mb-2">
                      <CInputGroupText>
                        <CIcon icon={cilSearch} />
                      </CInputGroupText>
                      <CFormInput
                        id="attendance-employee-search"
                        type="text"
                        placeholder="Cari nama atau ID karyawan..."
                        value={employeeSearchTerm || selectedEmployeeLabel}
                        onChange={handleEmployeeSearchChange}
                        autoComplete="off"
                        onFocus={() => setIsEmployeeDropdownOpen(true)}
                        invalid={!!formErrors.employee_id}
                      />
                      {employeeLoading && (
                        <CInputGroupText>
                          <CSpinner size="sm" />
                        </CInputGroupText>
                      )}
                    </CInputGroup>
                    {isEmployeeDropdownOpen && (
                      <div className="position-absolute w-100 bg-white border rounded shadow-sm" style={{ zIndex: 1050, maxHeight: '240px', overflowY: 'auto' }}>
                        {employeeOptions.length > 0 ? (
                          <CListGroup flush>
                            {employeeOptions.map((option) => (
                              <CListGroupItem
                                key={option.value}
                                action
                                onClick={() => handleSelectEmployee(option)}
                                className={option.value === addFormData.employee_id ? 'active' : ''}
                              >
                                {option.label}
                              </CListGroupItem>
                            ))}
                          </CListGroup>
                        ) : (
                          <div className="p-2 text-muted small">
                            {employeeSearchTerm ? 'Tidak ada karyawan yang cocok.' : 'Mulai ketik untuk mencari karyawan.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {employeeFetchError && (
                    <div className="text-danger small mt-1">{employeeFetchError}</div>
                  )}
                  {formErrors.employee_id && (
                    <CFormFeedback invalid>{formErrors.employee_id}</CFormFeedback>
                  )}
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="attendance-payroll-period">Periode Payroll (YYYYMM)</CFormLabel>
                  <CFormInput
                    id="attendance-payroll-period"
                    name="payroll_periode"
                    type="text"
                    value={addFormData.payroll_periode}
                    onChange={handleAddInputChange}
                    invalid={!!formErrors.payroll_periode}
                    placeholder="Contoh: 202502"
                    autoComplete="off"
                  />
                  {formErrors.payroll_periode && (
                    <CFormFeedback invalid>{formErrors.payroll_periode}</CFormFeedback>
                  )}
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="attendance-total-days">Total Hari Kerja</CFormLabel>
                  <CFormInput
                    id="attendance-total-days"
                    name="total_working_days"
                    type="number"
                    min="0"
                    value={addFormData.total_working_days}
                    onChange={handleAddInputChange}
                    invalid={!!formErrors.total_working_days}
                    placeholder="Contoh: 25"
                  />
                  {formErrors.total_working_days && (
                    <CFormFeedback invalid>{formErrors.total_working_days}</CFormFeedback>
                  )}
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="attendance-absent-days">Hari Absen</CFormLabel>
                  <CFormInput
                    id="attendance-absent-days"
                    name="absent_days"
                    type="number"
                    min="0"
                    value={addFormData.absent_days}
                    onChange={handleAddInputChange}
                    invalid={!!formErrors.absent_days}
                    placeholder="Contoh: 2"
                  />
                  {formErrors.absent_days && (
                    <CFormFeedback invalid>{formErrors.absent_days}</CFormFeedback>
                  )}
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="attendance-actual-days">Hari Kerja Aktual</CFormLabel>
                  <CFormInput
                    id="attendance-actual-days"
                    name="actual_working_days"
                    type="number"
                    min="0"
                    value={addFormData.actual_working_days}
                    onChange={handleAddInputChange}
                    invalid={!!formErrors.actual_working_days}
                    placeholder="Contoh: 23"
                  />
                  {formErrors.actual_working_days && (
                    <CFormFeedback invalid>{formErrors.actual_working_days}</CFormFeedback>
                  )}
                </div>
                <div className="border-top pt-3 mt-3">
                  <h6>Overtime</h6>
                  <CRow className="g-3">
                    <CCol md={6}>
                      <CFormLabel htmlFor="attendance-overtime-hour-days">Hari Lembur Berbasis Jam</CFormLabel>
                      <CFormInput
                        id="attendance-overtime-hour-days"
                        name="overtime_hour_days"
                        type="number"
                        min="0"
                        value={addFormData.overtime_hour_days}
                        onChange={handleAddInputChange}
                        invalid={!!formErrors.overtime_hour_days}
                      />
                      {formErrors.overtime_hour_days && <CFormFeedback invalid>{formErrors.overtime_hour_days}</CFormFeedback>}
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel htmlFor="attendance-overtime-work-days">Hari Kerja Lembur</CFormLabel>
                      <CFormInput
                        id="attendance-overtime-work-days"
                        name="overtime_work_days"
                        type="number"
                        min="0"
                        value={addFormData.overtime_work_days}
                        onChange={handleAddInputChange}
                        invalid={!!formErrors.overtime_work_days}
                      />
                      {formErrors.overtime_work_days && <CFormFeedback invalid>{formErrors.overtime_work_days}</CFormFeedback>}
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel htmlFor="attendance-overtime-hours">Total Jam Lembur</CFormLabel>
                      <CFormInput
                        id="attendance-overtime-hours"
                        name="overtime_hours"
                        type="number"
                        min="0"
                        value={addFormData.overtime_hours}
                        onChange={handleAddInputChange}
                        invalid={!!formErrors.overtime_hours}
                      />
                      {formErrors.overtime_hours && <CFormFeedback invalid>{formErrors.overtime_hours}</CFormFeedback>}
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel htmlFor="attendance-overtime-minutes">Menit Lembur</CFormLabel>
                      <CFormInput
                        id="attendance-overtime-minutes"
                        name="overtime_minutes"
                        type="number"
                        min="0"
                        value={addFormData.overtime_minutes}
                        onChange={handleAddInputChange}
                        invalid={!!formErrors.overtime_minutes}
                      />
                      {formErrors.overtime_minutes && <CFormFeedback invalid>{formErrors.overtime_minutes}</CFormFeedback>}
                    </CCol>
                  </CRow>
                </div>
                <div className="border-top pt-3 mt-3">
                  <h6>Periode Cutoff</h6>
                  <CRow className="g-3">
                    <CCol md={6}>
                      <CFormLabel htmlFor="attendance-cutoff-start">Tanggal Mulai Cutoff</CFormLabel>
                      <CFormInput
                        id="attendance-cutoff-start"
                        name="cutoff_start_date"
                        type="date"
                        value={addFormData.cutoff_start_date}
                        onChange={handleAddInputChange}
                        invalid={!!formErrors.cutoff_start_date}
                      />
                      {formErrors.cutoff_start_date && <CFormFeedback invalid>{formErrors.cutoff_start_date}</CFormFeedback>}
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel htmlFor="attendance-cutoff-end">Tanggal Selesai Cutoff</CFormLabel>
                      <CFormInput
                        id="attendance-cutoff-end"
                        name="cutoff_end_date"
                        type="date"
                        value={addFormData.cutoff_end_date}
                        onChange={handleAddInputChange}
                        invalid={!!formErrors.cutoff_end_date}
                      />
                      {formErrors.cutoff_end_date && <CFormFeedback invalid>{formErrors.cutoff_end_date}</CFormFeedback>}
                    </CCol>
                  </CRow>
                </div>
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" variant="outline" onClick={handleCloseAddModal} disabled={formSubmitting}>
                  Batal
                </CButton>
                <CButton color="primary" type="submit" disabled={formSubmitting}>
                  {formSubmitting ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      {isEditMode ? 'Menyimpan perubahan...' : 'Menyimpan...'}
                    </>
                  ) : (
                    isEditMode ? 'Update' : 'Simpan'
                  )}
                </CButton>
              </CModalFooter>
            </CForm>
          </CModal>
          <CModal
            visible={showDeleteModal}
            onClose={resetDeleteState}
            alignment="center"
          >
            <CModalHeader>
              <CModalTitle>Konfirmasi Hapus</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <p className="mb-0">
                {pendingDeleteAttendance?.employee?.name
                  ? `Hapus attendance untuk ${pendingDeleteAttendance.employee.name} (ID: ${pendingDeleteAttendance.employee_id})?`
                  : 'Hapus attendance yang dipilih?'}
              </p>
            </CModalBody>
            <CModalFooter>
              <CButton
                color="secondary"
                variant="outline"
                onClick={resetDeleteState}
                disabled={!!deletingAttendanceId}
              >
                Batal
              </CButton>
              <CButton
                color="danger"
                onClick={handleConfirmDeleteAttendance}
                disabled={!!deletingAttendanceId}
              >
                {deletingAttendanceId ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus'
                )}
              </CButton>
            </CModalFooter>
          </CModal>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default AttendanceList;
