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
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CToast,
  CToastBody,
  CToastHeader
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilTrash, cilPrint, cilMoney, cilSearch, cilFilter } from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import payrollService from '../services/payrollService';
import employeeService from '../../employees/services/employeeService';

console.log('PayrollService imported:', payrollService);

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
  const [pageSize, setPageSize] = useState(5); // Default to 5 as per requirements
  const [searchParams, setSearchParams] = useState({
    search: '',
    payroll_periode: '',
    employee_name: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Generate Payroll Modal State
  const [showGeneratePayrollModal, setShowGeneratePayrollModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollPeriod, setPayrollPeriod] = useState('');
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [payrollError, setPayrollError] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  
  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: '',
    color: 'success' // success, danger, warning, info
  });

  useDocumentTitle('Payroll List');

  const loadPayrolls = async () => {
    try {
      console.log('Loading payrolls, page:', currentPage, 'params:', searchParams);
      setLoading(true);
      
      const serviceParams = {
        page: currentPage,
        rows: pageSize,
        ...searchParams
      };
      
      console.log('Service params being sent:', serviceParams);
      
      const response = await payrollService.getPayrolls(serviceParams);
      console.log('Payroll response:', response);
      
      if (response) {
        console.log('Response data:', response);
        // The service already parsed the response structure
        setPayrolls(response.data || []);
        // Ensure we're correctly setting totalPages and totalRecords from the service response
        const pages = response.pages || 1;
        console.log('Setting totalPages:', pages);
        const total = response.total || 0;
        setTotalPages(pages);
        setTotalRecords(total);
        console.log('Setting totalPages:', pages);
        console.log('Setting totalRecords:', total);
      } else {
        setPayrolls([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error loading payrolls:', error);
      console.error('Error stack:', error.stack);
      setPayrolls([]);
      setTotalPages(1);
      // Show error toast
      showToast(error.message || 'Failed to load payrolls', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Load payrolls when page or page size changes
  useEffect(() => {
    loadPayrolls();
  }, [currentPage, pageSize]);

  const handlePageChange = (page) => {
    console.log('Changing page to:', page);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (field, value) => {
    console.log('Search param changed:', field, '=', value);
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
    // Don't reset page here to prevent losing focus
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search form submitted with params:', searchParams);
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

  const resetFilters = () => {
    setSearchParams({
      search: '',
      payroll_periode: '',
      employee_name: ''
    });
    setCurrentPage(1);
  };

  // Handle Generate Payroll
  const handleGeneratePayroll = () => {
    console.log('Opening generate payroll modal');
    console.log('Employee service:', employeeService);
    console.log('Employee service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(employeeService)));
    setSelectedEmployee(null);
    setPayrollPeriod('');
    setPayrollError('');
    setEmployeeSearchTerm('');
    setEmployeeSearchResults([]);
    setShowGeneratePayrollModal(true);
  };

  // Handle modal close with confirmation
  const handleModalClose = () => {
    // Prevent modal from closing when clicking outside
    // But allow closing via Cancel or Generate buttons
    console.log('Modal close requested - preventing close on backdrop click');
    // Do nothing to prevent closing
    // Modal can only be closed via explicit button actions
  };

  // Search employees for the payroll modal
  const searchEmployeesForPayroll = async (searchTerm) => {
    console.log('Searching employees with term:', searchTerm);
    console.log('Employee service:', employeeService);
    if (!searchTerm.trim()) {
      setEmployeeSearchResults([]);
      return;
    }

    try {
      setSearchingEmployees(true);
      console.log('Calling employeeService.getAllEmployees');
      
      // Temporary workaround to test if the method exists
      if (typeof employeeService.getAllEmployees !== 'function') {
        console.error('employeeService.getAllEmployees is not a function, trying alternative approach');
        
        // Try to call the method directly from the prototype
        const proto = Object.getPrototypeOf(employeeService);
        if (proto.getAllEmployees && typeof proto.getAllEmployees === 'function') {
          console.log('Found method in prototype, calling it');
          const employees = await proto.getAllEmployees.call(employeeService, searchTerm);
          console.log('Employees found (from prototype):', employees);
          setEmployeeSearchResults(employees || []);
          return;
        } else {
          // Fallback: use the existing getEmployees method with search
          console.log('Using fallback method: getEmployees with search');
          const response = await employeeService.getEmployees({ 
            page: 1, 
            rows: 10, 
            search: searchTerm 
          });
          console.log('Fallback response:', response);
          setEmployeeSearchResults(response.data || []);
          return;
        }
      }
      
      const employees = await employeeService.getAllEmployees(searchTerm);
      console.log('Employees found:', employees);
      setEmployeeSearchResults(employees || []);
    } catch (error) {
      console.error('Error searching employees:', error);
      setPayrollError('Failed to search employees: ' + error.message);
    } finally {
      setSearchingEmployees(false);
    }
  };

  // Handle employee search input change
  const handleEmployeeSearchChange = (e) => {
    const value = e.target.value;
    setEmployeeSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchEmployeesForPayroll(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Select employee for payroll
  const selectEmployeeForPayroll = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearchTerm(employee.name);
    setEmployeeSearchResults([]);
  };

  // Generate payroll
  const generatePayroll = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      setPayrollError('Please select an employee');
      return;
    }
    
    if (!payrollPeriod.trim()) {
      setPayrollError('Please enter a payroll period');
      return;
    }

    try {
      setGeneratingPayroll(true);
      setPayrollError('');
      
      // Call the payroll service to generate the payroll
      await payrollService.generatePayroll(selectedEmployee.employee_id, payrollPeriod);
      
      // Close modal
      setShowGeneratePayrollModal(false);
      setSelectedEmployee(null);
      setPayrollPeriod('');
      
      // Show success toast
      showToast('Payroll generated successfully', 'success');
      
      // Refresh the payroll list
      await loadPayrolls();
      
    } catch (error) {
      console.error('Error generating payroll:', error);
      setPayrollError(error.message || 'Failed to generate payroll');
      // Show error toast
      showToast(error.message || 'Failed to generate payroll', 'danger');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  // Show toast notification
  const showToast = (message, color = 'success') => {
    setToast({
      show: true,
      message,
      color
    });
    
    // Auto hide toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({
        ...prev,
        show: false
      }));
    }, 3000);
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

  // Add this function to handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
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
                  <CButton 
                    color="primary"
                    onClick={handleGeneratePayroll}
                    className="me-2"
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Generate Payroll
                  </CButton>
                  <CButton 
                    color="info"
                    onClick={() => console.log('Generate Mass clicked')}
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Generate Mass
                  </CButton>
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody>
              {/* Error Alert */}
              {/* {error && (
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
              )} */}
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
                  </div>
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
      
      {/* Generate Payroll Modal */}
      <CModal 
        visible={showGeneratePayrollModal} 
        onClose={handleModalClose}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Generate Payroll</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {payrollError && (
            <CAlert color="danger" className="mb-3">
              {payrollError}
            </CAlert>
          )}
          
          <div className="mb-3">
            <label className="form-label">Employee</label>
            <div className="position-relative">
              <CFormInput
                type="text"
                placeholder="Type to search employees..."
                value={employeeSearchTerm}
                onChange={handleEmployeeSearchChange}
                disabled={generatingPayroll}
              />
              {selectedEmployee && (
                <div className="mt-2">
                  <CBadge color="info">
                    {selectedEmployee.name} ({selectedEmployee.nik})
                  </CBadge>
                </div>
              )}
              
              {/* Employee search results as dropdown */}
              {employeeSearchResults.length > 0 && (
                <div 
                  className="position-absolute w-100 mt-1" 
                  style={{ 
                    zIndex: 1000, 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {employeeSearchResults.map((employee) => (
                    <div
                      key={employee.employee_id}
                      className="p-2 border-bottom cursor-pointer hover-bg-light"
                      onClick={() => selectEmployeeForPayroll(employee)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between">
                        <div className="fw-bold">{employee.name}</div>
                        <div className="text-muted small">ID: {employee.employee_id}</div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <small className="text-muted">{employee.nik}</small>
                        <small className="text-muted">{employee.email}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchingEmployees && (
                <div className="mt-2">
                  <CSpinner size="sm" className="me-2" />
                  <small>Searching...</small>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="text"
              placeholder="Enter period (e.g., 202501)"
              value={payrollPeriod}
              onChange={(e) => setPayrollPeriod(e.target.value)}
              disabled={generatingPayroll}
              required
            />
            <small className="text-muted">Format: YYYYMM (e.g., 202501 for January 2025)</small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowGeneratePayrollModal(false)}
            disabled={generatingPayroll}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={generatePayroll}
            disabled={generatingPayroll || !selectedEmployee || !payrollPeriod.trim()}
          >
            {generatingPayroll ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              'Generate Payroll'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
      
      {/* Toast Notification */}
      <div 
        className="position-fixed bottom-0 end-0 p-3" 
        style={{ zIndex: 1100 }}
      >
        <CToast
          autohide={false}
          visible={toast.show}
          color={toast.color}
          className="align-items-center"
        >
          <div className="d-flex">
            <CToastBody>{toast.message}</CToastBody>
            <button
              type="button"
              className="btn-close me-2 m-auto"
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
            ></button>
          </div>
        </CToast>
      </div>
    </PayrollListErrorBoundary>
  );
};

export default PayrollList;