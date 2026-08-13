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
  cilLoopCircular,
  cilEnvelopeClosed,
  cilCheckCircle,
  cilWarning
} from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatPayrollPeriod } from '../../../utils/formatters';
import payrollService from '../services/payrollService';
import employeeService from '../../employees/services/employeeService';
import companyService from '../../companies/services/companyService';
import config from '../../../config/environment';

const emptySearchParams = {
  search: '',
  payroll_periode: '',
  company_id: ''
};

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
  const [pageSize, setPageSize] = useState(15); // Default to 15 rows per page
  const [searchParams, setSearchParams] = useState(emptySearchParams);
  const [appliedSearchParams, setAppliedSearchParams] = useState(emptySearchParams);
  const [hasLoadedPayrolls, setHasLoadedPayrolls] = useState(false);
  const [periodOptions, setPeriodOptions] = useState([]);
  const [periodOptionsLoading, setPeriodOptionsLoading] = useState(false);
  const [periodOptionsError, setPeriodOptionsError] = useState('');
  
  // Generate Payroll Modal State
  const [showGeneratePayrollModal, setShowGeneratePayrollModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollPeriod, setPayrollPeriod] = useState('');
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [payrollError, setPayrollError] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateTarget, setRegenerateTarget] = useState(null);
  const [regeneratePeriod, setRegeneratePeriod] = useState('');
  const [regenerateError, setRegenerateError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [showRowPayrollModal, setShowRowPayrollModal] = useState(false);
  const [rowPayrollTarget, setRowPayrollTarget] = useState(null);
  const [rowPayrollPeriod, setRowPayrollPeriod] = useState('');
  const [rowPayrollError, setRowPayrollError] = useState('');
  const [rowGeneratingPayroll, setRowGeneratingPayroll] = useState(false);
  
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

  useDocumentTitle('Payroll List');

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
    setAppliedSearchParams({
      search: searchParams.search.trim(),
      payroll_periode: searchParams.payroll_periode.trim(),
      company_id: String(searchParams.company_id || '').trim()
    });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchParams(emptySearchParams);
    setAppliedSearchParams(emptySearchParams);
    setCurrentPage(1);
  };

  // Handle Generate Payroll
  const handleGeneratePayroll = () => {
    setSelectedEmployee(null);
    setPayrollPeriod('');
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

  const openRegenerateModal = (payroll) => {
    setRegenerateTarget(payroll);
    setRegeneratePeriod(String(payroll.payroll_periode || '').trim());
    setRegenerateError('');
    setShowRegenerateModal(true);
  };

  const closeRegenerateModal = () => {
    setShowRegenerateModal(false);
    setRegenerateTarget(null);
    setRegeneratePeriod('');
    setRegenerateError('');
  };

  const openRowPayrollModal = (payroll) => {
    setRowPayrollTarget(payroll);
    setRowPayrollPeriod(String(payroll.payroll_periode || '').trim());
    setRowPayrollError('');
    setShowRowPayrollModal(true);
  };

  const closeRowPayrollModal = () => {
    setShowRowPayrollModal(false);
    setRowPayrollTarget(null);
    setRowPayrollPeriod('');
    setRowPayrollError('');
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

  const handleGenerateSlip = async () => {
    if (!regenerateTarget || !regenerateTarget.employee_id) {
      setRegenerateError('Invalid payroll selected.');
      return;
    }

    if (!regeneratePeriod.trim()) {
      setRegenerateError('Payroll period is required.');
      return;
    }

    try {
      setRegenerating(true);
      setRegenerateError('');

      const response = await payrollService.generateSlip(
        regenerateTarget.employee_id,
        regeneratePeriod.trim()
      );

      const slipUrl =
        response?.data?.payroll?.slip_url ||
        response?.payroll?.slip_url ||
        null;

      showToast(
        slipUrl
          ? 'Slip generated successfully. Download icon updated.'
          : 'Slip generated successfully.',
        'success'
      );

      closeRegenerateModal();
      await loadPayrolls();
    } catch (error) {
      console.error('Error generating slip:', error);
      setRegenerateError(error.message || 'Failed to generate slip.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRowPayrollGenerate = async () => {
    if (!rowPayrollTarget || !rowPayrollTarget.employee_id) {
      setRowPayrollError('Invalid payroll selected.');
      return;
    }

    if (!rowPayrollPeriod.trim()) {
      setRowPayrollError('Payroll period is required.');
      return;
    }

    try {
      setRowGeneratingPayroll(true);
      setRowPayrollError('');

      const response = await payrollService.generatePayroll(
        rowPayrollTarget.employee_id,
        rowPayrollPeriod.trim()
      );

      const slipUrl =
        response?.data?.payroll?.slip_url ||
        response?.payroll?.slip_url ||
        null;

      showToast(
        slipUrl
          ? 'Payroll generated successfully. Download icon updated.'
          : 'Payroll generated successfully.',
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
  const [massPayrollPeriod, setMassPayrollPeriod] = useState('');
  const [massGenerateError, setMassGenerateError] = useState('');
  const [massGenerating, setMassGenerating] = useState(false);
  const [showMassSlipModal, setShowMassSlipModal] = useState(false);
  const [massSlipPeriod, setMassSlipPeriod] = useState('');
  const [massSlipError, setMassSlipError] = useState('');
  const [massSlipGenerating, setMassSlipGenerating] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPeriod, setDownloadPeriod] = useState('');
  const [downloadCompanyId, setDownloadCompanyId] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadCompanies, setDownloadCompanies] = useState([]);
  const [showMassEmailModal, setShowMassEmailModal] = useState(false);
  const [massEmailCompanyId, setMassEmailCompanyId] = useState('');
  const [massEmailPeriod, setMassEmailPeriod] = useState('');
  const [massEmailError, setMassEmailError] = useState('');
  const [massEmailSending, setMassEmailSending] = useState(false);
  const [massEmailConfirmPayload, setMassEmailConfirmPayload] = useState(null);
  const [emailingSlipId, setEmailingSlipId] = useState(null);
  const [emailConfirmTarget, setEmailConfirmTarget] = useState(null);

  const openMassGenerateModal = () => {
    setMassPayrollPeriod('');
    setMassGenerateError('');
    setShowMassGenerateModal(true);
  };

  const closeMassGenerateModal = () => {
    setShowMassGenerateModal(false);
    setMassPayrollPeriod('');
    setMassGenerateError('');
  };

  const openMassSlipModal = () => {
    setMassSlipPeriod('');
    setMassSlipError('');
    setShowMassSlipModal(true);
  };

  const closeMassSlipModal = () => {
    setShowMassSlipModal(false);
    setMassSlipPeriod('');
    setMassSlipError('');
  };

  const handleMassPayrollGenerate = async () => {
    if (!massPayrollPeriod.trim()) {
      setMassGenerateError('Payroll period is required.');
      return;
    }

    try {
      setMassGenerating(true);
      setMassGenerateError('');

      const result = await payrollService.generateMassPayroll(massPayrollPeriod.trim());

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

  const openDownloadModal = () => {
    setDownloadPeriod("");
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
    setDownloadPeriod("");
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
    if (!downloadPeriod.trim()) {
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
        downloadPeriod.trim(),
        companyIdNumeric
      );

      const payload = responseData?.data ? responseData.data : responseData;
      const downloadUrl = payload?.download_url || null;
      const fallbackName =
        payload?.file_name ||
        `payroll-${downloadPeriod.trim()}.xlsx`;

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

  const handleMassSlipGenerate = async () => {
    if (!massSlipPeriod.trim()) {
      setMassSlipError('Payroll period is required.');
      return;
    }

    try {
      setMassSlipGenerating(true);
      setMassSlipError('');

      await payrollService.generateMassSlip(massSlipPeriod.trim());

      showToast('Mass slip generation started successfully.', 'success');
      closeMassSlipModal();
      await loadPayrolls();
    } catch (error) {
      console.error('Error generating mass slip:', error);
      setMassSlipError(error.message || 'Failed to generate mass slip.');
    } finally {
      setMassSlipGenerating(false);
    }
  };

  const openMassEmailModal = () => {
    setMassEmailPeriod('');
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
    setMassEmailPeriod('');
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

    if (!massEmailPeriod.trim()) {
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
      period: massEmailPeriod.trim()
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
      setMassEmailPeriod('');
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
                  <CButton
                    color="primary"
                    onClick={handleGeneratePayroll}
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Generate Payroll
                  </CButton>
                  <CButton
                    color="info"
                    onClick={openMassGenerateModal}
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Generate Mass Payroll
                  </CButton>
                  <CButton
                    color="success"
                    onClick={openMassSlipModal}
                  >
                    <CIcon icon={cilPlus} className="me-1" />
                    Generate Mass Slip
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
                        <div className="text-uppercase text-medium-emphasis small">Slip Status</div>
                        <div className="fs-5 fw-semibold">
                          {summaryMetrics.printedCount.toLocaleString('id-ID')} printed
                        </div>
                      </div>
                    </div>
                    <div className="small text-medium-emphasis">
                      {summaryMetrics.printedCount.toLocaleString('id-ID')} of {payrolls.length.toLocaleString('id-ID')} payrolls have printable slips.
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

                        return (
                          <CTableRow key={payroll.payroll_id}>
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
                                  {payroll.is_printed ? 'Slip ready' : 'Slip pending'}
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
                                <CButton
                                  color="primary"
                                  size="sm"
                                  title="Generate slip"
                                  onClick={() => openRegenerateModal(payroll)}
                                >
                                  <CIcon icon={cilLoopCircular} size="sm" />
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
                                  color="success"
                                  size="sm"
                                  title="Print slip"
                                  disabled={!payroll.is_printed || !hasSlipFile}
                                >
                                  <CIcon icon={cilPrint} size="sm" />
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
                                  title="Delete payroll (coming soon)"
                                  disabled
                                >
                                  <CIcon icon={cilTrash} size="sm" />
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
              type="text"
              placeholder="Enter period (e.g., 202501)"
              value={rowPayrollPeriod}
              onChange={(e) => setRowPayrollPeriod(e.target.value)}
              disabled={rowGeneratingPayroll}
            />
            <small className="text-muted">
              Format: YYYYMM (e.g., 202501 for January 2025)
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
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="text"
              placeholder="Enter period (e.g., 202501)"
              value={massPayrollPeriod}
              onChange={(e) => setMassPayrollPeriod(e.target.value)}
              disabled={massGenerating}
            />
            <small className="text-muted">
              Format: YYYYMM (e.g., 202501 for January 2025)
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
            disabled={massGenerating}
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
      
      {/* Generate Mass Slip Modal */}
      <CModal
        visible={showMassSlipModal}
        onClose={closeMassSlipModal}
      >
        <CModalHeader>
          <CModalTitle>Generate Mass Slip</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {massSlipError && (
            <CAlert color="danger" className="mb-3">
              {massSlipError}
            </CAlert>
          )}

          <div className="mb-3">
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="text"
              placeholder="Enter period (e.g., 202501)"
              value={massSlipPeriod}
              onChange={(e) => setMassSlipPeriod(e.target.value)}
              disabled={massSlipGenerating}
            />
            <small className="text-muted">
              Format: YYYYMM (e.g., 202501 for January 2025)
            </small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={closeMassSlipModal}
            disabled={massSlipGenerating}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleMassSlipGenerate}
            disabled={massSlipGenerating}
          >
            {massSlipGenerating ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              'Generate Slip'
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
                type="text"
                placeholder="Enter period (e.g., 202501)"
                value={massEmailPeriod}
                onChange={(e) => setMassEmailPeriod(e.target.value)}
                disabled={massEmailSending}
              />
              <small className="text-muted">
                Format: YYYYMM (e.g., 202501 for January 2025)
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
      
      {/* Generate Slip Modal */}{/* Generate Slip Modal */}
      <CModal
        visible={showRegenerateModal}
        onClose={closeRegenerateModal}
      >
        <CModalHeader>
          <CModalTitle>Generate Slip</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {regenerateError && (
            <CAlert color="danger" className="mb-3">
              {regenerateError}
            </CAlert>
          )}

          <div className="mb-3">
            <label className="form-label">Employee</label>
            <CFormInput
              type="text"
              value={
                regenerateTarget
                  ? `${regenerateTarget.employee?.name || '-'} (${regenerateTarget.employee?.nik || '-'})`
                  : ''
              }
              disabled
              readOnly
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Payroll Period</label>
            <CFormInput
              type="text"
              placeholder="Enter period (e.g., 202501)"
              value={regeneratePeriod}
              onChange={(e) => setRegeneratePeriod(e.target.value)}
              disabled={regenerating}
            />
            <small className="text-muted">
              Format: YYYYMM (e.g., 202501 for January 2025)
            </small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={closeRegenerateModal}
            disabled={regenerating}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleGenerateSlip}
            disabled={regenerating}
          >
            {regenerating ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              'Generate Slip'
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
              type="text"
              placeholder="Enter period (e.g., 202501)"
              value={downloadPeriod}
              onChange={(e) => setDownloadPeriod(e.target.value)}
              disabled={downloading}
            />
            <small className="text-muted">
              Format: YYYYMM (e.g., 202501 for January 2025)
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
