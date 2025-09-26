// ========================================
// COMPANY LIST PAGE - CLEAN IMPLEMENTATION
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
  cilBuilding,
  cilPlus,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilReload,
  cilInfo,
  cilCheckCircle,
  cilXCircle
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import companyService from '../services/companyService';
import config from '../../../config/environment';

const CompanyList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Set document title
  useDocumentTitle('Company Management');

  // State management
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [rows, setRows] = useState(config.pagination.defaultRows);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Load companies data
  const loadCompanies = useCallback(async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      setIsSearching(search.trim() !== '');
      setError('');

      const params = {
        page,
        rows,
        search: search.trim()
      };

      // Add status filter if not 'all'
      if (status !== 'all') {
        params.is_active = status === 'active';
      }

      const response = await companyService.getCompanies(params);

      setCompanies(response.data || []);
      setTotalCompanies(response.total || 0);
      setTotalPages(response.lastPage || Math.ceil((response.total || 0) / rows));
      setCurrentPage(response.page || page);

    } catch (error) {
      console.error('Error loading companies:', error);
      setError(error.message || 'Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [rows]);

  // Initial load
  useEffect(() => {
    loadCompanies(1, searchTerm, statusFilter);
  }, [loadCompanies, searchTerm, statusFilter]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);

    // Debounce search
    const timeoutId = setTimeout(() => {
      loadCompanies(1, value, statusFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    loadCompanies(1, searchTerm, status);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadCompanies(page, searchTerm, statusFilter);
  };

  // Handle rows per page change
  const handleRowsChange = (newRows) => {
    setRows(newRows);
    setCurrentPage(1);
    loadCompanies(1, searchTerm, statusFilter);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadCompanies(currentPage, searchTerm, statusFilter);
  };

  // Handle delete
  const handleDelete = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      setDeleting(true);
      await companyService.deleteCompany(companyToDelete.company_id);

      setShowDeleteModal(false);
      setCompanyToDelete(null);

      // Reload current page
      loadCompanies(currentPage, searchTerm, statusFilter);

    } catch (error) {
      console.error('Error deleting company:', error);
      setError(error.message || 'Failed to delete company');
    } finally {
      setDeleting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (company) => {
    try {
      await companyService.toggleCompanyStatus(company.company_id);

      // Reload current page
      loadCompanies(currentPage, searchTerm, statusFilter);

    } catch (error) {
      console.error('Error toggling company status:', error);
      setError(error.message || 'Failed to update company status');
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

  if (loading && companies.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading companies...</span>
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
                    <CIcon icon={cilBuilding} className="me-2" />
                    Company Management
                  </h4>
                  <small className="text-medium-emphasis">
                    Manage company data and information
                  </small>
                </CCol>
                <CCol xs="auto">
                  {/* Add Company button removed */}
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              {/* Search and Filters */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CFormInput
                      placeholder="Search by name, code, or email..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <CButton color="outline-secondary" variant="outline">
                      <CIcon icon={cilMagnifyingGlass} />
                    </CButton>
                  </CInputGroup>
                  {isSearching && (
                    <small className="text-info mt-1 d-block">
                      <CSpinner size="sm" className="me-2" />
                      Searching...
                    </small>
                  )}
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
                  {totalCompanies > 0 ? (
                    <>
                      Showing {((currentPage - 1) * rows) + 1} to {Math.min(currentPage * rows, totalCompanies)} of {totalCompanies} companies
                      {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                      {searchTerm && ` (filtered by "${searchTerm}")`}
                    </>
                  ) : (
                    <>
                      No companies found
                      {searchTerm && ` for "${searchTerm}"`}
                    </>
                  )}
                </small>
              </div>

              {/* Company Table */}
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell width="80">ID</CTableHeaderCell>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Phone</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Created</CTableHeaderCell>
                    <CTableHeaderCell width="150">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <CTableRow key={company.company_id}>
                        <CTableDataCell>
                          <CBadge color="primary" className="fs-6">
                            #{company.company_id}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{company.code}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>
                            <strong>{company.name}</strong>
                            {company.address && (
                              <div>
                                <small className="text-muted">
                                  {company.address.length > 50
                                    ? `${company.address.substring(0, 50)}...`
                                    : company.address
                                  }
                                </small>
                              </div>
                            )}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{company.email || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{formatPhoneNumber(company.phone) || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={company.is_active ? 'success' : 'danger'}>
                            {company.is_active ? (
                              <>
                                <CIcon icon={cilCheckCircle} className="me-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <CIcon icon={cilXCircle} className="me-1" />
                                Inactive
                              </>
                            )}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{formatDate(company.created_at) || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <Link to={`/companies/${company.company_id}`}>
                              <CButton color="info" variant="outline" size="sm" title="View Details">
                                <CIcon icon={cilInfo} />
                              </CButton>
                            </Link>
                            {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                              <Link to={`/companies/${company.company_id}/edit`}>
                                <CButton color="warning" variant="outline" size="sm" title="Edit Company">
                                  <CIcon icon={cilPencil} />
                                </CButton>
                              </Link>
                            )}
                            {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                              <CButton
                                color={company.is_active ? 'secondary' : 'success'}
                                variant="outline"
                                size="sm"
                                title={company.is_active ? 'Deactivate' : 'Activate'}
                                onClick={() => handleToggleStatus(company)}
                              >
                                {company.is_active ? (
                                  <CIcon icon={cilXCircle} />
                                ) : (
                                  <CIcon icon={cilCheckCircle} />
                                )}
                              </CButton>
                            )}
                            {hasPermission(PERMISSIONS.COMPANIES_DELETE) && (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                title="Delete Company"
                                onClick={() => handleDelete(company)}
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
                              <CIcon icon={cilMagnifyingGlass} className="me-2" size="xl" />
                              <br />
                              No companies found for "{searchTerm}"
                              <br />
                              <CButton
                                color="link"
                                size="sm"
                                onClick={() => setSearchTerm('')}
                                className="mt-2"
                              >
                                Clear search
                              </CButton>
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilBuilding} className="me-2" size="xl" />
                              <br />
                              No companies found
                              <br />
                              <small className="d-block mt-2">
                                No companies available in the system
                              </small>
                            </>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              {totalCompanies > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <small className="text-medium-emphasis">
                      Showing {((currentPage - 1) * rows) + 1} to {Math.min(currentPage * rows, totalCompanies)} of {totalCompanies} entries
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
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
          <CModalTitle>Confirm Deactivation</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {companyToDelete && (
            <>
              Are you sure you want to {companyToDelete.is_active ? 'deactivate' : 'activate'} company:
              <br />
              <strong>{companyToDelete.name}</strong> ({companyToDelete.code})?
              <br />
              <br />
              <small className="text-danger">
                {companyToDelete.is_active
                  ? 'Deactivated companies will be hidden from the list but data will be preserved.'
                  : 'Activating will make the company visible again.'
                }
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
            color={companyToDelete?.is_active ? 'warning' : 'success'}
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {companyToDelete?.is_active ? 'Deactivating...' : 'Activating...'}
              </>
            ) : (
              companyToDelete?.is_active ? 'Deactivate' : 'Activate'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CompanyList;
