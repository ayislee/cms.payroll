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
  cilEyedropper,
  cilInfo
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatPhoneNumber, truncateText } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import { PTKP_OPTIONS } from '../../../constants/payrollConstants';
import employeeService from '../services/employeeService';
import config from '../../../config/environment';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [rows, setRows] = useState(config.pagination.defaultRows);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load employees data
  const loadEmployees = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
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
    }
  }, [rows]);

  // Initial load
  useEffect(() => {
    loadEmployees(1, searchTerm);
  }, [loadEmployees, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadEmployees(1, value);
    }, 500);

    return () => clearTimeout(timeoutId);
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
                  <CInputGroup>
                    <CFormInput
                      placeholder="Search by name, NIK, or email..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <CButton color="outline-secondary" variant="outline">
                      <CIcon icon={cilMagnifyingGlass} />
                    </CButton>
                  </CInputGroup>
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
                    <CTableHeaderCell>NIK</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Phone</CTableHeaderCell>
                    <CTableHeaderCell>Company</CTableHeaderCell>
                    <CTableHeaderCell>PTKP</CTableHeaderCell>
                    <CTableHeaderCell>Hire Date</CTableHeaderCell>
                    <CTableHeaderCell width="120">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <CTableRow key={employee.employee_id}>
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
                      <CTableDataCell colSpan="8" className="text-center py-4">
                        <div className="text-medium-emphasis">
                          {searchTerm ? (
                            <>
                              No employees found for "{searchTerm}"
                              <br />
                              <CButton
                                color="link"
                                size="sm"
                                onClick={() => setSearchTerm('')}
                              >
                                Clear search
                              </CButton>
                            </>
                          ) : (
                            <>
                              No employees found
                              <br />
                              {hasPermission(PERMISSIONS.EMPLOYEES_CREATE) && (
                                <Link to="/employees/create">
                                  <CButton color="primary" size="sm" className="mt-2">
                                    Add First Employee
                                  </CButton>
                                </Link>
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