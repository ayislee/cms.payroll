// ========================================
// DASHBOARD PAGE COMPONENT
// ========================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CWidgetStatsA,
  CSpinner,
  CAlert,
  CForm,
  CFormInput,
  CButton,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilCash,
  cilClipboard,
  cilCalendar,
  cilChart,
  cilCheckCircle,
  cilWarning,
  cilBuilding,
  cilCloudDownload,
  cilEnvelopeClosed
} from '@coreui/icons';
import { CChartLine, CChartBar } from '@coreui/react-chartjs';
import { getStyle } from '@coreui/utils';
import { useAuth } from '../../../hooks/useAuth';
import {
  formatCurrency,
  formatPayrollPeriod,
  getCurrentPayrollPeriod,
  getCurrentPayrollPickerValue,
  pickerValueToPayrollPeriod,
  payrollPeriodToPickerValue
} from '../../../utils/formatters';
import { readSessionFilter, writeSessionFilter } from '../../../utils/filterPersistence';
import { PERMISSIONS } from '../../../constants/userRoles';
import { useDocumentTitle } from '../../../utils/documentTitle';
import config from '../../../config/environment';
import companyService from '../../companies/services/companyService';
import payrollService from '../../payroll/services/payrollService';
import dashboardService from '../services/dashboardService';
import CompanyPeriodSummaryTable from '../components/CompanyPeriodSummaryTable';

const formatPeriodLabel = (period, fallbackLabel) => {
  if (!period) {
    return fallbackLabel || '-';
  }

  const formatted = formatPayrollPeriod(period);
  if (formatted && formatted !== '-') {
    return formatted;
  }

  return fallbackLabel || period;
};

const toLocaleNumber = (value) => Number(value || 0).toLocaleString('id-ID');
const DASHBOARD_FILTER_STORAGE_KEY = 'cms.payroll.filters.dashboard';

const createDefaultActiveFilters = () => {
  const currentPeriod = getCurrentPayrollPeriod();

  return {
    companyId: '',
    periodStart: currentPeriod,
    periodEnd: currentPeriod
  };
};

const createDefaultFilterForm = () => {
  const currentPickerValue = getCurrentPayrollPickerValue();

  return {
    companyId: '',
    periodStart: currentPickerValue,
    periodEnd: currentPickerValue
  };
};

const normalizeDashboardFilters = (filters, fallback) => ({
  companyId: String(filters.companyId || ''),
  periodStart: /^\d{6}$/.test(String(filters.periodStart || ''))
    ? String(filters.periodStart)
    : fallback.periodStart,
  periodEnd: /^\d{6}$/.test(String(filters.periodEnd || ''))
    ? String(filters.periodEnd)
    : fallback.periodEnd
});

const readDashboardFilters = () =>
  readSessionFilter(
    DASHBOARD_FILTER_STORAGE_KEY,
    createDefaultActiveFilters(),
    normalizeDashboardFilters
  );

const createFilterFormFromActiveFilters = (filters) => {
  const defaultForm = createDefaultFilterForm();

  return {
    companyId: filters.companyId || '',
    periodStart: payrollPeriodToPickerValue(filters.periodStart) || defaultForm.periodStart,
    periodEnd: payrollPeriodToPickerValue(filters.periodEnd) || defaultForm.periodEnd
  };
};

const Dashboard = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [companyPeriodSummary, setCompanyPeriodSummary] = useState(null);
  const [companyPeriodSummaryLoading, setCompanyPeriodSummaryLoading] = useState(true);
  const [companyPeriodSummaryError, setCompanyPeriodSummaryError] = useState('');
  const [activeFilters, setActiveFilters] = useState(() => readDashboardFilters());
  const [filterForm, setFilterForm] = useState(() =>
    createFilterFormFromActiveFilters(readDashboardFilters())
  );
  const [companyOptions, setCompanyOptions] = useState([
    { value: '', label: 'Semua Perusahaan' }
  ]);
  const [companyOptionsLoading, setCompanyOptionsLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPeriod, setDownloadPeriod] = useState(() => getCurrentPayrollPickerValue());
  const [downloadCompanyId, setDownloadCompanyId] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingPayroll, setDownloadingPayroll] = useState(false);

  useDocumentTitle('Dashboard');

  const canViewEmployees = hasPermission(PERMISSIONS.EMPLOYEES_VIEW);
  const canViewPayroll = hasPermission(PERMISSIONS.PAYROLL_VIEW);
  const canViewAttendance = hasPermission(PERMISSIONS.ATTENDANCE_VIEW);

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await dashboardService.getOverview(activeFilters);

      if (response?.status) {
        setOverview(response.data);
      } else {
        throw new Error(response?.message || 'Gagal memuat data dashboard.');
      }
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
      setOverview(null);
      setError(err.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  const loadCompanyPeriodSummary = useCallback(async () => {
    try {
      setCompanyPeriodSummaryLoading(true);
      setCompanyPeriodSummaryError('');
      const response = await dashboardService.getCompanyPeriodSummary(activeFilters);

      if (response?.status) {
        setCompanyPeriodSummary(response.data);
      } else {
        throw new Error(response?.message || 'Gagal memuat ringkasan perusahaan.');
      }
    } catch (err) {
      console.error('Error loading company period summary:', err);
      setCompanyPeriodSummary(null);
      setCompanyPeriodSummaryError(err.message || 'Gagal memuat ringkasan perusahaan.');
    } finally {
      setCompanyPeriodSummaryLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    loadOverviewData();
    loadCompanyPeriodSummary();
  }, [loadOverviewData, loadCompanyPeriodSummary]);

  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        setCompanyOptionsLoading(true);
        const options = await companyService.getCompanyOptions();
        const formattedOptions = Array.isArray(options)
          ? options.map((option) => ({
              value: String(option.value ?? ''),
              label: option.label ?? String(option.value ?? '')
            }))
          : [];

        setCompanyOptions([
          { value: '', label: 'Semua Perusahaan' },
          ...formattedOptions
        ]);
      } catch (err) {
        console.error('Gagal memuat daftar perusahaan:', err);
        setCompanyOptions([{ value: '', label: 'Semua Perusahaan' }]);
      } finally {
        setCompanyOptionsLoading(false);
      }
    };

    fetchCompanyOptions();
  }, []);

  const handleFilterInputChange = (field) => (event) => {
    const { value } = event.target;
    setFilterForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterApply = (event) => {
    event.preventDefault();
    const nextFormValues = {
      companyId: filterForm.companyId.trim(),
      periodStart: filterForm.periodStart.trim(),
      periodEnd: filterForm.periodEnd.trim()
    };
    const nextActiveFilters = {
      companyId: nextFormValues.companyId,
      periodStart: pickerValueToPayrollPeriod(nextFormValues.periodStart),
      periodEnd: pickerValueToPayrollPeriod(nextFormValues.periodEnd)
    };

    setFilterForm(nextFormValues);
    setActiveFilters(nextActiveFilters);
    writeSessionFilter(DASHBOARD_FILTER_STORAGE_KEY, nextActiveFilters);
  };

  const handleFilterReset = () => {
    const defaultActiveFilters = createDefaultActiveFilters();
    setFilterForm(createDefaultFilterForm());
    setActiveFilters(defaultActiveFilters);
    writeSessionFilter(DASHBOARD_FILTER_STORAGE_KEY, defaultActiveFilters);
  };

  const openDownloadModal = () => {
    const selectedPeriod = activeFilters.periodEnd || activeFilters.periodStart || getCurrentPayrollPeriod();
    const selectedCompany = activeFilters.companyId || '';

    setDownloadPeriod(payrollPeriodToPickerValue(selectedPeriod) || getCurrentPayrollPickerValue());
    setDownloadCompanyId(selectedCompany);
    setDownloadError('');
    setShowDownloadModal(true);
  };

  const closeDownloadModal = () => {
    setShowDownloadModal(false);
    setDownloadPeriod(getCurrentPayrollPickerValue());
    setDownloadCompanyId('');
    setDownloadError('');
  };

  const handleDownloadPayroll = async () => {
    const selectedPeriod = pickerValueToPayrollPeriod(downloadPeriod);
    const selectedCompanyId = downloadCompanyId ? Number(downloadCompanyId) : null;

    if (!selectedPeriod) {
      setDownloadError('Periode payroll harus dipilih.');
      return;
    }

    if (downloadCompanyId && (!Number.isFinite(selectedCompanyId) || selectedCompanyId <= 0)) {
      setDownloadError('ID perusahaan tidak valid.');
      return;
    }

    try {
      setDownloadingPayroll(true);
      setDownloadError('');

      const responseData = await payrollService.downloadPayroll(selectedPeriod, selectedCompanyId);
      const payload = responseData?.data ? responseData.data : responseData;
      const downloadUrl = payload?.download_url || null;
      const fallbackName = payload?.file_name || `payroll-${selectedPeriod}.xlsx`;

      if (!downloadUrl) {
        throw new Error('File payroll tidak tersedia untuk periode yang dipilih.');
      }

      const token = localStorage.getItem(config.auth.tokenStorageKey);
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login ulang.');
      }

      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil file payroll.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fallbackName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      closeDownloadModal();
    } catch (err) {
      console.error('Error downloading dashboard payroll:', err);
      setDownloadError(err.message || 'Gagal mengunduh payroll.');
    } finally {
      setDownloadingPayroll(false);
    }
  };

  const employeesMetrics = overview?.metrics?.employees || {
    total: 0,
    active: 0,
    inactive: 0
  };

  const payrollMetrics = overview?.metrics?.payroll || {
    total_records: 0,
    checked_records: 0,
    unchecked_records: 0,
    emailed_records: 0,
    total_net_pay: 0,
    checked_net_pay: 0,
    unchecked_net_pay: 0,
    projected_net_pay: 0,
    period: null,
    period_start: '',
    period_end: '',
    recent_paid_net_pay: []
  };

  const attendanceMetrics = overview?.metrics?.attendance || {
    total_records: 0,
    covered_employees: 0,
    period_start: '',
    period_end: '',
    recent_periods: []
  };

  const periodRangeLabel = useMemo(() => {
    const startLabel = formatPeriodLabel(overview?.period_start, 'Periode Awal');
    const endLabel = formatPeriodLabel(overview?.period_end, 'Periode Akhir');
    return `${startLabel} - ${endLabel}`;
  }, [overview]);

  const attendanceCoverage = useMemo(() => {
    const covered = Number(overview?.metrics?.attendance?.covered_employees || 0);
    const totalEmployees = Number(overview?.metrics?.employees?.total || 0);

    if (!covered || !totalEmployees) {
      return 0;
    }

    return Math.round((covered / totalEmployees) * 100);
  }, [overview]);

  const netPayChartData = useMemo(() => {
    const recentNetPay = overview?.metrics?.payroll?.recent_paid_net_pay || [];
    if (!recentNetPay.length) {
      return null;
    }

    const labels = recentNetPay.map((item, index) => {
      const periodValue = item.payroll_period || item.period || '';
      return formatPeriodLabel(periodValue, `Periode ${index + 1}`);
    });

    const dataPoints = recentNetPay.map((item) => Number(item.total_net_pay || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Total Net Pay',
          data: dataPoints,
          borderColor: getStyle('--cui-success'),
          backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, 0.2)`,
          pointBackgroundColor: getStyle('--cui-success'),
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [overview]);

  const attendanceChartData = useMemo(() => {
    const recentPeriods = overview?.metrics?.attendance?.recent_periods || [];
    if (!recentPeriods.length) {
      return null;
    }

    const labels = recentPeriods.map((item, index) => {
      const periodValue = item.period || item.payroll_period || '';
      return formatPeriodLabel(periodValue, `Periode ${index + 1}`);
    });

    const totalRecordsData = recentPeriods.map((item) => Number(item.total_records || 0));
    const coveredEmployeesData = recentPeriods.map((item) => Number(item.covered_employees || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Total Kehadiran',
          data: totalRecordsData,
          backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, 0.6)`,
          borderColor: getStyle('--cui-info'),
          borderWidth: 1
        },
        {
          label: 'Karyawan Tercakup',
          data: coveredEmployeesData,
          backgroundColor: `rgba(${getStyle('--cui-warning-rgb')}, 0.6)`,
          borderColor: getStyle('--cui-warning'),
          borderWidth: 1
        }
      ]
    };
  }, [overview]);

  const lineChartOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: getStyle('--cui-body-color')
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: getStyle('--cui-border-color-translucent'),
            drawOnChartArea: false
          },
          ticks: {
            color: getStyle('--cui-body-color')
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: getStyle('--cui-border-color-translucent')
          },
          ticks: {
            color: getStyle('--cui-body-color')
          }
        }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 2
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          hitRadius: 10
        }
      }
    }),
    []
  );

  const barChartOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: getStyle('--cui-body-color')
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: getStyle('--cui-border-color-translucent')
          },
          ticks: {
            color: getStyle('--cui-body-color')
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: getStyle('--cui-border-color-translucent')
          },
          ticks: {
            color: getStyle('--cui-body-color')
          }
        }
      }
    }),
    []
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" size="lg" />
        <p className="text-medium-emphasis mt-3">Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <CAlert color="danger" className="mb-4">
          {error}
        </CAlert>
      )}

      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader>Filter Dashboard</CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleFilterApply}>
                <CRow className="g-3 align-items-end">
                  <CCol md={4}>
                    <label className="form-label">Company ID</label>
                    <CFormSelect
                      value={filterForm.companyId}
                      onChange={handleFilterInputChange('companyId')}
                      disabled={loading || companyOptionsLoading}
                    >
                      {companyOptions.map((option) => (
                        <option key={option.value || 'all'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={4}>
                    <label className="form-label">Periode Mulai</label>
                    <CFormInput
                      type="month"
                      value={filterForm.periodStart}
                      onChange={handleFilterInputChange('periodStart')}
                      disabled={loading}
                    />
                  </CCol>
                  <CCol md={4}>
                    <label className="form-label">Periode Akhir</label>
                    <CFormInput
                      type="month"
                      value={filterForm.periodEnd}
                      onChange={handleFilterInputChange('periodEnd')}
                      disabled={loading}
                    />
                  </CCol>
                  <CCol xs="auto" className="mt-3">
                    <CButton type="submit" color="primary" className="me-2" disabled={loading}>
                      Terapkan
                    </CButton>
                    <CButton
                      type="button"
                      color="secondary"
                      variant="outline"
                      onClick={handleFilterReset}
                      disabled={loading}
                    >
                      Reset
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol xs={12}>
          <div className="d-flex justify-content-end">
            <CButton
              color="dark"
              onClick={openDownloadModal}
              disabled={loading}
            >
              <CIcon icon={cilCloudDownload} className="me-2" />
              Download Payroll
            </CButton>
          </div>
        </CCol>
      </CRow>

      <CModal visible={showDownloadModal} onClose={closeDownloadModal} alignment="center">
        <CModalHeader>
          <CModalTitle>Download Payroll</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {downloadError && (
            <CAlert color="danger" className="mb-3">{downloadError}</CAlert>
          )}

          <div className="mb-3">
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="month"
              value={downloadPeriod}
              onChange={(e) => setDownloadPeriod(e.target.value)}
              disabled={downloadingPayroll}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Company</label>
            <CFormSelect
              value={downloadCompanyId}
              onChange={(e) => setDownloadCompanyId(e.target.value)}
              disabled={downloadingPayroll || companyOptions.length <= 1}
            >
              {companyOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeDownloadModal} disabled={downloadingPayroll}>
            Batal
          </CButton>
          <CButton color="dark" onClick={handleDownloadPayroll} disabled={downloadingPayroll}>
            {downloadingPayroll ? 'Mengunduh...' : 'Download'}
          </CButton>
        </CModalFooter>
      </CModal>

      {!overview ? (
        <CAlert color="warning">Data dashboard belum tersedia.</CAlert>
      ) : (
        <>
          <CRow className="mb-4">
            <CCol xs={12}>
              <CCard className="shadow-sm border-0">
                <CCardHeader>
                  <CIcon icon={cilBuilding} className="me-2" />
                  Ringkasan Perusahaan
                </CCardHeader>
                <CCardBody>
                  <div className="d-flex flex-wrap gap-4">
                    <div>
                      <div className="text-medium-emphasis small">Perusahaan</div>
                      <strong>{overview.company_name || '-'}</strong>
                    </div>
                    {/* <div>
                      <div className="text-medium-emphasis small">ID Perusahaan</div>
                      <strong>{overview.company_id ?? '-'}</strong>
                    </div> */}
                    <div>
                      <div className="text-medium-emphasis small">Rentang Periode</div>
                      <strong>{periodRangeLabel}</strong>
                    </div>
                  </div>
                  <CompanyPeriodSummaryTable
                    periods={companyPeriodSummary?.periods}
                    companies={companyPeriodSummary?.companies}
                    loading={companyPeriodSummaryLoading}
                    error={companyPeriodSummaryError}
                  />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {canViewEmployees && (
            <CRow className="mb-4">
              <CCol sm={6} lg={4}>
                <CWidgetStatsA
                  className="mb-4 shadow-sm border-0"
                  color="primary"
                  value={toLocaleNumber(employeesMetrics.total)}
                  title="Total Pegawai"
                  action={<CIcon icon={cilPeople} height={48} className="text-white-50" />}
                />
              </CCol>
              <CCol sm={6} lg={4}>
                <CWidgetStatsA
                  className="mb-4 shadow-sm border-0"
                  color="success"
                  value={toLocaleNumber(employeesMetrics.active)}
                  title="Pegawai Aktif"
                  action={<CIcon icon={cilCheckCircle} height={48} className="text-white-50" />}
                />
              </CCol>
              <CCol sm={6} lg={4}>
                <CWidgetStatsA
                  className="mb-4 shadow-sm border-0"
                  color="danger"
                  value={toLocaleNumber(employeesMetrics.inactive)}
                  title="Pegawai Tidak Aktif"
                  action={<CIcon icon={cilWarning} height={48} className="text-white-50" />}
                />
              </CCol>
            </CRow>
          )}

          {canViewPayroll && (
            <>
              <CRow className="mb-4">
                <CCol sm={6} lg={4} xl={4}>
                  <CWidgetStatsA
                    className="mb-4 shadow-sm border-0"
                    color="success"
                    value={formatCurrency(payrollMetrics.checked_net_pay ?? payrollMetrics.total_net_pay, { maximumFractionDigits: 0 })}
                    title="Total Net Pay Checked"
                    action={<CIcon icon={cilCash} height={48} className="text-white-50" />}
                  />
                </CCol>
                <CCol sm={6} lg={4} xl={4}>
                  <CWidgetStatsA
                    className="mb-4 shadow-sm border-0"
                    color="warning"
                    value={formatCurrency(payrollMetrics.unchecked_net_pay, { maximumFractionDigits: 0 })}
                    title="Total Net Pay Belum Check"
                    action={<CIcon icon={cilWarning} height={48} className="text-white-50" />}
                  />
                </CCol>
                <CCol sm={6} lg={4} xl={4}>
                  <CWidgetStatsA
                    className="mb-4 shadow-sm border-0"
                    color="primary"
                    value={formatCurrency(payrollMetrics.projected_net_pay, { maximumFractionDigits: 0 })}
                    title="Total Proyeksi Net Pay"
                    action={<CIcon icon={cilChart} height={48} className="text-white-50" />}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-4">
                <CCol sm={6} lg={4} xl={4}>
                  <CWidgetStatsA
                    className="mb-4 shadow-sm border-0"
                    color="success"
                    value={toLocaleNumber(payrollMetrics.checked_records)}
                    title="Total Payroll Checked"
                    action={<CIcon icon={cilCheckCircle} height={48} className="text-white-50" />}
                  />
                </CCol>
                <CCol sm={6} lg={4} xl={4}>
                  <CWidgetStatsA
                    className="mb-4 shadow-sm border-0"
                    color="warning"
                    value={toLocaleNumber(payrollMetrics.unchecked_records)}
                    title="Total Payroll Belum Check"
                    action={<CIcon icon={cilWarning} height={48} className="text-white-50" />}
                  />
                </CCol>
                <CCol sm={6} lg={4} xl={4}>
                  <CWidgetStatsA
                    className="mb-4 shadow-sm border-0"
                    color="info"
                    value={toLocaleNumber(payrollMetrics.emailed_records)}
                    title="Total Payroll Telah di Email"
                    action={<CIcon icon={cilEnvelopeClosed} height={48} className="text-white-50" />}
                  />
                </CCol>
              </CRow>
            </>
          )}

          {canViewAttendance && (
            <CRow className="mb-4">
              <CCol sm={6} lg={4}>
                <CWidgetStatsA
                  className="mb-4 shadow-sm border-0"
                  color="primary"
                  value={toLocaleNumber(attendanceMetrics.total_records)}
                  title="Total Kehadiran"
                  action={<CIcon icon={cilCalendar} height={48} className="text-white-50" />}
                />
              </CCol>
              <CCol sm={6} lg={4}>
                <CWidgetStatsA
                  className="mb-4 shadow-sm border-0"
                  color="info"
                  value={toLocaleNumber(attendanceMetrics.covered_employees)}
                  title="Karyawan Tercakup"
                  action={<CIcon icon={cilPeople} height={48} className="text-white-50" />}
                />
              </CCol>
              <CCol sm={6} lg={4}>
                <CWidgetStatsA
                  className="mb-4 shadow-sm border-0"
                  color="warning"
                  value={`${attendanceCoverage}%`}
                  title="Tingkat Cakupan Kehadiran"
                  action={<CIcon icon={cilChart} height={48} className="text-white-50" />}
                />
              </CCol>
            </CRow>
          )}


        </>
      )}
    </>
  );
};

export default Dashboard;
