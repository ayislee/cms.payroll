// ========================================
// COMPANY FORM PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
  CFormCheck
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilSave, cilCheck } from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS } from '../../../constants/userRoles';
import companyService from '../services/companyService';

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isEdit = Boolean(id);

  // Set document title
  useDocumentTitle(isEdit ? 'Edit Company' : 'Create Company');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Load company data if editing
  useEffect(() => {
    if (isEdit) {
      loadCompany();
    }
  }, [isEdit, id]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError('');

      const company = await companyService.getCompanyById(id);

      setFormData({
        name: company.name || '',
        code: company.code || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        is_active: company.is_active !== false
      });

    } catch (error) {
      console.error('Error loading company:', error);
      setError(error.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Clear success message when user starts editing
    if (success) {
      setSuccess('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasPermission(isEdit ? PERMISSIONS.COMPANIES_UPDATE : PERMISSIONS.COMPANIES_CREATE)) {
      setError('You do not have permission to perform this action');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setValidationErrors({});

      // Validate form data
      const validation = companyService.validateCompanyData(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      let result;
      if (isEdit) {
        result = await companyService.updateCompany(id, formData);
      } else {
        result = await companyService.createCompany(formData);
      }

      setSuccess(isEdit ? 'Company updated successfully!' : 'Company created successfully!');

      // Redirect to company list after a delay
      setTimeout(() => {
        navigate('/companies');
      }, 1500);

    } catch (error) {
      console.error('Error saving company:', error);

      if (error.message && error.message.includes('Validation Error')) {
        // Handle validation errors
        try {
          const errorData = JSON.parse(error.message.split(': ')[1]);
          setValidationErrors(errorData.errors || {});
        } catch {
          setError(error.message);
        }
      } else {
        setError(error.message || `Failed to ${isEdit ? 'update' : 'create'} company`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Check permissions
  if (isEdit && !hasPermission(PERMISSIONS.COMPANIES_UPDATE)) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardBody className="text-center py-5">
              <h4 className="text-danger mb-3">Access Denied</h4>
              <p className="text-medium-emphasis">
                You do not have permission to edit companies.
              </p>
              <Link to="/companies">
                <CButton color="primary">
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  Back to Companies
                </CButton>
              </Link>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
  }

  if (!isEdit && !hasPermission(PERMISSIONS.COMPANIES_CREATE)) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardBody className="text-center py-5">
              <h4 className="text-danger mb-3">Access Denied</h4>
              <p className="text-medium-emphasis">
                You do not have permission to create companies.
              </p>
              <Link to="/companies">
                <CButton color="primary">
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  Back to Companies
                </CButton>
              </Link>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading company data...</span>
      </div>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <CIcon icon={isEdit ? cilCheck : cilCheck} className="me-2" />
                {isEdit ? 'Edit Company' : 'Create New Company'}
              </h4>
              <Link to="/companies">
                <CButton color="secondary" variant="outline">
                  <CIcon icon={cilArrowLeft} className="me-1" />
                  Back to Companies
                </CButton>
              </Link>
            </div>
          </CCardHeader>

          <CCardBody>
            {/* Success Alert */}
            {success && (
              <CAlert color="success" className="mb-4">
                <CIcon icon={cilCheck} className="me-2" />
                {success}
                <div className="mt-2">
                  <small className="text-muted">
                    Redirecting to company list in a moment...
                  </small>
                </div>
              </CAlert>
            )}

            {/* Error Alert */}
            {error && (
              <CAlert color="danger" className="mb-4">
                <strong>Error:</strong> {error}
                <CButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  className="ms-2"
                  onClick={() => setError('')}
                >
                  Dismiss
                </CButton>
              </CAlert>
            )}

            <CForm onSubmit={handleSubmit}>
              <CRow>
                {/* Left Column */}
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="name">
                      Company Name <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className={validationErrors.name ? 'is-invalid' : ''}
                      disabled={saving}
                    />
                    {validationErrors.name && (
                      <div className="invalid-feedback">
                        {validationErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <CFormLabel htmlFor="code">
                      Company Code <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Enter company code (e.g., PT001)"
                      className={validationErrors.code ? 'is-invalid' : ''}
                      disabled={saving}
                    />
                    {validationErrors.code && (
                      <div className="invalid-feedback">
                        {validationErrors.code}
                      </div>
                    )}
                    <small className="form-text text-muted">
                      Unique code to identify the company (2-50 characters)
                    </small>
                  </div>

                  <div className="mb-3">
                    <CFormLabel htmlFor="email">
                      Email Address
                    </CFormLabel>
                    <CFormInput
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className={validationErrors.email ? 'is-invalid' : ''}
                      disabled={saving}
                    />
                    {validationErrors.email && (
                      <div className="invalid-feedback">
                        {validationErrors.email}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <CFormLabel htmlFor="phone">
                      Phone Number
                    </CFormLabel>
                    <CFormInput
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className={validationErrors.phone ? 'is-invalid' : ''}
                      disabled={saving}
                    />
                    {validationErrors.phone && (
                      <div className="invalid-feedback">
                        {validationErrors.phone}
                      </div>
                    )}
                    <small className="form-text text-muted">
                      Format: +62XXXXXXXXXX or 08XXXXXXXXXX
                    </small>
                  </div>
                </CCol>

                {/* Right Column */}
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="address">
                      Address
                    </CFormLabel>
                    <CFormTextarea
                      id="address"
                      name="address"
                      rows={4}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter company address"
                      className={validationErrors.address ? 'is-invalid' : ''}
                      disabled={saving}
                    />
                    {validationErrors.address && (
                      <div className="invalid-feedback">
                        {validationErrors.address}
                      </div>
                    )}
                    <small className="form-text text-muted">
                      Maximum 500 characters
                    </small>
                  </div>

                  <div className="mb-4">
                    <CFormCheck
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      disabled={saving}
                      label={
                        <>
                          <strong>Active Company</strong>
                          <br />
                          <small className="text-muted">
                            Inactive companies will be hidden from the list but data will be preserved
                          </small>
                        </>
                      }
                    />
                  </div>
                </CCol>
              </CRow>

              {/* Form Actions */}
              <div className="d-flex justify-content-between mt-4">
                <Link to="/companies">
                  <CButton color="secondary" variant="outline" disabled={saving}>
                    <CIcon icon={cilArrowLeft} className="me-1" />
                    Cancel
                  </CButton>
                </Link>

                <CButton
                  color="primary"
                  type="submit"
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
                      {isEdit ? 'Update Company' : 'Create Company'}
                    </>
                  )}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default CompanyForm;