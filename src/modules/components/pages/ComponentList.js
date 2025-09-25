// ========================================
// COMPONENT LIST PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSettings,
  cilPlus,
  cilInfo,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilReload
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS } from '../../../constants/userRoles';
import componentService from '../services/componentService';

const ComponentList = () => {
  const { hasPermission } = useAuth();
  useDocumentTitle('Payroll Components');

  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const response = await componentService.getComponents();
      setComponents(response.data || []);
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (component) => {
    setComponentToDelete(component);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!componentToDelete) return;

    try {
      setDeleting(true);
      await componentService.deleteComponent(componentToDelete.main_component_id);
      setShowDeleteModal(false);
      setComponentToDelete(null);
      await loadComponents(); // Reload data
    } catch (error) {
      setError(error.message || 'Failed to delete component');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading components...</span>
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
                    <CIcon icon={cilSettings} className="me-2" />
                    Payroll Components
                  </h4>
                </CCol>
                  <CCol xs="auto">
                    <CButtonGroup>
                      <CButton
                        color="secondary"
                        variant="outline"
                        onClick={loadComponents}
                        disabled={loading}
                      >
                        <CIcon icon={cilReload} className={loading ? 'spin' : ''} />
                        {loading ? ' Loading...' : ' Refresh'}
                      </CButton>
                      {hasPermission(PERMISSIONS.COMPONENTS_CREATE) && (
                        <Link to="/components/create">
                          <CButton color="primary">
                            <CIcon icon={cilPlus} className="me-1" />
                            Add Component
                          </CButton>
                        </Link>
                      )}
                    </CButtonGroup>
                  </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}

              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell width="60">ID</CTableHeaderCell>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Category</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell width="120">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {components.length > 0 ? (
                    components.map((component) => (
                      <CTableRow key={component.main_component_id}>
                        <CTableDataCell>
                          <CBadge color="info">#{component.main_component_id}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{component.code}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{component.name}</strong>
                          {component.description && (
                            <div className="small text-muted">{component.description}</div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={component.type === 'Earning' ? 'success' : 'danger'}>
                            {component.type}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="secondary">{component.category}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={component.is_active ? 'success' : 'secondary'}>
                            {component.is_active ? 'Active' : 'Inactive'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <Link to={`/components/${component.main_component_id}`}>
                              <CButton color="info" variant="outline" size="sm" title="View Details">
                                <CIcon icon={cilInfo} />
                              </CButton>
                            </Link>
                            {hasPermission(PERMISSIONS.COMPONENTS_UPDATE) && (
                              <Link to={`/components/${component.main_component_id}/edit`}>
                                <CButton color="warning" variant="outline" size="sm" title="Edit Component">
                                  <CIcon icon={cilPencil} />
                                </CButton>
                              </Link>
                            )}
                            {hasPermission(PERMISSIONS.COMPONENTS_DELETE) && (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                title="Delete Component"
                                onClick={() => handleDelete(component)}
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
                      <CTableDataCell colSpan="7" className="text-center py-4">
                        <div className="text-medium-emphasis">
                          No components found
                          <br />
                          {hasPermission(PERMISSIONS.COMPONENTS_CREATE) && (
                            <Link to="/components/create">
                              <CButton color="primary" size="sm" className="mt-2">
                                Add First Component
                              </CButton>
                            </Link>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
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
          {componentToDelete && (
            <>
              Are you sure you want to delete component:
              <br />
              <strong>{componentToDelete.name}</strong> ({componentToDelete.code})?
              <br />
              <br />
              <small className="text-danger">
                This action cannot be undone. This may affect existing payroll calculations.
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
              'Delete'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ComponentList;