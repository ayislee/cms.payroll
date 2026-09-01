// ========================================
// EMPLOYEE DETAIL PAGE
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
  CBreadcrumb,
  CBreadcrumbItem,
  CBadge,
  CListGroup,
  CListGroupItem,
  CButtonGroup,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTabs,
  CTab,
  CTabList,
  CTabContent,
  CTabPanel,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormInput,
  CFormSwitch
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser,
  cilPencil,
  cilTrash,
  cilSettings,
  cilArrowLeft,
  cilBuilding,
  cilPhone,
  cilEnvelopeClosed,
  cilLocationPin,
  cilCalendar,
  cilInfo,
  cilCreditCard,
  cilBank,
  cilNotes,
  cilDollar,
  cilSave
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatDateTime, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import { CALCULATION_TYPES } from '../../../constants/payrollConstants';
import employeeService from '../services/employeeService';
import employeeComponentService from '../services/employeeComponentService';
import employeeBenefitService from '../services/employeeBenefitService';

const getComponentCalculationType = (component) =>
  (component.mainComponent?.calculation_type || component.calculation_type || '').toLowerCase();

const isAutomaticComponent = (component) =>
  getComponentCalculationType(component) === CALCULATION_TYPES.AUTO;

const getComponentTypeOrder = (component) => {
  const type = (component.mainComponent?.type || component.type || '').toLowerCase();

  if (type === 'earning') return 0;
  if (type === 'deduction') return 1;
  return 2;
};

const sortEmployeeComponents = (components = []) =>
  [...components].sort((first, second) => getComponentTypeOrder(first) - getComponentTypeOrder(second));

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // State management
  const [employee, setEmployee] = useState(null);
  const [employeeComponents, setEmployeeComponents] = useState([]);
  const [employeeBenefits, setEmployeeBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [error, setError] = useState('');
  const [componentsError, setComponentsError] = useState('');
  const [benefitsError, setBenefitsError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [editingComponent, setEditingComponent] = useState(null);
  const [componentForm, setComponentForm] = useState({ amount: 0, is_active: true });
  const [componentStatusUpdatingId, setComponentStatusUpdatingId] = useState(null);
  const [benefitUpdatingId, setBenefitUpdatingId] = useState(null);

  // Debugging: Log when component mounts
  useEffect(() => {
  }, []);

  // Set document title
  useDocumentTitle(employee ? `${employee.name} - Employee Detail` : 'Employee Detail');

  // Load employee data
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError('');

        const employeeData = await employeeService.getEmployeeById(id);
        
        if (employeeData) {
          setEmployee(employeeData);
        } else {
          setError('Employee not found');
        }
      } catch (error) {
        console.error('Error loading employee:', error);
        setError(error.message || 'Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id]);

  // Load employee benefit assignments as soon as employee data is available.
  useEffect(() => {
    const loadEmployeeBenefits = async () => {
      if (!employee?.employee_id) {
        setEmployeeBenefits([]);
        return;
      }

      try {
        setBenefitsLoading(true);
        setBenefitsError('');

        const benefits = await employeeBenefitService.getEmployeeBenefits(employee.employee_id);
        setEmployeeBenefits(benefits || []);
      } catch (error) {
        console.error('Error loading employee benefits:', error);
        setBenefitsError(error.message || 'Failed to load employee benefits');
        setEmployeeBenefits([]);
      } finally {
        setBenefitsLoading(false);
      }
    };

    loadEmployeeBenefits();
  }, [employee?.employee_id, employee?.company_id]);

  // Load employee components when settings tab is active
  useEffect(() => {
    const loadEmployeeSettings = async () => {
      if (activeTab === 'settings') {
        if (employee) {
          if (employee.employee_id) {
            setComponentsLoading(true);
            setComponentsError('');

            try {
              const components = await employeeComponentService.getEmployeeComponents(employee.employee_id);
              setEmployeeComponents(sortEmployeeComponents(components || []));
            } catch (error) {
              console.error('Error loading employee components:', error);
              setComponentsError(error.message || 'Failed to load employee components');
              setEmployeeComponents([]);
            } finally {
              setComponentsLoading(false);
            }
          } else {
          }
        } else {
        }
      } else {
      }
    };

    loadEmployeeSettings();
  }, [activeTab, employee]);

  // Debugging: Log tab change events
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (employee) {
    }
  };

  const handleStatusToggle = async (event) => {
    const nextActive = event.target.checked;
    const previousStatus = employee.status;
    const nextStatus = nextActive ? 'active' : 'not_active';

    try {
      setStatusUpdating(true);
      setStatusError('');
      setEmployee((prev) => ({
        ...prev,
        status: nextStatus
      }));

      await employeeService.updateEmployeeStatus(employee.employee_id, employee.company_id, nextActive);
    } catch (error) {
      console.error('Error updating employee status:', error);
      setEmployee((prev) => ({
        ...prev,
        status: previousStatus
      }));
      setStatusError(error.message || 'Failed to update employee status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await employeeService.deleteEmployee(id);
      
      // Redirect to employee list after successful deletion
      navigate('/employees', { 
        state: { message: `Employee ${employee.name} has been deleted successfully` }
      });
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError(error.message || 'Failed to delete employee');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // Handle component edit
  const handleEditComponent = (component) => {
    setEditingComponent(component.employee_component_id);
    setComponentForm({
      amount: component.amount || 0,
      is_active: component.is_active || false
    });
  };

  // Handle component form change
  const handleComponentFormChange = (field, value) => {
    setComponentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleComponentStatus = async (component, isActive) => {
    if (!component?.employee_component_id || !hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)) {
      return;
    }

    const componentId = component.employee_component_id;
    const previousActive = Boolean(component.is_active);

    try {
      setComponentsError('');
      setComponentStatusUpdatingId(componentId);
      setEmployeeComponents((prevComponents) => prevComponents.map((item) => (
        item.employee_component_id === componentId
          ? { ...item, is_active: Boolean(isActive) }
          : item
      )));

      if (editingComponent === componentId) {
        setComponentForm((prev) => ({
          ...prev,
          is_active: Boolean(isActive)
        }));
      }

      await employeeComponentService.toggleEmployeeComponentActive(componentId, isActive);
    } catch (error) {
      console.error('Error toggling employee component status:', error);
      setEmployeeComponents((prevComponents) => prevComponents.map((item) => (
        item.employee_component_id === componentId
          ? { ...item, is_active: previousActive }
          : item
      )));
      setComponentsError(error.message || 'Failed to update employee component status');
    } finally {
      setComponentStatusUpdatingId(null);
    }
  };

  const handleToggleEmployeeBenefit = async (benefit, isActive) => {
    if (!benefit?.company_benefit_id || !employee?.employee_id || !hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)) {
      return;
    }

    const benefitId = benefit.company_benefit_id;
    const previousAssigned = Boolean(benefit.is_assigned);

    try {
      setBenefitsError('');
      setBenefitUpdatingId(benefitId);
      setEmployeeBenefits((prevBenefits) => prevBenefits.map((item) => (
        item.company_benefit_id === benefitId
          ? { ...item, is_assigned: Boolean(isActive), employee_benefit_active: Boolean(isActive) }
          : item
      )));

      await employeeBenefitService.toggleEmployeeBenefit(employee.employee_id, benefitId, isActive);
    } catch (error) {
      console.error('Error toggling employee benefit:', error);
      setEmployeeBenefits((prevBenefits) => prevBenefits.map((item) => (
        item.company_benefit_id === benefitId
          ? { ...item, is_assigned: previousAssigned, employee_benefit_active: previousAssigned }
          : item
      )));
      setBenefitsError(error.message || 'Failed to update employee benefit');
    } finally {
      setBenefitUpdatingId(null);
    }
  };

  const resolveBenefitBaseLabel = (benefit) => {
    const component = benefit?.main_component;

    if (component?.code || component?.name) {
      return [component.code, component.name].filter(Boolean).join(' - ');
    }

    return benefit?.main_component_id ? `Component #${benefit.main_component_id}` : 'Total Earnings';
  };

  // Handle component save
  const handleSaveComponent = async (componentId) => {
    try {
      const currentComponent = employeeComponents.find((component) => component.employee_component_id === componentId);
      const updatedData = {
        employee_component_id: componentId,
        amount: parseFloat(componentForm.amount) || 0,
        is_active: currentComponent ? Boolean(currentComponent.is_active) : componentForm.is_active
      };
      
      await employeeComponentService.updateEmployeeComponent(updatedData);
      
      // Refresh the components list
      const components = await employeeComponentService.getEmployeeComponents(employee.employee_id);
      setEmployeeComponents(sortEmployeeComponents(components || []));
      
      // Reset editing state
      setEditingComponent(null);
      setComponentForm({ amount: 0, is_active: true });
    } catch (error) {
      console.error('Error updating employee component:', error);
      setComponentsError(error.message || 'Failed to update employee component');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingComponent(null);
    setComponentForm({ amount: 0, is_active: true });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading employee details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        {error}
        <div className="mt-2">
          <Link to="/employees">
            <CButton color="primary" size="sm">
              Back to Employee List
            </CButton>
          </Link>
        </div>
      </CAlert>
    );
  }

  if (!employee) {
    return (
      <CAlert color="warning">
        Employee not found
        <div className="mt-2">
          <Link to="/employees">
            <CButton color="primary" size="sm">
              Back to Employee List
            </CButton>
          </Link>
        </div>
      </CAlert>
    );
  }

  // Calculate employment duration
  const getEmploymentDuration = () => {
    if (!employee.created_at) return 'Unknown';
    
    const startDate = new Date(employee.created_at);
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const renderEmployeeBenefitsCard = () => (
    <CCard className="mb-4">
      <CCardHeader>
        <CRow className="align-items-center">
          <CCol>
            <h5 className="mb-0">
              <CIcon icon={cilCreditCard} className="me-2" />
              Employee Company Benefits
            </h5>
          </CCol>
        </CRow>
      </CCardHeader>
      <CCardBody>
        {benefitsLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '160px' }}>
            <CSpinner color="primary" />
            <span className="ms-2">Loading employee benefits...</span>
          </div>
        ) : benefitsError ? (
          <CAlert color="danger">
            {benefitsError}
          </CAlert>
        ) : (
          <>
            <p className="text-medium-emphasis">
              Select which company benefits apply to this employee. Only enabled benefits are calculated when payroll is generated.
            </p>

            {employeeBenefits.length > 0 ? (
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Benefit</CTableHeaderCell>
                    <CTableHeaderCell>Base</CTableHeaderCell>
                    <CTableHeaderCell>Employee %</CTableHeaderCell>
                    <CTableHeaderCell>Employer %</CTableHeaderCell>
                    <CTableHeaderCell>Max Base</CTableHeaderCell>
                    <CTableHeaderCell>Taxable</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {employeeBenefits.map((benefit) => (
                    <CTableRow key={benefit.company_benefit_id}>
                      <CTableDataCell>
                        <div>
                          <strong>{benefit.name || 'Benefit'}</strong>
                          <div className="small text-medium-emphasis">
                            {benefit.benefit_type || 'No type'}
                          </div>
                          {benefit.description && (
                            <div className="small text-medium-emphasis">
                              {benefit.description}
                            </div>
                          )}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>{resolveBenefitBaseLabel(benefit)}</CTableDataCell>
                      <CTableDataCell>{Number(benefit.employee_percentage || 0).toFixed(4)}%</CTableDataCell>
                      <CTableDataCell>{Number(benefit.employer_percentage || 0).toFixed(4)}%</CTableDataCell>
                      <CTableDataCell>
                        {benefit.max_base !== null && benefit.max_base !== undefined
                          ? formatCurrency(benefit.max_base)
                          : '-'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={benefit.is_taxable ? 'warning' : 'secondary'}>
                          {benefit.is_taxable ? 'Taxable' : 'Non-taxable'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-2">
                          {benefitUpdatingId === benefit.company_benefit_id && (
                            <CSpinner size="sm" color="primary" />
                          )}
                          <CFormSwitch
                            className="mb-0"
                            checked={Boolean(benefit.is_assigned)}
                            onChange={(event) => handleToggleEmployeeBenefit(benefit, event.target.checked)}
                            disabled={
                              benefitUpdatingId === benefit.company_benefit_id ||
                              !benefit.is_active ||
                              !hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)
                            }
                            title={
                              !benefit.is_active
                                ? 'Company benefit is inactive'
                                : hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)
                                  ? 'Toggle employee benefit'
                                  : 'You do not have permission to update employee benefits'
                            }
                            size="sm"
                          />
                          <CBadge color={benefit.is_assigned ? 'success' : 'secondary'}>
                            {benefit.is_assigned ? 'Enabled' : 'Disabled'}
                          </CBadge>
                          {!benefit.is_active && (
                            <CBadge color="dark">Company inactive</CBadge>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            ) : (
              <div className="text-center py-5">
                <CIcon icon={cilCreditCard} size="3xl" className="text-muted mb-3" />
                <p className="text-medium-emphasis">
                  No company benefits configured for this employee company.
                </p>
              </div>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  );

  return (
    <>
      {/* Breadcrumb */}
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem>
          <Link to="/employees">Employees</Link>
        </CBreadcrumbItem>
        <CBreadcrumbItem active>{employee.name}</CBreadcrumbItem>
      </CBreadcrumb>

      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  <h4 className="mb-0">
                    <CIcon icon={cilUser} className="me-2" />
                    Employee Details
                  </h4>
                  <small className="text-medium-emphasis">
                    {employee.nik} - {employee.name}
                  </small>
                </CCol>
                <CCol xs="auto">
                  <CButtonGroup>
                    <Link to="/employees">
                      <CButton color="secondary" variant="outline">
                        <CIcon icon={cilArrowLeft} className="me-1" />
                        Back to List
                      </CButton>
                    </Link>
                    {hasPermission(PERMISSIONS.EMPLOYEES_UPDATE) && (
                      <Link to={`/employees/${id}/edit`}>
                        <CButton color="warning">
                          <CIcon icon={cilPencil} className="me-1" />
                          Edit
                        </CButton>
                      </Link>
                    )}
                    {hasPermission(PERMISSIONS.EMPLOYEES_DELETE) && (
                      <CButton color="danger" onClick={handleDelete}>
                        <CIcon icon={cilTrash} className="me-1" />
                        Delete
                      </CButton>
                    )}
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              <CTabs activeItemKey={activeTab} onActiveItemChange={handleTabChange}>
                <CTabList variant="tabs">
                  <CTab itemKey="details" onClick={() => setActiveTab('details')}>Details</CTab>
                  <CTab itemKey="benefit" onClick={() => setActiveTab('benefit')}>
                    <CIcon icon={cilCreditCard} className="me-1" />
                    Benefit
                  </CTab>
                  <CTab itemKey="settings" onClick={() => setActiveTab('settings')}>
                    <CIcon icon={cilSettings} className="me-1" />
                    Settings
                  </CTab>
                </CTabList>

                <CTabContent>
                  <CTabPanel className="mt-3" itemKey="details">
                    <CRow>
                      {/* Basic Information */}
                      <CCol lg={6}>
                        <CCard className="h-100">
                          <CCardHeader>
                            <h5 className="mb-0">
                              <CIcon icon={cilInfo} className="me-2" />
                              Basic Information
                            </h5>
                          </CCardHeader>
                          <CCardBody>
                            {statusError && (
                              <CAlert color="danger" dismissible onClose={() => setStatusError('')}>
                                {statusError}
                              </CAlert>
                            )}
                            <CListGroup flush>
                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Employee ID</strong>
                                  <div className="text-medium-emphasis small">Internal ID</div>
                                </div>
                                <CBadge color="primary">
                                  #{employee.employee_id}
                                </CBadge>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>NIK</strong>
                                  <div className="text-medium-emphasis small">Employee NIK</div>
                                </div>
                                <CBadge color="info" className="fs-6">
                                  {employee.nik}
                                </CBadge>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Full Name</strong>
                                  <div className="text-medium-emphasis small">Employee name</div>
                                </div>
                                <div className="text-end fw-semibold">
                                  {employee.name}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div className="d-flex align-items-center">
                                  <CIcon icon={cilEnvelopeClosed} className="me-2" />
                                  <div>
                                    <strong>Email</strong>
                                    <div className="text-medium-emphasis small">Contact email</div>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <a href={`mailto:${employee.email}`} className="text-decoration-none">
                                    {employee.email}
                                  </a>
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div className="d-flex align-items-center">
                                  <CIcon icon={cilPhone} className="me-2" />
                                  <div>
                                    <strong>Phone</strong>
                                    <div className="text-medium-emphasis small">Contact number</div>
                                  </div>
                                </div>
                                <div className="text-end">
                                  {employee.phone ? (
                                    <a href={`tel:${employee.phone}`} className="text-decoration-none">
                                      {formatPhoneNumber(employee.phone)}
                                    </a>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div className="d-flex align-items-center">
                                  <CIcon icon={cilNotes} className="me-2" />
                                  <div>
                                    <strong>Job Position</strong>
                                    <div className="text-medium-emphasis small">Current role</div>
                                  </div>
                                </div>
                                <div className="text-end fw-semibold">
                                  {employee.job_position ? employee.job_position : <span className="text-muted">-</span>}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Grade</strong>
                                  <div className="text-medium-emphasis small">Employee level</div>
                                </div>
                                <div className="text-end fw-semibold">
                                  {employee.grade ? employee.grade : <span className="text-muted">-</span>}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Organization</strong>
                                  <div className="text-medium-emphasis small">Business unit</div>
                                </div>
                                <div className="text-end fw-semibold">
                                  {employee.organization ? employee.organization : <span className="text-muted">-</span>}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Resign Date</strong>
                                  <div className="text-medium-emphasis small">Date employment ended</div>
                                </div>
                                <div className="text-end fw-semibold">
                                  {employee.resign_date ? formatDate(employee.resign_date) : <span className="text-muted">-</span>}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div className="d-flex align-items-center">
                                  <CIcon icon={cilCalendar} className="me-2" />
                                  <div>
                                    <strong>Registration Date</strong>
                                    <div className="text-medium-emphasis small">Date created</div>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div>{formatDate(employee.created_at)}</div>
                                  <small className="text-medium-emphasis">
                                    {formatDateTime(employee.created_at)}
                                  </small>
                                </div>
                              </CListGroupItem>
                            </CListGroup>
                          </CCardBody>
                        </CCard>
                      </CCol>

                      {/* Company & Status Information */}
                      <CCol lg={6}>
                        <CCard className="h-100">
                          <CCardHeader>
                            <h5 className="mb-0">
                              <CIcon icon={cilBuilding} className="me-2" />
                              Company & Status
                            </h5>
                          </CCardHeader>
                          <CCardBody>
                            <CListGroup flush>
                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Company</strong>
                                  <div className="text-medium-emphasis small">Assigned company</div>
                                </div>
                                <div className="text-end">
                                  <div className="fw-semibold">
                                    {employee.company?.name || employee.company_name || 'N/A'}
                                  </div>
                                  {employee.company_id && (
                                    <CBadge color="info" className="mt-1">
                                      ID: {employee.company_id}
                                    </CBadge>
                                  )}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Status</strong>
                                  <div className="text-medium-emphasis small">Active or inactive employee</div>
                                </div>
                                <div className="text-end">
                                  <div className="d-flex justify-content-end align-items-center gap-2">
                                    {statusUpdating && <CSpinner size="sm" color="primary" />}
                                    <CBadge color={employee.status === 'active' ? 'success' : 'secondary'}>
                                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                                    </CBadge>
                                    <CFormSwitch
                                      className="mb-0"
                                      checked={employee.status === 'active'}
                                      onChange={handleStatusToggle}
                                      disabled={statusUpdating || !hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)}
                                      title={hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)
                                        ? 'Toggle employee status'
                                        : 'You do not have permission to update employee status'}
                                    />
                                  </div>
                                  <div className="small text-medium-emphasis mt-1">
                                    {employee.status === 'active' ? 'On' : 'Off'}
                                  </div>
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>PTKP Status</strong>
                                  <div className="text-medium-emphasis small">Tax status</div>
                                </div>
                                <div className="text-end">
                                  <CBadge color="secondary" className="fs-6">
                                    {employee.ptkp}
                                  </CBadge>
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div className="d-flex align-items-center">
                                  <CIcon icon={cilLocationPin} className="me-2" />
                                  <div>
                                    <strong>Address</strong>
                                    <div className="text-medium-emphasis small">Complete address</div>
                                  </div>
                                </div>
                                <div className="text-end">
                                  {employee.address ? (
                                    <div className="small">
                                      {employee.address}
                                      {employee.city && (
                                        <div className="text-medium-emphasis mt-1">
                                          City: {employee.city}
                                        </div>
                                      )}
                                      {employee.state && (
                                        <div className="text-medium-emphasis">
                                          State: {employee.state}
                                        </div>
                                      )}
                                      {employee.country && (
                                        <div className="text-medium-emphasis">
                                          Country: {employee.country}
                                        </div>
                                      )}
                                      {employee.zip && (
                                        <div className="text-medium-emphasis">
                                          ZIP: {employee.zip}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted">No address provided</span>
                                  )}
                                </div>
                              </CListGroupItem>

                              <CListGroupItem className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>Employment Duration</strong>
                                  <div className="text-medium-emphasis small">Since registration</div>
                                </div>
                                <div className="text-end">
                                  <strong>{getEmploymentDuration()}</strong>
                                  <div className="small text-medium-emphasis">
                                    Since {formatDate(employee.created_at)}
                                  </div>
                                </div>
                              </CListGroupItem>
                            </CListGroup>
                          </CCardBody>
                        </CCard>

                      </CCol>
                    </CRow>

                    {/* Banking Information */}
                    {(employee.rekening || employee.bank || employee.npwp) && (
                      <CRow className="mt-4">
                        <CCol xs={12}>
                          <CCard>
                            <CCardHeader>
                              <h5 className="mb-0">
                                <CIcon icon={cilBank} className="me-2" />
                                Banking & Tax Information
                              </h5>
                            </CCardHeader>
                            <CCardBody>
                              <CListGroup flush>
                                {employee.rekening && (
                                  <CListGroupItem className="d-flex justify-content-between align-items-start">
                                    <div className="d-flex align-items-center">
                                      <CIcon icon={cilCreditCard} className="me-2" />
                                      <div>
                                        <strong>Account Number</strong>
                                        <div className="text-medium-emphasis small">Bank account</div>
                                      </div>
                                    </div>
                                    <div className="text-end">
                                      <code>{employee.rekening}</code>
                                      {employee.nama_rekening && (
                                        <div className="small text-medium-emphasis mt-1">
                                          Name: {employee.nama_rekening}
                                        </div>
                                      )}
                                    </div>
                                  </CListGroupItem>
                                )}

                                {employee.bank && (
                                  <CListGroupItem className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <strong>Bank</strong>
                                      <div className="text-medium-emphasis small">Banking institution</div>
                                    </div>
                                    <div className="text-end">
                                      <strong>{employee.bank}</strong>
                                      {employee.cabang && (
                                        <div className="small text-medium-emphasis mt-1">
                                          Branch: {employee.cabang}
                                        </div>
                                      )}
                                    </div>
                                  </CListGroupItem>
                                )}

                                {employee.npwp && (
                                  <CListGroupItem className="d-flex justify-content-between align-items-start">
                                    <div className="d-flex align-items-center">
                                      <CIcon icon={cilNotes} className="me-2" />
                                      <div>
                                        <strong>NPWP</strong>
                                        <div className="text-medium-emphasis small">Tax identification number</div>
                                      </div>
                                    </div>
                                    <div className="text-end">
                                      <code>{employee.npwp}</code>
                                    </div>
                                  </CListGroupItem>
                                )}
                              </CListGroup>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>
                    )}

                    {/* System Information */}
                    <CRow className="mt-4">
                      <CCol xs={12}>
                        <CCard>
                          <CCardHeader>
                            <h5 className="mb-0">
                              <CIcon icon={cilInfo} className="me-2" />
                              System Information
                            </h5>
                          </CCardHeader>
                          <CCardBody>
                            <CRow>
                              <CCol md={6}>
                                <CListGroup flush>
                                  <CListGroupItem className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <strong>Created At</strong>
                                      <div className="text-medium-emphasis small">Registration date</div>
                                    </div>
                                    <div className="text-end">
                                      <div>{formatDate(employee.created_at)}</div>
                                      <small className="text-medium-emphasis">
                                        {formatDateTime(employee.created_at)}
                                      </small>
                                    </div>
                                  </CListGroupItem>
                                </CListGroup>
                              </CCol>
                              <CCol md={6}>
                                <CListGroup flush>
                                  <CListGroupItem className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <strong>Last Updated</strong>
                                      <div className="text-medium-emphasis small">Modification date</div>
                                    </div>
                                    <div className="text-end">
                                      <div>{formatDate(employee.updated_at)}</div>
                                      <small className="text-medium-emphasis">
                                        {formatDateTime(employee.updated_at)}
                                      </small>
                                    </div>
                                  </CListGroupItem>
                                </CListGroup>
                              </CCol>
                            </CRow>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    </CRow>
                  </CTabPanel>

                  <CTabPanel className="mt-3" itemKey="benefit">
                    <CRow>
                      <CCol xs={12}>
                        {renderEmployeeBenefitsCard()}
                      </CCol>
                    </CRow>
                  </CTabPanel>

                  <CTabPanel className="mt-3" itemKey="settings">
                    <CRow>
                      <CCol xs={12}>
                        <CCard className="mb-4">
                          <CCardHeader>
                            <CRow className="align-items-center">
                              <CCol>
                                <h5 className="mb-0">
                                  <CIcon icon={cilSettings} className="me-2" />
                                  Employee Payroll Components
                                </h5>
                              </CCol>
                              {hasPermission(PERMISSIONS.EMPLOYEES_UPDATE) && (
                                <CCol xs="auto">
                                  <Link to={`/employees/${id}/edit`}>
                                    <CButton color="warning" size="sm">
                                      <CIcon icon={cilPencil} className="me-1" />
                                      Edit Employee
                                    </CButton>
                                  </Link>
                                </CCol>
                              )}
                            </CRow>
                          </CCardHeader>
                          <CCardBody>
                            {componentsLoading ? (
                              <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                                <CSpinner color="primary" />
                                <span className="ms-2">Loading payroll components...</span>
                              </div>
                            ) : componentsError ? (
                              <CAlert color="danger">
                                {componentsError}
                              </CAlert>
                            ) : (
                              <>
                                <p className="text-medium-emphasis">
                                  Manage payroll components for this employee. You can set specific amounts for each component.
                                </p>
                                
                                {employeeComponents.length > 0 ? (
                                  <CTable responsive hover>
                                    <CTableHead>
                                      <CTableRow>
                                        <CTableHeaderCell>Component Name</CTableHeaderCell>
                                        <CTableHeaderCell>Type</CTableHeaderCell>
                                        <CTableHeaderCell>Amount</CTableHeaderCell>
                                        <CTableHeaderCell>Status</CTableHeaderCell>
                                        <CTableHeaderCell>Actions</CTableHeaderCell>
                                      </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                      {employeeComponents.map((component) => (
                                        <CTableRow key={component.employee_component_id}>
                                          <CTableDataCell>
                                            <div>
                                              <strong>{component.mainComponent?.name || 'N/A'}</strong>
                                              <div className="small text-medium-emphasis">
                                                {component.mainComponent?.description || 'No description'}
                                              </div>
                                            </div>
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            <CBadge 
                                              color={component.mainComponent?.type === 'Earning' ? 'success' : 'danger'}
                                            >
                                              {component.mainComponent?.type || 'N/A'}
                                            </CBadge>
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {editingComponent === component.employee_component_id ? (
                                              <CFormInput
                                                type="number"
                                                value={componentForm.amount}
                                                onChange={(e) => handleComponentFormChange('amount', e.target.value)}
                                                step="0.01"
                                                min="0"
                                              />
                                            ) : (
                                              <div>
                                                {component.mainComponent?.type === 'Earning' ? '+' : '-'} 
                                                {parseFloat(component.amount || 0).toLocaleString('id-ID', {
                                                  style: 'currency',
                                                  currency: 'IDR',
                                                  minimumFractionDigits: 0,
                                                  maximumFractionDigits: 0
                                                })}
                                              </div>
                                            )}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            <div className="d-flex align-items-center gap-2">
                                              {componentStatusUpdatingId === component.employee_component_id && (
                                                <CSpinner size="sm" color="primary" />
                                              )}
                                              <CFormSwitch
                                                className="mb-0"
                                                checked={Boolean(component.is_active)}
                                                onChange={(e) => handleToggleComponentStatus(component, e.target.checked)}
                                                disabled={
                                                  componentStatusUpdatingId === component.employee_component_id ||
                                                  !hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)
                                                }
                                                title={hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)
                                                  ? 'Toggle component status'
                                                  : 'You do not have permission to update component status'}
                                                size="sm"
                                              />
                                              <CBadge color={component.is_active ? 'success' : 'secondary'}>
                                                {component.is_active ? 'Active' : 'Inactive'}
                                              </CBadge>
                                            </div>
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {editingComponent === component.employee_component_id ? (
                                              <div className="d-flex gap-1">
                                                <CButton 
                                                  color="success" 
                                                  size="sm"
                                                  onClick={() => handleSaveComponent(component.employee_component_id)}
                                                >
                                                  <CIcon icon={cilSave} size="sm" />
                                                </CButton>
                                                <CButton 
                                                  color="secondary" 
                                                  size="sm"
                                                  onClick={handleCancelEdit}
                                                >
                                                  Cancel
                                                </CButton>
                                              </div>
                                            ) : (
                                              <CButton 
                                                color="primary" 
                                                size="sm"
                                                title="Edit component"
                                                onClick={() => handleEditComponent(component)}
                                              >
                                                <CIcon icon={cilPencil} size="sm" />
                                              </CButton>
                                            )}
                                          </CTableDataCell>
                                        </CTableRow>
                                      ))}
                                    </CTableBody>
                                  </CTable>
                                ) : (
                                  <div className="text-center py-5">
                                    <CIcon icon={cilDollar} size="3xl" className="text-muted mb-3" />
                                    <p className="text-medium-emphasis">
                                      No payroll components found for this employee.
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </CCardBody>
                        </CCard>
                      </CCol>
                    </CRow>
                  </CTabPanel>
                </CTabContent>
              </CTabs>

              {/* Additional Actions */}
              <CRow className="mt-4">
                <CCol xs={12}>
                  <div className="d-flex justify-content-end gap-2">
                    <Link to="/employees">
                      <CButton color="secondary" variant="outline">
                        Back to Employee List
                      </CButton>
                    </Link>
                    {hasPermission(PERMISSIONS.EMPLOYEES_UPDATE) && (
                      <Link to={`/employees/${id}/edit`}>
                        <CButton color="primary">
                          <CIcon icon={cilPencil} className="me-1" />
                          Edit Employee
                        </CButton>
                      </Link>
                    )}
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete employee:
          <br />
          <strong>{employee.name}</strong> ({employee.nik})?
          <br />
          <br />
          <small className="text-medium-emphasis">
            This will soft-delete the employee: the record is hidden from employee lists and disabled for new payroll processing, while historical payroll data remains intact.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Employee'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EmployeeDetail;
