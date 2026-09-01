// ========================================
// PAYROLL LIST PAGE
// ========================================

import React, { useState, useEffect, useMemo } from 'react';
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
  CFormCheck,
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
import {
  cilPlus,
  cilTrash,
  cilPrint,
  cilMoney,
  cilSearch,
  cilCloudDownload,
  cilViewModule,
  cilEnvelopeClosed,
  cilCheckCircle,
  cilWarning
} from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import {
  formatPayrollPeriod,
  getCurrentPayrollPickerValue,
  pickerValueToPayrollPeriod,
  payrollPeriodToPickerValue
} from '../../../utils/formatters';
import payrollService from '../services/payrollService';
import employeeService from '../../employees/services/employeeService';
import companyService from '../../companies/services/companyService';
import config from '../../../config/environment';
import { readSessionFilter, writeSessionFilter, normalizePageSize } from '../../../utils/filterPersistence';

const DEFAULT_PAYROLL_PAGE_SIZE = 15;
const PAYROLL_FILTER_STORAGE_KEY = 'cms.payroll.filters.payroll';

const createDefaultSearchParams = () => ({
  search: '',
  payroll_periode: pickerValueToPayrollPeriod(getCurrentPayrollPickerValue()),
  company_id: ''
});

const createDefaultPayrollFilters = () => ({
  ...createDefaultSearchParams(),
  pageSize: DEFAULT_PAYROLL_PAGE_SIZE
});

const readPayrollFilters = () =>
  readSessionFilter(PAYROLL_FILTER_STORAGE_KEY, createDefaultPayrollFilters(), (filters, fallback) => {
    const payrollPeriod = String(filters.payroll_periode || '');

    return {
      search: String(filters.search || ''),
      payroll_periode: payrollPeriod === '' || /^\d{6}$/.test(payrollPeriod)
        ? payrollPeriod
        : fallback.payroll_periode,
      company_id: String(filters.company_id || ''),
      pageSize: normalizePageSize(filters.pageSize, fallback.pageSize)
    };
  });

const getDefaultPayrollPickerValue = () => getCurrentPayrollPickerValue();

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
  const persistedFilters = useMemo(() => readPayrollFilters(), []);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(() => persistedFilters.pageSize);
  const [searchParams, setSearchParams] = useState(() => ({
    search: persistedFilters.search,
    payroll_periode: persistedFilters.payroll_periode,
    company_id: persistedFilters.company_id
  }));
  const [appliedSearchParams, setAppliedSearchParams] = useState(() => ({
    search: persistedFilters.search,
    payroll_periode: persistedFilters.payroll_periode,
    company_id: persistedFilters.company_id
  }));
  const [hasLoadedPayrolls, setHasLoadedPayrolls] = useState(false);
  const [periodOptions, setPeriodOptions] = useState([]);
  const [periodOptionsLoading, setPeriodOptionsLoading] = useState(false);
  const [periodOptionsError, setPeriodOptionsError] = useState('');
  
  // Generate Payroll Modal State
  const [showGeneratePayrollModal, setShowGeneratePayrollModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollPeriod, setPayrollPeriod] = useState(() => getDefaultPayrollPickerValue());
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [payrollError, setPayrollError] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [showRowPayrollModal, setShowRowPayrollModal] = useState(false);
  const [rowPayrollTarget, setRowPayrollTarget] = useState(null);
  const [rowPayrollPeriod, setRowPayrollPeriod] = useState(() => getDefaultPayrollPickerValue());
  const [rowPayrollError, setRowPayrollError] = useState('');
  const [rowGeneratingPayroll, setRowGeneratingPayroll] = useState(false);
  const [showMassCheckModal, setShowMassCheckModal] = useState(false);
  const [massCheckPassword, setMassCheckPassword] = useState('');
  const [massCheckError, setMassCheckError] = useState('');
  const [massChecking, setMassChecking] = useState(false);
  const [selectedPayrollIds, setSelectedPayrollIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState(null);
  const [deletingPayrollId, setDeletingPayrollId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  
  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: '',
    color: 'success' // success, danger, warning, info
  });

  const summaryMetrics = useMemo(() => {
    if (!Array.isArray(payrolls) || payrolls.length === 0) {
      return {
        totalNetPay: 0,
        printedCount: 0,
        emailedCount: 0,
        pendingSlipCount: 0
      };
    }

    return payrolls.reduce(
      (acc, payroll) => {
        const netPay = Number(payroll?.net_pay ?? 0);
        if (!Number.isNaN(netPay)) {
          acc.totalNetPay += netPay;
        }

        if (payroll?.is_printed) {
          acc.printedCount += 1;
        }

        if (payroll?.is_emailed) {
          acc.emailedCount += 1;
        }

        if (!payroll?.slip_url) {
          acc.pendingSlipCount += 1;
        }

        return acc;
      },
      {
        totalNetPay: 0,
        printedCount: 0,
        emailedCount: 0,
        pendingSlipCount: 0
      }
    );
  }, [payrolls]);

  const getCompanyLabel = (payroll) => {
    if (!payroll || typeof payroll !== 'object') {
      return '-';
    }

    const companyFromEmployee = payroll.employee?.company;
    if (companyFromEmployee && typeof companyFromEmployee === 'object') {
      return companyFromEmployee.name || `Company #${companyFromEmployee.company_id}`;
    }

    if (payroll.company && typeof payroll.company === 'object') {
      return payroll.company.name || `Company #${payroll.company.company_id}`;
    }

    if (payroll.company_name) {
      return payroll.company_name;
    }

    if (payroll.company_id) {
      return `Company #${payroll.company_id}`;
    }

    return '-';
  };

  const getPayrollCompanyId = (payroll) => {
    if (!payroll || typeof payroll !== 'object') {
      return '';
    }

    const directCompanyId = payroll.company_id;
    if (directCompanyId) {
      return directCompanyId;
    }

    const payrollCompanyId = payroll.company?.company_id;
    if (payrollCompanyId) {
      return payrollCompanyId;
    }

    const employeeCompanyId = payroll.employee?.company_id;
    if (employeeCompanyId) {
      return employeeCompanyId;
    }

    const employeeCompanyRelationId = payroll.employee?.company?.company_id;
    if (employeeCompanyRelationId) {
      return employeeCompanyRelationId;
    }

    return '';
  };

  const canReopenPayroll = (payroll) => Boolean(payroll?.is_printed) && !Boolean(payroll?.is_emailed);
  const canCheckPayroll = (payroll) => Boolean(payroll?.slip_url) && !Boolean(payroll?.is_printed);
  const canSelectPayrollForMassCheck = (payroll) => canCheckPayroll(payroll) && !Boolean(payroll?.is_emailed);
  const canDeletePayroll = (payroll) => !Boolean(payroll?.is_printed) && !Boolean(payroll?.is_emailed) && !Boolean(payroll?.is_posted);
  const getDeletePayrollDisabledReason = (payroll) => {
    if (payroll?.is_printed) return 'Payroll already checked and cannot be deleted';
    if (payroll?.is_emailed) return 'Payroll already emailed and cannot be deleted';
    if (payroll?.is_posted) return 'Payroll already posted and cannot be deleted';
    return '';
  };
  const selectedEligiblePayrolls = payrolls.filter((payroll) => selectedPayrollIds.includes(payroll.payroll_id));
  const allEligiblePayrollIds = payrolls
    .filter((payroll) => canSelectPayrollForMassCheck(payroll))
    .map((payroll) => payroll.payroll_id);
  const isAllEligibleSelected =
    allEligiblePayrollIds.length > 0 &&
    allEligiblePayrollIds.every((payrollId) => selectedPayrollIds.includes(payrollId));
  const currentPayrollPeriod = pickerValueToPayrollPeriod(getCurrentPayrollPickerValue());
  const hasCurrentPeriodOption = periodOptions.some(
    (option) => String(option.value) === String(currentPayrollPeriod)
  );

  useDocumentTitle('Payroll List');

  useEffect(() => {
    setSelectedPayrollIds((previous) =>
      previous.filter((payrollId) =>
        payrolls.some(
          (payroll) =>
            payroll.payroll_id === payrollId && canSelectPayrollForMassCheck(payroll)
        )
      )
    );
  }, [payrolls]);

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      
      const serviceParams = {
        page: currentPage,
        rows: pageSize,
        ...appliedSearchParams
      };

      const response = await payrollService.getPayrolls(serviceParams);

      if (response) {
        setPayrolls(response.data || []);
        setTotalPages(response.pages || 1);
        setTotalRecords(response.total || 0);
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
      setHasLoadedPayrolls(true);
    }
  };

  // Load payrolls when page, page size, or applied filters change.
  useEffect(() => {
    loadPayrolls();
  }, [currentPage, pageSize, appliedSearchParams]);

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
    // Don't reset page here to prevent losing focus
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextSearchParams = {
      search: searchParams.search.trim(),
      payroll_periode: searchParams.payroll_periode.trim(),
      company_id: String(searchParams.company_id || '').trim()
    };

    setSearchParams(nextSearchParams);
    setAppliedSearchParams(nextSearchParams);
    setCurrentPage(1);
    writeSessionFilter(PAYROLL_FILTER_STORAGE_KEY, {
      ...nextSearchParams,
      pageSize
    });
  };

  const resetFilters = () => {
    const defaultParams = createDefaultSearchParams();
    const defaultPageSize = DEFAULT_PAYROLL_PAGE_SIZE;
    setSearchParams(defaultParams);
    setAppliedSearchParams(defaultParams);
    setPageSize(defaultPageSize);
    setCurrentPage(1);
    writeSessionFilter(PAYROLL_FILTER_STORAGE_KEY, {
      ...defaultParams,
      pageSize: defaultPageSize
    });
  };

  // Handle Generate Payroll
  const handleGeneratePayroll = () => {
    setSelectedEmployee(null);
    setPayrollPeriod(getDefaultPayrollPickerValue());
    setPayrollError('');
    setEmployeeSearchTerm('');
    setEmployeeSearchResults([]);
    setShowGeneratePayrollModal(true);
  };

  const closeGeneratePayrollModal = () => {
    setShowGeneratePayrollModal(false);
  };

  // Search employees for the payroll modal
  const searchEmployeesForPayroll = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setEmployeeSearchResults([]);
      return;
    }

    try {
      setSearchingEmployees(true);
      
      // Temporary workaround to test if the method exists
      if (typeof employeeService.getAllEmployees !== 'function') {
        console.error('employeeService.getAllEmployees is not a function, trying alternative approach');
        
        // Try to call the method directly from the prototype
        const proto = Object.getPrototypeOf(employeeService);
        if (proto.getAllEmployees && typeof proto.getAllEmployees === 'function') {
          const employees = await proto.getAllEmployees.call(employeeService, searchTerm);
          setEmployeeSearchResults(employees || []);
          return;
        } else {
          // Fallback: use the existing getEmployees method with search
          const response = await employeeService.getEmployees({ 
            page: 1, 
            rows: 10, 
            search: searchTerm 
          });
          setEmployeeSearchResults(response.data || []);
          return;
        }
      }
      
      const employees = await employeeService.getAllEmployees(searchTerm);
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

  const openRowPayrollModal = (payroll) => {
    setRowPayrollTarget(payroll);
    setRowPayrollPeriod(
      payrollPeriodToPickerValue(String(payroll.payroll_periode || '').trim()) ||
        getDefaultPayrollPickerValue()
    );
    setRowPayrollError('');
    setShowRowPayrollModal(true);
  };

  const closeRowPayrollModal = () => {
    setShowRowPayrollModal(false);
    setRowPayrollTarget(null);
    setRowPayrollPeriod(getDefaultPayrollPickerValue());
    setRowPayrollError('');
  };

  // Generate payroll
  const generatePayroll = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      setPayrollError('Please select an employee');
      return;
    }

    const normalizedPayrollPeriod = pickerValueToPayrollPeriod(payrollPeriod);

    if (!normalizedPayrollPeriod) {
      setPayrollError('Please select a payroll period');
      return;
    }

    try {
      setGeneratingPayroll(true);
      setPayrollError('');
      
      const response = await payrollService.generatePayroll(
        selectedEmployee.employee_id,
        normalizedPayrollPeriod,
        selectedEmployee.company_id || selectedEmployee.company?.company_id || ''
      );

      setShowGeneratePayrollModal(false);
      setSelectedEmployee(null);
      setPayrollPeriod(getDefaultPayrollPickerValue());

      showToast(response?.message || 'Payroll generated successfully. Slip generated automatically.', 'success');
      await loadPayrolls();
    } catch (error) {
      console.error('Error generating payroll:', error);
      setPayrollError(error.message || 'Failed to generate payroll');
      showToast(error.message || 'Failed to generate payroll', 'danger');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const handleRowPayrollGenerate = async () => {
    if (!rowPayrollTarget || !rowPayrollTarget.employee_id) {
      setRowPayrollError('Invalid payroll selected.');
      return;
    }

    const normalizedPayrollPeriod = pickerValueToPayrollPeriod(rowPayrollPeriod);

    if (!normalizedPayrollPeriod) {
      setRowPayrollError('Payroll period is required.');
      return;
    }

    try {
      setRowGeneratingPayroll(true);
      setRowPayrollError('');

      const response = await payrollService.generatePayroll(
        rowPayrollTarget.employee_id,
        normalizedPayrollPeriod,
        getPayrollCompanyId(rowPayrollTarget)
      );

      showToast(
        response?.message || 'Payroll generated successfully. Slip generated automatically.',
        'success'
      );

      closeRowPayrollModal();
      await loadPayrolls();
    } catch (error) {
      console.error('Error generating payroll:', error);
      setRowPayrollError(error.message || 'Failed to generate payroll.');
    } finally {
      setRowGeneratingPayroll(false);
    }
  };

  const [showMassGenerateModal, setShowMassGenerateModal] = useState(false);
  const [massGenerateCompanyId, setMassGenerateCompanyId] = useState('');
  const [massPayrollPeriod, setMassPayrollPeriod] = useState(() => getDefaultPayrollPickerValue());
  const [massGenerateError, setMassGenerateError] = useState('');
  const [massGenerating, setMassGenerating] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPeriod, setDownloadPeriod] = useState(() => getDefaultPayrollPickerValue());
  const [downloadCompanyId, setDownloadCompanyId] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadCompanies, setDownloadCompanies] = useState([]);
  const [showMassEmailModal, setShowMassEmailModal] = useState(false);
  const [massEmailCompanyId, setMassEmailCompanyId] = useState('');
  const [massEmailPeriod, setMassEmailPeriod] = useState(() => getDefaultPayrollPickerValue());
  const [massEmailError, setMassEmailError] = useState('');
  const [massEmailSending, setMassEmailSending] = useState(false);
  const [massEmailConfirmPayload, setMassEmailConfirmPayload] = useState(null);
  const [emailingSlipId, setEmailingSlipId] = useState(null);
  const [emailConfirmTarget, setEmailConfirmTarget] = useState(null);
  const [checkingPayrollId, setCheckingPayrollId] = useState(null);

  const openMassGenerateModal = () => {
    setMassGenerateCompanyId(downloadCompanies.length > 0 ? String(downloadCompanies[0].value) : '');
    setMassPayrollPeriod(getDefaultPayrollPickerValue());
    setMassGenerateError('');
    setShowMassGenerateModal(true);
  };

  const closeMassGenerateModal = () => {
    setShowMassGenerateModal(false);
    setMassGenerateCompanyId('');
    setMassPayrollPeriod(getDefaultPayrollPickerValue());
    setMassGenerateError('');
  };

  const handleMassPayrollGenerate = async () => {
    const normalizedPayrollPeriod = pickerValueToPayrollPeriod(massPayrollPeriod);

    if (!normalizedPayrollPeriod) {
      setMassGenerateError('Payroll period is required.');
      return;
    }

    if (downloadCompanies.length === 0) {
      setMassGenerateError('No companies available for mass payroll generation.');
      return;
    }

    if (!massGenerateCompanyId.trim()) {
      setMassGenerateError('Company is required.');
      return;
    }

    const companyIdNumeric = Number(massGenerateCompanyId);
    if (Number.isNaN(companyIdNumeric) || companyIdNumeric <= 0) {
      setMassGenerateError('Company ID must be a positive number.');
      return;
    }

    try {
      setMassGenerating(true);
      setMassGenerateError('');

      const result = await payrollService.generateMassPayroll(normalizedPayrollPeriod, companyIdNumeric);

      showToast(result?.message || 'Mass payroll generation completed.', 'success');
      closeMassGenerateModal();
      await loadPayrolls();
    } catch (error) {
      console.error('Error generating mass payroll:', error);
      setMassGenerateError(error.message || 'Failed to generate mass payroll.');
    } finally {
      setMassGenerating(false);
    }
  };

  const handlePayrollSelectionToggle = (payrollId) => {
    setSelectedPayrollIds((previous) => (
      previous.includes(payrollId)
        ? previous.filter((id) => id !== payrollId)
        : [...previous, payrollId]
    ));
  };

  const handleSelectAllEligiblePayrolls = () => {
    setSelectedPayrollIds((previous) => {
      if (isAllEligibleSelected) {
        return previous.filter((id) => !allEligiblePayrollIds.includes(id));
      }

      const mergedIds = new Set([...previous, ...allEligiblePayrollIds]);
      return Array.from(mergedIds);
    });
  };

  const openMassCheckModal = () => {
    if (selectedEligiblePayrolls.length === 0) {
      showToast('Select at least one eligible payroll to check.', 'warning');
      return;
    }

    setMassCheckPassword('');
    setMassCheckError('');
    setShowMassCheckModal(true);
  };

  const closeMassCheckModal = () => {
    if (massChecking) {
      return;
    }

    setShowMassCheckModal(false);
    setMassCheckPassword('');
    setMassCheckError('');
  };

  const handleMassCheckPayrolls = async () => {
    if (selectedEligiblePayrolls.length === 0) {
      setMassCheckError('Select at least one eligible payroll.');
      return;
    }

    if (!massCheckPassword.trim()) {
      setMassCheckError('Password confirmation is required.');
      return;
    }

    try {
      setMassChecking(true);
      setMassCheckError('');

      const response = await payrollService.massCheckPayrolls(
        selectedEligiblePayrolls.map((payroll) => payroll.payroll_id),
        massCheckPassword.trim(),
        appliedSearchParams.company_id || ''
      );

      showToast(response?.message || 'Mass payroll check completed.', 'success');
      setSelectedPayrollIds([]);
      setShowMassCheckModal(false);
      setMassCheckPassword('');
      setMassCheckError('');
      await loadPayrolls();
    } catch (error) {
      console.error('Error checking payrolls in bulk:', error);
      setMassCheckError(error.message || 'Failed to run mass payroll check.');
    } finally {
      setMassChecking(false);
    }
  };

  const openDownloadModal = () => {
    setDownloadPeriod(getDefaultPayrollPickerValue());
    setDownloadError("");
    setShowDownloadModal(true);

    if (downloadCompanies.length > 0) {
      setDownloadCompanyId(String(downloadCompanies[0].value));
    } else {
      setDownloadCompanyId("");
    }
  };

  const closeDownloadModal = () => {
    setShowDownloadModal(false);
    setDownloadPeriod(getDefaultPayrollPickerValue());
    setDownloadCompanyId("");
    setDownloadError("");
  };

  const extractFilename = (response, fallbackName) => {
    const contentDisposition = response.headers?.get
      ? response.headers.get('content-disposition')
      : null;

    if (!contentDisposition) {
      return fallbackName;
    }

    const filenameMatch = contentDisposition
      .split(';')
      .map(part => part.trim())
      .find(part => part.toLowerCase().startsWith('filename'));

    if (!filenameMatch) {
      return fallbackName;
    }

    const [, value] = filenameMatch.split('=');
    if (!value) {
      return fallbackName;
    }

    return decodeURIComponent(value.replace(/(^"|"$)/g, '')) || fallbackName;
  };

  const downloadFileWithAuth = async (url, fallbackFileName) => {
    const token = localStorage.getItem(config.auth.tokenStorageKey);

    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payroll file.');
    }

    const blob = await response.blob();
    const filename = extractFilename(response, fallbackFileName);

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const handlePayrollDownload = async () => {
    const normalizedPayrollPeriod = pickerValueToPayrollPeriod(downloadPeriod);

    if (!normalizedPayrollPeriod) {
      setDownloadError("Payroll period is required.");
      return;
    }

    if (!downloadCompanyId.trim()) {
      setDownloadError("Company ID is required.");
      return;
    }

    const companyIdNumeric = Number(downloadCompanyId);
    if (Number.isNaN(companyIdNumeric) || companyIdNumeric <= 0) {
      setDownloadError("Company ID must be a positive number.");
      return;
    }

    try {
      setDownloading(true);
      setDownloadError("");

      const responseData = await payrollService.downloadPayroll(
        normalizedPayrollPeriod,
        companyIdNumeric
      );

      const payload = responseData?.data ? responseData.data : responseData;
      const downloadUrl = payload?.download_url || null;
      const fallbackName =
        payload?.file_name ||
        `payroll-${normalizedPayrollPeriod}.xlsx`;

      if (!downloadUrl) {
        showToast("Payroll file generation triggered.", "success");
        closeDownloadModal();
        return;
      }

      try {
        await downloadFileWithAuth(downloadUrl, fallbackName);
        showToast("Payroll file downloaded successfully.", "success");
      } catch (downloadErr) {
        console.error("Error fetching payroll file:", downloadErr);
        setDownloadError(downloadErr.message || "Failed to download payroll file.");
        return;
      }

      closeDownloadModal();
    } catch (error) {
      console.error("Error downloading payroll:", error);
      setDownloadError(error.message || "Failed to download payroll.");
    } finally {
      setDownloading(false);
    }
  };
  useEffect(() => {
    const fetchDownloadCompanies = async () => {
      try {
        const options = await companyService.getCompanyOptions();
        setDownloadCompanies(options || []);
      } catch (err) {
        console.error('Error loading companies for download:', err);
      }
    };

    fetchDownloadCompanies();
  }, []);
  useEffect(() => {
    if (showMassGenerateModal && !massGenerateCompanyId && downloadCompanies.length > 0) {
      setMassGenerateCompanyId(String(downloadCompanies[0].value));
    }
  }, [showMassGenerateModal, massGenerateCompanyId, downloadCompanies]);
  useEffect(() => {
    if (showDownloadModal && !downloadCompanyId && downloadCompanies.length > 0) {
      setDownloadCompanyId(String(downloadCompanies[0].value));
    }
  }, [showDownloadModal, downloadCompanyId, downloadCompanies]);
  useEffect(() => {
    if (showMassEmailModal && !massEmailCompanyId && downloadCompanies.length > 0) {
      setMassEmailCompanyId(String(downloadCompanies[0].value));
    }
  }, [showMassEmailModal, massEmailCompanyId, downloadCompanies]);

  useEffect(() => {
    let isMounted = true;

    const fetchPeriodOptions = async () => {
      try {
        setPeriodOptionsLoading(true);
        setPeriodOptionsError('');

        const options = await payrollService.getPayrollPeriodOptions(searchParams.company_id);

        if (isMounted) {
          setPeriodOptions(options || []);
        }
      } catch (err) {
        console.error('Error loading payroll period options:', err);
        if (isMounted) {
          setPeriodOptions([]);
          setPeriodOptionsError('Period filter unavailable');
        }
      } finally {
        if (isMounted) {
          setPeriodOptionsLoading(false);
        }
      }
    };

    fetchPeriodOptions();

    return () => {
      isMounted = false;
    };
  }, [searchParams.company_id]);

  const openMassEmailModal = () => {
    setMassEmailPeriod(getDefaultPayrollPickerValue());
    setMassEmailError('');
    if (downloadCompanies.length > 0) {
      setMassEmailCompanyId(String(downloadCompanies[0].value));
    } else {
      setMassEmailCompanyId('');
    }
    setShowMassEmailModal(true);
  };

  const closeMassEmailModal = () => {
    if (massEmailSending) {
      return;
    }
    setShowMassEmailModal(false);
    setMassEmailPeriod(getDefaultPayrollPickerValue());
    setMassEmailCompanyId('');
    setMassEmailError('');
    setMassEmailConfirmPayload(null);
  };

  const handleMassEmailPrepare = (event) => {
    if (event) {
      event.preventDefault();
    }

    if (massEmailSending) {
      return;
    }

    const normalizedPayrollPeriod = pickerValueToPayrollPeriod(massEmailPeriod);

    if (!normalizedPayrollPeriod) {
      setMassEmailError('Payroll period is required.');
      return;
    }

    if (downloadCompanies.length === 0) {
      setMassEmailError('No companies available for mass email.');
      return;
    }

    if (!massEmailCompanyId) {
      setMassEmailError('Company is required.');
      return;
    }

    const companyIdNumeric = Number(massEmailCompanyId);
    if (Number.isNaN(companyIdNumeric) || companyIdNumeric <= 0) {
      setMassEmailError('Company ID must be a positive number.');
      return;
    }

    setMassEmailError('');
    setMassEmailConfirmPayload({
      companyId: companyIdNumeric,
      period: normalizedPayrollPeriod
    });
    setShowMassEmailModal(false);
  };

  const cancelMassEmailConfirm = () => {
    if (massEmailSending) {
      return;
    }
    setMassEmailConfirmPayload(null);
    setShowMassEmailModal(true);
  };

  const handleMassEmailConfirm = async () => {
    if (!massEmailConfirmPayload) {
      return;
    }

    const { companyId, period } = massEmailConfirmPayload;

    try {
      setMassEmailSending(true);
      await payrollService.emailMassSlip(companyId, period);
      showToast('Mass slip emails sent successfully.', 'success');
      setMassEmailConfirmPayload(null);
      setShowMassEmailModal(false);
      setMassEmailPeriod(getDefaultPayrollPickerValue());
      setMassEmailCompanyId('');
      setMassEmailError('');
      await loadPayrolls();
    } catch (error) {
      console.error('Error emailing mass slips:', error);
      showToast(error.message || 'Failed to send mass slip emails.', 'danger');
    } finally {
      setMassEmailSending(false);
    }
  };

  const getCompanyOptionLabel = (value) => {
    if (!value) {
      return 'Selected company';
    }
    const option = downloadCompanies.find(
      (company) => String(company.value) === String(value)
    );
    return option?.label || `Company #${value}`;
  };

  const confirmEmailSlip = (payroll) => {
    setEmailConfirmTarget(payroll);
  };

  const handleEmailSlip = async () => {
    const payroll = emailConfirmTarget;
    if (!payroll?.employee_id) {
      showToast('Invalid employee data for slip email.', 'danger');
      setEmailConfirmTarget(null);
      return;
    }

    const period = String(payroll?.payroll_periode || '').trim();
    if (!period) {
      showToast('Payroll period not found for this record.', 'danger');
      setEmailConfirmTarget(null);
      return;
    }

    try {
      setEmailingSlipId(payroll.payroll_id);
      await payrollService.emailSlip(payroll.employee_id, period);
      showToast('Slip email sent successfully.', 'success');
      await loadPayrolls();
    } catch (error) {
      console.error('Error emailing slip:', error);
      showToast(error.message || 'Failed to send slip email.', 'danger');
    } finally {
      setEmailConfirmTarget(null);
      setEmailingSlipId(null);
    }
  };

  const handleManualCheckPayroll = async (payroll) => {
    if (!payroll?.payroll_id) {
      showToast('Invalid payroll selected.', 'danger');
      return;
    }

    const nextChecked = !Boolean(payroll.is_printed);

    if (payroll.is_printed && payroll.is_emailed) {
      showToast('Emailed payroll cannot be reopened.', 'warning');
      return;
    }

    try {
      setCheckingPayrollId(payroll.payroll_id);
      const response = await payrollService.updatePayroll(payroll.payroll_id, {
        is_printed: nextChecked
      });

      const updatedPayroll = response?.data || null;

      setPayrolls((previousPayrolls) => previousPayrolls.map((item) => (
        item.payroll_id === payroll.payroll_id
          ? {
              ...item,
              ...(updatedPayroll || {}),
              is_printed: nextChecked
            }
          : item
      )));

      showToast(
        nextChecked
          ? 'Payroll marked as checked.'
          : 'Payroll reopened for correction.',
        'success'
      );
    } catch (error) {
      console.error('Error updating payroll check status:', error);
      showToast(error.message || 'Failed to update payroll check status.', 'danger');
    } finally {
      setCheckingPayrollId(null);
    }
  };

  const openDeletePayrollModal = (payroll) => {
    setPayrollToDelete(payroll);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const closeDeletePayrollModal = () => {
    setShowDeleteModal(false);
    setPayrollToDelete(null);
    setDeleteError('');
  };

  const handleDeletePayroll = async () => {
    if (!payrollToDelete?.payroll_id) {
      return;
    }

    try {
      setDeletingPayrollId(payrollToDelete.payroll_id);
      setDeleteError('');

      await payrollService.deletePayroll(payrollToDelete.payroll_id);

      closeDeletePayrollModal();
      showToast('Payroll deleted successfully.', 'success');
      await loadPayrolls();
    } catch (error) {
      console.error('Error deleting payroll:', error);
      setDeleteError(error.message || 'Failed to delete payroll.');
      showToast(error.message || 'Failed to delete payroll.', 'danger');
    } finally {
      setDeletingPayrollId(null);
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

  const resolvePeriodLabel = (period) => {
    const normalized = String(period || '').trim();

    if (/^\d{6}$/.test(normalized)) {
      return {
        formatted: formatPayrollPeriod(normalized),
        raw: normalized
      };
    }

    if (normalized) {
      return {
        formatted: normalized,
        raw: normalized
      };
    }

    return {
      formatted: '-',
      raw: '-'
    };
  };

  // Add this function to handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
    writeSessionFilter(PAYROLL_FILTER_STORAGE_KEY, {
      ...appliedSearchParams,
      pageSize: size
    });
  };

  if (loading && !hasLoadedPayrolls) {
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
          <CModal visible={showDeleteModal} onClose={closeDeletePayrollModal} alignment="center">
            <CModalHeader>
              <CModalTitle>Delete Payroll</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {payrollToDelete ? (
                <>
                  <p className="mb-2">
                    Are you sure you want to delete payroll for <strong>{payrollToDelete.employee?.name || 'this employee'}</strong>?
                  </p>
                  <p className="mb-2 text-medium-emphasis">
                    Period: <strong>{resolvePeriodLabel(payrollToDelete.payroll_periode).formatted}</strong>
                  </p>
                  <p className="mb-0 text-medium-emphasis">
                    This will also delete payroll details and benefits associated with this record.
                  </p>
                </>
              ) : null}
              {deleteError && (
                <CAlert color="danger" className="mt-3 mb-0">{deleteError}</CAlert>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" variant="outline" onClick={closeDeletePayrollModal} disabled={deletingPayrollId !== null}>
                Cancel
              </CButton>
              <CButton color="danger" onClick={handleDeletePayroll} disabled={deletingPayrollId !== null}>
                {deletingPayrollId !== null ? <CSpinner size="sm" className="me-2" /> : null}
                Delete
              </CButton>
            </CModalFooter>
          </CModal>

          <CCard className="mb-4">
            <CCardHeader className="bg-white border-bottom-0 pb-0">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                <div>
                  <h4 className="mb-1">Payroll Management</h4>
                  <p className="text-medium-emphasis mb-0">
                    Monitor payroll runs, slips, and communication in one place.
                  </p>
                </div>
                <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                  {/* <CButton
                    color="primary"
                    onClick={handleGeneratePayroll}
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Generate Payroll
                  </CButton> */}
                  <CButton
                    color="info"
                    onClick={openMassGenerateModal}
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Generate Mass Payroll
                  </CButton>
                  <CButton
                    color="success"
                    onClick={openMassCheckModal}
                    disabled={selectedEligiblePayrolls.length === 0}
                  >
                    <CIcon icon={cilCheckCircle} className="me-1" />
                    Check Selected ({selectedEligiblePayrolls.length})
                  </CButton>
                  <CButton
                    color="warning"
                    onClick={openMassEmailModal}
                  >
                    <CIcon icon={cilEnvelopeClosed} className="me-1" />
                    Send Mass Email
                  </CButton>
                  <CButton
                    color="dark"
                    onClick={openDownloadModal}
                  >
                    <CIcon icon={cilCloudDownload} className="me-1" />
                    Download Payroll
                  </CButton>
                </div>
              </div>
            </CCardHeader>
            <CCardBody className="pt-4">
              <CRow className="g-3 mb-4">
                <CCol sm={6} lg={3}>
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                        <CIcon icon={cilViewModule} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-uppercase text-medium-emphasis small">Records</div>
                        <div className="fs-5 fw-semibold">{totalRecords.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="small text-medium-emphasis">
                      Viewing {payrolls.length.toLocaleString('id-ID')} record(s) on this page.
                    </div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3}>
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="bg-success bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                        <CIcon icon={cilMoney} className="text-success" />
                      </div>
                      <div>
                        <div className="text-uppercase text-medium-emphasis small">Net Pay (Current View)</div>
                        <div className="fs-5 fw-semibold">{formatCurrency(summaryMetrics.totalNetPay)}</div>
                      </div>
                    </div>
                    <div className="small text-medium-emphasis">
                      Aggregated from payrolls displayed in the table.
                    </div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3}>
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="bg-info bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                        <CIcon icon={cilCheckCircle} className="text-info" />
                      </div>
                      <div>
                        <div className="text-uppercase text-medium-emphasis small">Manual Check</div>
                        <div className="fs-5 fw-semibold">
                          {summaryMetrics.printedCount.toLocaleString('id-ID')} checked
                        </div>
                      </div>
                    </div>
                    <div className="small text-medium-emphasis">
                      {summaryMetrics.printedCount.toLocaleString('id-ID')} of {payrolls.length.toLocaleString('id-ID')} payrolls have been manually checked.
                    </div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3}>
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center">
                        <CIcon icon={cilWarning} className="text-warning" />
                      </div>
                      <div>
                        <div className="text-uppercase text-medium-emphasis small">Pending Actions</div>
                        <div className="fs-5 fw-semibold">
                          {summaryMetrics.pendingSlipCount.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                    <div className="small text-medium-emphasis">
                      {summaryMetrics.emailedCount.toLocaleString('id-ID')} emailed | {summaryMetrics.pendingSlipCount.toLocaleString('id-ID')} awaiting slip file.
                    </div>
                  </div>
                </CCol>
              </CRow>

              <CForm onSubmit={handleSearchSubmit} className="mb-4">
                <CRow className="g-3 align-items-md-end">
                  <CCol lg={5}>
                    <label className="form-label" htmlFor="payroll-search-filter">Search</label>
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilSearch} />
                      </CInputGroupText>
                      <CFormInput
                        id="payroll-search-filter"
                        type="text"
                        placeholder="Search by employee name or email"
                        value={searchParams.search}
                        onChange={(e) => handleSearchChange('search', e.target.value)}
                      />
                    </CInputGroup>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <label className="form-label" htmlFor="payroll-company-filter">Company</label>
                    <CFormSelect
                      id="payroll-company-filter"
                      value={searchParams.company_id}
                      onChange={(e) => handleSearchChange('company_id', e.target.value)}
                    >
                      <option value="">All Companies</option>
                      {downloadCompanies.length === 0 ? (
                        <option disabled>No active companies available</option>
                      ) : (
                        downloadCompanies.map((option) => (
                          <option key={option.value} value={String(option.value)}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </CFormSelect>
                  </CCol>
                  <CCol sm={6} lg={2}>
                    <label className="form-label" htmlFor="payroll-period-filter">Period</label>
                    <CFormSelect
                      id="payroll-period-filter"
                      value={searchParams.payroll_periode}
                      onChange={(e) => handleSearchChange('payroll_periode', e.target.value)}
                      disabled={periodOptionsLoading}
                    >
                      <option value="">All Periods</option>
                      {currentPayrollPeriod && !hasCurrentPeriodOption && (
                        <option value={currentPayrollPeriod}>
                          {formatPayrollPeriod(currentPayrollPeriod)}
                        </option>
                      )}
                      {periodOptionsLoading ? (
                        <option disabled>Loading periods...</option>
                      ) : periodOptions.length === 0 ? (
                        <option disabled>No periods available</option>
                      ) : (
                        periodOptions.map((option) => (
                          <option key={option.value} value={String(option.value)}>
                            {option.label || option.value}
                          </option>
                        ))
                      )}
                    </CFormSelect>
                    {periodOptionsError && (
                      <small className="text-warning d-block mt-1">{periodOptionsError}</small>
                    )}
                  </CCol>
                  <CCol lg={2}>
                    <div className="d-grid gap-2 d-sm-flex justify-content-lg-end">
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
              </CForm>

              {payrolls.length > 0 ? (
                <>
                  <CTable responsive hover>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell className="text-center">
                          <CFormCheck
                            checked={isAllEligibleSelected}
                            disabled={allEligiblePayrollIds.length === 0}
                            onChange={handleSelectAllEligiblePayrolls}
                          />
                        </CTableHeaderCell>
                        <CTableHeaderCell>Employee</CTableHeaderCell>
                        <CTableHeaderCell>Company</CTableHeaderCell>
                        <CTableHeaderCell>Period</CTableHeaderCell>
                        <CTableHeaderCell>Net Pay</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {payrolls.map((payroll) => {
                        const periodInfo = resolvePeriodLabel(payroll.payroll_periode);
                        const companyLabel = getCompanyLabel(payroll);
                        const hasSlipFile = Boolean(payroll.slip_url);
                        const canSelectForMassCheck = canSelectPayrollForMassCheck(payroll);

                        return (
                          <CTableRow key={payroll.payroll_id}>
                            <CTableDataCell className="text-center">
                              <CFormCheck
                                checked={selectedPayrollIds.includes(payroll.payroll_id)}
                                disabled={!canSelectForMassCheck}
                                onChange={() => handlePayrollSelectionToggle(payroll.payroll_id)}
                              />
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="fw-semibold">{payroll.employee?.name || 'N/A'}</div>
                              <div className="small text-medium-emphasis">
                                {payroll.employee?.nik || 'No NIK'}
                              </div>
                              <div className="small text-medium-emphasis">
                                {payroll.employee?.email || 'No email'}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="fw-semibold">{companyLabel}</div>
                              {payroll.employee?.company?.email && (
                                <div className="small text-medium-emphasis">
                                  {payroll.employee.company.email}
                                </div>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="fw-semibold">{periodInfo.formatted}</div>
                              <div className="small text-medium-emphasis">{periodInfo.raw}</div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <strong>{formatCurrency(payroll.net_pay)}</strong>
                              {payroll.updated_at && (
                                <div className="small text-medium-emphasis">
                                  Updated {formatDate(payroll.updated_at)}
                                </div>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="d-flex flex-wrap gap-2">
                                <CBadge color={payroll.is_printed ? 'success' : 'warning'}>
                                  {payroll.is_printed ? 'Checked' : 'Needs check'}
                                </CBadge>
                                <CBadge color={hasSlipFile ? 'info' : 'secondary'}>
                                  {hasSlipFile ? 'File available' : 'No file'}
                                </CBadge>
                                <CBadge color={payroll.is_emailed ? 'success' : 'secondary'}>
                                  {payroll.is_emailed ? 'Email sent' : 'Email pending'}
                                </CBadge>
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="d-flex flex-wrap gap-2">
                                <Link
                                  to={`/payroll/${payroll.payroll_id}`}
                                  className="text-decoration-none"
                                >
                                  <CButton
                                    color="info"
                                    size="sm"
                                    title="View payroll detail"
                                  >
                                    <CIcon icon={cilViewModule} size="sm" />
                                  </CButton>
                                </Link>
                                <CButton
                                  color="primary"
                                  size="sm"
                                  title="Generate payroll"
                                  onClick={() => openRowPayrollModal(payroll)}
                                >
                                  <CIcon icon={cilMoney} size="sm" />
                                </CButton>
                                {hasSlipFile ? (
                                  <CButton
                                    color="primary"
                                    size="sm"
                                    title="Download slip"
                                    component="a"
                                    href={payroll.slip_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <CIcon icon={cilCloudDownload} size="sm" />
                                  </CButton>
                                ) : (
                                  <CButton
                                    color="primary"
                                    size="sm"
                                    title="Download slip"
                                    disabled
                                  >
                                    <CIcon icon={cilCloudDownload} size="sm" />
                                  </CButton>
                                )}
                                <CButton
                                  color={payroll.is_printed ? 'warning' : 'success'}
                                  size="sm"
                                  title={
                                    payroll.is_printed
                                      ? (payroll.is_emailed
                                        ? 'Emailed payroll cannot be reopened'
                                        : 'Reopen payroll for correction')
                                      : hasSlipFile
                                        ? 'Mark payroll as checked'
                                        : 'Payroll slip is not available'
                                  }
                                  disabled={
                                    checkingPayrollId === payroll.payroll_id ||
                                    (!payroll.is_printed && !canCheckPayroll(payroll)) ||
                                    (payroll.is_printed && !canReopenPayroll(payroll))
                                  }
                                  onClick={() => handleManualCheckPayroll(payroll)}
                                >
                                  {checkingPayrollId === payroll.payroll_id ? (
                                    <CSpinner size="sm" />
                                  ) : payroll.is_printed ? (
                                    <CIcon icon={cilMoney} size="sm" />
                                  ) : (
                                    <CIcon icon={cilCheckCircle} size="sm" />
                                  )}
                                </CButton>
                                <CButton
                                  color="warning"
                                  size="sm"
                                  title="Email slip"
                                  disabled={
                                    !payroll.is_printed ||
                                    !hasSlipFile ||
                                    emailingSlipId === payroll.payroll_id
                                  }
                                  onClick={() => confirmEmailSlip(payroll)}
                                >
                                  {emailingSlipId === payroll.payroll_id ? (
                                    <CSpinner size="sm" />
                                  ) : (
                                    <CIcon icon={cilEnvelopeClosed} size="sm" />
                                  )}
                                </CButton>
                                <CButton
                                  color="danger"
                                  size="sm"
                                  title={
                                    canDeletePayroll(payroll)
                                      ? 'Delete payroll'
                                      : getDeletePayrollDisabledReason(payroll)
                                  }
                                  disabled={!canDeletePayroll(payroll) || deletingPayrollId === payroll.payroll_id}
                                  onClick={() => openDeletePayrollModal(payroll)}
                                >
                                  {deletingPayrollId === payroll.payroll_id ? (
                                    <CSpinner size="sm" />
                                  ) : (
                                    <CIcon icon={cilTrash} size="sm" />
                                  )}
                                </CButton>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        );
                      })}
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
                          <option value="15">15</option>
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
                  <p className="text-medium-emphasis mb-3">
                    No payrolls match the current filters. Adjust the search criteria or create a new payroll.
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
        onClose={closeGeneratePayrollModal}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <CModalHeader closeButton={false}>
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
              type="month"
              value={payrollPeriod}
              onChange={(e) => setPayrollPeriod(e.target.value)}
              disabled={generatingPayroll}
              required
            />
            <small className="text-muted">Select the payroll month to generate.</small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={closeGeneratePayrollModal}
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
      
      {/* Generate Payroll (Row) Modal */}
      <CModal
        visible={showRowPayrollModal}
        onClose={closeRowPayrollModal}
      >
        <CModalHeader>
          <CModalTitle>Generate Payroll</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {rowPayrollError && (
            <CAlert color="danger" className="mb-3">
              {rowPayrollError}
            </CAlert>
          )}

          <div className="mb-3">
            <label className="form-label">Employee</label>
            <CFormInput
              type="text"
              value={
                rowPayrollTarget
                  ? `${rowPayrollTarget.employee?.name || '-'} (${rowPayrollTarget.employee?.nik || '-'})`
                  : ''
              }
              disabled
              readOnly
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="month"
              value={rowPayrollPeriod}
              onChange={(e) => setRowPayrollPeriod(e.target.value)}
              disabled={rowGeneratingPayroll}
            />
            <small className="text-muted">
              Select the payroll month to generate.
            </small>
            <small className="text-muted d-block mt-1">
              Only employees with net pay greater than 0 will be generated. Employees with zero or negative net pay are skipped.
            </small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={closeRowPayrollModal}
            disabled={rowGeneratingPayroll}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleRowPayrollGenerate}
            disabled={rowGeneratingPayroll}
          >
            {rowGeneratingPayroll ? (
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
      
      {/* Generate Mass Payroll Modal */}
      <CModal
        visible={showMassGenerateModal}
        onClose={closeMassGenerateModal}
      >
        <CModalHeader>
          <CModalTitle>Generate Mass Payroll</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {massGenerateError && (
            <CAlert color="danger" className="mb-3">
              {massGenerateError}
            </CAlert>
          )}

          <div className="mb-3">
            <label className="form-label">Company</label>
            <CFormSelect
              value={massGenerateCompanyId}
              onChange={(e) => setMassGenerateCompanyId(e.target.value)}
              disabled={massGenerating || downloadCompanies.length === 0}
            >
              <option value="">Select company</option>
              {downloadCompanies.map((company) => (
                <option key={company.value} value={company.value}>
                  {company.label}
                </option>
              ))}
            </CFormSelect>
            {downloadCompanies.length === 0 && (
              <small className="text-muted">
                No companies available. Please ensure company data is loaded.
              </small>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="month"
              value={massPayrollPeriod}
              onChange={(e) => setMassPayrollPeriod(e.target.value)}
              disabled={massGenerating}
            />
            <small className="text-muted">
              Select the payroll month for mass generation.
            </small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={closeMassGenerateModal}
            disabled={massGenerating}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleMassPayrollGenerate}
            disabled={massGenerating || !massGenerateCompanyId || downloadCompanies.length === 0}
          >
            {massGenerating ? (
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

      <CModal
        visible={showMassCheckModal}
        onClose={closeMassCheckModal}
      >
        <CModalHeader>
          <CModalTitle>Check Selected Payrolls</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {massCheckError && (
            <CAlert color="danger" className="mb-3">
              {massCheckError}
            </CAlert>
          )}

          <p className="mb-3">
            {selectedEligiblePayrolls.length} payroll akan ditandai checked. Masukkan password akun Anda untuk konfirmasi.
          </p>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <CFormInput
              type="password"
              value={massCheckPassword}
              onChange={(e) => setMassCheckPassword(e.target.value)}
              disabled={massChecking}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={closeMassCheckModal}
            disabled={massChecking}
          >
            Cancel
          </CButton>
          <CButton
            color="success"
            onClick={handleMassCheckPayrolls}
            disabled={massChecking || !massCheckPassword.trim() || selectedEligiblePayrolls.length === 0}
          >
            {massChecking ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Checking...
              </>
            ) : (
              'Confirm Check'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
      
      {/* Mass Email Slip Modal */}
      <CModal
        visible={showMassEmailModal}
        onClose={closeMassEmailModal}
      >
        <CModalHeader>
          <CModalTitle>Send Mass Slip Email</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleMassEmailPrepare}>
          <CModalBody>
            {massEmailError && (
              <CAlert color="danger" className="mb-3">
                {massEmailError}
              </CAlert>
            )}

            <div className="mb-3">
              <label className="form-label">Payroll Period</label>
              <CFormInput
                type="month"
                value={massEmailPeriod}
                onChange={(e) => setMassEmailPeriod(e.target.value)}
                disabled={massEmailSending}
              />
              <small className="text-muted">
                Select the payroll month for mass slip email.
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label">Company</label>
              <CFormSelect
                value={massEmailCompanyId}
                onChange={(e) => setMassEmailCompanyId(e.target.value)}
                disabled={massEmailSending || downloadCompanies.length === 0}
              >
                <option value="">Select company</option>
                {downloadCompanies.map((company) => (
                  <option key={company.value} value={company.value}>
                    {company.label}
                  </option>
                ))}
              </CFormSelect>
              {downloadCompanies.length === 0 && (
                <small className="text-muted">
                  No companies available. Please ensure company data is loaded.
                </small>
              )}
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={closeMassEmailModal}
              disabled={massEmailSending}
            >
              Cancel
            </CButton>
            <CButton
              color="warning"
              type="submit"
              disabled={
                massEmailSending ||
                downloadCompanies.length === 0
              }
            >
              Send Email
            </CButton>
          </CModalFooter>
      </CForm>
    </CModal>
      
      {/* Mass Email Confirmation Modal */}
      <CModal
        visible={!!massEmailConfirmPayload}
        onClose={cancelMassEmailConfirm}
      >
        <CModalHeader>
          <CModalTitle>Confirm Mass Slip Email</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Send payroll slips for period{' '}
            <strong>{massEmailConfirmPayload?.period}</strong> to company{' '}
            <strong>{getCompanyOptionLabel(massEmailConfirmPayload?.companyId)}</strong>?
          </p>
          <p className="mb-0">
            This will email slips to all eligible employees in the selected company.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={cancelMassEmailConfirm}
            disabled={massEmailSending}
          >
            Back
          </CButton>
          <CButton
            color="warning"
            onClick={handleMassEmailConfirm}
            disabled={massEmailSending}
          >
            {massEmailSending ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              'Send Emails'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
      {/* Download Payroll Modal */}
      <CModal
        visible={showDownloadModal}
        onClose={closeDownloadModal}
      >
        <CModalHeader>
          <CModalTitle>Download Payroll</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {downloadError && (
            <CAlert color="danger" className="mb-3">
              {downloadError}
            </CAlert>
          )}

          <div className="mb-3">
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="month"
              value={downloadPeriod}
              onChange={(e) => setDownloadPeriod(e.target.value)}
              disabled={downloading}
            />
            <small className="text-muted">
              Select the payroll month to download.
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">Company</label>
            <CFormSelect
              value={downloadCompanyId}
              onChange={(e) => setDownloadCompanyId(e.target.value)}
              disabled={downloading || downloadCompanies.length === 0}
            >
              <option value="">Select company</option>
              {downloadCompanies.map((company) => (
                <option key={company.value} value={company.value}>
                  {company.label}
                </option>
              ))}
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={closeDownloadModal}
            disabled={downloading}
          >
            Cancel
          </CButton>
          <CButton
            color="dark"
            onClick={handlePayrollDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Downloading...
              </>
            ) : (
              'Download'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
      
      {/* Email Slip Confirmation Modal */}
      <CModal
        visible={!!emailConfirmTarget}
        onClose={() => setEmailConfirmTarget(null)}
      >
        <CModalHeader>
          <CModalTitle>Send Slip Email</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Send payroll slip email to{' '}
            <strong>{emailConfirmTarget?.employee?.name || 'this employee'}</strong>{' '}
            for period <strong>{emailConfirmTarget?.payroll_periode}</strong>?
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setEmailConfirmTarget(null)}
            disabled={emailingSlipId === emailConfirmTarget?.payroll_id}
          >
            Cancel
          </CButton>
          <CButton
            color="warning"
            onClick={handleEmailSlip}
            disabled={emailingSlipId === emailConfirmTarget?.payroll_id}
          >
            {emailingSlipId === emailConfirmTarget?.payroll_id ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              'Send Email'
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
