// ========================================
// EMPLOYEE LIST PAGE
// ========================================

import React, { useState, useEffect, useCallback } from 'react';
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
  cilSettings
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatPhoneNumber, truncateText } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import { PTKP_OPTIONS } from '../../../constants/payrollConstants';
import employeeService from '../services/employeeService';
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [rows, setRows] = useState(config.pagination.defaultRows);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load employees data
  const loadEmployees = useCallback(async (page = 1, search = '', showSearchIndicator = true) => {
    try {
      if (showSearchIndicator) {
        setLoading(true);
        setIsSearching(search.trim() !== '');
      }
      setError('');

      const params = {
        page,
        rows,
        search: search.trim()
      };

      const response = await employeeService.getEmployees(params);

      setEmployees(response.data || []);
      setTotalEmployees(response.total || 0);
      setTotalPages(response.lastPage || Math.ceil((response.total || 0) / rows));
      setCurrentPage(response.page || page);

    } catch (error) {
      console.error('Error loading employees:', error);
      setError(error.message || 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [rows]);

  // Initial load
  useEffect(() => {
    loadEmployees(1, searchTerm);
  }, [loadEmployees, searchTerm]);

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

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);

    // Show suggestions
    setShowSuggestions(true);
    generateSuggestions(value);

    // Add to search history if not empty and not already in history
    if (value.trim() && !searchHistory.includes(value.trim())) {
      setSearchHistory(prev => [value.trim(), ...prev.slice(0, 9)]); // Keep only last 10 searches
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      setShowSuggestions(false);
      loadEmployees(1, value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle search from history
  const handleSearchFromHistory = (searchValue) => {
    setSearchTerm(searchValue);
    setCurrentPage(1);
    setShowSearchHistory(false);
    loadEmployees(1, searchValue);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadEmployees(1, '');
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  // Generate search suggestions
  const generateSuggestions = useCallback((searchValue) => {
    if (!searchValue || searchValue.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = [
      // Search in current employees
      ...employees
        .filter(emp =>
          emp.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          emp.nik?.toLowerCase().includes(searchValue.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchValue.toLowerCase())
        )
        .slice(0, 5)
        .map(emp => ({
          type: 'employee',
          value: emp.name,
          subtitle: `${emp.nik} - ${emp.email}`,
          icon: cilPeople
        })),

      // Common search patterns
      ...(searchValue.length >= 3 ? [
        {
          type: 'pattern',
          value: searchValue,
          subtitle: 'Search all fields',
          icon: cilMagnifyingGlass
        }
      ] : [])
    ];

    setSearchSuggestions(suggestions.slice(0, 8)); // Max 8 suggestions
  }, [employees]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.value);
    setCurrentPage(1);
    setShowSuggestions(false);
    loadEmployees(1, suggestion.value);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadEmployees(page, searchTerm);
  };

  // Handle rows per page change
  const handleRowsChange = (newRows) => {
    setRows(newRows);
    setCurrentPage(1); // Reset to first page when changing rows per page
    loadEmployees(1, searchTerm);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadEmployees(currentPage, searchTerm);
  };

  // Handle delete
  const handleDelete = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      setDeleting(true);
      await employeeService.deleteEmployee(employeeToDelete.employee_id);
      
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      
      // Reload current page
      loadEmployees(currentPage, searchTerm);
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError(error.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxPages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
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
  };

  if (loading && employees.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading employees...</span>
      </div>
    );
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  <h4 className="mb-0">
                    <CIcon icon={cilPeople} className="me-2" />
                    Employee Management
                  </h4>
                  <small className="text-medium-emphasis">
                    Manage employee data and information
                  </small>
                </CCol>
                <CCol xs="auto">
                  {hasPermission(PERMISSIONS.EMPLOYEES_CREATE) && (
                    <Link to="/employees/create">
                      <CButton color="primary">
                        <CIcon icon={cilPlus} className="me-1" />
                        Add Employee
                      </CButton>
                    </Link>
                  )}
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              {/* Search and Actions */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <div className="search-container">
                    <CInputGroup>
                    <CFormInput
                      placeholder="Search by name, NIK, or email..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <div className="search-history-container">
                      <CDropdown visible={showSearchHistory} onToggle={setShowSearchHistory}>
                        <CDropdownToggle color="outline-secondary" variant="outline">
                          <CIcon icon={cilMagnifyingGlass} />
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
                            <CDropdownItem
                              onClick={clearSearchHistory}
                              className="text-danger"
                            >
                              <CIcon icon={cilTrash} className="me-2" />
                              Clear History
                            </CDropdownItem>
                          </>
                        ) : (
                          <CDropdownItem disabled>
                            No recent searches
                          </CDropdownItem>
                        )}
                      </CDropdownMenu>
                    </CDropdown>
                    </div>
                    {searchTerm && (
                      <CButton color="outline-danger" variant="outline" onClick={handleClearSearch}>
                        <CIcon icon={cilTrash} />
                      </CButton>
                    )}
                  </CInputGroup>
                  {/* Search Suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="position-relative">
                      <div className="search-suggestions position-absolute w-100">
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
                    <small className="text-info mt-1 d-block">
                      <CSpinner size="sm" className="me-2" />
                      Searching...
                    </small>
                  )}
                  </div>
                </CCol>
                <CCol md={6} className="d-flex justify-content-end gap-2">
                  <div className="d-flex align-items-center">
                    <small className="me-2">Show:</small>
                    <CFormSelect
                      size="sm"
                      value={rows}
                      onChange={(e) => handleRowsChange(Number(e.target.value))}
                      style={{ width: '80px' }}
                    >
                      {config.pagination.pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </CFormSelect>
                    <small className="ms-2">per page</small>
                  </div>
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <CIcon icon={cilReload} className={loading ? 'spin' : ''} />
                    {loading ? ' Loading...' : ' Refresh'}
                  </CButton>
                </CCol>
              </CRow>

              {/* Error Alert */}
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    className="ms-2"
                    onClick={() => setError('')}
                  >
                    Dismiss
                  </CButton>
                </CAlert>
              )}

              {/* Summary */}
              <div className="mb-3">
                <small className="text-medium-emphasis">
                  {totalEmployees > 0 ? (
                    <>
                      Showing {((currentPage - 1) * rows) + 1} to {Math.min(currentPage * rows, totalEmployees)} of {totalEmployees} employees
                      {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                      {searchTerm && ` (filtered by "${searchTerm}")`}
                    </>
                  ) : (
                    <>
                      No employees found
                      {searchTerm && ` for "${searchTerm}"`}
                    </>
                  )}
                </small>
              </div>

              {/* Employee Table */}
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell width="80">ID</CTableHeaderCell>
                    <CTableHeaderCell>NIK</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Phone</CTableHeaderCell>
                    <CTableHeaderCell>Company</CTableHeaderCell>
                    <CTableHeaderCell>PTKP</CTableHeaderCell>
                    <CTableHeaderCell>Created</CTableHeaderCell>
                    <CTableHeaderCell width="150">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <CTableRow key={employee.employee_id}>
                        <CTableDataCell>
                          <CBadge color="primary" className="fs-6">
                            #{employee.employee_id}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{employee.nik}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>
                            <strong>{employee.name}</strong>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{employee.email}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{formatPhoneNumber(employee.phone) || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">
                            Company {employee.company_id}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="secondary">
                            {employee.ptkp}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{formatDate(employee.created_at) || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
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
                      <CTableDataCell colSpan="10" className="text-center py-4">
                        <div className="text-medium-emphasis">
                          {searchTerm ? (
                            <>
                              <CIcon icon={cilMagnifyingGlass} className="me-2" size="xl" />
                              <br />
                              No employees found for "{searchTerm}"
                              <br />
                              <small className="d-block mt-2">
                                Try searching with different keywords or check your spelling
                              </small>
                              <div className="mt-3">
                                <CButton
                                  color="link"
                                  size="sm"
                                  onClick={() => setSearchTerm('')}
                                  className="me-3"
                                >
                                  Clear search
                                </CButton>
                                <small className="text-muted">
                                  or try: {searchSuggestions.slice(0, 3).map(s => s.value).join(', ')}
                                </small>
                              </div>
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilPeople} className="me-2" size="xl" />
                              <br />
                              No employees found
                              <br />
                              <small className="d-block mt-2">
                                Start by adding your first employee to the system
                              </small>
                              {hasPermission(PERMISSIONS.EMPLOYEES_CREATE) && (
                                <div className="mt-3">
                                  <Link to="/employees/create">
                                    <CButton color="primary" size="sm">
                                      <CIcon icon={cilPlus} className="me-2" />
                                      Add First Employee
                                    </CButton>
                                  </Link>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>

              {/* Pagination - Always show if there are employees */}
              {totalEmployees > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <small className="text-medium-emphasis">
                      Showing {((currentPage - 1) * rows) + 1} to {Math.min(currentPage * rows, totalEmployees)} of {totalEmployees} entries
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {/* Rows per page selector */}
                    <div className="d-flex align-items-center">
                      <small className="me-2 text-medium-emphasis">Rows per page:</small>
                      <CFormSelect
                        size="sm"
                        value={rows}
                        onChange={(e) => handleRowsChange(Number(e.target.value))}
                        style={{ width: '80px' }}
                      >
                        {config.pagination.pageSizeOptions.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </CFormSelect>
                    </div>
                    
                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <CPagination>
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
                        
                        {getPaginationItems()}
                        
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
                    )}
                  </div>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Delete Confirmation Modal */}
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