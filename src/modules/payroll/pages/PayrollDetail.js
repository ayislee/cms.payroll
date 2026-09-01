// ========================================
// PAYROLL DETAIL PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilPrint, cilMoney, cilCloudDownload, cilTrash } from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import payrollService from '../services/payrollService';

const PayrollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  useDocumentTitle('Payroll Detail');

  const loadPayrollDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await payrollService.getPayrollById(id);
      console.log('Payroll detail response:', response);
      
      if (response && response.data) {
        setPayroll(response.data);
      } else if (response) {
        // Handle case where response structure is different
        setPayroll(response);
      } else {
        setError('Payroll not found');
      }
    } catch (error) {
      console.error('Error loading payroll detail:', error);
      setError(error.message || 'Failed to load payroll detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollDetail();
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    const numeric = Number(value || 0);
    return `${numeric.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    })}%`;
  };

  const isTruthy = (value) => value === true || value === 1 || value === '1' || value === 'true';

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isPrinted, isEmailed) => {
    if (isPrinted && isEmailed) {
      return (
        <>
          <CBadge color="success" className="me-1">Checked</CBadge>
          <CBadge color="success">Emailed</CBadge>
        </>
      );
    } else if (isPrinted) {
      return <CBadge color="success">Checked</CBadge>;
    } else if (isEmailed) {
      return <CBadge color="success">Emailed</CBadge>;
    } else {
      return <CBadge color="secondary">Needs Check</CBadge>;
    }
  };

  const canDeletePayroll = (payrollData) =>
    !Boolean(payrollData?.is_printed) &&
    !Boolean(payrollData?.is_emailed) &&
    !Boolean(payrollData?.is_posted);

  const getDeletePayrollDisabledReason = (payrollData) => {
    if (payrollData?.is_printed) return 'Payroll already checked and cannot be deleted';
    if (payrollData?.is_emailed) return 'Payroll already emailed and cannot be deleted';
    if (payrollData?.is_posted) return 'Payroll already posted and cannot be deleted';
    return '';
  };

  const handleDeletePayroll = async () => {
    if (!payroll?.payroll?.payroll_id) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');

      await payrollService.deletePayroll(payroll.payroll.payroll_id);
      setShowDeleteModal(false);
      window.alert('Payroll deleted successfully');
      navigate('/payroll');
    } catch (deleteError) {
      console.error('Error deleting payroll:', deleteError);
      setDeleteError(deleteError.message || 'Failed to delete payroll.');
    } finally {
      setDeleting(false);
    }
  };

  const getCompanyLabel = (payrollData) => {
    if (!payrollData) {
      return '-';
    }

    const companyFromEmployee = payrollData.employee?.company;
    if (companyFromEmployee && typeof companyFromEmployee === 'object') {
      return companyFromEmployee.name || `Company #${companyFromEmployee.company_id}`;
    }

    if (payrollData.company && typeof payrollData.company === 'object') {
      return payrollData.company.name || `Company #${payrollData.company.company_id}`;
    }

    if (payrollData.company_name) {
      return payrollData.company_name;
    }

    if (payrollData.company_id) {
      return `Company #${payrollData.company_id}`;
    }

    return '-';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading payroll detail...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="danger">
            <h4>Error Loading Payroll</h4>
            <p>{error}</p>
            <CButton color="primary" onClick={loadPayrollDetail}>Retry</CButton>
          </CAlert>
        </CCol>
      </CRow>
    );
  }

  if (!payroll) {
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="warning">
            <h4>Payroll Not Found</h4>
            <p>Unable to find payroll with ID: {id}</p>
          </CAlert>
        </CCol>
      </CRow>
    );
  }

  // Separate earnings and deductions
  const earnings = payroll.payroll.payrollDetails.filter(detail => detail.mainComponent.type === 'Earning');
  const deductions = payroll.payroll.payrollDetails.filter(detail => detail.mainComponent.type === 'Deduction');
  const benefits = payroll.payroll.payrollBenefits || [];
  
  // Calculate totals
  const totalEarning = earnings.reduce((sum, detail) => sum + (detail.amount || 0), 0);
  const totalDeduction = deductions.reduce((sum, detail) => sum + (detail.amount || 0), 0);
  const totalEmployeeBenefit = benefits.reduce((sum, benefit) => sum + Number(benefit.employee_amount || 0), 0);
  const totalEmployerBenefit = benefits.reduce((sum, benefit) => sum + Number(benefit.employer_amount || 0), 0);
  const totalBenefit = benefits.reduce((sum, benefit) => sum + Number(benefit.total_amount || 0), 0);
  const totalTaxableBenefit = benefits.reduce((sum, benefit) => sum + Number(benefit.taxable_amount || 0), 0);
  const companyLabel = getCompanyLabel(payroll.payroll);
  const companyEmail =
    payroll.payroll.employee?.company?.email ||
    payroll.payroll.company?.email ||
    '-';
  const slipUrl = payroll.payroll.slip_url;

  return (
    <CRow>
      <CCol xs={12}>
        <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} alignment="center">
          <CModalHeader>
            <CModalTitle>Delete Payroll</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p className="mb-2">
              Are you sure you want to delete payroll <strong>#{payroll.payroll.payroll_id}</strong> for <strong>{payroll.payroll.employee.name}</strong>?
            </p>
            <p className="mb-0 text-medium-emphasis">
              This will also delete the payroll details and benefits associated with this payroll.
            </p>
            {deleteError && (
              <CAlert color="danger" className="mt-3 mb-0">{deleteError}</CAlert>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </CButton>
            <CButton color="danger" onClick={handleDeletePayroll} disabled={deleting}>
              {deleting ? <CSpinner size="sm" className="me-2" /> : null}
              Delete
            </CButton>
          </CModalFooter>
        </CModal>

        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="align-items-center">
              <CCol>
                <h4 className="mb-0">Payroll Detail</h4>
                <small className="text-medium-emphasis">
                  Payroll ID: #{payroll.payroll.payroll_id} | Period: {payroll.payroll.payroll_periode}
                </small>
              </CCol>
              <CCol xs="auto" className="d-flex flex-wrap gap-2">
                {slipUrl && (
                  <CButton
                    color="primary"
                    variant="outline"
                    component="a"
                    href={slipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CIcon icon={cilCloudDownload} className="me-1" />
                    Download Slip
                  </CButton>
                )}
                <CButton color="secondary" variant="outline">
                  <CIcon icon={cilPrint} className="me-1" />
                  Print
                </CButton>
                <CButton color="info" variant="outline">
                  <CIcon icon={cilMoney} className="me-1" />
                  Email
                </CButton>
                <CButton
                  color="danger"
                  variant="outline"
                  disabled={!canDeletePayroll(payroll.payroll) || deleting}
                  title={
                    canDeletePayroll(payroll.payroll)
                      ? 'Delete payroll'
                      : getDeletePayrollDisabledReason(payroll.payroll)
                  }
                  onClick={() => setShowDeleteModal(true)}
                >
                  {deleting ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilTrash} className="me-1" />}
                  Delete
                </CButton>
              </CCol>
            </CRow>
          </CCardHeader>
          <CCardBody>
            {/* Employee Information */}
            <div className="border rounded p-3 mb-4">
              <h5>Employee Information</h5>
              <CRow>
                <CCol md={6}>
                  <p className="mb-1"><strong>Name:</strong> {payroll.payroll.employee.name}</p>
                  <p className="mb-1"><strong>NIK:</strong> {payroll.payroll.employee.nik}</p>
                  <p className="mb-1"><strong>Company:</strong> {companyLabel}</p>
                </CCol>
                <CCol md={6}>
                  <p className="mb-1"><strong>Email:</strong> {payroll.payroll.employee.email}</p>
                  <p className="mb-1"><strong>Company Email:</strong> {companyEmail}</p>
                  <p className="mb-1"><strong>Status:</strong> {getStatusBadge(payroll.payroll.is_printed, payroll.payroll.is_emailed)}</p>
                </CCol>
              </CRow>
              <CRow className="mt-2">
                <CCol md={6}>
                  <p className="mb-1"><strong>Created:</strong> {formatDate(payroll.payroll.created_at)}</p>
                </CCol>
                <CCol md={6}>
                  <p className="mb-1"><strong>Last Updated:</strong> {formatDate(payroll.payroll.updated_at)}</p>
                </CCol>
              </CRow>
            </div>

            {/* Earnings */}
            <div className="border rounded p-3 mb-4">
              <h5>Earnings</h5>
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell width="50">ID</CTableHeaderCell>
                    <CTableHeaderCell>Component</CTableHeaderCell>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>Category</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {earnings.map((detail) => (
                    <CTableRow key={detail.payroll_detail_id}>
                      <CTableDataCell>{detail.main_component_id}</CTableDataCell>
                      <CTableDataCell>{detail.mainComponent.name}</CTableDataCell>
                      <CTableDataCell><CBadge color="info">{detail.mainComponent.code}</CBadge></CTableDataCell>
                      <CTableDataCell>{detail.mainComponent.category}</CTableDataCell>
                      <CTableDataCell className="text-end">{formatCurrency(detail.amount)}</CTableDataCell>
                    </CTableRow>
                  ))}
                  <CTableRow className="table-active">
                    <CTableDataCell colSpan="4" className="text-end"><strong>Total Earnings:</strong></CTableDataCell>
                    <CTableDataCell className="text-end"><strong>{formatCurrency(totalEarning)}</strong></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            {/* Deductions */}
            <div className="border rounded p-3 mb-4">
              <h5>Deductions</h5>
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell width="50">ID</CTableHeaderCell>
                    <CTableHeaderCell>Component</CTableHeaderCell>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>Category</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {deductions.map((detail) => (
                    <CTableRow key={detail.payroll_detail_id}>
                      <CTableDataCell>{detail.main_component_id}</CTableDataCell>
                      <CTableDataCell>{detail.mainComponent.name}</CTableDataCell>
                      <CTableDataCell><CBadge color="warning">{detail.mainComponent.code}</CBadge></CTableDataCell>
                      <CTableDataCell>{detail.mainComponent.category}</CTableDataCell>
                      <CTableDataCell className="text-end">{formatCurrency(detail.amount)}</CTableDataCell>
                    </CTableRow>
                  ))}
                  <CTableRow className="table-active">
                    <CTableDataCell colSpan="4" className="text-end"><strong>Total Deductions:</strong></CTableDataCell>
                    <CTableDataCell className="text-end"><strong>{formatCurrency(totalDeduction)}</strong></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            {/* Benefits */}
            <div className="border rounded p-3 mb-4">
              <h5>Benefits</h5>
              {benefits.length > 0 ? (
                <CTable responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Benefit</CTableHeaderCell>
                      <CTableHeaderCell>Type</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Base</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Employee %</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Employer %</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Employee Amount</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Employer Amount</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Taxable</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Total</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {benefits.map((benefit) => (
                      <CTableRow key={benefit.payroll_benefit_id}>
                        <CTableDataCell>
                          <div className="fw-semibold">{benefit.benefit_name || 'Benefit'}</div>
                          {benefit.company_benefit_id && (
                            <div className="small text-medium-emphasis">
                              Company Benefit #{benefit.company_benefit_id}
                            </div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>{benefit.benefit_type || '-'}</CTableDataCell>
                        <CTableDataCell className="text-end">{formatCurrency(benefit.base_amount)}</CTableDataCell>
                        <CTableDataCell className="text-end">{formatPercentage(benefit.employee_percentage)}</CTableDataCell>
                        <CTableDataCell className="text-end">{formatPercentage(benefit.employer_percentage)}</CTableDataCell>
                        <CTableDataCell className="text-end">{formatCurrency(benefit.employee_amount)}</CTableDataCell>
                        <CTableDataCell className="text-end">{formatCurrency(benefit.employer_amount)}</CTableDataCell>
                        <CTableDataCell className="text-end">
                          <div>{formatCurrency(benefit.taxable_amount)}</div>
                          <CBadge color={isTruthy(benefit.is_taxable) ? 'warning' : 'secondary'}>
                            {isTruthy(benefit.is_taxable) ? 'Taxable' : 'Non-taxable'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">{formatCurrency(benefit.total_amount)}</CTableDataCell>
                      </CTableRow>
                    ))}
                    <CTableRow className="table-active">
                      <CTableDataCell colSpan="5" className="text-end"><strong>Total Benefits:</strong></CTableDataCell>
                      <CTableDataCell className="text-end"><strong>{formatCurrency(totalEmployeeBenefit)}</strong></CTableDataCell>
                      <CTableDataCell className="text-end"><strong>{formatCurrency(totalEmployerBenefit)}</strong></CTableDataCell>
                      <CTableDataCell className="text-end"><strong>{formatCurrency(totalTaxableBenefit)}</strong></CTableDataCell>
                      <CTableDataCell className="text-end"><strong>{formatCurrency(totalBenefit)}</strong></CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              ) : (
                <p className="text-medium-emphasis mb-0">No benefits recorded for this payroll.</p>
              )}
            </div>

            {/* Summary */}
            <div className="border rounded p-3">
              <CRow>
                <CCol md={8}>
                  <h5>Summary</h5>
                  {payroll.summary ? (
                    <>
                      <p><strong>Total Earnings:</strong> {formatCurrency(payroll.summary.total_earning)}</p>
                      <p><strong>Total Deductions:</strong> {formatCurrency(payroll.summary.total_deduction)}</p>
                      <p><strong>Employee Benefit:</strong> {formatCurrency(payroll.summary.employee_benefit_total)}</p>
                      <p><strong>Employer Benefit:</strong> {formatCurrency(payroll.summary.employer_benefit_total)}</p>
                      <p><strong>Total Benefit:</strong> {formatCurrency(payroll.summary.benefit_total)}</p>
                      <p><strong>Taxable Benefit:</strong> {formatCurrency(payroll.summary.taxable_benefit_total)}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Total Earnings:</strong> {formatCurrency(totalEarning)}</p>
                      <p><strong>Total Deductions:</strong> {formatCurrency(totalDeduction)}</p>
                      <p><strong>Employee Benefit:</strong> {formatCurrency(totalEmployeeBenefit)}</p>
                      <p><strong>Employer Benefit:</strong> {formatCurrency(totalEmployerBenefit)}</p>
                      <p><strong>Total Benefit:</strong> {formatCurrency(totalBenefit)}</p>
                      <p><strong>Taxable Benefit:</strong> {formatCurrency(totalTaxableBenefit)}</p>
                    </>
                  )}
                </CCol>
                <CCol md={4} className="text-end">
                  <h5>Net Pay</h5>
                  <h2 className="text-success">{formatCurrency(payroll.payroll.net_pay)}</h2>
                </CCol>
              </CRow>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default PayrollDetail;
