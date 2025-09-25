// ========================================
// COMPONENT FORM PAGE
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
  CFormCheck,
  CButton,
  CSpinner,
  CAlert,
  CBreadcrumb,
  CBreadcrumbItem
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilSave, cilArrowLeft } from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS } from '../../../constants/userRoles';
import componentService from '../services/componentService';

const ComponentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const isEdit = Boolean(id);

  useDocumentTitle(isEdit ? 'Edit Component' : 'Add Component');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    code: '',
    type: '',
    is_active: '1',
    is_integration: '0',
    integration_code: '',
    calculation_type: '',
    calculation_formula: '',
    calculation_params: '',
    attendance_based: '0',
    attendance_type: 'full'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load component data for edit
  useEffect(() => {
    if (!isEdit) return;

    const loadComponent = async () => {
      try {
        setLoading(true);
        const component = await componentService.getComponentById(id);
        
        if (component) {
          setFormData({
            name: component.name || '',
            category: component.category || '',
            description: component.description || '',
            code: component.code || '',
            type: component.type || '',
            is_active: component.is_active ? '1' : '0',
            is_integration: component.is_integration ? '1' : '0',
            integration_code: component.integration_code || '',
            calculation_type: component.calculation_type || '',
            calculation_formula: component.calculation_formula || '',
            calculation_params: component.calculation_params ? 
              JSON.stringify(component.calculation_params, null, 2) : '',
            attendance_based: component.attendance_based ? '1' : '0',
            attendance_type: component.attendance_type || 'full'
          });
        }
      } catch (error) {
        setError(error.message || 'Failed to load component');
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [id, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = componentService.validateComponentData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Prepare data for API - exact format as per API.md
      const submitData = { ...formData };
      
      // Parse calculation_params if it's a string (keep as object for API)
      if (submitData.calculation_params && submitData.calculation_params.trim()) {
        try {
          submitData.calculation_params = JSON.parse(submitData.calculation_params);
        } catch (e) {
          setError('Invalid JSON format in calculation parameters');
          return;
        }
      } else {
        submitData.calculation_params = null;
      }

      // Set integration_code to null if not used
      if (submitData.is_integration === '0') {
        submitData.integration_code = null;
      }

      // For auto calculation type, formula is required
      if (submitData.calculation_type === 'auto' && !submitData.calculation_formula?.trim()) {
        setError('Calculation formula is required for automatic calculation type');
        return;
      }

      // Clean empty strings to null for optional fields
      if (!submitData.integration_code?.trim()) {
        submitData.integration_code = null;
      }

      if (isEdit) {
        await componentService.updateComponent(id, submitData);
        setSuccess('Component updated successfully!');
      } else {
        await componentService.createComponent(submitData);
        setSuccess('Component created successfully!');
      }

      setTimeout(() => navigate('/components'), 1500);

    } catch (error) {
      setError(error.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading component...</span>
      </div>
    );
  }

  return (
    <>
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem href="/components">Components</CBreadcrumbItem>
        <CBreadcrumbItem active>
          {isEdit ? 'Edit Component' : 'Add Component'}
        </CBreadcrumbItem>
      </CBreadcrumb>

    <CRow>
      <CCol xs={12}>
          <CCard>
          <CCardHeader>
              <h4 className="mb-0">
                <CIcon icon={cilSettings} className="me-2" />
                {isEdit ? 'Edit Component' : 'Add New Component'}
              </h4>
          </CCardHeader>

          <CCardBody>
              {success && <CAlert color="success">{success}</CAlert>}
              {error && <CAlert color="danger">{error}</CAlert>}

              <CForm onSubmit={handleSubmit}>
                {/* Basic Information */}
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Name *</CFormLabel>
                      <CFormInput
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        invalid={!!errors.name}
                        placeholder="e.g., Gaji Pokok"
                      />
                      {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Code *</CFormLabel>
                      <CFormInput
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        invalid={!!errors.code}
                        placeholder="e.g., GP, BPJS-K"
                      />
                      {errors.code && <div className="invalid-feedback d-block">{errors.code}</div>}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Category *</CFormLabel>
                      <CFormSelect
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        invalid={!!errors.category}
                      >
                        <option value="">Select Category</option>
                        <option value="Gaji">Gaji</option>
                        <option value="Tunjangan">Tunjangan</option>
                        <option value="Potongan">Potongan</option>
                        <option value="Bonus">Bonus</option>
                        <option value="Lembur">Lembur</option>
                      </CFormSelect>
                      {errors.category && <div className="invalid-feedback d-block">{errors.category}</div>}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Type *</CFormLabel>
                      <CFormSelect
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        invalid={!!errors.type}
                      >
                        <option value="">Select Type</option>
                        <option value="Earning">Earning (Pendapatan)</option>
                        <option value="Deduction">Deduction (Potongan)</option>
                      </CFormSelect>
                      {errors.type && <div className="invalid-feedback d-block">{errors.type}</div>}
                    </div>
                  </CCol>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel>Description</CFormLabel>
                      <CFormTextarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Describe the component purpose and calculation..."
                      />
                    </div>
                  </CCol>
                </CRow>

                {/* Status & Integration */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <h5 className="mb-3">Status & Integration</h5>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Status *</CFormLabel>
                      <CFormSelect
                        name="is_active"
                        value={formData.is_active}
                        onChange={handleInputChange}
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Integration</CFormLabel>
                      <CFormSelect
                        name="is_integration"
                        value={formData.is_integration}
                        onChange={handleInputChange}
                      >
                        <option value="0">No Integration</option>
                        <option value="1">Enable Integration</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                  {formData.is_integration === '1' && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel>Integration Code</CFormLabel>
                        <CFormInput
                          name="integration_code"
                          value={formData.integration_code}
                          onChange={handleInputChange}
                          placeholder="External system integration code"
                        />
                      </div>
                    </CCol>
                  )}
                </CRow>

                {/* Calculation Settings */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <h5 className="mb-3">Calculation Settings</h5>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Calculation Type *</CFormLabel>
                      <CFormSelect
                        name="calculation_type"
                        value={formData.calculation_type}
                        onChange={handleInputChange}
                        invalid={!!errors.calculation_type}
                      >
                        <option value="">Select Calculation Type</option>
                        <option value="manual">Manual</option>
                        <option value="auto">Automatic</option>
                      </CFormSelect>
                      {errors.calculation_type && <div className="invalid-feedback d-block">{errors.calculation_type}</div>}
                    </div>
                  </CCol>
                  {formData.calculation_type === 'auto' && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel>Calculation Formula *</CFormLabel>
                        <CFormInput
                          name="calculation_formula"
                          value={formData.calculation_formula}
                          onChange={handleInputChange}
                          invalid={!!errors.calculation_formula}
                          placeholder="e.g., bpjs_health_calculation"
                        />
                        {errors.calculation_formula && <div className="invalid-feedback d-block">{errors.calculation_formula}</div>}
                      </div>
                    </CCol>
                  )}
                  {formData.calculation_type === 'auto' && (
                    <CCol md={12}>
                      <div className="mb-3">
                        <CFormLabel>Calculation Parameters</CFormLabel>
                        <CFormTextarea
                          name="calculation_params"
                          value={formData.calculation_params}
                          onChange={handleInputChange}
                          rows={6}
                          placeholder={`{
  "max_base": 12000000,
  "percentage": 0.01,
  "base_components": ["GP"]
}`}
                        />
                        <small className="text-muted">
                          Enter valid JSON format. Example for BPJS: max_base (max salary base), percentage (deduction %), base_components (which components to calculate from)
                        </small>
                        {errors.calculation_params && <div className="invalid-feedback d-block">{errors.calculation_params}</div>}
                      </div>
                    </CCol>
                  )}
                </CRow>

                {/* Attendance Settings */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <h5 className="mb-3">Attendance Settings</h5>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Attendance Based</CFormLabel>
                      <CFormSelect
                        name="attendance_based"
                        value={formData.attendance_based}
                        onChange={handleInputChange}
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                  {formData.attendance_based === '1' && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel>Attendance Type</CFormLabel>
                        <CFormSelect
                          name="attendance_type"
                          value={formData.attendance_type}
                          onChange={handleInputChange}
                        >
                        <option value="full">Full Attendance</option>
                        <option value="prorate">Prorate</option>
                        </CFormSelect>
                      </div>
                    </CCol>
                  )}
                </CRow>

                <div className="d-flex justify-content-end gap-2">
                  <CButton color="secondary" onClick={() => navigate('/components')}>
                    Cancel
                  </CButton>
                  <CButton type="submit" color="primary" disabled={saving}>
                    {saving ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilSave} className="me-1" />}
                    {saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
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

export default ComponentForm;