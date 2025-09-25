// ========================================
// COMPONENT DETAIL PAGE
// ========================================

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CAlert,
  CBreadcrumb,
  CBreadcrumbItem,
  CBadge,
  CListGroup,
  CListGroupItem,
  CButtonGroup,
  CButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSettings,
  cilPencil,
  cilArrowLeft,
  cilInfo,
  cilCalculator,
  cilClock
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatDateTime } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import componentService from '../services/componentService';

const ComponentDetail = () => {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(component ? `${component.name} - Component Detail` : 'Component Detail');

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        const componentData = await componentService.getComponentById(id);
        
        if (componentData) {
          setComponent(componentData);
        } else {
          setError('Component not found');
        }
      } catch (error) {
        setError(error.message || 'Failed to load component');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadComponent();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading component details...</span>
      </div>
    );
  }

  if (error || !component) {
    return (
      <CAlert color="danger">
        {error || 'Component not found'}
        <div className="mt-2">
          <Link to="/components">
            <CButton color="primary" size="sm">
              Back to Components
            </CButton>
          </Link>
        </div>
      </CAlert>
    );
  }

  return (
    <>
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem href="/components">Components</CBreadcrumbItem>
        <CBreadcrumbItem active>{component.name}</CBreadcrumbItem>
      </CBreadcrumb>

      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  <h4 className="mb-0">
                    <CIcon icon={cilSettings} className="me-2" />
                    Component Details
                  </h4>
                  <small className="text-medium-emphasis">
                    {component.code} - {component.name}
                  </small>
                </CCol>
                <CCol xs="auto">
                  <CButtonGroup>
                    <Link to="/components">
                      <CButton color="secondary" variant="outline">
                        <CIcon icon={cilArrowLeft} className="me-1" />
                        Back to List
                      </CButton>
                    </Link>
                    {hasPermission(PERMISSIONS.COMPONENTS_UPDATE) && (
                      <Link to={`/components/${id}/edit`}>
                        <CButton color="warning">
                          <CIcon icon={cilPencil} className="me-1" />
                          Edit
                        </CButton>
                      </Link>
                    )}
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              <CRow>
                <CCol lg={6}>
                  <CCard className="h-100">
                    <CCardHeader>
                      <h5 className="mb-0">
                        <CIcon icon={cilInfo} className="me-2" />
                        Basic Information
                      </h5>
                    </CCardHeader>
                    <CCardBody>
                      <CListGroup flush>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Component ID</strong>
                          <CBadge color="info">#{component.main_component_id}</CBadge>
                        </CListGroupItem>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Code</strong>
                          <code>{component.code}</code>
                        </CListGroupItem>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Name</strong>
                          <span>{component.name}</span>
                        </CListGroupItem>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Category</strong>
                          <CBadge color="secondary">{component.category}</CBadge>
                        </CListGroupItem>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Type</strong>
                          <CBadge color={component.type === 'Earning' ? 'success' : 'danger'}>
                            {component.type}
                          </CBadge>
                        </CListGroupItem>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Status</strong>
                          <CBadge color={component.is_active ? 'success' : 'secondary'}>
                            {component.is_active ? 'Active' : 'Inactive'}
                          </CBadge>
                        </CListGroupItem>
                        {component.description && (
                          <CListGroupItem>
                            <strong>Description</strong>
                            <div className="mt-1">{component.description}</div>
                          </CListGroupItem>
                        )}
                      </CListGroup>
                    </CCardBody>
                  </CCard>
                </CCol>

                <CCol lg={6}>
                  <CCard className="h-100">
                    <CCardHeader>
                      <h5 className="mb-0">
                        <CIcon icon={cilCalculator} className="me-2" />
                        Calculation Settings
                      </h5>
                    </CCardHeader>
                    <CCardBody>
                      <CListGroup flush>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Calculation Type</strong>
                          <CBadge color="primary">{component.calculation_type}</CBadge>
                        </CListGroupItem>
                        {component.calculation_formula && (
                          <CListGroupItem>
                            <strong>Formula</strong>
                            <div className="mt-1">
                              <code>{component.calculation_formula}</code>
                            </div>
                          </CListGroupItem>
                        )}
                        {component.calculation_params && (
                          <CListGroupItem>
                            <strong>Parameters</strong>
                            <div className="mt-1">
                              <pre className="small bg-light p-2 rounded">
                                {JSON.stringify(component.calculation_params, null, 2)}
                              </pre>
                            </div>
                          </CListGroupItem>
                        )}
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Attendance Based</strong>
                          <CBadge color={component.attendance_based ? 'info' : 'secondary'}>
                            {component.attendance_based ? 'Yes' : 'No'}
                          </CBadge>
                        </CListGroupItem>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Attendance Type</strong>
                          <span>{component.attendance_type || 'N/A'}</span>
                        </CListGroupItem>
                        <CListGroupItem className="d-flex justify-content-between">
                          <strong>Integration</strong>
                          <CBadge color={component.is_integration ? 'warning' : 'secondary'}>
                            {component.is_integration ? 'Enabled' : 'Disabled'}
                          </CBadge>
                        </CListGroupItem>
                      </CListGroup>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              <CRow className="mt-4">
                <CCol xs={12}>
                  <CCard>
                    <CCardHeader>
                      <h5 className="mb-0">
                        <CIcon icon={cilClock} className="me-2" />
                        System Information
                      </h5>
                    </CCardHeader>
                    <CCardBody>
                      <CRow>
                        <CCol md={6}>
                          <strong>Created At:</strong>
                          <div>{formatDateTime(component.created_at)}</div>
                        </CCol>
                        <CCol md={6}>
                          <strong>Last Updated:</strong>
                          <div>{formatDateTime(component.updated_at)}</div>
                        </CCol>
                      </CRow>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default ComponentDetail;