// ========================================
// COMPANY FORM PAGE - PROFESSIONAL VERSION
// ========================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  CButton,
  CSpinner,
  CAlert,
  CFormSwitch,
  CBreadcrumb,
  CBreadcrumbItem
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilSave,
  cilCheckCircle,
  cilBuilding,
  cilInfo,
  cilShieldAlt
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS } from '../../../constants/userRoles';
import companyService from '../services/companyService';

const formStyles = `
  .company-form-hero {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.5rem;
    padding: 2.35rem;
    background: linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #8b5cf6 100%);
    color: #fff;
    overflow: hidden;
  }

  .company-form-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.35), transparent 60%);
    opacity: 0.7;
    pointer-events: none;
  }

  .company-form-hero__content,
  .company-form-hero__actions {
    position: relative;
    z-index: 2;
  }

  .company-form-hero__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.85;
  }

  .company-form-hero__title {
    font-size: 1.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .company-form-hero__subtitle {
    max-width: 520px;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .company-form-hero__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .company-form-hero__actions .btn {
    border-radius: 999px;
    padding-inline: 1.35rem;
    font-weight: 500;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .section-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
  }

  .hint-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    background: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('company-form-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'company-form-styles';
  styleElement.textContent = formStyles;
  document.head.appendChild(styleElement);
}

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isEdit = Boolean(id);

  useDocumentTitle(isEdit ? 'Edit Company' : 'Create Company');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const loadCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const company = await companyService.getCompanyById(id);
      const formatted = companyService.formatCompanyListItem(company);

      setFormData({
        name: formatted.name || '',
        address: formatted.address || '',
        phone: formatted.phone || '',
        email: formatted.email || '',
        is_active: formatted.is_active !== false
      });
    } catch (err) {
      console.error('Error loading company:', err);
      setError(err.message || 'Gagal memuat data perusahaan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      if (hasPermission(PERMISSIONS.COMPANIES_UPDATE)) {
        loadCompany();
      } else {
        setLoading(false);
      }
    }
  }, [hasPermission, isEdit, loadCompany]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (error) {
      setError('');
    }

    if (success) {
      setSuccess('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasPermission(isEdit ? PERMISSIONS.COMPANIES_UPDATE : PERMISSIONS.COMPANIES_CREATE)) {
      setError('Anda tidak memiliki izin untuk melakukan aksi ini.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      setValidationErrors({});

      const validation = companyService.validateCompanyData(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      if (isEdit) {
        await companyService.updateCompany(id, formData);
        setSuccess('Data perusahaan berhasil diperbarui.');
      } else {
        await companyService.createCompany(formData);
        setSuccess('Perusahaan baru berhasil ditambahkan.');
        setFormData((prev) => ({
          ...prev,
          name: '',
          address: '',
          phone: '',
          email: ''
        }));
      }

      setTimeout(() => {
        navigate('/companies');
      }, 1200);
    } catch (err) {
      console.error('Error saving company:', err);
      if (err.message && err.message.includes('Validation Error')) {
        try {
          const payload = JSON.parse(err.message.split(': ')[1]);
          setValidationErrors(payload.errors || {});
        } catch {
          setError(err.message);
        }
      } else {
        setError(err.message || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} perusahaan`);
      }
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = useMemo(
    () => (isEdit ? 'Perbarui Perusahaan' : 'Tambah Perusahaan'),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () =>
      isEdit
        ? 'Revisi data perusahaan agar tetap selaras dengan kebutuhan operasional.'
        : 'Lengkapi data perusahaan untuk memastikan payroll dan compliance berjalan mulus.',
    [isEdit]
  );

  if (isEdit && !hasPermission(PERMISSIONS.COMPANIES_UPDATE)) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CAlert color="warning" className="mb-4 d-inline-block">
            Anda tidak memiliki akses untuk mengubah data perusahaan.
          </CAlert>
          <div>
            <CButton color="primary" onClick={() => navigate('/companies')}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              Kembali ke daftar perusahaan
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  if (!isEdit && !hasPermission(PERMISSIONS.COMPANIES_CREATE)) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CAlert color="warning" className="mb-4 d-inline-block">
            Anda tidak memiliki akses untuk menambahkan perusahaan baru.
          </CAlert>
          <div>
            <CButton color="primary" onClick={() => navigate('/companies')}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              Kembali ke daftar perusahaan
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  if (loading) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CSpinner color="primary" />
          <div className="mt-3 text-medium-emphasis">Memuat data perusahaan...</div>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <CBreadcrumb className="px-0 mb-3">
        <CBreadcrumbItem>
          <Link to="/companies">Perusahaan</Link>
        </CBreadcrumbItem>
        <CBreadcrumbItem active>{pageTitle}</CBreadcrumbItem>
      </CBreadcrumb>

      <div className="company-form-hero mb-4">
        <div className="company-form-hero__content">
          <span className="company-form-hero__eyebrow">Company Registry</span>
          <h2 className="company-form-hero__title">{pageTitle}</h2>
          <p className="company-form-hero__subtitle mb-0">{pageSubtitle}</p>
        </div>
        <div className="company-form-hero__actions">
          <CButton
            color="light"
            variant="outline"
            onClick={() => navigate('/companies')}
            disabled={saving}
          >
            <CIcon icon={cilArrowLeft} className="me-2" />
            Kembali
          </CButton>
          <CButton color="light" disabled={saving} type="submit" form="company-form">
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <CIcon icon={cilSave} className="me-2" />
                Simpan Perusahaan
              </>
            )}
          </CButton>
        </div>
      </div>

      <CRow className="g-4">
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Formulir Perusahaan</h5>
                  <small className="text-medium-emphasis">
                    Pastikan data yang diisikan sesuai dokumen legal perusahaan.
                  </small>
                </div>
                <div className="hint-badge">
                  <CIcon icon={cilInfo} />
                  Data penting untuk payroll
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {success && (
                <CAlert color="success" className="mb-3">
                  <CIcon icon={cilCheckCircle} className="me-2" />
                  {success}
                  <div className="mt-2 text-medium-emphasis">
                    Mengarahkan kembali ke daftar perusahaan...
                  </div>
                </CAlert>
              )}

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
                    Tutup
                  </CButton>
                </CAlert>
              )}

              <CForm id="company-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="section-title mb-1">Identitas Perusahaan</div>
                  <div className="section-subtitle">
                    Informasi utama yang digunakan di seluruh modul.
                  </div>
                </div>

                <CRow className="g-3 align-items-start">
                  <CCol md={8} lg={6}>
                    <CFormLabel htmlFor="name">
                      Nama Perusahaan <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      id="name"
                      name="name"
                      placeholder="Contoh: PT Maju Mundur"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={saving}
                      className={validationErrors.name ? 'is-invalid' : ''}
                    />
                    {validationErrors.name && (
                      <div className="invalid-feedback">{validationErrors.name}</div>
                    )}
                  </CCol>
                </CRow>

                <hr className="my-4" />

                <div className="mb-4">
                  <div className="section-title mb-1">Kontak & Lokasi</div>
                  <div className="section-subtitle">
                    Data ini membantu tim payroll dan auditor menghubungi perusahaan.
                  </div>
                </div>

                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="email">Email</CFormLabel>
                    <CFormInput
                      type="email"
                      id="email"
                      name="email"
                      placeholder="contoh@perusahaan.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={saving}
                      className={validationErrors.email ? 'is-invalid' : ''}
                    />
                    {validationErrors.email && (
                      <div className="invalid-feedback">{validationErrors.email}</div>
                    )}
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="phone">Nomor Telepon</CFormLabel>
                    <CFormInput
                      id="phone"
                      name="phone"
                      placeholder="Contoh: +62xxxxxxxxxx"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={saving}
                      className={validationErrors.phone ? 'is-invalid' : ''}
                    />
                    {validationErrors.phone && (
                      <div className="invalid-feedback">{validationErrors.phone}</div>
                    )}
                    <small className="text-medium-emphasis d-block mt-1">
                      Format dianjurkan: +62xxxxxxxxxx atau 08xxxxxxxxxx.
                    </small>
                  </CCol>
                  <CCol xs={12}>
                    <CFormLabel htmlFor="address">Alamat</CFormLabel>
                    <CFormTextarea
                      id="address"
                      name="address"
                      rows={4}
                      placeholder="Tulis alamat lengkap kantor operasional"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={saving}
                      className={validationErrors.address ? 'is-invalid' : ''}
                    />
                    {validationErrors.address && (
                      <div className="invalid-feedback">{validationErrors.address}</div>
                    )}
                  </CCol>
                </CRow>

                <hr className="my-4" />

                <div className="mb-3">
                  <div className="section-title mb-2">Status Perusahaan</div>
                  <div className="d-flex align-items-start gap-3">
                    <CFormSwitch
                      id="is_active"
                      name="is_active"
                      label=""
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    <div>
                      <div className="fw-semibold">Perusahaan Aktif</div>
                      <small className="text-medium-emphasis">
                        Perusahaan nonaktif tidak akan muncul pada pilihan master data lain tetapi data tetap tersimpan.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    disabled={saving}
                    onClick={() => navigate('/companies')}
                  >
                    <CIcon icon={cilArrowLeft} className="me-2" />
                    Batalkan
                  </CButton>
                  <CButton color="primary" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilSave} className="me-2" />
                        {isEdit ? 'Simpan Perubahan' : 'Simpan Perusahaan'}
                      </>
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-white border-0 pb-0">
              <h6 className="mb-1">Checklist Kualitas Data</h6>
              <small className="text-medium-emphasis">
                Ikuti panduan singkat berikut agar data siap untuk audit.
              </small>
            </CCardHeader>
            <CCardBody>
              <ul className="text-medium-emphasis small mb-0">
                <li>Gunakan nama resmi sesuai akta atau dokumen legal.</li>
                <li>Alamat yang lengkap membantu proses pengiriman dokumen.</li>
                <li>Nomor telepon dan email aktif memudahkan tim payroll menghubungi.</li>
                <li>Tandai perusahaan aktif hanya jika masih beroperasi.</li>
              </ul>
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-white border-0 pb-0">
              <h6 className="mb-1">Keamanan Data</h6>
              <small className="text-medium-emphasis">
                Kami menjaga kerahasiaan informasi perusahaan Anda.
              </small>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex align-items-start gap-3">
                <div className="text-primary">
                  <CIcon icon={cilShieldAlt} size="xl" />
                </div>
                <div className="small text-medium-emphasis">
                  Data perusahaan hanya dapat diakses oleh pengguna yang memiliki izin. Setiap perubahan dicatat untuk kebutuhan audit trail.
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default CompanyForm;
