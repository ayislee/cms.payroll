// ========================================
// USER FORM PAGE
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
import {
  cilArrowLeft,
  cilSave,
  cilCheck
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS } from '../../../constants/userRoles';
import userService from '../services/userService';

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
    username: '',
    phone: '',
    address: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Load user data for edit
  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const userData = await userService.getUserById(id);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        username: userData.username || '',
        phone: userData.phone || '',
        address: userData.address || '',
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const processedValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');

      // Client-side validation
      const validation = userService.validateUserData(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      if (isEdit) {
        await userService.updateUser(id, formData);
      } else {
        await userService.createUser(formData);
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

                  {/* Username */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="username">
                      <strong>Username *</strong>
                    </CFormLabel>
                    <CFormInput
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter username"
                      disabled={saving}
                      invalid={!!validationErrors.username}
                    />
                    {validationErrors.username && (
                      <small className="text-danger">{validationErrors.username}</small>
                    )}
                  </div>

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
                  {/* Address */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="address">Address</CFormLabel>
                    <CFormTextarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter address"
                      rows={4}
                      disabled={saving}
                      invalid={!!validationErrors.address}
                    />
                    <small className="text-muted">
                      Maximum 500 characters
                    </small>
                    {validationErrors.address && (
                      <small className="text-danger">{validationErrors.address}</small>
                    )}
                  </div>

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