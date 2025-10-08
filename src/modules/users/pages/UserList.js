// ========================================
// USER LIST PAGE
// ========================================

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CButtonGroup,
  CSpinner,
  CAlert,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser,
  cilPlus,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilReload,
  cilInfo,
  cilCheckCircle,
  cilXCircle
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS, USER_ROLES } from '../../../constants/userRoles';
import userService from '../services/userService';
import config from '../../../config/environment';

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

const UserList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Set document title
  useDocumentTitle('User Management');

  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [rows, setRows] = useState(config.pagination.defaultRows);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Load users data
  const loadUsers = useCallback(async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      setIsSearching(search.trim() !== '');
      setError('');

      const params = {
        page,
        rows,
        search: search.trim()
      };

      // Add status filter if not 'all'
      if (status !== 'all') {
        params.is_active = status === 'active';
      }

      const response = await userService.getUsers(params);

      setUsers(response.data || []);
      setTotalUsers(response.total || 0);
      setTotalPages(response.lastPage || Math.ceil((response.total || 0) / rows));
      setCurrentPage(response.page || page);

    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [rows]);

  // Initial load
  useEffect(() => {
    loadUsers(1, searchTerm, statusFilter);
  }, [loadUsers, searchTerm, statusFilter]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);

    // Debounce search
    const timeoutId = setTimeout(() => {
      loadUsers(1, value, statusFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    loadUsers(1, searchTerm, status);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadUsers(page, searchTerm, statusFilter);
  };

  // Handle rows per page change
  const handleRowsChange = (newRows) => {
    setRows(newRows);
    setCurrentPage(1);
    loadUsers(1, searchTerm, statusFilter);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadUsers(currentPage, searchTerm, statusFilter);
  };

  // Handle delete
  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await userService.deleteUser(userToDelete.user_id);

      setShowDeleteModal(false);
      setUserToDelete(null);

      // Reload current page
      loadUsers(currentPage, searchTerm, statusFilter);

    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleUserStatus(user.user_id);

      // Reload current page
      loadUsers(currentPage, searchTerm, statusFilter);

    } catch (error) {
      console.error('Error toggling user status:', error);
      setError(error.message || 'Failed to update user status');
    }
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxPages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <CPaginationItem
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </CPaginationItem>
      );
    }

    return items;
  };

  if (loading && users.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading users...</span>
      </div>
    );
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  <h4 className="mb-0">
                    <CIcon icon={cilUser} className="me-2" />
                    User Management
                  </h4>
                  <small className="text-medium-emphasis">
                    Manage user accounts and permissions
                  </small>
                </CCol>
                <CCol xs="auto">
                  {/* Add User button removed - only accessible via edit */}
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              {/* Search and Filters */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CFormInput
                  placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <CButton color="outline-secondary" variant="outline">
                      <CIcon icon={cilMagnifyingGlass} />
                    </CButton>
                  </CInputGroup>
                  {isSearching && (
                    <small className="text-info mt-1 d-block">
                      <CSpinner size="sm" className="me-2" />
                      Searching...
                    </small>
                  )}
                </CCol>
                <CCol md={6} className="d-flex justify-content-end gap-2">
                  <div className="d-flex align-items-center">
                    <small className="me-2">Show:</small>
                    <CFormSelect
                      size="sm"
                      value={rows}
                      onChange={(e) => handleRowsChange(Number(e.target.value))}
                      style={{ width: '80px' }}
                    >
                      {config.pagination.pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </CFormSelect>
                    <small className="ms-2">per page</small>
                  </div>
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <CIcon icon={cilReload} className={loading ? 'spin' : ''} />
                    {loading ? ' Loading...' : ' Refresh'}
                  </CButton>
                </CCol>
              </CRow>

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

              {/* Summary */}
              <div className="mb-3">
                <small className="text-medium-emphasis">
                  {totalUsers > 0 ? (
                    <>
                      Showing {((currentPage - 1) * rows) + 1} to {Math.min(currentPage * rows, totalUsers)} of {totalUsers} users
                      {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                      {searchTerm && ` (filtered by "${searchTerm}")`}
                    </>
                  ) : (
                    <>
                      No users found
                      {searchTerm && ` for "${searchTerm}"`}
                    </>
                  )}
                </small>
              </div>

              {/* User Table */}
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell width="80">ID</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Company</CTableHeaderCell>
                    <CTableHeaderCell>User Type</CTableHeaderCell>
                    <CTableHeaderCell>Phone</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Created</CTableHeaderCell>
                    <CTableHeaderCell width="150">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <CTableRow key={user.user_id}>
                        <CTableDataCell>
                          <CBadge color="primary" className="fs-6">
                            #{user.user_id}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{user.name}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{user.email || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{getCompanyLabel(user)}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          {(() => {
                            const { color, label } = getUserTypeBadge(user.type);
                            return (
                              <CBadge color={color}>
                                {label}
                              </CBadge>
                            );
                          })()}
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{formatPhoneNumber(user.phone) || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={user.is_active ? 'success' : 'danger'}>
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
                        </CTableDataCell>
                        <CTableDataCell>
                          <small>{formatDate(user.created_at) || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <Link to={`/users/${user.user_id}`}>
                              <CButton color="info" variant="outline" size="sm" title="View Details">
                                <CIcon icon={cilInfo} />
                              </CButton>
                            </Link>
                            {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                              <Link to={`/users/${user.user_id}/edit`}>
                                <CButton color="warning" variant="outline" size="sm" title="Edit User">
                                  <CIcon icon={cilPencil} />
                                </CButton>
                              </Link>
                            )}
                            {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                              <CButton
                                color={user.is_active ? 'secondary' : 'success'}
                                variant="outline"
                                size="sm"
                                title={user.is_active ? 'Deactivate' : 'Activate'}
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.is_active ? (
                                  <CIcon icon={cilXCircle} />
                                ) : (
                                  <CIcon icon={cilCheckCircle} />
                                )}
                              </CButton>
                            )}
                            {hasPermission(PERMISSIONS.USERS_DELETE) && (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                title="Delete User"
                                onClick={() => handleDelete(user)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            )}
                          </CButtonGroup>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="8" className="text-center py-4">
                        <div className="text-medium-emphasis">
                          {searchTerm ? (
                            <>
                              <CIcon icon={cilMagnifyingGlass} className="me-2" size="xl" />
                              <br />
                              No users found for "{searchTerm}"
                              <br />
                              <CButton
                                color="link"
                                size="sm"
                                onClick={() => setSearchTerm('')}
                                className="mt-2"
                              >
                                Clear search
                              </CButton>
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilUser} className="me-2" size="xl" />
                              <br />
                              No users found
                              <br />
                              <small className="d-block mt-2">
                                No user accounts available in the system
                              </small>
                            </>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              {totalUsers > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <small className="text-medium-emphasis">
                      Showing {((currentPage - 1) * rows) + 1} to {Math.min(currentPage * rows, totalUsers)} of {totalUsers} entries
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center">
                      <small className="me-2 text-medium-emphasis">Rows per page:</small>
                      <CFormSelect
                        size="sm"
                        value={rows}
                        onChange={(e) => handleRowsChange(Number(e.target.value))}
                        style={{ width: '80px' }}
                      >
                        {config.pagination.pageSizeOptions.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </CFormSelect>
                    </div>

                    {totalPages > 1 && (
                      <CPagination>
                        <CPaginationItem
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(1)}
                        >
                          First
                        </CPaginationItem>
                        <CPaginationItem
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </CPaginationItem>

                        {getPaginationItems()}

                        <CPaginationItem
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </CPaginationItem>
                        <CPaginationItem
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(totalPages)}
                        >
                          Last
                        </CPaginationItem>
                      </CPagination>
                    )}
                  </div>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Deactivation</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {userToDelete && (
            <>
              Are you sure you want to {userToDelete.is_active ? 'deactivate' : 'activate'} user:
              <br />
              <strong>{userToDelete.name}</strong> ({userToDelete.email})?
              <br />
              <br />
              <small className="text-danger">
                {userToDelete.is_active
                  ? 'Deactivated users will be unable to login but data will be preserved.'
                  : 'Activating will allow the user to login again.'
                }
              </small>
            </>
          )}
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
            color={userToDelete?.is_active ? 'warning' : 'success'}
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {userToDelete?.is_active ? 'Deactivating...' : 'Activating...'}
              </>
            ) : (
              userToDelete?.is_active ? 'Deactivate' : 'Activate'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default UserList;
