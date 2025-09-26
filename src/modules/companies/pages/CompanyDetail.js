// ========================================
// COMPANY DETAIL PAGE
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
  CBadge,
  CListGroup,
  CListGroupItem
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilPencil,
  cilBuilding,
  cilPhone,
  cilEnvelopeClosed,
  cilCheckCircle,
  cilXCircle,
  cilPeople,
  cilCash,
  cilMedicalCross,
  cilCalendar
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import companyService from '../services/companyService';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Set document title
  useDocumentTitle('Company Details');

  // State
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load company data
  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load company details and stats in parallel
      const [companyData, companyStats] = await Promise.all([
        companyService.getCompanyById(id),
        companyService.getCompanyStats(id)
      ]);

      setCompany(companyData);
      setStats(companyStats.data);

    } catch (error) {
      console.error('Error loading company:', error);
      setError(error.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    try {
      await companyService.toggleCompanyStatus(id);

      // Reload data
      await loadCompanyData();

    } catch (error) {
      console.error('Error toggling company status:', error);
      setError(error.message || 'Failed to update company status');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading company details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardBody className="text-center py-5">
              <h4 className="text-danger mb-3">Error</h4>
              <p className="text-medium-emphasis mb-4">{error}</p>
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

  if (!company) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardBody className="text-center py-5">
              <h4 className="text-warning mb-3">Company Not Found</h4>
              <p className="text-medium-emphasis mb-4">
                The company you're looking for doesn't exist or has been removed.
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

  return (
    <CRow>
      <CCol xs={12}>
        {/* Header */}
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-1">
                  <CIcon icon={cilBuilding} className="me-2" />
                  {company.name}
                </h3>
                <div className="d-flex align-items-center gap-3 mt-1">
                  <CBadge color="info" className="fs-6">
                    {company.code}
                  </CBadge>
                  <CBadge color={company.is_active ? 'success' : 'danger'}>
                    {company.is_active ? (
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
                </div>
              </div>
              <div className="d-flex gap-2">
                {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                  <Link to={`/companies/${id}/edit`}>
                    <CButton color="warning" variant="outline">
                      <CIcon icon={cilPencil} className="me-1" />
                      Edit Company
                    </CButton>
                  </Link>
                )}
                {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                  <CButton
                    color={company.is_active ? 'secondary' : 'success'}
                    variant="outline"
                    onClick={handleToggleStatus}
                  >
                    {company.is_active ? (
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
                <Link to="/companies">
                  <CButton color="secondary" variant="outline">
                    <CIcon icon={cilArrowLeft} className="me-1" />
                    Back to List
                  </CButton>
                </Link>
              </div>
            </div>
          </CCardHeader>
        </CCard>

        <CRow>
          {/* Company Information */}
          <CCol lg={8}>
            <CCard className="mb-4">
              <CCardHeader>
                <h5 className="mb-0">
                  <CIcon icon={cilBuilding} className="me-2" />
                  Company Information
                </h5>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol md={6}>
                    <CListGroup flush>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Company Name</strong>
                        <span>{company.name}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Company Code</strong>
                        <CBadge color="info">{company.code}</CBadge>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>Status</strong>
                        <CBadge color={company.is_active ? 'success' : 'danger'}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </CBadge>
                      </CListGroupItem>
                    </CListGroup>
                  </CCol>
                  <CCol md={6}>
                    <CListGroup flush>
                      <CListGroupItem className="d-flex justify-content-between align-items-start px-0">
                        <strong>Address</strong>
                        <small className="text-end">
                          {company.address || 'No address provided'}
                        </small>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>
                          <CIcon icon={cilPhone} className="me-2" />
                          Phone
                        </strong>
                        <span>{formatPhoneNumber(company.phone) || 'No phone'}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center px-0">
                        <strong>
                          <CIcon icon={cilEnvelopeClosed} className="me-2" />
                          Email
                        </strong>
                        <span>{company.email || 'No email'}</span>
                      </CListGroupItem>
                    </CListGroup>
                  </CCol>
                </CRow>

                {/* Timestamps */}
                <CRow className="mt-3 pt-3 border-top">
                  <CCol md={6}>
                    <small className="text-muted">
                      <CIcon icon={cilCalendar} className="me-1" />
                      Created: {formatDate(company.created_at)}
                    </small>
                  </CCol>
                  <CCol md={6} className="text-end">
                    <small className="text-muted">
                      <CIcon icon={cilCalendar} className="me-1" />
                      Updated: {formatDate(company.updated_at)}
                    </small>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>

          {/* Statistics */}
          <CCol lg={4}>
            <CCard className="mb-4">
              <CCardHeader>
                <h5 className="mb-0">
                  <CIcon icon={cilBuilding} className="me-2" />
                  Statistics
                </h5>
              </CCardHeader>
              <CCardBody>
                {stats ? (
                  <div className="space-y-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <CIcon icon={cilPeople} className="me-2 text-primary" />
                        <strong>Employees</strong>
                      </div>
                      <CBadge color="info" className="fs-6">
                        {stats.employees_count || 0}
                      </CBadge>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <CIcon icon={cilCash} className="me-2 text-success" />
                        <strong>Payrolls</strong>
                      </div>
                      <CBadge color="success" className="fs-6">
                        {stats.payrolls_count || 0}
                      </CBadge>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <CIcon icon={cilMedicalCross} className="me-2 text-warning" />
                        <strong>BPJS Kesehatan</strong>
                      </div>
                      <CBadge color="warning" className="fs-6">
                        {stats.bpjs_k_settings_count || 0}
                      </CBadge>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <CIcon icon={cilMedicalCross} className="me-2 text-info" />
                        <strong>BPJS TK</strong>
                      </div>
                      <CBadge color="info" className="fs-6">
                        {stats.bpjs_tk_settings_count || 0}
                      </CBadge>
                    </div>

                    <hr />

                    <div className="text-center">
                      <small className="text-muted">
                        Company created: {formatDate(stats.created_at)}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <CSpinner size="sm" />
                    <small className="text-muted d-block mt-2">
                      Loading statistics...
                    </small>
                  </div>
                )}
              </CCardBody>
            </CCard>

            {/* Quick Actions */}
            <CCard>
              <CCardHeader>
                <h6 className="mb-0">
                  <CIcon icon={cilBuilding} className="me-2" />
                  Quick Actions
                </h6>
          </CCardHeader>
          <CCardBody>
                <div className="d-grid gap-2">
                  <Link to="/employees" className="btn btn-outline-primary">
                    <CIcon icon={cilPeople} className="me-2" />
                    View Employees
                  </Link>

                  <Link to="/payroll" className="btn btn-outline-success">
                    <CIcon icon={cilCash} className="me-2" />
                    View Payrolls
                  </Link>

                  {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                    <Link to={`/companies/${id}/edit`} className="btn btn-outline-warning">
                      <CIcon icon={cilPencil} className="me-2" />
                      Edit Company
                    </Link>
                  )}
                </div>
          </CCardBody>
        </CCard>
          </CCol>
        </CRow>
      </CCol>
    </CRow>
  );
};

export default CompanyDetail;