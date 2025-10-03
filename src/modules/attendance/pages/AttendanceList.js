// ========================================
// ATTENDANCE LIST PAGE
// ========================================

import React, { useState, useEffect, useRef } from 'react';
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilFilter, cilTrash, cilPen } from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import attendanceService from '../services/attendanceService';
import employeeService from '../../employees/services/employeeService';

const AttendanceList = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState(''); // Current input value
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // Search term that's been applied
  const [showFilters, setShowFilters] = useState(false);
  const initialFormState = {
    employee_id: '',
    payroll_periode: '',
    total_working_days: '',
    absent_days: '',
    actual_working_days: ''
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
  const searchInputRef = useRef(null);

  useDocumentTitle('Attendance List');

  const loadAttendances = async () => {
    try {
      setLoading(true);
      
      const serviceParams = {
        page: currentPage,
        rows: pageSize,
        search: appliedSearchTerm
      };
      
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
  }, [currentPage, pageSize, appliedSearchTerm]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle search input change without triggering immediate search
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search form submission - only time we hit the API
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  // Remove the auto-search debounce effect completely
  // We only want to search when user explicitly submits

  const resetFilters = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
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
      absent_days: attendance.absent_days?.toString() || '',
      actual_working_days: attendance.actual_working_days?.toString() || ''
    });
    setShowAddModal(true);
  };

  const handleAddInputChange = (event) => {
    const { name, value } = event.target;
    let sanitizedValue = value;

    if (['employee_id', 'total_working_days', 'absent_days', 'actual_working_days'].includes(name)) {
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

    if (!errors.total_working_days && !errors.actual_working_days && actualWorkingDays > totalWorkingDays) {
      errors.actual_working_days = 'Hari kerja aktual tidak boleh melebihi total hari kerja';
    }

    if (!errors.total_working_days && !errors.absent_days && !errors.actual_working_days) {
      if (absentDays + actualWorkingDays > totalWorkingDays) {
        errors.actual_working_days = 'Total hari aktual dan hari absen tidak boleh melebihi total hari kerja';
      }
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
      absent_days: Number(addFormData.absent_days)
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
          <CCardHeader>
            <CRow className="align-items-center">
              <CCol>
                <strong>Attendance Management</strong>
              </CCol>
              <CCol xs="auto">
                <div className="d-flex gap-2">
                  <CButton color="primary" onClick={handleOpenAddModal}>
                    Add Attendance
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <CIcon icon={cilFilter} className="me-1" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </CButton>
                </div>
              </CCol>
            </CRow>
          </CCardHeader>
          <CCardBody>
            {successMessage && (
              <CAlert color="success" dismissible onClose={() => setSuccessMessage('')} className="mb-4">
                {successMessage}
              </CAlert>
            )}
            {/* Search Form */}
            <CForm onSubmit={handleSearchSubmit} className="mb-4">
              <CRow>
                <CCol md={6} className="mb-3">
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      placeholder="Search by employee name..."
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      ref={searchInputRef}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={6} className="mb-3">
                  <div className="d-grid d-md-flex gap-2">
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
            </CForm>

            {attendances.length > 0 ? (
              <>
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Employee</CTableHeaderCell>
                      <CTableHeaderCell>Period</CTableHeaderCell>
                      <CTableHeaderCell>Working Days</CTableHeaderCell>
                      <CTableHeaderCell>Absent Days</CTableHeaderCell>
                      <CTableHeaderCell>Actual Days</CTableHeaderCell>
                      <CTableHeaderCell>Created At</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {attendances.map((attendance) => (
                      <CTableRow key={attendance.attendance_id}>
                        <CTableDataCell>
                          <div>
                            <strong>{attendance.employee?.name || 'N/A'}</strong>
                            <div className="small text-medium-emphasis">
                              ID: {attendance.employee_id}
                            </div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.payroll_periode || '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.total_working_days || 0}
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.absent_days || 0}
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.actual_working_days || 0}
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(attendance.created_at).toLocaleDateString('id-ID')}
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
                    ))}
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
                <p className="text-medium-emphasis">
                  No attendance records found.
                </p>
              </div>
            )}
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
