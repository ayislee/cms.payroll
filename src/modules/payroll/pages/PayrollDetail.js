// ========================================
// PAYROLL DETAIL PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CAlert,
  CListGroup,
  CListGroupItem,
  CBreadcrumb,
  CBreadcrumbItem,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilArrowLeft, 
  cilPrint, 
  cilEnvelope, 
  cilMoney,
  cilUser,
  cilCalendar,
  cilDollar
} from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import payrollService from '../services/payrollService';

// Error Boundary Component
class PayrollDetailErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PayrollDetail Error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <CAlert color="danger">
          <h4>Something went wrong.</h4>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </CAlert>
      );
    }

    return this.props.children;
  }
}

const PayrollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(payroll ? `Payroll Detail - ${payroll.employee?.name}` : 'Payroll Detail');

  useEffect(() => {
    loadPayroll();
  }, [id]);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await payrollService.getPayrollById(id);
      
      if (response && response.data) {
        setPayroll(response.data);
      } else {
        setError('Payroll not found');
      }
    } catch (error) {
      console.error('Error loading payroll:', error);
      setError(error.message || 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading payroll details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        {error}
        <div className="mt-2">
          <Link to="/payroll">
            <CButton color="primary" size="sm">
              Back to Payroll List
            </CButton>
          </Link>
        </div>
      </CAlert>
    );
  }

  if (!payroll) {
    return (
      <CAlert color="warning">
        Payroll not found
        <div className="mt-2">
          <Link to="/payroll">
            <CButton color="primary" size="sm">
              Back to Payroll List
            </CButton>
          </Link>
        </div>
      </CAlert>
    );
  }

  const payrollData = payroll.payroll;
  const summary = payroll.summary;

  return (
    <PayrollDetailErrorBoundary>
      <>
        <CBreadcrumb className="mb-4">
          <CBreadcrumbItem href="/payroll">Payroll</CBreadcrumbItem>
          <CBreadcrumbItem active>Detail</CBreadcrumbItem>
        </CBreadcrumb>

        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader>
                <CRow className="align-items-center">
                  <CCol>
                    <h4 className="mb-0">
                      <CIcon icon={cilMoney} className="me-2" />
                      Payroll Detail
                    </h4>
                    <small className="text-medium-emphasis">
                      {payrollData.employee?.name} - {payrollData.payroll_periode}
                    </small>
                  </CCol>
                  <CCol xs="auto">
                    <CButton color="secondary" variant="outline" onClick={() => navigate('/payroll')}>
                      <CIcon icon={cilArrowLeft} className="me-1" />
                      Back to List
                    </CButton>
                  </CCol>
                </CRow>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  {/* Employee Information */}
                  <CCol lg={6}>
                    <CCard className="h-100">
                      <CCardHeader>
                        <h5 className="mb-0">
                          <CIcon icon={cilUser} className="me-2" />
                          Employee Information
                        </h5>
                      </CCardHeader>
                      <CCardBody>
                        <CListGroup flush>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Employee Name</strong>
                            </div>
                            <div className="text-end">
                              {payrollData.employee?.name || 'N/A'}
                            </div>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Employee NIK</strong>
                            </div>
                            <div className="text-end">
                              {payrollData.employee?.nik || 'N/A'}
                            </div>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Employee Email</strong>
                            </div>
                            <div className="text-end">
                              {payrollData.employee?.email || 'N/A'}
                            </div>
                          </CListGroupItem>
                        </CListGroup>
                      </CCardBody>
                    </CCard>
                  </CCol>

                  {/* Payroll Information */}
                  <CCol lg={6}>
                    <CCard className="h-100">
                      <CCardHeader>
                        <h5 className="mb-0">
                          <CIcon icon={cilCalendar} className="me-2" />
                          Payroll Information
                        </h5>
                      </CCardHeader>
                      <CCardBody>
                        <CListGroup flush>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Payroll Period</strong>
                            </div>
                            <div className="text-end">
                              {payrollData.payroll_periode || 'N/A'}
                            </div>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Created At</strong>
                            </div>
                            <div className="text-end">
                              {formatDateTime(payrollData.created_at)}
                            </div>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Status</strong>
                            </div>
                            <div className="text-end">
                              <CBadge color={payrollData.is_printed ? 'success' : 'secondary'} className="me-1">
                                {payrollData.is_printed ? 'Printed' : 'Not Printed'}
                              </CBadge>
                              <CBadge color={payrollData.is_emailed ? 'success' : 'secondary'}>
                                {payrollData.is_emailed ? 'Emailed' : 'Not Emailed'}
                              </CBadge>
                            </div>
                          </CListGroupItem>
                        </CListGroup>
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>

                {/* Payroll Summary */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <CCard>
                      <CCardHeader>
                        <h5 className="mb-0">
                          <CIcon icon={cilDollar} className="me-2" />
                          Payroll Summary
                        </h5>
                      </CCardHeader>
                      <CCardBody>
                        <CListGroup flush>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Total Earnings</strong>
                            </div>
                            <div className="text-end">
                              <strong className="text-success">
                                {formatCurrency(summary.total_earning)}
                              </strong>
                            </div>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Total Deductions</strong>
                            </div>
                            <div className="text-end">
                              <strong className="text-danger">
                                {formatCurrency(summary.total_deduction)}
                              </strong>
                            </div>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>Net Pay</strong>
                            </div>
                            <div className="text-end">
                              <strong className="fs-5">
                                {formatCurrency(summary.net_pay)}
                              </strong>
                            </div>
                          </CListGroupItem>
                        </CListGroup>
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>

                {/* Payroll Details */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <CCard>
                      <CCardHeader>
                        <h5 className="mb-0">
                          <CIcon icon={cilMoney} className="me-2" />
                          Payroll Components
                        </h5>
                      </CCardHeader>
                      <CCardBody>
                        {payrollData.payrollDetails && payrollData.payrollDetails.length > 0 ? (
                          <CTable responsive hover>
                            <CTableHead>
                              <CTableRow>
                                <CTableHeaderCell>Component</CTableHeaderCell>
                                <CTableHeaderCell>Code</CTableHeaderCell>
                                <CTableHeaderCell>Category</CTableHeaderCell>
                                <CTableHeaderCell>Type</CTableHeaderCell>
                                <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {payrollData.payrollDetails.map((detail) => {
                                const component = detail.mainComponent;
                                return (
                                  <CTableRow key={detail.payroll_detail_id}>
                                    <CTableDataCell>
                                      <div>
                                        <strong>{component?.name || 'N/A'}</strong>
                                      </div>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                      {component?.code || 'N/A'}
                                    </CTableDataCell>
                                    <CTableDataCell>
                                      <CBadge color="info">
                                        {component?.category || 'N/A'}
                                      </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                      <CBadge 
                                        color={component?.type === 'Earning' ? 'success' : 'danger'}
                                      >
                                        {component?.type || 'N/A'}
                                      </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell className="text-end">
                                      {formatCurrency(detail.amount)}
                                    </CTableDataCell>
                                  </CTableRow>
                                );
                              })}
                            </CTableBody>
                          </CTable>
                        ) : (
                          <div className="text-center py-3">
                            <p className="text-medium-emphasis">
                              No payroll components found.
                            </p>
                          </div>
                        )}
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>

                {/* Action Buttons */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <div className="d-flex justify-content-end gap-2">
                      <CButton color="secondary" variant="outline" onClick={() => navigate('/payroll')}>
                        <CIcon icon={cilArrowLeft} className="me-1" />
                        Back to List
                      </CButton>
                      <CButton color="success" disabled={!payrollData.is_printed}>
                        <CIcon icon={cilPrint} className="me-1" />
                        Print
                      </CButton>
                      <CButton color="warning" disabled={!payrollData.is_emailed}>
                        <CIcon icon={cilEnvelope} className="me-1" />
                        Email
                      </CButton>
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </>
    </PayrollDetailErrorBoundary>
  );
};

export default PayrollDetail;