// ========================================
// USER DETAIL PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CAlert,
  CListGroup,
  CListGroupItem,
  CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilPencil,
  cilUser,
  cilEnvelopeClosed,
  cilPhone,
  cilCalendar,
  cilCheckCircle,
  cilXCircle
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS, USER_ROLES } from '../../../constants/userRoles';
import userService from '../services/userService';

const USER_TYPE_BADGE = {
  admin: { color: 'primary', label: 'Admin' },
  hr: { color: 'info', label: 'HR' },
  finance: { color: 'warning', label: 'Finance' },
  manager: { color: 'secondary', label: 'Manager' },
  user: { color: 'dark', label: 'Member' }
};

const getUserTypeBadge = (type) => {
  if (!type || typeof type !== 'string') {
    return { color: 'light', label: 'Unknown' };
  }

  const normalized = type.toLowerCase();
  return USER_TYPE_BADGE[normalized] || {
    color: 'light',
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1)
  };
};

const getCompanyLabel = (user) => {
  if (!user || typeof user !== 'object') {
    return '-';
  }

  const name = user.company_name || user.company?.name;
  if (name) {
    return name;
  }

  if (user.company && typeof user.company === 'object') {
    const email = user.company.email;
    if (email) {
      return email;
    }
  }

  if (user.company_id) {
    return `Company #${user.company_id}`;
  }

  return '-';
};

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Set document title
  useDocumentTitle('User Detail');

  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load user data
  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const userData = await userService.getUserById(id);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setError(error.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  // Handle toggle status
  const handleToggleStatus = async () => {
    try {
      await userService.toggleUserStatus(id);
      // Reload user data
      loadUser();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError(error.message || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading user details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CRow>
        <CCol xs={12}>
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
        </CCol>
      </CRow>
    );
  }

  if (!user) {
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="warning" className="mb-3">
            User not found
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
            <div className="d-flex justify-content-between align-items-center">
              <div>
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
                  <CIcon icon={cilUser} className="me-2" />
                  User Details
                </h4>
              </div>
              <div className="d-flex align-items-center gap-2">
                {(() => {
                  const { color, label } = getUserTypeBadge(user.type);
                  return (
                    <CBadge color={color} className="fs-6">
                      {label}
                    </CBadge>
                  );
                })()}
                <CBadge color={user.is_active ? 'success' : 'danger'} className="fs-6">
                  {user.is_active ? (
                    <>
                      <CIcon icon={cilCheckCircle} className="me-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilXCircle} className="me-1" />
                      Inactive
                    </>
                  )}
                </CBadge>
                {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                  <Link to={`/users/${id}/edit`}>
                    <CButton color="warning" variant="outline">
                      <CIcon icon={cilPencil} className="me-1" />
                      Edit User
                    </CButton>
                  </Link>
                )}
                {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                  <CButton
                    color={user.is_active ? 'secondary' : 'success'}
                    variant="outline"
                    onClick={handleToggleStatus}
                  >
                    {user.is_active ? (
                      <>
                        <CIcon icon={cilXCircle} className="me-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilCheckCircle} className="me-1" />
                        Activate
                      </>
                    )}
                  </CButton>
                )}
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CRow>
              <CCol lg={8}>
                <CCard className="mb-4">
                  <CCardHeader>
                    <h5 className="mb-0">
                      <CIcon icon={cilUser} className="me-2" />
                      User Information
                    </h5>
                  </CCardHeader>
                  <CCardBody>
                    <CListGroup flush>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>User ID</strong>
                        <CBadge color="primary" className="fs-6">
                          #{user.user_id}
                        </CBadge>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Full Name</strong>
                        <span>{user.name}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Email</strong>
                        <span>{user.email || '-'}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Company</strong>
                        <span>{getCompanyLabel(user)}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>User Type</strong>
                        {(() => {
                          const { color, label } = getUserTypeBadge(user.type);
                          return (
                            <CBadge color={color}>
                              {label}
                            </CBadge>
                          );
                        })()}
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Phone</strong>
                        <span>{formatPhoneNumber(user.phone) || '-'}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Created At</strong>
                        <small className="text-muted">
                          <CIcon icon={cilCalendar} className="me-1" />
                          {formatDate(user.created_at)}
                        </small>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Updated At</strong>
                        <small className="text-muted">
                          <CIcon icon={cilCalendar} className="me-1" />
                          {formatDate(user.updated_at)}
                        </small>
                      </CListGroupItem>
                    </CListGroup>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={4}>
                <CCard className="mb-4">
                  <CCardHeader>
                    <h5 className="mb-0">
                      <CIcon icon={cilUser} className="me-2" />
                      Quick Actions
                    </h5>
                  </CCardHeader>
                  <CCardBody>
                    <div className="d-grid gap-2">
                      {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                        <Link to={`/users/${id}/edit`} className="btn btn-outline-warning">
                          <CIcon icon={cilPencil} className="me-2" />
                          Edit User
                        </Link>
                      )}
                      <Link to="/users" className="btn btn-outline-secondary">
                        <CIcon icon={cilArrowLeft} className="me-2" />
                        Back to Users
                      </Link>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default UserDetail;
