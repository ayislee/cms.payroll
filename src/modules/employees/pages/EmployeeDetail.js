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
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser,
  cilPencil,
  cilTrash,
  cilArrowLeft,
  cilBuilding,
  cilPhone,
  cilEnvelopeClosed,
  cilLocationPin,
  cilCalendar,
  cilInfo,
  cilCreditCard,
  cilBank,
  cilNotes
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatDateTime, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import employeeService from '../services/employeeService';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // State management
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <>
      {/* Breadcrumb */}
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem href="/employees">Employees</CBreadcrumbItem>
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
                            <CBadge color="info">
                              Company ID: {employee.company_id}
                            </CBadge>
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
          <small className="text-danger">
            This action cannot be undone. All related payroll data will also be affected.
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