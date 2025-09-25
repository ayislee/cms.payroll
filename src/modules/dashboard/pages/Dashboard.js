// ========================================
// DASHBOARD PAGE COMPONENT
// ========================================

import React, { useState, useEffect } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CWidgetStatsA,
  CProgress,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CSpinner,
  CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilCash,
  cilBuilding,
  cilClipboard,
  cilCalendar,
  cilChart
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { formatCurrency, formatPayrollPeriod, getCurrentPayrollPeriod } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useDocumentTitle } from '../../../utils/documentTitle';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set document title
  useDocumentTitle('Dashboard');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      totalCompanies: 0,
      thisMonthPayroll: 0,
      pendingPayrolls: 0
    },
    recentPayrolls: [],
    monthlyStats: {
      processed: 0,
      pending: 0,
      total: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load dashboard statistics
      const stats = await Promise.allSettled([
        hasPermission(PERMISSIONS.EMPLOYEES_VIEW) ? loadEmployeeStats() : Promise.resolve(0),
        hasPermission(PERMISSIONS.COMPANIES_VIEW) ? loadCompanyStats() : Promise.resolve(0),
        hasPermission(PERMISSIONS.PAYROLL_VIEW) ? loadPayrollStats() : Promise.resolve({ total: 0, pending: 0 }),
        hasPermission(PERMISSIONS.PAYROLL_VIEW) ? loadRecentPayrolls() : Promise.resolve([])
      ]);

      const [employeeStats, companyStats, payrollStats, recentPayrolls] = stats.map(
        result => result.status === 'fulfilled' ? result.value : null
      );

      setDashboardData({
        stats: {
          totalEmployees: employeeStats || 0,
          totalCompanies: companyStats || 0,
          thisMonthPayroll: payrollStats?.total || 0,
          pendingPayrolls: payrollStats?.pending || 0
        },
        recentPayrolls: recentPayrolls || [],
        monthlyStats: {
          processed: payrollStats?.processed || 0,
          pending: payrollStats?.pending || 0,
          total: payrollStats?.total || 0
        }
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeStats = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.EMPLOYEES.LIST}?limit=1`);
      return response.data?.employees?.total || 0;
    } catch (error) {
      console.error('Error loading employee stats:', error);
      return 0;
    }
  };

  const loadCompanyStats = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.COMPANIES.LIST}?limit=1`);
      return response.data?.companies?.total || 0;
    } catch (error) {
      console.error('Error loading company stats:', error);
      return 0;
    }
  };

  const loadPayrollStats = async () => {
    try {
      const currentPeriod = getCurrentPayrollPeriod();
      const [totalResponse, pendingResponse] = await Promise.all([
        apiClient.get(`${API_ENDPOINTS.PAYROLL.LIST}?payroll_period=${currentPeriod}&limit=1`),
        apiClient.get(`${API_ENDPOINTS.PAYROLL.LIST}?payroll_period=${currentPeriod}&is_printed=0&limit=1`)
      ]);

      return {
        total: totalResponse.data?.payrolls?.total || 0,
        pending: pendingResponse.data?.payrolls?.total || 0,
        processed: (totalResponse.data?.payrolls?.total || 0) - (pendingResponse.data?.payrolls?.total || 0)
      };
    } catch (error) {
      console.error('Error loading payroll stats:', error);
      return { total: 0, pending: 0, processed: 0 };
    }
  };

  const loadRecentPayrolls = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.PAYROLL.LIST}?limit=5`);
      return response.data?.payrolls?.data || [];
    } catch (error) {
      console.error('Error loading recent payrolls:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        {error}
        <div className="mt-2">
          <CButton color="primary" size="sm" onClick={loadDashboardData}>
            Retry
          </CButton>
        </div>
      </CAlert>
    );
  }

  const progressPercentage = dashboardData.stats.thisMonthPayroll > 0 
    ? (dashboardData.monthlyStats.processed / dashboardData.stats.thisMonthPayroll) * 100 
    : 0;

  return (
    <>
      {/* Welcome Section */}
      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>
              <h4 className="mb-0">
                Welcome back, {user?.firstname} {user?.lastname}!
              </h4>
            </CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis mb-0">
                Here's what's happening with your payroll system for {formatPayrollPeriod(getCurrentPayrollPeriod())}.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Statistics Cards */}
      <CRow className="mb-4">
        {hasPermission(PERMISSIONS.EMPLOYEES_VIEW) && (
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="primary"
              value={dashboardData.stats.totalEmployees.toLocaleString()}
              title="Total Employees"
              action={
                <CIcon icon={cilPeople} height={52} className="text-white-50" />
              }
            />
          </CCol>
        )}

        {hasPermission(PERMISSIONS.COMPANIES_VIEW) && (
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="info"
              value={dashboardData.stats.totalCompanies.toLocaleString()}
              title="Total Companies"
              action={
                <CIcon icon={cilBuilding} height={52} className="text-white-50" />
              }
            />
          </CCol>
        )}

        {hasPermission(PERMISSIONS.PAYROLL_VIEW) && (
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="success"
              value={dashboardData.stats.thisMonthPayroll.toLocaleString()}
              title="This Month Payrolls"
              action={
                <CIcon icon={cilCash} height={52} className="text-white-50" />
              }
            />
          </CCol>
        )}

        {hasPermission(PERMISSIONS.PAYROLL_VIEW) && (
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="warning"
              value={dashboardData.stats.pendingPayrolls.toLocaleString()}
              title="Pending Payrolls"
              action={
                <CIcon icon={cilClipboard} height={52} className="text-white-50" />
              }
            />
          </CCol>
        )}
      </CRow>

      {/* Payroll Progress */}
      {hasPermission(PERMISSIONS.PAYROLL_VIEW) && (
        <CRow className="mb-4">
          <CCol>
            <CCard>
              <CCardHeader>
                <CIcon icon={cilChart} className="me-2" />
                Payroll Processing Progress - {formatPayrollPeriod(getCurrentPayrollPeriod())}
              </CCardHeader>
              <CCardBody>
                <div className="d-flex justify-content-between mb-2">
                  <span>Processed: {dashboardData.monthlyStats.processed}</span>
                  <span>Pending: {dashboardData.monthlyStats.pending}</span>
                </div>
                <CProgress className="mb-3" height={25}>
                  <CProgress 
                    color="success" 
                    value={progressPercentage}
                  >
                    {progressPercentage.toFixed(1)}%
                  </CProgress>
                </CProgress>
                <small className="text-medium-emphasis">
                  {dashboardData.monthlyStats.processed} of {dashboardData.stats.thisMonthPayroll} payrolls processed
                </small>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* Recent Payrolls */}
      {hasPermission(PERMISSIONS.PAYROLL_VIEW) && (
        <CRow>
          <CCol>
            <CCard>
              <CCardHeader>
                <CIcon icon={cilCalendar} className="me-2" />
                Recent Payrolls
              </CCardHeader>
              <CCardBody>
                {dashboardData.recentPayrolls.length > 0 ? (
                  <CTable hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Employee</CTableHeaderCell>
                        <CTableHeaderCell>Period</CTableHeaderCell>
                        <CTableHeaderCell>Net Pay</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {dashboardData.recentPayrolls.map((payroll) => (
                        <CTableRow key={payroll.payroll_id}>
                          <CTableDataCell>
                            {payroll.employee?.name || '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatPayrollPeriod(payroll.payroll_periode)}
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatCurrency(payroll.net_pay)}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={payroll.is_printed ? 'success' : 'warning'}>
                              {payroll.is_printed ? 'Printed' : 'Pending'}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-medium-emphasis">No recent payrolls found</p>
                  </div>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </>
  );
};

export default Dashboard;
