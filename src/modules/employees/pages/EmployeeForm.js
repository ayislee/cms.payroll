// ========================================
// EMPLOYEE FORM PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
  CBreadcrumb,
  CBreadcrumbItem
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilSave,
  cilArrowLeft,
  cilUser,
  cilCreditCard,
  cilNotes
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS } from '../../../constants/userRoles';
import { PTKP_OPTIONS } from '../../../constants/payrollConstants';
import employeeService from '../services/employeeService';
import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const isEdit = Boolean(id);

  // Set document title
  useDocumentTitle(isEdit ? 'Edit Employee' : 'Add Employee');

  // State management
  const [formData, setFormData] = useState({
    employee_id: '',
    nik: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    company_id: '',
    ptkp: '',
    job_position: '',
    grade: '',
    organization: '',
    rekening: '',
    bank: '',
    cabang: '',
    nama_rekening: '',
    npwp: ''
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check permissions
  useEffect(() => {
    if (isEdit && !hasPermission(PERMISSIONS.EMPLOYEES_UPDATE)) {
      navigate('/employees', { replace: true });
      return;
    }
    if (!isEdit && !hasPermission(PERMISSIONS.EMPLOYEES_CREATE)) {
      navigate('/employees', { replace: true });
      return;
    }
  }, [isEdit, hasPermission, navigate]);

  // Load companies for dropdown and suggest next employee ID
  useEffect(() => {
    const loadInitialData = async () => {
      // For now, use mock companies until backend API is ready
      setCompanies([
        { company_id: 1, name: 'PT Company A', code: 'PTA' },
        { company_id: 2, name: 'PT Company B', code: 'PTB' },
        { company_id: 3, name: 'PT Company C', code: 'PTC' }
      ]);

      // Auto-suggest next employee ID for create mode only
      if (!isEdit) {
        try {
          const nextId = await employeeService.getNextEmployeeId();
          setFormData(prev => ({
            ...prev,
            employee_id: nextId
          }));
        } catch (error) {
          console.warn('Could not get next employee ID, using default');
          // Fallback to simple ID generation
          setFormData(prev => ({
            ...prev,
            employee_id: 11 // Default next ID
          }));
        }
      }
    };

    loadInitialData();
  }, [isEdit]);

  // Load employee data for edit
  useEffect(() => {
    const loadEmployee = async () => {
      if (!isEdit) return;

      let timeout;
      
      try {
        setLoadingEmployee(true);
        
        // Set timeout to prevent stuck loading
        timeout = setTimeout(() => {
          console.warn('Loading timeout, forcing state reset');
          setLoadingEmployee(false);
        }, 10000);
        
        const employee = await employeeService.getEmployeeById(id);
        
        if (employee) {
          setFormData({
            employee_id: employee.employee_id || '',
            nik: employee.nik || '',
            name: employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            address: employee.address || '',
            city: employee.city || '',
            state: employee.state || '',
            country: employee.country || '',
            zip: employee.zip || '',
            company_id: employee.company_id || '',
            ptkp: employee.ptkp || '',
            job_position: employee.job_position || '',
            grade: employee.grade || '',
            organization: employee.organization || '',
            rekening: employee.rekening || '',
            bank: employee.bank || '',
            cabang: employee.cabang || '',
            nama_rekening: employee.nama_rekening || '',
            npwp: employee.npwp || ''
          });
        } else {
          console.warn('Employee not found, trying mock data');
          setError('Employee not found');
        }
      } catch (error) {
        console.error('Error loading employee:', error);
        setError(error.message || 'Failed to load employee data');
      } finally {
        if (timeout) {
          clearTimeout(timeout);
        }
        setLoadingEmployee(false);
      }
    };

    loadEmployee();
  }, [id, isEdit]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const validation = employeeService.validateEmployeeData(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (isEdit) {
        await employeeService.updateEmployee(id, formData);
        setSuccess('Employee updated successfully!');
      } else {
        await employeeService.createEmployee(formData);
        setSuccess('Employee created successfully!');
      }

      // Redirect after successful save
      setTimeout(() => {
        navigate('/employees');
      }, 1500);

    } catch (error) {
      console.error('Error saving employee:', error);
      setError(error.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/employees');
  };

  if (loadingEmployee) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading employee data...</span>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem href="/employees">Employees</CBreadcrumbItem>
        <CBreadcrumbItem active>
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </CBreadcrumbItem>
      </CBreadcrumb>

      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  <h4 className="mb-0">
                    <CIcon icon={cilUser} className="me-2" />
                    {isEdit ? 'Edit Employee' : 'Add New Employee'}
                  </h4>
                  <small className="text-medium-emphasis">
                    {isEdit ? 'Update employee information' : 'Enter employee details'}
                  </small>
                </CCol>
                <CCol xs="auto">
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <CIcon icon={cilArrowLeft} className="me-1" />
                    Back to List
                  </CButton>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              {/* Success Alert */}
              {success && (
                <CAlert color="success" className="mb-3">
                  {success}
                </CAlert>
              )}

              {/* Error Alert */}
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                <CRow>
                  {/* Basic Information */}
                  {!isEdit && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="employee_id">
                          Employee ID <span className="text-danger">*</span>
                        </CFormLabel>
                        <CFormInput
                          type="number"
                          id="employee_id"
                          name="employee_id"
                          value={formData.employee_id}
                          onChange={handleInputChange}
                          invalid={!!errors.employee_id}
                          placeholder="Employee ID (e.g., 11)"
                        />
                        {errors.employee_id && (
                          <div className="invalid-feedback d-block">
                            {errors.employee_id}
                          </div>
                        )}
                        <small className="text-medium-emphasis">
                          Next available ID will be auto-suggested
                        </small>
                      </div>
                    </CCol>
                  )}

                  <CCol md={isEdit ? 6 : 6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="nik">
                        NIK <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="nik"
                        name="nik"
                        value={formData.nik}
                        onChange={handleInputChange}
                        invalid={!!errors.nik}
                        placeholder="Employee NIK (e.g., EMP001)"
                      />
                      {errors.nik && (
                        <div className="invalid-feedback d-block">
                          {errors.nik}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="name">
                        Full Name <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        invalid={!!errors.name}
                        placeholder="Employee full name"
                      />
                      {errors.name && (
                        <div className="invalid-feedback d-block">
                          {errors.name}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="email">
                        Email <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        invalid={!!errors.email}
                        placeholder="employee@company.com"
                      />
                      {errors.email && (
                        <div className="invalid-feedback d-block">
                          {errors.email}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="phone">Phone Number</CFormLabel>
                      <CFormInput
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        invalid={!!errors.phone}
                        placeholder="08123456789"
                      />
                      {errors.phone && (
                        <div className="invalid-feedback d-block">
                          {errors.phone}
                        </div>
                      )}
                    </div>
                  </CCol>

                  {/* Company Information */}
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="company_id">
                        Company <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormSelect
                        id="company_id"
                        name="company_id"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        invalid={!!errors.company_id}
                      >
                        <option value="">Select Company</option>
                        {companies.map((company) => (
                          <option key={company.company_id} value={company.company_id}>
                            {company.name} ({company.code})
                          </option>
                        ))}
                      </CFormSelect>
                      {errors.company_id && (
                        <div className="invalid-feedback d-block">
                          {errors.company_id}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="ptkp">
                        PTKP Status <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormSelect
                        id="ptkp"
                        name="ptkp"
                        value={formData.ptkp}
                        onChange={handleInputChange}
                        invalid={!!errors.ptkp}
                      >
                        <option value="">Select PTKP Status</option>
                        {PTKP_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </CFormSelect>
                      {errors.ptkp && (
                        <div className="invalid-feedback d-block">
                          {errors.ptkp}
                        </div>
                      )}
                    </div>
                  </CCol>

                  {/* Job Details */}
                  <CCol xs={12}>
                    <h5 className="mt-2 mb-3">
                      <CIcon icon={cilNotes} className="me-2" />
                      Job Details
                    </h5>
                  </CCol>

                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="job_position">Job Position</CFormLabel>
                      <CFormInput
                        type="text"
                        id="job_position"
                        name="job_position"
                        value={formData.job_position}
                        onChange={handleInputChange}
                        placeholder="e.g., Payroll Specialist"
                      />
                    </div>
                  </CCol>

                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="grade">Grade</CFormLabel>
                      <CFormInput
                        type="text"
                        id="grade"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        placeholder="e.g., G6"
                      />
                    </div>
                  </CCol>

                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="organization">Organization</CFormLabel>
                      <CFormInput
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        placeholder="e.g., Finance Division"
                      />
                    </div>
                  </CCol>

                  {/* Address Information */}
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="address">Address</CFormLabel>
                      <CFormTextarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Complete address"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="city">City</CFormLabel>
                      <CFormInput
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="state">State/Province</CFormLabel>
                      <CFormInput
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State or Province"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="country">Country</CFormLabel>
                      <CFormInput
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="zip">ZIP Code</CFormLabel>
                      <CFormInput
                        type="text"
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        placeholder="ZIP/Postal Code"
                      />
                    </div>
                  </CCol>
                </CRow>

                {/* Banking Information Section */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <h5 className="mb-3">
                      <CIcon icon={cilCreditCard} className="me-2" />
                      Banking Information
                    </h5>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="rekening">Account Number</CFormLabel>
                      <CFormInput
                        type="text"
                        id="rekening"
                        name="rekening"
                        value={formData.rekening}
                        onChange={handleInputChange}
                        placeholder="Bank account number"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="nama_rekening">Account Holder Name</CFormLabel>
                      <CFormInput
                        type="text"
                        id="nama_rekening"
                        name="nama_rekening"
                        value={formData.nama_rekening}
                        onChange={handleInputChange}
                        placeholder="Name on bank account"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="bank">Bank Name</CFormLabel>
                      <CFormInput
                        type="text"
                        id="bank"
                        name="bank"
                        value={formData.bank}
                        onChange={handleInputChange}
                        placeholder="Bank name (e.g., Bank Mandiri)"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="cabang">Bank Branch</CFormLabel>
                      <CFormInput
                        type="text"
                        id="cabang"
                        name="cabang"
                        value={formData.cabang}
                        onChange={handleInputChange}
                        placeholder="Bank branch name"
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="npwp">NPWP</CFormLabel>
                      <CFormInput
                        type="text"
                        id="npwp"
                        name="npwp"
                        value={formData.npwp}
                        onChange={handleInputChange}
                        placeholder="Tax identification number (NPWP)"
                      />
                    </div>
                  </CCol>
                </CRow>

                {/* Form Actions */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <CButton
                    type="button"
                    color="secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </CButton>
                  <CButton
                    type="submit"
                    color="primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilSave} className="me-1" />
                        {isEdit ? 'Update Employee' : 'Create Employee'}
                      </>
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default EmployeeForm;
