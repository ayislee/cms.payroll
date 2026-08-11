// ========================================
// EMPLOYEE LIST PAGE
// ========================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CButtonGroup,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormSelect,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilPlus,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilReload,
  cilInfo,
  cilSettings,
  cilBuilding,
  cilUserFollow,
  cilClock,
  cilSync
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatDateTime, formatPhoneNumber, formatStatus } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import { PTKP_OPTIONS } from '../../../constants/payrollConstants';
import employeeService from '../services/employeeService';
import companyService from '../../companies/services/companyService';
import config from '../../../config/environment';

// Enhanced Search Styles
const searchStyles = `
  .search-container {
    position: relative;
  }

  .search-history-container {
    position: relative;
  }

  .hover-bg-light:hover {
    background-color: #f8f9fa !important;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .z-index-1000 {
    z-index: 1000;
  }

  .search-suggestions {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    max-height: 300px;
    overflow-y: auto;
  }

  .search-suggestion-item {
    padding: 0.75rem;
    border-bottom: 1px solid #f1f3f4;
    transition: background-color 0.15s ease-in-out;
  }

  .search-suggestion-item:hover {
    background-color: #f8f9fa;
  }

  .search-suggestion-icon {
    width: 20px;
    height: 20px;
    margin-right: 0.5rem;
    color: #6c757d;
  }

  .search-suggestion-badge {
    font-size: 0.7rem;
  }

  .employees-hero {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.25rem;
    padding: 2.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 45%, #8b5cf6 100%);
    color: #fff;
    overflow: hidden;
  }

  .employees-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.35), transparent 60%);
    opacity: 0.75;
    pointer-events: none;
  }

  .employees-hero__content,
  .employees-hero__actions {
    position: relative;
    z-index: 2;
  }

  .employees-hero__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.75;
  }

  .employees-hero__title {
    font-size: 1.875rem;
    font-weight: 600;
  }

  .employees-hero__subtitle {
    max-width: 540px;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .employees-hero__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .employees-hero__actions .btn {
    border-radius: 999px;
    padding-inline: 1.25rem;
    font-weight: 500;
  }

  .employees-hero__actions .last-updated-indicator {
    color: rgba(255, 255, 255, 0.85);
  }

  .stat-card {
    border: 1px solid rgba(99, 102, 241, 0.08);
    border-radius: 1rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 35px rgba(15, 23, 42, 0.08);
  }

  .stat-card__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    font-weight: 600;
  }

  .stat-card__value {
    font-size: 1.85rem;
    font-weight: 600;
    color: #111827;
  }

  .stat-card__caption {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .stat-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.85rem;
    font-size: 1.25rem;
  }

  .stat-card__icon--primary {
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
  }

  .stat-card__icon--success {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  .stat-card__icon--info {
    background: rgba(14, 165, 233, 0.12);
    color: #0284c7;
  }

  .stat-card__icon--warning {
    background: rgba(234, 179, 8, 0.15);
    color: #ca8a04;
  }

  .filter-card {
    border-radius: 0.9rem;
    border: 1px solid #e5e7eb;
    background-color: #f9fafb;
    padding: 1.5rem;
  }

  .search-input-group {
    border-radius: 0.9rem;
    border: 1px solid #d1d5db;
    background-color: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-input-group:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.15);
  }

  .search-input-group .input-group-text {
    border: none;
    background: transparent;
    color: #9ca3af;
    padding-left: 1rem;
  }

  .search-input-group .form-control {
    border: none;
    box-shadow: none;
    padding-left: 0.35rem;
    padding-right: 0.35rem;
  }

  .search-input-group .btn {
    border: none;
  }

  .search-input-group .btn:focus,
  .search-input-group .form-control:focus {
    box-shadow: none;
  }

  .employees-table tbody tr {
    transition: background-color 0.2s ease, transform 0.2s ease;
  }

  .employees-table tbody tr:hover {
    background-color: rgba(99, 102, 241, 0.05);
  }

  .last-updated-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject styles
if (!document.getElementById('employee-search-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'employee-search-styles';
  styleElement.textContent = searchStyles;
  document.head.appendChild(styleElement);
}

const EmployeeList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  // Set document title
  useDocumentTitle('Employee Management');

  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyOptionsLoading, setCompanyOptionsLoading] = useState(false);
  const [companyFilterError, setCompanyFilterError] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [rows, setRows] = useState(config.pagination.defaultRows);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const canCreateEmployee = hasPermission(PERMISSIONS.EMPLOYEES_CREATE);
  const canUpdateEmployee = hasPermission(PERMISSIONS.EMPLOYEES_UPDATE);
  const canSyncEmployees = canCreateEmployee || canUpdateEmployee;
  const searchDebounceRef = useRef(null);

  const ptkpLabelMap = useMemo(() => {
    return PTKP_OPTIONS.reduce((map, option) => {
      map[option.value] = option.label;
      return map;
    }, {});
  }, []);

  const resolvePTKPLabel = useCallback(
    (value) => {
      if (!value) return '-';
      return ptkpLabelMap[value] || value;
    },
    [ptkpLabelMap]
  );

  const trimmedSearchTerm = searchTerm.trim();
  const trimmedSearchInput = searchInput.trim();

  const selectedCompanyLabel = useMemo(() => {
    if (!selectedCompanyId) return '';

    const selectedOption = companyOptions.find(
      (option) => String(option.value) === String(selectedCompanyId)
    );

    return selectedOption?.label || `Company #${selectedCompanyId}`;
  }, [companyOptions, selectedCompanyId]);

  const uniqueCompanyCount = useMemo(() => {
    if (!employees.length) return 0;

    const uniqueCompanies = new Set(
      employees
        .map((employee) => employee.company?.name || employee.company_name || employee.company_id)
        .filter((company) => company !== undefined && company !== null && company !== '')
    );

    return uniqueCompanies.size;
  }, [employees]);

  const recentJoinersCount = useMemo(() => {
    if (!employees.length) return 0;

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    return employees.reduce((count, employee) => {
      const createdAt = employee.created_at || employee.hire_date || employee.join_date;
      if (!createdAt) return count;

      const createdDate = new Date(createdAt);
      if (Number.isNaN(createdDate.getTime())) return count;

      return createdDate >= threshold ? count + 1 : count;
    }, 0);
  }, [employees]);

  const lastUpdatedLabel = useMemo(() => {
    if (!employees.length) {
      return 'Awaiting first employee';
    }

    const timestamps = employees
      .map((employee) => employee.updated_at || employee.created_at || null)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    if (!timestamps.length) {
      return 'No update timestamps available';
    }

    return `Last update ${formatDateTime(timestamps[0])}`;
  }, [employees]);

  const summaryText = useMemo(() => {
    const filterParts = [];

    if (trimmedSearchTerm) {
      filterParts.push(`matching "${trimmedSearchTerm}"`);
    }

    if (selectedCompanyLabel) {
      filterParts.push(`in ${selectedCompanyLabel}`);
    }

    if (totalEmployees > 0) {
      const start = ((currentPage - 1) * rows) + 1;
      const end = Math.min(currentPage * rows, totalEmployees);
      let base = `Showing ${start}-${end} of ${totalEmployees} employees`;

      if (filterParts.length > 0) {
        base += ` ${filterParts.join(' ')}`;
      }

      return base;
    }

    if (filterParts.length > 0) {
      return `No employees found ${filterParts.join(' ')}`;
    }

    return 'No employees available yet';
  }, [currentPage, rows, selectedCompanyLabel, totalEmployees, trimmedSearchTerm]);

  // Load employees data
  const loadEmployees = useCallback(async (
    page = 1,
    search = '',
    showSearchIndicator = true,
    rowsOverride,
    companyId = ''
  ) => {
    try {
      const effectiveCompanyId = String(companyId || '').trim();

      if (showSearchIndicator) {
        setLoading(true);
        setIsSearching(search.trim() !== '' || effectiveCompanyId !== '');
      }
      setError('');

      const effectiveRows = rowsOverride && Number.isFinite(rowsOverride)
        ? rowsOverride
        : config.pagination.defaultRows;

      const params = {
        page,
        rows: effectiveRows,
        search: search.trim()
      };

      if (effectiveCompanyId) {
        params.company_id = effectiveCompanyId;
      }

      const response = await employeeService.getEmployees(params);

      setEmployees(Array.isArray(response.data) ? response.data : []);
      setTotalEmployees(response.total ?? (Array.isArray(response.data) ? response.data.length : 0));
      const totalCount = response.total ?? (Array.isArray(response.data) ? response.data.length : 0);
      const pageSize = effectiveRows || config.pagination.defaultRows;
      setTotalPages(response.lastPage || Math.ceil(totalCount / pageSize));
      setCurrentPage(response.page || page);

    } catch (error) {
      console.error('Error loading employees:', error);
      setError(error.message || 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEmployees(1, '', true, config.pagination.defaultRows, '');
  }, [loadEmployees]);

  useEffect(() => {
    let isMounted = true;

    const loadCompanyOptions = async () => {
      try {
        setCompanyOptionsLoading(true);
        setCompanyFilterError('');

        const options = await companyService.getCompanyOptions();

        if (isMounted) {
          setCompanyOptions(Array.isArray(options) ? options : []);
        }
      } catch (error) {
        console.error('Error loading company filter options:', error);

        if (isMounted) {
          setCompanyOptions([]);
          setCompanyFilterError('Company filter unavailable');
        }
      } finally {
        if (isMounted) {
          setCompanyOptionsLoading(false);
        }
      }
    };

    loadCompanyOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const generateSuggestions = useCallback((searchValue) => {
    const trimmed = searchValue.trim();

    if (trimmed.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const normalized = trimmed.toLowerCase();

    const employeeMatches = employees
      .filter((employee) => {
        const nameMatch = employee.name?.toLowerCase().includes(normalized);
        const nikMatch = employee.nik?.toLowerCase().includes(normalized);
        const emailMatch = employee.email?.toLowerCase().includes(normalized);
        return nameMatch || nikMatch || emailMatch;
      })
      .slice(0, 5)
      .map((employee) => ({
        type: 'employee',
        value: employee.name,
        subtitle: `${employee.nik || 'NIK N/A'}${employee.email ? ` • ${employee.email}` : ''}`,
        icon: cilPeople
      }));

    const suggestions = [
      ...employeeMatches,
      ...(trimmed.length >= 3
        ? [
            {
              type: 'pattern',
              value: trimmed,
              subtitle: 'Search across all employee fields',
              icon: cilMagnifyingGlass
            }
          ]
        : [])
    ];

    setSearchSuggestions(suggestions.slice(0, 8));
  }, [employees]);

  const handleSearchInputChange = useCallback(
    (event) => {
      const { value } = event.target;
      setSearchInput(value);
      setShowSearchHistory(false);

      const trimmed = value.trim();
      if (trimmed.length >= 2) {
        setShowSuggestions(true);
        generateSuggestions(trimmed);
      } else {
        setShowSuggestions(false);
        setSearchSuggestions([]);
      }
    },
    [generateSuggestions]
  );

  const handleApplySearch = useCallback(() => {
    const trimmed = trimmedSearchInput;
    setSearchInput(trimmed);
    setSearchTerm(trimmed);
    setCurrentPage(1);
    setShowSuggestions(false);
    setShowSearchHistory(false);

    if (trimmed) {
      setSearchHistory((previous) => {
        const existingIndex = previous.findIndex(
          (entry) => entry.toLowerCase() === trimmed.toLowerCase()
        );
        const updated =
          existingIndex >= 0
            ? [trimmed, ...previous.filter((_, idx) => idx !== existingIndex)]
            : [trimmed, ...previous];
        return updated.slice(0, 10);
      });
    }

    loadEmployees(1, trimmed, true, rows, selectedCompanyId);
  }, [loadEmployees, rows, selectedCompanyId, trimmedSearchInput]);

  const handleSearchFromHistory = useCallback(
    (value) => {
      const trimmed = value.trim();
      setSearchInput(trimmed);
      setSearchTerm(trimmed);
      setCurrentPage(1);
      setShowSearchHistory(false);
      setShowSuggestions(false);

      setSearchHistory((previous) => {
        if (!trimmed) {
          return previous;
        }
        const filtered = previous.filter(
          (entry) => entry.toLowerCase() !== trimmed.toLowerCase()
        );
        return [trimmed, ...filtered].slice(0, 10);
      });

      loadEmployees(1, trimmed, true, rows, selectedCompanyId);
    },
    [loadEmployees, rows, selectedCompanyId]
  );

  const handleResetSearch = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCompanyId('');
    setCurrentPage(1);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    setShowSearchHistory(false);

    loadEmployees(1, '', true, rows, '');
  }, [loadEmployees, rows]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    setShowSearchHistory(false);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion) => {
      const { value } = suggestion;
      const trimmed = value.trim();
      setSearchInput(trimmed);
      setSearchTerm(trimmed);
      setCurrentPage(1);
      setShowSuggestions(false);

      loadEmployees(1, trimmed, true, rows, selectedCompanyId);
    },
    [loadEmployees, rows, selectedCompanyId]
  );

  const handleCompanyFilterChange = useCallback(
    (event) => {
      const companyId = event.target.value;

      setSelectedCompanyId(companyId);
      setCurrentPage(1);
      setShowSuggestions(false);
      setShowSearchHistory(false);

      loadEmployees(1, searchTerm, true, rows, companyId);
    },
    [loadEmployees, rows, searchTerm]
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      loadEmployees(page, searchTerm, true, rows, selectedCompanyId);
    },
    [loadEmployees, rows, searchTerm, selectedCompanyId]
  );

  const handleRowsChange = useCallback(
    (newRows) => {
      setRows(newRows);
      setCurrentPage(1);
      setShowSuggestions(false);
      setShowSearchHistory(false);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      loadEmployees(1, searchTerm, true, newRows, selectedCompanyId);
    },
    [loadEmployees, searchTerm, selectedCompanyId]
  );

  const handleRefresh = useCallback(() => {
    loadEmployees(currentPage, searchTerm, true, rows, selectedCompanyId);
  }, [currentPage, loadEmployees, rows, searchTerm, selectedCompanyId]);

  const handleDelete = useCallback((employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!employeeToDelete) return;

    try {
      setDeleting(true);
      await employeeService.deleteEmployee(employeeToDelete.employee_id);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      loadEmployees(currentPage, searchTerm, true, rows, selectedCompanyId);
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError(error.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  }, [currentPage, employeeToDelete, loadEmployees, rows, searchTerm, selectedCompanyId]);

  const handleOpenSyncModal = useCallback(() => {
    setShowSyncModal(true);
  }, []);

  const handleCloseSyncModal = useCallback(() => {
    if (!syncing) {
      setShowSyncModal(false);
    }
  }, [syncing]);

  const confirmSync = useCallback(async () => {
    try {
      setSyncing(true);
      setError('');

      await employeeService.syncExternalEmployees();

      setShowSyncModal(false);
      setInfoMessage(
        'Sinkronisasi karyawan sedang diproses. Data akan diperbarui setelah backend menyelesaikan proses.'
      );
      loadEmployees(currentPage, searchTerm, true, rows, selectedCompanyId);
    } catch (syncError) {
      console.error('Error syncing employees:', syncError);
      setShowSyncModal(false);
      setInfoMessage('');
      setError(syncError.message || 'Failed to sync employees');
    } finally {
      setSyncing(false);
    }
  }, [currentPage, loadEmployees, rows, searchTerm, selectedCompanyId]);

  const handleCreateEmployee = useCallback(() => {
    navigate('/employees/create');
  }, [navigate]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 1) {
      return null;
    }

    const items = [];
    const maxPages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      items.push(
        <CPaginationItem
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </CPaginationItem>
      );
    }

    return items;
  }, [currentPage, handlePageChange, totalPages]);

  useEffect(() => {
    if (trimmedSearchInput.length >= 2) {
      generateSuggestions(trimmedSearchInput);
    }
  }, [employees, generateSuggestions, trimmedSearchInput]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
      if (showSearchHistory && !event.target.closest('.search-history-container')) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions, showSearchHistory]);

  if (loading && employees.length === 0) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center text-center"
        style={{ minHeight: '320px' }}
      >
        <CSpinner color="primary" />
        <p className="mt-3 text-medium-emphasis mb-0">Preparing your employee directory...</p>
      </div>
    );
  }

  return (
    <>
      <div className="employees-hero mb-4">
        <div className="employees-hero__content">
          <span className="employees-hero__eyebrow">People Operations</span>
          <h2 className="employees-hero__title mb-2">Employee Directory</h2>
          <p className="employees-hero__subtitle mb-0">
            Keep every employee profile organised for compliant payroll and confident decision-making.
          </p>
        </div>
        <div className="employees-hero__actions">
          <span className="last-updated-indicator text-white-50 flex-wrap">
            <CIcon icon={cilClock} className="me-2" />
            {lastUpdatedLabel}
          </span>
          {canSyncEmployees && (
            <CButton
              color="light"
              variant="outline"
              className="fw-semibold text-primary"
              onClick={handleOpenSyncModal}
              disabled={syncing}
            >
              <CIcon icon={cilSync} className="me-2" />
              Sinkronisasi Karyawan
            </CButton>
          )}
          {canCreateEmployee && (
            <CButton color="light" className="text-primary fw-semibold" onClick={handleCreateEmployee}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Employee
            </CButton>
          )}
        </div>
      </div>

      <CRow className="g-4 mb-4">
        <CCol sm={6} xl={3}>
          <CCard className="stat-card shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-card__label">Total Employees</div>
                  <div className="stat-card__value">{totalEmployees}</div>
                  <div className="stat-card__caption">Across all companies</div>
                </div>
                <span className="stat-card__icon stat-card__icon--primary">
                  <CIcon icon={cilPeople} />
                </span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} xl={3}>
          <CCard className="stat-card shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-card__label">Currently Showing</div>
                  <div className="stat-card__value">{employees.length}</div>
                  <div className="stat-card__caption">Employees on this page</div>
                </div>
                <span className="stat-card__icon stat-card__icon--info">
                  <CIcon icon={cilInfo} />
                </span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} xl={3}>
          <CCard className="stat-card shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-card__label">Companies In View</div>
                  <div className="stat-card__value">{uniqueCompanyCount}</div>
                  <div className="stat-card__caption">Based on current list</div>
                </div>
                <span className="stat-card__icon stat-card__icon--warning">
                  <CIcon icon={cilBuilding} />
                </span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} xl={3}>
          <CCard className="stat-card shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-card__label">New In 30 Days</div>
                  <div className="stat-card__value">{recentJoinersCount}</div>
                  <div className="stat-card__caption">From the current view</div>
                </div>
                <span className="stat-card__icon stat-card__icon--success">
                  <CIcon icon={cilUserFollow} />
                </span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className="border-0 shadow-sm">
        <CCardBody className="p-4">
          <div className="filter-card mb-4">
            <CRow className="g-3 align-items-center">
              <CCol lg={7}>
                <div className="search-container">
                  <CInputGroup className="search-input-group">
                    <CInputGroupText>
                      <CIcon icon={cilMagnifyingGlass} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search by name, NIK, email or phone..."
                      value={searchInput}
                      onChange={handleSearchInputChange}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleApplySearch();
                        }
                      }}
                    />
                    <div className="search-history-container">
                      <CDropdown alignment="end" visible={showSearchHistory} onToggle={setShowSearchHistory}>
                        <CDropdownToggle color="light" className="shadow-none px-3">
                          <CIcon icon={cilClock} />
                        </CDropdownToggle>
                        <CDropdownMenu className="w-100">
                          {searchHistory.length > 0 ? (
                            <>
                              {searchHistory.map((search, index) => (
                                <CDropdownItem
                                  key={index}
                                  onClick={() => handleSearchFromHistory(search)}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <span>
                                    <CIcon icon={cilMagnifyingGlass} className="me-2" />
                                    {search}
                                  </span>
                                  <small className="text-muted">Recent</small>
                                </CDropdownItem>
                              ))}
                              <CDropdownItem onClick={clearSearchHistory} className="text-danger">
                                <CIcon icon={cilTrash} className="me-2" />
                                Clear History
                              </CDropdownItem>
                            </>
                          ) : (
                            <CDropdownItem disabled>No recent searches</CDropdownItem>
                          )}
                        </CDropdownMenu>
                      </CDropdown>
                    </div>
                    <CButton
                      color="primary"
                      variant="outline"
                      onClick={handleApplySearch}
                      disabled={loading || trimmedSearchInput === trimmedSearchTerm}
                    >
                      {isSearching ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Filtering...
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilMagnifyingGlass} className="me-2" />
                          Apply
                        </>
                      )}
                    </CButton>
                    <CButton
                      color="light"
                      className="text-danger"
                      onClick={handleResetSearch}
                      disabled={!trimmedSearchTerm && !trimmedSearchInput && !selectedCompanyId}
                    >
                      <CIcon icon={cilTrash} className="me-2" />
                      Reset
                    </CButton>
                  </CInputGroup>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="position-relative">
                      <div className="search-suggestions position-absolute w-100 mt-2">
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="search-suggestion-item cursor-pointer"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <div className="d-flex align-items-center">
                              <CIcon icon={suggestion.icon} className="search-suggestion-icon" />
                              <div className="flex-grow-1">
                                <div className="fw-bold">{suggestion.value}</div>
                                <small className="text-muted">{suggestion.subtitle}</small>
                              </div>
                              <CBadge
                                color={suggestion.type === 'employee' ? 'info' : 'secondary'}
                                size="sm"
                                className="search-suggestion-badge"
                              >
                                {suggestion.type}
                              </CBadge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isSearching && (
                    <small className="text-info mt-2 d-block">
                      <CSpinner size="sm" className="me-2" />
                      Searching directory...
                    </small>
                  )}
                </div>
              </CCol>
              <CCol lg={5}>
                <div className="d-flex flex-wrap align-items-end justify-content-lg-end gap-3">
                  <div className="flex-grow-1" style={{ minWidth: '220px' }}>
                    <div className="stat-card__label mb-1">Company</div>
                    <CFormSelect
                      size="sm"
                      value={selectedCompanyId}
                      onChange={handleCompanyFilterChange}
                      disabled={companyOptionsLoading}
                    >
                      <option value="">All Companies</option>
                      {companyOptionsLoading && (
                        <option disabled>Loading companies...</option>
                      )}
                      {!companyOptionsLoading && companyOptions.length === 0 && (
                        <option disabled>No active companies available</option>
                      )}
                      {!companyOptionsLoading &&
                        companyOptions.map((option) => (
                          <option key={option.value} value={String(option.value)}>
                            {option.label}
                          </option>
                        ))}
                    </CFormSelect>
                    {companyFilterError && (
                      <small className="text-warning d-block mt-1">{companyFilterError}</small>
                    )}
                  </div>
                  <div>
                    <div className="stat-card__label mb-1">Rows per page</div>
                    <CFormSelect
                      size="sm"
                      value={rows}
                      onChange={(e) => handleRowsChange(Number(e.target.value))}
                      style={{ minWidth: '100px' }}
                    >
                      {config.pagination.pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="d-flex align-items-center"
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Refreshing
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilReload} className="me-2" />
                        Refresh
                      </>
                    )}
                  </CButton>
                </div>
              </CCol>
            </CRow>
          </div>

          {error && (
            <CAlert color="danger" className="mb-4 d-flex align-items-center justify-content-between">
              <span>{error}</span>
              <CButton color="danger" variant="outline" size="sm" onClick={() => setError('')}>
                Dismiss
              </CButton>
            </CAlert>
          )}
          {infoMessage && (
            <CAlert color="success" className="mb-4 d-flex align-items-center justify-content-between">
              <span>{infoMessage}</span>
              <CButton color="success" variant="outline" size="sm" onClick={() => setInfoMessage('')}>
                Tutup
              </CButton>
            </CAlert>
          )}

          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <small className="text-medium-emphasis">{summaryText}</small>
            <span className="last-updated-indicator">
              <CIcon icon={cilClock} className="text-primary" />
              {lastUpdatedLabel}
            </span>
          </div>

          <CTable responsive hover className="employees-table align-middle mb-0">
            <CTableHead className="bg-body-tertiary">
              <CTableRow>
                <CTableHeaderCell scope="col" className="text-uppercase small text-medium-emphasis">
                  ID
                </CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-uppercase small text-medium-emphasis">
                  Employee
                </CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-uppercase small text-medium-emphasis">
                  Company
                </CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-uppercase small text-medium-emphasis">
                  PTKP
                </CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-uppercase small text-medium-emphasis">
                  Status
                </CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-uppercase small text-medium-emphasis">
                  Updated
                </CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-uppercase small text-medium-emphasis text-end">
                  Actions
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <CTableRow key={employee.employee_id}>
                    <CTableDataCell>
                      <CBadge color="primary" className="px-3 py-2 rounded-pill">
                        #{employee.employee_id}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-break">
                      <div className="fw-semibold text-dark">{employee.name}</div>
                      <small className="d-block text-medium-emphasis">
                        NIK: {employee.nik || '-'}
                      </small>
                      {employee.job_title && (
                        <small className="d-block text-medium-emphasis">{employee.job_title}</small>
                      )}
                      <small className="d-block text-medium-emphasis">
                        {employee.email || '-'}
                      </small>
                      <small className="d-block text-medium-emphasis">
                        {formatPhoneNumber(employee.phone) || '-'}
                      </small>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="fw-semibold">
                        {employee.company?.name || employee.company_name || 'N/A'}
                      </div>
                      {employee.company_id && (
                        <small className="text-medium-emphasis">ID #{employee.company_id}</small>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="secondary">{resolvePTKPLabel(employee.ptkp)}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={employee.status === 'active' ? 'success' : employee.status === 'resign' ? 'secondary' : 'info'}>
                        {formatStatus(employee.status) || '-'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <small className="text-medium-emphasis">{formatDate(employee.updated_at || employee.created_at) || '-'}</small>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButtonGroup size="sm" className="gap-1">
                        <Link to={`/employees/${employee.employee_id}`}>
                          <CButton color="info" variant="outline" size="sm">
                            <CIcon icon={cilInfo} />
                          </CButton>
                        </Link>
                        {hasPermission(PERMISSIONS.EMPLOYEES_UPDATE) && (
                          <Link to={`/employees/${employee.employee_id}/edit`}>
                            <CButton color="warning" variant="outline" size="sm">
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </Link>
                        )}
                        <Link to={`/employees/${employee.employee_id}/settings`}>
                          <CButton color="secondary" variant="outline" size="sm" title="Employee Settings">
                            <CIcon icon={cilSettings} />
                          </CButton>
                        </Link>
                        {hasPermission(PERMISSIONS.EMPLOYEES_DELETE) && (
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(employee)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        )}
                      </CButtonGroup>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center py-5">
                    <div className="py-4">
                      <CIcon
                        icon={trimmedSearchTerm || selectedCompanyId ? cilMagnifyingGlass : cilPeople}
                        className="text-primary mb-3"
                        size="xl"
                      />
                      <h5 className="fw-semibold mb-2">
                        {trimmedSearchTerm || selectedCompanyId ? 'No matching employees' : 'No employees on record yet'}
                      </h5>
                      <p className="text-medium-emphasis mb-4">
                        {trimmedSearchTerm || selectedCompanyId
                          ? 'Adjust your filters or clear them to see the full directory.'
                          : 'Start building your organisation by adding your first employee profile.'}
                      </p>
                      <div className="d-flex justify-content-center gap-3 flex-wrap">
                        {(trimmedSearchTerm || selectedCompanyId) && (
                          <CButton color="link" className="text-decoration-none" onClick={handleResetSearch}>
                            Clear filters
                          </CButton>
                        )}
                        {hasPermission(PERMISSIONS.EMPLOYEES_CREATE) && (
                          <CButton color="primary" onClick={handleCreateEmployee}>
                            <CIcon icon={cilPlus} className="me-2" />
                            Add Employee
                          </CButton>
                        )}
                      </div>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>

          {totalEmployees > 0 && totalPages > 1 && (
            <div className="d-flex justify-content-end mt-4">
              <CPagination className="mb-0">
                <CPaginationItem
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(1)}
                >
                  First
                </CPaginationItem>
                <CPaginationItem
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </CPaginationItem>

                {paginationItems}

                <CPaginationItem
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </CPaginationItem>
                <CPaginationItem
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                >
                  Last
                </CPaginationItem>
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Delete Confirmation Modal */}
      <CModal visible={showSyncModal} onClose={handleCloseSyncModal}>
        <CModalHeader>
          <CModalTitle>Konfirmasi Sinkronisasi</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Sinkronisasi akan mengambil data karyawan terbaru dari sistem eksternal. Proses ini mungkin memerlukan beberapa
          menit dan tidak dapat dibatalkan. Lanjutkan?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={handleCloseSyncModal} disabled={syncing}>
            Batal
          </CButton>
          <CButton color="primary" onClick={confirmSync} disabled={syncing}>
            {syncing ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Menyinkronkan...
              </>
            ) : (
              'Mulai Sinkronisasi'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {employeeToDelete && (
            <>
              Are you sure you want to delete employee:
              <br />
              <strong>{employeeToDelete.name}</strong> ({employeeToDelete.nik})?
              <br />
              <br />
              <small className="text-danger">
                This action cannot be undone.
              </small>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EmployeeList;
