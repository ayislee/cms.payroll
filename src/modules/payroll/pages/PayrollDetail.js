// ========================================
// PAYROLL DETAIL PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilPrint, cilMoney } from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import payrollService from '../services/payrollService';

const PayrollDetail = () => {
  const { id } = useParams();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
          <CBadge color="success" className="me-1">Printed</CBadge>
          <CBadge color="success">Emailed</CBadge>
        </>
      );
    } else if (isPrinted) {
      return <CBadge color="success">Printed</CBadge>;
    } else if (isEmailed) {
      return <CBadge color="success">Emailed</CBadge>;
    } else {
      return <CBadge color="secondary">Not Processed</CBadge>;
    }
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
  
  // Calculate totals
  const totalEarning = earnings.reduce((sum, detail) => sum + (detail.amount || 0), 0);
  const totalDeduction = deductions.reduce((sum, detail) => sum + (detail.amount || 0), 0);

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="align-items-center">
              <CCol>
                <h4 className="mb-0">Payroll Detail</h4>
                <small className="text-medium-emphasis">
                  Payroll ID: #{payroll.payroll.payroll_id} | Period: {payroll.payroll.payroll_periode}
                </small>
              </CCol>
              <CCol xs="auto">
                <CButton color="secondary" variant="outline" className="me-2">
                  <CIcon icon={cilPrint} className="me-1" />
                  Print
                </CButton>
                <CButton color="info" variant="outline">
                  <CIcon icon={cilMoney} className="me-1" />
                  Email
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
                </CCol>
                <CCol md={6}>
                  <p className="mb-1"><strong>Email:</strong> {payroll.payroll.employee.email}</p>
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

            {/* Summary */}
            <div className="border rounded p-3">
              <CRow>
                <CCol md={8}>
                  <h5>Summary</h5>
                  {payroll.summary ? (
                    <>
                      <p><strong>Total Earnings:</strong> {formatCurrency(payroll.summary.total_earning)}</p>
                      <p><strong>Total Deductions:</strong> {formatCurrency(payroll.summary.total_deduction)}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Total Earnings:</strong> {formatCurrency(totalEarning)}</p>
                      <p><strong>Total Deductions:</strong> {formatCurrency(totalDeduction)}</p>
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