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
import { cilArrowLeft, cilPrint, cilCloudDownload, cilTrash, cilSettings, cilReload, cilCheckCircle, cilEnvelopeClosed } from '@coreui/icons';
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
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshingPayroll, setRefreshingPayroll] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [refreshSuccess, setRefreshSuccess] = useState('');
  const [checkingPayroll, setCheckingPayroll] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [checkSuccess, setCheckSuccess] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailingPayroll, setEmailingPayroll] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
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
    const checked = isTruthy(isPrinted);
    const emailed = isTruthy(isEmailed);

    if (checked && emailed) {
      return (
        <>
          <CBadge color="success" className="me-1">Checked</CBadge>
          <CBadge color="success">Emailed</CBadge>
        </>
      );
    } else if (checked) {
      return <CBadge color="success">Checked</CBadge>;
    } else if (emailed) {
      return <CBadge color="success">Emailed</CBadge>;
    } else {
      return <CBadge color="secondary">Needs Check</CBadge>;
    }
  };

  const canDeletePayroll = (payrollData) =>
    !isTruthy(payrollData?.is_printed) &&
    !isTruthy(payrollData?.is_emailed) &&
    !isTruthy(payrollData?.is_posted);

  const getDeletePayrollDisabledReason = (payrollData) => {
    if (isTruthy(payrollData?.is_printed)) return 'Payroll already checked and cannot be deleted';
    if (isTruthy(payrollData?.is_emailed)) return 'Payroll already emailed and cannot be deleted';
    if (isTruthy(payrollData?.is_posted)) return 'Payroll already posted and cannot be deleted';
    return '';
  };

  const canRefreshPayroll = (payrollData) =>
    !isTruthy(payrollData?.is_printed) &&
    !isTruthy(payrollData?.is_emailed);

  const getRefreshPayrollDisabledReason = (payrollData) => {
    if (isTruthy(payrollData?.is_emailed)) return 'Payroll already emailed and cannot be regenerated';
    if (isTruthy(payrollData?.is_printed)) return 'Payroll already checked and cannot be regenerated';
    return '';
  };

  const canCheckPayroll = (payrollData) =>
    Boolean(payrollData?.slip_url) && !isTruthy(payrollData?.is_printed);

  const canReopenPayroll = (payrollData) =>
    isTruthy(payrollData?.is_printed) && !isTruthy(payrollData?.is_emailed);

  const getCheckPayrollDisabledReason = (payrollData) => {
    if (isTruthy(payrollData?.is_printed)) {
      return canReopenPayroll(payrollData)
        ? 'Reopen payroll for correction'
        : 'Emailed payroll cannot be reopened';
    }

    if (!payrollData?.slip_url) return 'Payroll slip is not available';
    return 'Mark payroll as checked';
  };

  const canEmailPayroll = (payrollData) =>
    isTruthy(payrollData?.is_printed) &&
    Boolean(payrollData?.slip_url) &&
    Boolean(payrollData?.employee?.email);

  const getEmailPayrollDisabledReason = (payrollData) => {
    if (!isTruthy(payrollData?.is_printed)) return 'Payroll must be checked before emailing';
    if (!payrollData?.slip_url) return 'Payroll slip is not available';
    if (!payrollData?.employee?.email) return 'Employee email is not available';
    if (isTruthy(payrollData?.is_emailed)) return 'Send payroll slip email again';
    return 'Send payroll slip email';
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

  const handleRefreshPayroll = async () => {
    const payrollData = payroll?.payroll;
    const targetEmployeeId = payrollData?.employee?.employee_id || payrollData?.employee_id;
    const targetPayrollPeriod = String(payrollData?.payroll_periode || '').trim();
    const targetCompanyId = payrollData?.company_id || payrollData?.employee?.company_id || '';

    if (!payrollData || !targetEmployeeId || !targetPayrollPeriod) {
      return;
    }

    try {
      setRefreshingPayroll(true);
      setRefreshError('');
      setRefreshSuccess('');

      await payrollService.generatePayroll(
        targetEmployeeId,
        targetPayrollPeriod,
        targetCompanyId
      );
      setShowRefreshModal(false);
      setRefreshSuccess('Payroll berhasil diperbaharui.');
      setCheckSuccess('');
      setEmailSuccess('');
      await loadPayrollDetail();
    } catch (error) {
      console.error('Error refreshing payroll:', error);
      setRefreshError(error.message || 'Gagal memperbaharui payroll.');
    } finally {
      setRefreshingPayroll(false);
    }
  };

  const handleCheckPayroll = async () => {
    const payrollData = payroll?.payroll;
    if (!payrollData?.payroll_id) {
      return;
    }

    const isChecked = isTruthy(payrollData.is_printed);
    const nextChecked = !isChecked;

    if (!isChecked && !canCheckPayroll(payrollData)) {
      setCheckError(getCheckPayrollDisabledReason(payrollData));
      return;
    }

    if (isChecked && !canReopenPayroll(payrollData)) {
      setCheckError(getCheckPayrollDisabledReason(payrollData));
      return;
    }

    try {
      setCheckingPayroll(true);
      setCheckError('');
      setCheckSuccess('');
      setRefreshSuccess('');
      setEmailSuccess('');

      const response = await payrollService.updatePayroll(payrollData.payroll_id, {
        is_printed: nextChecked
      });
      const updatedPayroll = response?.data || null;

      setPayroll((previous) => {
        if (!previous?.payroll) {
          return previous;
        }

        return {
          ...previous,
          payroll: {
            ...previous.payroll,
            ...(updatedPayroll || {}),
            is_printed: nextChecked
          }
        };
      });

      setCheckSuccess(
        nextChecked
          ? 'Payroll berhasil ditandai sudah diverifikasi.'
          : 'Payroll berhasil dibuka kembali untuk koreksi.'
      );
    } catch (error) {
      console.error('Error updating payroll check status:', error);
      setCheckError(error.message || 'Gagal mengubah status verifikasi payroll.');
    } finally {
      setCheckingPayroll(false);
    }
  };

  const handleEmailPayroll = async () => {
    const payrollData = payroll?.payroll;
    const targetEmployeeId = payrollData?.employee?.employee_id || payrollData?.employee_id;
    const targetPayrollPeriod = String(payrollData?.payroll_periode || '').trim();
    const targetCompanyId = payrollData?.company_id || payrollData?.employee?.company_id || '';

    if (!payrollData || !targetEmployeeId || !targetPayrollPeriod) {
      setEmailError('Data payroll tidak lengkap untuk mengirim email.');
      return;
    }

    if (!canEmailPayroll(payrollData)) {
      setEmailError(getEmailPayrollDisabledReason(payrollData));
      return;
    }

    try {
      setEmailingPayroll(true);
      setEmailError('');
      setEmailSuccess('');
      setRefreshSuccess('');
      setCheckSuccess('');

      await payrollService.emailSlip(targetEmployeeId, targetPayrollPeriod, targetCompanyId);
      setShowEmailModal(false);
      setEmailSuccess('Email slip payroll berhasil dikirim.');

      setPayroll((previous) => {
        if (!previous?.payroll) {
          return previous;
        }

        return {
          ...previous,
          payroll: {
            ...previous.payroll,
            is_emailed: true
          }
        };
      });

      await loadPayrollDetail();
    } catch (error) {
      console.error('Error sending payroll email:', error);
      setEmailError(error.message || 'Gagal mengirim email slip payroll.');
    } finally {
      setEmailingPayroll(false);
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
  const employeeId = payroll.payroll.employee?.employee_id || payroll.payroll.employee_id;
  const payrollPeriod = String(payroll.payroll.payroll_periode || '').trim();
  const summaryTotals = payroll.summary
    ? {
        totalEarning: payroll.summary.total_earning,
        totalDeduction: payroll.summary.total_deduction,
        employeeBenefit: payroll.summary.employee_benefit_total,
        employerBenefit: payroll.summary.employer_benefit_total,
        totalBenefit: payroll.summary.benefit_total,
        taxableBenefit: payroll.summary.taxable_benefit_total
      }
    : {
        totalEarning,
        totalDeduction,
        employeeBenefit: totalEmployeeBenefit,
        employerBenefit: totalEmployerBenefit,
        totalBenefit,
        taxableBenefit: totalTaxableBenefit
      };

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

        <CModal visible={showRefreshModal} onClose={() => setShowRefreshModal(false)} alignment="center">
          <CModalHeader>
            <CModalTitle>Perbaharui Payroll</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p className="mb-2">
              Payroll untuk <strong>{payroll.payroll.employee.name}</strong> periode <strong>{payrollPeriod}</strong> akan digenerate ulang.
            </p>
            <p className="mb-0 text-medium-emphasis">
              Data payroll detail akan dihitung ulang berdasarkan konfigurasi komponen karyawan saat ini.
            </p>
            {refreshError && (
              <CAlert color="danger" className="mt-3 mb-0">{refreshError}</CAlert>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => setShowRefreshModal(false)}
              disabled={refreshingPayroll}
            >
              Batal
            </CButton>
            <CButton color="primary" onClick={handleRefreshPayroll} disabled={refreshingPayroll}>
              {refreshingPayroll ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilReload} className="me-1" />}
              Perbaharui
            </CButton>
          </CModalFooter>
        </CModal>

        <CModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} alignment="center">
          <CModalHeader>
            <CModalTitle>Send Slip Email</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p className="mb-2">
              Send payroll slip email to <strong>{payroll.payroll.employee.name}</strong> at <strong>{payroll.payroll.employee.email || '-'}</strong> for period <strong>{payrollPeriod}</strong>?
            </p>
            <p className="mb-0 text-medium-emphasis">
              Payroll yang sudah dikirim email tidak bisa dibuka kembali untuk koreksi.
            </p>
            {emailError && (
              <CAlert color="danger" className="mt-3 mb-0">{emailError}</CAlert>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              disabled={emailingPayroll}
            >
              Cancel
            </CButton>
            <CButton color="warning" onClick={handleEmailPayroll} disabled={emailingPayroll}>
              {emailingPayroll ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilEnvelopeClosed} className="me-1" />}
              Send Email
            </CButton>
          </CModalFooter>
        </CModal>

        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="align-items-center">
              <CCol>
                <h4 className="mb-0">Payroll Detail</h4>
                <small className="text-medium-emphasis">
                  Payroll ID: #{payroll.payroll.payroll_id} | Period: {payrollPeriod}
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
                {/* <CButton color="secondary" variant="outline">
                  <CIcon icon={cilPrint} className="me-1" />
                  Print
                </CButton> */}
                <CButton
                  color="info"
                  variant="outline"
                  title={getEmailPayrollDisabledReason(payroll.payroll)}
                  disabled={!canEmailPayroll(payroll.payroll) || emailingPayroll}
                  onClick={() => {
                    setEmailError('');
                    setShowEmailModal(true);
                  }}
                >
                  {emailingPayroll ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilEnvelopeClosed} className="me-1" />}
                  {isTruthy(payroll.payroll.is_emailed) ? 'Email Again' : 'Email'}
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
            {refreshSuccess && (
              <CAlert color="success" dismissible onClose={() => setRefreshSuccess('')}>
                {refreshSuccess}
              </CAlert>
            )}
            {checkSuccess && (
              <CAlert color="success" dismissible onClose={() => setCheckSuccess('')}>
                {checkSuccess}
              </CAlert>
            )}
            {checkError && (
              <CAlert color="danger" dismissible onClose={() => setCheckError('')}>
                {checkError}
              </CAlert>
            )}
            {emailSuccess && (
              <CAlert color="success" dismissible onClose={() => setEmailSuccess('')}>
                {emailSuccess}
              </CAlert>
            )}

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

            {employeeId && (
              <div className="d-flex flex-wrap justify-content-end gap-2 mb-4">
                <CButton
                  color="secondary"
                  variant="outline"
                  title="Open employee payroll component settings"
                  onClick={() => navigate(`/employees/${employeeId}/settings`)}
                >
                  <CIcon icon={cilSettings} className="me-1" />
                  Employee Settings
                </CButton>
                <CButton
                  color="primary"
                  variant="outline"
                  title={
                    canRefreshPayroll(payroll.payroll)
                      ? 'Generate ulang payroll employee'
                      : getRefreshPayrollDisabledReason(payroll.payroll)
                  }
                  disabled={!canRefreshPayroll(payroll.payroll) || refreshingPayroll}
                  onClick={() => {
                    setRefreshError('');
                    setShowRefreshModal(true);
                  }}
                >
                  {refreshingPayroll ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilReload} className="me-1" />}
                  Perbaharui
                </CButton>
                <CButton
                  color={isTruthy(payroll.payroll.is_printed) ? 'warning' : 'success'}
                  variant="outline"
                  title={getCheckPayrollDisabledReason(payroll.payroll)}
                  disabled={
                    checkingPayroll ||
                    (!isTruthy(payroll.payroll.is_printed) && !canCheckPayroll(payroll.payroll)) ||
                    (isTruthy(payroll.payroll.is_printed) && !canReopenPayroll(payroll.payroll))
                  }
                  onClick={handleCheckPayroll}
                >
                  {checkingPayroll ? (
                    <CSpinner size="sm" className="me-2" />
                  ) : isTruthy(payroll.payroll.is_printed) ? (
                    <CIcon icon={cilReload} className="me-1" />
                  ) : (
                    <CIcon icon={cilCheckCircle} className="me-1" />
                  )}
                  {isTruthy(payroll.payroll.is_printed) ? 'Reopen Payroll for Correction' : 'Check'}
                </CButton>
              </div>
            )}

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
                  <p><strong>Total Earnings:</strong> {formatCurrency(summaryTotals.totalEarning)}</p>
                  <p><strong>Total Deductions:</strong> {formatCurrency(summaryTotals.totalDeduction)}</p>
                  <p><strong>Employee Contribution:</strong> {formatCurrency(summaryTotals.employeeBenefit)}</p>
                  <p><strong>Company Contribution:</strong> {formatCurrency(summaryTotals.employerBenefit)}</p>
                  <p><strong>Total Benefit:</strong> {formatCurrency(summaryTotals.totalBenefit)}</p>
                  <p><strong>Taxable Benefit:</strong> {formatCurrency(summaryTotals.taxableBenefit)}</p>
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
