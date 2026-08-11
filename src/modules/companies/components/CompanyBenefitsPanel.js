import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormSwitch,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCash,
  cilCheckCircle,
  cilMedicalCross,
  cilPencil,
  cilPlus,
  cilReload,
  cilSave,
  cilTrash,
  cilXCircle
} from '@coreui/icons';
import companyService from '../services/companyService';
import componentService from '../../components/services/componentService';
import { formatCurrency } from '../../../utils/formatters';

const defaultFormData = {
  name: '',
  benefit_type: 'BPJS',
  description: '',
  employee_percentage: '0',
  employer_percentage: '0',
  main_component_id: '',
  max_base: '',
  is_active: true,
  is_taxable: false,
  effective_date: '',
  expired_date: ''
};

const benefitNameOptions = [
  'JKK',
  'JKM',
  'JHT Company',
  'BPJS Kesehatan Company'
];

const benefitTypeOptions = [
  'BPJS',
  'Insurance',
  'Retirement',
  'Other'
];

const numberValue = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeDateInput = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const CompanyBenefitsPanel = ({ companyId, canManage = false, canDelete = false, className = '' }) => {
  const [benefits, setBenefits] = useState([]);
  const [baseComponents, setBaseComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [componentLoading, setComponentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBenefits = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError('');
      const response = await companyService.getCompanyBenefits(companyId, { page: 1, rows: 100 });
      setBenefits(response.data || []);
    } catch (err) {
      console.error('Error loading company benefits:', err);
      setError(err.message || 'Gagal memuat company benefits');
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadBaseComponents = useCallback(async () => {
    try {
      setComponentLoading(true);
      const response = await componentService.getComponents({ page: 1, rows: 200, is_active: 1 });
      const rows = Array.isArray(response?.data) ? response.data : [];
      setBaseComponents(rows);
    } catch (err) {
      console.error('Error loading base components:', err);
      setBaseComponents([]);
    } finally {
      setComponentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBenefits();
    loadBaseComponents();
  }, [loadBaseComponents, loadBenefits]);

  const benefitSummary = useMemo(() => {
    const activeBenefits = benefits.filter((benefit) => benefit.is_active);
    const employerPercentage = activeBenefits.reduce(
      (sum, benefit) => sum + numberValue(benefit.employer_percentage),
      0
    );
    const employeePercentage = activeBenefits.reduce(
      (sum, benefit) => sum + numberValue(benefit.employee_percentage),
      0
    );
    const taxable = activeBenefits.filter((benefit) => benefit.is_taxable).length;

    return {
      total: benefits.length,
      active: activeBenefits.length,
      employerPercentage,
      employeePercentage,
      taxable
    };
  }, [benefits]);

  const resolveBaseComponentLabel = useCallback((benefit) => {
    const relation = benefit.main_component;
    if (relation) {
      return `${relation.name || 'Component'}${relation.code ? ` (${relation.code})` : ''}`;
    }

    const component = baseComponents.find(
      (item) => String(item.main_component_id) === String(benefit.main_component_id)
    );

    if (component) {
      return `${component.name || 'Component'}${component.code ? ` (${component.code})` : ''}`;
    }

    return benefit.main_component_id ? `Component #${benefit.main_component_id}` : 'Total Earnings';
  }, [baseComponents]);

  const openCreateModal = () => {
    setEditingBenefit(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setSuccess('');
    setError('');
    setShowFormModal(true);
  };

  const openEditModal = (benefit) => {
    setEditingBenefit(benefit);
    setFormData({
      name: benefit.name || '',
      benefit_type: benefit.benefit_type || 'BPJS',
      description: benefit.description || '',
      employee_percentage: String(benefit.employee_percentage ?? 0),
      employer_percentage: String(benefit.employer_percentage ?? 0),
      main_component_id: benefit.main_component_id ? String(benefit.main_component_id) : '',
      max_base: benefit.max_base !== null && benefit.max_base !== undefined ? String(benefit.max_base) : '',
      is_active: Boolean(benefit.is_active),
      is_taxable: Boolean(benefit.is_taxable),
      effective_date: normalizeDateInput(benefit.effective_date),
      expired_date: normalizeDateInput(benefit.expired_date)
    });
    setFormErrors({});
    setSuccess('');
    setError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setEditingBenefit(null);
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: undefined
    }));
  };

  const buildSubmitPayload = () => ({
    company_id: Number(companyId),
    name: formData.name.trim(),
    benefit_type: formData.benefit_type.trim() || null,
    description: formData.description.trim() || null,
    employee_percentage: numberValue(formData.employee_percentage),
    employer_percentage: numberValue(formData.employer_percentage),
    main_component_id: formData.main_component_id ? Number(formData.main_component_id) : null,
    max_base: formData.max_base === '' ? null : numberValue(formData.max_base),
    is_active: Boolean(formData.is_active),
    is_taxable: Boolean(formData.is_taxable),
    effective_date: formData.effective_date || null,
    expired_date: formData.expired_date || null
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = companyService.validateCompanyBenefitData(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = buildSubmitPayload();
      let savedBenefit = null;
      if (editingBenefit?.company_benefit_id) {
        savedBenefit = await companyService.updateCompanyBenefit(editingBenefit.company_benefit_id, payload);
        const mergedBenefit = companyService.formatCompanyBenefit({
          ...editingBenefit,
          ...payload,
          ...savedBenefit,
          is_taxable: savedBenefit?.is_taxable ?? payload.is_taxable,
          is_active: savedBenefit?.is_active ?? payload.is_active
        });
        setBenefits((prevBenefits) => prevBenefits.map((benefit) => (
          benefit.company_benefit_id === editingBenefit.company_benefit_id ? mergedBenefit : benefit
        )));
        setSuccess('Company benefit updated successfully.');
      } else {
        savedBenefit = await companyService.createCompanyBenefit(payload);
        const mergedBenefit = companyService.formatCompanyBenefit({
          ...payload,
          ...savedBenefit,
          is_taxable: savedBenefit?.is_taxable ?? payload.is_taxable,
          is_active: savedBenefit?.is_active ?? payload.is_active
        });
        setBenefits((prevBenefits) => [mergedBenefit, ...prevBenefits]);
        setSuccess('Company benefit created successfully.');
      }

      setShowFormModal(false);
      setEditingBenefit(null);
      loadBenefits();
    } catch (err) {
      console.error('Error saving company benefit:', err);
      setFormErrors({});
      setError(err.message || 'Gagal menyimpan company benefit');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (benefit) => {
    setBenefitToDelete(benefit);
    setShowDeleteModal(true);
    setError('');
    setSuccess('');
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setBenefitToDelete(null);
  };

  const confirmDelete = async () => {
    if (!benefitToDelete?.company_benefit_id) return;

    try {
      setDeleting(true);
      await companyService.deleteCompanyBenefit(benefitToDelete.company_benefit_id);
      setSuccess('Company benefit deleted successfully.');
      setShowDeleteModal(false);
      setBenefitToDelete(null);
      await loadBenefits();
    } catch (err) {
      console.error('Error deleting company benefit:', err);
      setError(err.message || 'Gagal menghapus company benefit');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <CCard className={`border-0 shadow-sm ${className}`}>
        <CCardHeader className="bg-white border-0 pb-0">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h5 className="mb-1">Company Benefits</h5>
              <small className="text-medium-emphasis">
                Konfigurasi benefit perusahaan yang akan disalin ke payroll benefits saat generate payroll.
              </small>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-start">
              <CButton color="secondary" variant="outline" onClick={loadBenefits} disabled={loading}>
                <CIcon icon={cilReload} className="me-2" />
                Refresh
              </CButton>
              {canManage && (
                <CButton color="primary" onClick={openCreateModal}>
                  <CIcon icon={cilPlus} className="me-2" />
                  Add Benefit
                </CButton>
              )}
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError('')}>
              {error}
            </CAlert>
          )}
          {success && (
            <CAlert color="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </CAlert>
          )}

          <CRow className="g-3 mb-4">
            <CCol md={3}>
              <div className="info-tile h-100">
                <div className="info-tile__label d-flex align-items-center gap-2">
                  <CIcon icon={cilMedicalCross} />
                  Active Benefits
                </div>
                <div className="info-tile__value">{benefitSummary.active}</div>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="info-tile h-100">
                <div className="info-tile__label d-flex align-items-center gap-2">
                  <CIcon icon={cilCash} />
                  Employer %
                </div>
                <div className="info-tile__value">{benefitSummary.employerPercentage.toFixed(4)}%</div>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="info-tile h-100">
                <div className="info-tile__label">Employee %</div>
                <div className="info-tile__value">{benefitSummary.employeePercentage.toFixed(4)}%</div>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="info-tile h-100">
                <div className="info-tile__label">Taxable PPH21</div>
                <div className="info-tile__value">{benefitSummary.taxable}</div>
              </div>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <div className="text-medium-emphasis mt-2">Loading company benefits...</div>
            </div>
          ) : (
            <CTable responsive hover align="middle" className="mb-0">
              <CTableHead className="text-medium-emphasis">
                <CTableRow>
                  <CTableHeaderCell>Benefit</CTableHeaderCell>
                  <CTableHeaderCell>Base Component</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Employee %</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Employer %</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Max Base</CTableHeaderCell>
                  <CTableHeaderCell>PPH21</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  {canManage && <CTableHeaderCell width="120">Actions</CTableHeaderCell>}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {benefits.length > 0 ? (
                  benefits.map((benefit) => (
                    <CTableRow key={benefit.company_benefit_id}>
                      <CTableDataCell>
                        <div className="fw-semibold">{benefit.name}</div>
                        <div className="small text-medium-emphasis">
                          {benefit.benefit_type || 'No type'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>{resolveBaseComponentLabel(benefit)}</CTableDataCell>
                      <CTableDataCell className="text-end">
                        {numberValue(benefit.employee_percentage).toFixed(4)}%
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        {numberValue(benefit.employer_percentage).toFixed(4)}%
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        {benefit.max_base !== null && benefit.max_base !== undefined
                          ? formatCurrency(Number(benefit.max_base))
                          : '-'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={benefit.is_taxable ? 'warning' : 'secondary'}>
                          {benefit.is_taxable ? 'Taxable' : 'Non-taxable'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={benefit.is_active ? 'success' : 'secondary'}>
                          <CIcon icon={benefit.is_active ? cilCheckCircle : cilXCircle} className="me-1" />
                          {benefit.is_active ? 'Active' : 'Inactive'}
                        </CBadge>
                      </CTableDataCell>
                      {canManage && (
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <CButton
                              color="info"
                              variant="outline"
                              title="Edit benefit"
                              onClick={() => openEditModal(benefit)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            {canDelete && (
                              <CButton
                                color="danger"
                                variant="outline"
                                title="Delete benefit"
                                onClick={() => openDeleteModal(benefit)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            )}
                          </CButtonGroup>
                        </CTableDataCell>
                      )}
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={canManage ? 8 : 7} className="text-center py-4">
                      <div className="text-medium-emphasis">
                        No company benefit rules configured yet.
                      </div>
                      {canManage && (
                        <CButton color="primary" variant="outline" className="mt-3" onClick={openCreateModal}>
                          <CIcon icon={cilPlus} className="me-2" />
                          Add First Benefit
                        </CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={showFormModal} onClose={closeFormModal} size="lg" backdrop="static">
        <CForm onSubmit={handleSubmit}>
          <CModalHeader>
            <CModalTitle>{editingBenefit ? 'Edit Company Benefit' : 'Add Company Benefit'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel htmlFor="company-benefit-name">Benefit Name</CFormLabel>
                <CFormInput
                  id="company-benefit-name"
                  list="company-benefit-name-options"
                  value={formData.name}
                  onChange={(event) => handleFormChange('name', event.target.value)}
                  invalid={!!formErrors.name}
                  placeholder="Example: JKK"
                />
                <datalist id="company-benefit-name-options">
                  {benefitNameOptions.map((option) => (
                    <option value={option} key={option} />
                  ))}
                </datalist>
                {formErrors.name && <CFormFeedback invalid>{formErrors.name}</CFormFeedback>}
                <div className="small text-medium-emphasis mt-1">
                  Label benefit yang akan muncul pada section Benefits di payslip.
                </div>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="company-benefit-type">Benefit Type</CFormLabel>
                <CFormInput
                  id="company-benefit-type"
                  list="company-benefit-type-options"
                  value={formData.benefit_type}
                  onChange={(event) => handleFormChange('benefit_type', event.target.value)}
                  placeholder="Example: BPJS"
                />
                <datalist id="company-benefit-type-options">
                  {benefitTypeOptions.map((option) => (
                    <option value={option} key={option} />
                  ))}
                </datalist>
                <div className="small text-medium-emphasis mt-1">
                  Kategori benefit untuk pengelompokan, tidak mengubah rumus perhitungan.
                </div>
              </CCol>
              <CCol md={12}>
                <CFormLabel htmlFor="company-benefit-base">Base Component</CFormLabel>
                <CFormSelect
                  id="company-benefit-base"
                  value={formData.main_component_id}
                  onChange={(event) => handleFormChange('main_component_id', event.target.value)}
                  disabled={componentLoading}
                >
                  <option value="">Total Earnings</option>
                  {baseComponents.map((component) => (
                    <option value={component.main_component_id} key={component.main_component_id}>
                      {component.name}{component.code ? ` (${component.code})` : ''}
                    </option>
                  ))}
                </CFormSelect>
                <div className="small text-medium-emphasis mt-1">
                  Dasar perhitungan benefit. Jika kosong, sistem memakai Total Earnings payroll.
                </div>
              </CCol>
              <CCol md={4}>
                <CFormLabel htmlFor="company-benefit-employee">Employee %</CFormLabel>
                <CFormInput
                  id="company-benefit-employee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.0001"
                  value={formData.employee_percentage}
                  onChange={(event) => handleFormChange('employee_percentage', event.target.value)}
                  invalid={!!formErrors.employee_percentage}
                />
                {formErrors.employee_percentage && (
                  <CFormFeedback invalid>{formErrors.employee_percentage}</CFormFeedback>
                )}
                <div className="small text-medium-emphasis mt-1">
                  Porsi karyawan yang disimpan di payroll benefits sebagai employee amount.
                </div>
              </CCol>
              <CCol md={4}>
                <CFormLabel htmlFor="company-benefit-employer">Employer %</CFormLabel>
                <CFormInput
                  id="company-benefit-employer"
                  type="number"
                  min="0"
                  max="100"
                  step="0.0001"
                  value={formData.employer_percentage}
                  onChange={(event) => handleFormChange('employer_percentage', event.target.value)}
                  invalid={!!formErrors.employer_percentage}
                />
                {formErrors.employer_percentage && (
                  <CFormFeedback invalid>{formErrors.employer_percentage}</CFormFeedback>
                )}
                <div className="small text-medium-emphasis mt-1">
                  Porsi perusahaan. Nilai ini tampil sebagai Benefits di payslip dan menjadi bruto PPH21 jika Taxable aktif.
                </div>
              </CCol>
              <CCol md={4}>
                <CFormLabel htmlFor="company-benefit-max-base">Max Base</CFormLabel>
                <CFormInput
                  id="company-benefit-max-base"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.max_base}
                  onChange={(event) => handleFormChange('max_base', event.target.value)}
                  invalid={!!formErrors.max_base}
                  placeholder="No limit"
                />
                {formErrors.max_base && <CFormFeedback invalid>{formErrors.max_base}</CFormFeedback>}
                <div className="small text-medium-emphasis mt-1">
                  Batas maksimum base perhitungan. Kosong berarti tanpa plafon.
                </div>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="company-benefit-effective">Effective Date</CFormLabel>
                <CFormInput
                  id="company-benefit-effective"
                  type="date"
                  value={formData.effective_date}
                  onChange={(event) => handleFormChange('effective_date', event.target.value)}
                />
                <div className="small text-medium-emphasis mt-1">
                  Tanggal mulai aturan benefit sebagai referensi konfigurasi.
                </div>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="company-benefit-expired">Expired Date</CFormLabel>
                <CFormInput
                  id="company-benefit-expired"
                  type="date"
                  value={formData.expired_date}
                  onChange={(event) => handleFormChange('expired_date', event.target.value)}
                  invalid={!!formErrors.expired_date}
                />
                {formErrors.expired_date && <CFormFeedback invalid>{formErrors.expired_date}</CFormFeedback>}
                <div className="small text-medium-emphasis mt-1">
                  Tanggal akhir aturan benefit sebagai referensi konfigurasi.
                </div>
              </CCol>
              <CCol md={12}>
                <CFormSwitch
                  id="company-benefit-active"
                  label="Active"
                  checked={Boolean(formData.is_active)}
                  onChange={(event) => handleFormChange('is_active', event.target.checked)}
                />
                <div className="small text-medium-emphasis mt-1">
                  Hanya benefit aktif yang dihitung saat payroll digenerate.
                </div>
              </CCol>
              <CCol md={12}>
                <CFormSwitch
                  id="company-benefit-taxable"
                  label="Taxable for PPH21"
                  checked={Boolean(formData.is_taxable)}
                  onChange={(event) => handleFormChange('is_taxable', event.target.checked)}
                />
                <div className="small text-medium-emphasis mt-1">
                  Jika aktif, porsi Employer % dari benefit ini ditambahkan ke bruto PPH21, tetapi tetap tidak masuk THP.
                </div>
              </CCol>
              <CCol md={12}>
                <CFormLabel htmlFor="company-benefit-description">Description</CFormLabel>
                <CFormTextarea
                  id="company-benefit-description"
                  rows={3}
                  value={formData.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                  placeholder="Optional note for payroll admins"
                />
                <div className="small text-medium-emphasis mt-1">
                  Catatan internal untuk admin payroll, tidak mempengaruhi perhitungan.
                </div>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={closeFormModal} disabled={submitting}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CIcon icon={cilSave} className="me-2" />
                  Save Benefit
                </>
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <CModal visible={showDeleteModal} onClose={closeDeleteModal} backdrop="static">
        <CModalHeader>
          <CModalTitle>Delete Company Benefit</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Delete <strong>{benefitToDelete?.name}</strong> from this company?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeDeleteModal} disabled={deleting}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <CIcon icon={cilTrash} className="me-2" />
                Delete
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CompanyBenefitsPanel;
