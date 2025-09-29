// ========================================
// PAYROLL LIST PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  CBadge,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilTrash, cilPrint, cilMoney, cilSearch, cilFilter } from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import payrollService from '../services/payrollService';

// Error Boundary Component
class PayrollListErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PayrollList Error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <CAlert color="danger">
          <h4>Something went wrong in the Payroll List component.</h4>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details (Click to expand)</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </CAlert>
      );
    }

    return this.props.children;
  }
}

const PayrollList = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchParams, setSearchParams] = useState({
    search: '',
    payroll_periode: '',
    employee_name: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useDocumentTitle('Payroll List');

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      setError('');
      
      const serviceParams = {
        page: currentPage,
        rows: pageSize,
        ...searchParams
      };
      
      const response = await payrollService.getPayrolls(serviceParams);
      
      if (response) {
        setPayrolls(response.data || []);
        setTotalRecords(response.total || 0);
        setTotalPages(response.lastPage || Math.ceil((response.total || 0) / pageSize));
        setCurrentPage(response.page || currentPage);
      } else {
        setPayrolls([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error loading payrolls:', error);
      setError(error.message || 'Failed to load payrolls');
      setPayrolls([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Load payrolls when page changes
  useEffect(() => {
    loadPayrolls();
  }, [currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPayrolls();
  };

  // Auto-search with debounce to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchParams.search || searchParams.payroll_periode || searchParams.employee_name) {
        setCurrentPage(1);
        loadPayrolls();
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchParams]);

  // Reload payrolls when pageSize or currentPage changes
  useEffect(() => {
    loadPayrolls();
  }, [currentPage, pageSize]);

  const resetFilters = () => {
    setSearchParams({
      search: '',
      payroll_periode: '',
      employee_name: ''
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading payrolls...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        <h4>Error Loading Payrolls</h4>
        <p>{error}</p>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
        <CButton color="primary" onClick={loadPayrolls}>Retry</CButton>
      </CAlert>
    );
  }

  return (
    <PayrollListErrorBoundary>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  <strong>Payroll Management</strong>
                </CCol>
                <CCol xs="auto">
                  <CButton 
                    color="secondary" 
                    variant="outline" 
                    className="me-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <CIcon icon={cilFilter} className="me-1" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </CButton>
                  <Link to="/payroll/generate">
                    <CButton color="primary">
                      <CIcon icon={cilPlus} className="me-1" />
                      Generate Payroll
                    </CButton>
                  </Link>
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody>
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
                        placeholder="Search by period or employee name..."
                        value={searchParams.search}
                        onChange={(e) => handleSearchChange('search', e.target.value)}
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
                
                {showFilters && (
                  <CRow>
                    <CCol md={6} className="mb-3">
                      <CFormInput
                        type="text"
                        placeholder="Payroll Period (e.g., 2023-01)"
                        value={searchParams.payroll_periode}
                        onChange={(e) => handleSearchChange('payroll_periode', e.target.value)}
                      />
                    </CCol>
                    <CCol md={6} className="mb-3">
                      <CFormInput
                        type="text"
                        placeholder="Employee Name"
                        value={searchParams.employee_name}
                        onChange={(e) => handleSearchChange('employee_name', e.target.value)}
                      />
                    </CCol>
                  </CRow>
                )}
              </CForm>
              
              {/* Rows per page selector */}
              <div className="d-flex justify-content-end mb-3">
                <div className="d-flex align-items-center">
                  <small className="me-2">Rows per page:</small>
                  <CFormSelect
                    size="sm"
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      setCurrentPage(1);
                    }}
                    style={{ width: '80px' }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </CFormSelect>
                </div>
              </div>

              {payrolls.length > 0 ? (
                <>
                  <CTable responsive hover>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Employee</CTableHeaderCell>
                        <CTableHeaderCell>Period</CTableHeaderCell>
                        <CTableHeaderCell>Net Pay</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Created At</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {payrolls.map((payroll) => (
                        <CTableRow key={payroll.payroll_id}>
                          <CTableDataCell>
                            <div>
                              <strong>{payroll.employee?.name || 'N/A'}</strong>
                              <div className="small text-medium-emphasis">
                                {payroll.employee?.nik || 'No NIK'}
                              </div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            {payroll.payroll_periode || '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            <strong>{formatCurrency(payroll.net_pay)}</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={payroll.is_printed ? 'success' : 'secondary'} className="me-1">
                              {payroll.is_printed ? 'Printed' : 'Not Printed'}
                            </CBadge>
                            <CBadge color={payroll.is_emailed ? 'success' : 'secondary'}>
                              {payroll.is_emailed ? 'Emailed' : 'Not Emailed'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatDate(payroll.created_at)}
                          </CTableDataCell>
                          <CTableDataCell>
                            <Link to={`/payroll/${payroll.payroll_id}`}>
                              <CButton color="info" size="sm" className="me-1">
                                <CIcon icon={cilMoney} size="sm" />
                              </CButton>
                            </Link>
                            <CButton color="success" size="sm" className="me-1" disabled={!payroll.is_printed}>
                              <CIcon icon={cilPrint} size="sm" />
                            </CButton>
                            <CButton color="warning" size="sm" className="me-1" disabled={!payroll.is_emailed}>
                              <CIcon icon={cilMoney} size="sm" />
                            </CButton>
                            <CButton color="danger" size="sm" disabled>
                              <CIcon icon={cilTrash} size="sm" />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                  
                  {/* Pagination - simplified to match UserList approach */}
                  {totalRecords > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                      </div>
                      <div className="d-flex align-items-center">
                        {totalPages > 1 && (
                          <CPagination align="center" className="mb-0">
                            <CPaginationItem 
                              disabled={currentPage === 1}
                              onClick={() => handlePageChange(currentPage - 1)}
                            >
                              Previous
                            </CPaginationItem>
                            
                            {/* Show page numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              // For simplicity, show first 5 pages or pages around current page
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
                              
                              // Ensure page number is valid
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
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-medium-emphasis">
                    No payrolls found.
                  </p>
                  <Link to="/payroll/generate">
                    <CButton color="primary">
                      <CIcon icon={cilPlus} className="me-1" />
                      Generate First Payroll
                    </CButton>
                  </Link>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </PayrollListErrorBoundary>
  );
};

export default PayrollList;