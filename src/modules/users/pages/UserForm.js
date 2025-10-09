// ========================================
// USER FORM PAGE
// ========================================

import React, { useState, useEffect, useMemo } from 'react';
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
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
  CFormCheck
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilSave,
  cilCheck
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS, USER_ROLES } from '../../../constants/userRoles';
import userService from '../services/userService';
import companyService from '../../companies/services/companyService';

const USER_TYPE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: 'Admin' },
  { value: USER_ROLES.USER, label: 'Member' }
];

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isEdit = Boolean(id);

  // Set document title
  useDocumentTitle(isEdit ? 'Edit User' : 'Add User');

  // State management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: USER_ROLES.USER,
    company_id: '',
    is_active: true
  });
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyFallbackOption, setCompanyFallbackOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Load user data for edit
  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const userData = await userService.getUserById(id);
      const typeValue = userData.type || USER_ROLES.USER;
      if (typeValue === USER_ROLES.USER && userData.company_id) {
        setCompanyFallbackOption({
          value: String(userData.company_id),
          label: userData.company_name || `Company #${userData.company_id}`
        });
      } else {
      setCompanyFallbackOption(null);
    }
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      type: typeValue,
      company_id: typeValue === USER_ROLES.USER && userData.company_id ? String(userData.company_id) : '',
      is_active: userData.is_active
    });
    } catch (error) {
      console.error('Error loading user:', error);
      setError(error.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isEdit && id) {
      loadUser();
    }
  }, [isEdit, id]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const options = await companyService.getCompanyOptions();
        setCompanyOptions(options);
      } catch (err) {
        console.error('Error loading companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const processedValue = type === 'checkbox' ? checked : value;

    if (name === 'type' && processedValue !== USER_ROLES.USER) {
      setCompanyFallbackOption(null);
    }

    setFormData(prev => {
      if (name === 'type') {
        const nextType = processedValue;
        return {
          ...prev,
          type: nextType,
          company_id: nextType === USER_ROLES.USER ? prev.company_id : ''
        };
      }

      return {
        ...prev,
        [name]: processedValue
      };
    });

    if (validationErrors[name] || (name === 'type' && validationErrors.company_id)) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        if (name === 'type') {
          delete updated.company_id;
        }
        return updated;
      });
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (passwordErrors[name]) {
      setPasswordErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    const trimmedNew = passwordForm.new_password?.trim() || '';
    const trimmedConfirm = passwordForm.confirm_password?.trim() || '';

    if (!trimmedNew) {
      errors.new_password = 'New password is required.';
    } else if (trimmedNew.length < 8) {
      errors.new_password = 'New password must be at least 8 characters.';
    }

    if (!trimmedConfirm) {
      errors.confirm_password = 'Please confirm the new password.';
    } else if (trimmedNew !== trimmedConfirm) {
      errors.confirm_password = 'New password and confirmation must match.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');

      const submissionData = {
        ...formData,
        company_id: formData.type === USER_ROLES.USER ? formData.company_id : ''
      };

      // Client-side validation
      const validation = userService.validateUserData(submissionData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      if (isEdit) {
        await userService.updateUser(id, submissionData);
      } else {
        await userService.createUser(submissionData);
      }

      // Navigate back to user list
      navigate('/users');

    } catch (error) {
      console.error('Error saving user:', error);

      // Handle validation errors from server
      if (error.message.includes('Validation Error')) {
        try {
          const errorData = JSON.parse(error.message.split(': ')[1]);
          setValidationErrors(errorData.errors || {});
        } catch (parseError) {
          setError(error.message);
        }
      } else {
        setError(error.message || 'Failed to save user');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit || !id) {
      return;
    }
    setPasswordSuccess('');
    setPasswordErrorMessage('');

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword(id, {
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });

      setPasswordSuccess('Password updated successfully.');
      setPasswordForm({
        new_password: '',
        confirm_password: ''
      });
      setPasswordErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrorMessage(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const companySelectOptions = useMemo(() => {
    if (formData.type !== USER_ROLES.USER) {
      return companyOptions;
    }

    if (!formData.company_id) {
      return companyOptions;
    }

    const exists = companyOptions.some(
      option => String(option.value) === String(formData.company_id)
    );

    if (exists) {
      return companyOptions;
    }

    if (companyFallbackOption) {
      return [...companyOptions, companyFallbackOption];
    }

    return [
      ...companyOptions,
      {
        value: formData.company_id,
        label: `Company #${formData.company_id}`
      }
    ];
  }, [companyOptions, companyFallbackOption, formData.type, formData.company_id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading user data...</span>
      </div>
    );
  }

  // Check permissions
  if (!hasPermission(isEdit ? PERMISSIONS.USERS_UPDATE : PERMISSIONS.USERS_CREATE)) {
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="danger" className="mb-3">
            Access Denied: You don't have permission to {isEdit ? 'edit' : 'create'} users
            <Link to="/users" className="ms-2">
              <CButton color="link" size="sm">
                Back to Users
              </CButton>
            </Link>
          </CAlert>
        </CCol>
      </CRow>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => navigate('/users')}
              className="me-2"
            >
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Users
            </CButton>
            <h4 className="mb-0 d-inline">
              {isEdit ? 'Edit User' : 'Add New User'}
            </h4>
          </CCardHeader>

          <CCardBody>
            {/* Error Alert */}
            {error && (
              <CAlert color="danger" className="mb-3">
                {error}
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
                <CCol md={6}>
                  {/* Full Name */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="name">
                      <strong>Full Name *</strong>
                    </CFormLabel>
                    <CFormInput
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      disabled={saving}
                      invalid={!!validationErrors.name}
                    />
                    {validationErrors.name && (
                      <small className="text-danger">{validationErrors.name}</small>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="email">
                      <strong>Email *</strong>
                    </CFormLabel>
                    <CFormInput
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      disabled={saving}
                      invalid={!!validationErrors.email}
                    />
                    {validationErrors.email && (
                      <small className="text-danger">{validationErrors.email}</small>
                    )}
                  </div>

                  {/* User Type */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="type">
                      <strong>User Type *</strong>
                    </CFormLabel>
                    <CFormSelect
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      disabled={saving}
                      invalid={!!validationErrors.type}
                    >
                      <option value="">Select user type</option>
                      {USER_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CFormSelect>
                    {validationErrors.type && (
                      <small className="text-danger">{validationErrors.type}</small>
                    )}
                  </div>

                  {formData.type === USER_ROLES.USER && (
                    <div className="mb-3">
                      <CFormLabel htmlFor="company_id">
                        <strong>Company *</strong>
                      </CFormLabel>
                      <CFormSelect
                        id="company_id"
                        name="company_id"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        disabled={saving || loadingCompanies}
                        invalid={!!validationErrors.company_id}
                      >
                        <option value="">Select company</option>
                        {companySelectOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </CFormSelect>
                      {loadingCompanies && (
                        <small className="text-muted d-block mt-1">Loading companies...</small>
                      )}
                      {validationErrors.company_id && (
                        <small className="text-danger d-block">{validationErrors.company_id}</small>
                      )}
                    </div>
                  )}

                  {/* Phone */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="phone">Phone</CFormLabel>
                    <CFormInput
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      disabled={saving}
                      invalid={!!validationErrors.phone}
                    />
                    {validationErrors.phone && (
                      <small className="text-danger">{validationErrors.phone}</small>
                    )}
                  </div>
                </CCol>

                <CCol md={6}>
                  {/* Active Status */}
                  <div className="mb-4">
                    <CFormCheck
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      disabled={saving}
                      label={
                        <>
                          <strong>Active User</strong>
                          <br />
                          <small className="text-muted">
                            Inactive users will be unable to login but data will be preserved
                          </small>
                        </>
                      }
                    />
                  </div>

                  {isEdit && (
                    <CCard>
                      <CCardHeader>
                        <h5 className="mb-0">Change Password</h5>
                      </CCardHeader>
                      <CCardBody>
                        {passwordSuccess && (
                          <CAlert color="success" className="mb-3">
                            {passwordSuccess}
                          </CAlert>
                        )}

                        {passwordErrorMessage && (
                          <CAlert color="danger" className="mb-3">
                            {passwordErrorMessage}
                          </CAlert>
                        )}

                          <div className="mb-3">
                            <CFormLabel htmlFor="new_password">
                              New Password <span className="text-danger">*</span>
                            </CFormLabel>
                            <CFormInput
                            type="password"
                            id="new_password"
                            name="new_password"
                            value={passwordForm.new_password}
                            onChange={handlePasswordInputChange}
                            disabled={changingPassword}
                            invalid={!!passwordErrors.new_password}
                            autoComplete="new-password"
                          />
                          {passwordErrors.new_password && (
                            <small className="text-danger">{passwordErrors.new_password}</small>
                            )}
                          </div>

                          <div className="mb-3">
                            <CFormLabel htmlFor="confirm_password">
                              Confirm Password <span className="text-danger">*</span>
                            </CFormLabel>
                            <CFormInput
                              type="password"
                              id="confirm_password"
                              name="confirm_password"
                            value={passwordForm.confirm_password}
                            onChange={handlePasswordInputChange}
                            disabled={changingPassword}
                            invalid={!!passwordErrors.confirm_password}
                            autoComplete="new-password"
                          />
                          {passwordErrors.confirm_password && (
                            <small className="text-danger">{passwordErrors.confirm_password}</small>
                          )}
                        </div>

                        <div className="d-flex justify-content-end">
                          <CButton
                            color="primary"
                            type="button"
                            onClick={handlePasswordSubmit}
                            disabled={changingPassword}
                          >
                            {changingPassword ? (
                              <>
                                <CSpinner size="sm" className="me-2" />
                                Changing...
                              </>
                            ) : (
                              'Change Password'
                            )}
                          </CButton>
                        </div>
                      </CCardBody>
                    </CCard>
                  )}
                </CCol>
              </CRow>

              {/* Form Actions */}
              <div className="d-flex justify-content-between mt-4">
                <Link to="/users">
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
                      {isEdit ? 'Update User' : 'Create User'}
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

export default UserForm;
