// ========================================
// COMPANY DETAIL PAGE - PROFESSIONAL VERSION
// ========================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CListGroupItem,
  CBreadcrumb,
  CBreadcrumbItem
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
  cilCalendar,
  cilLocationPin,
  cilReload
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDateTime, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import companyService from '../services/companyService';

const detailStyles = `
  .company-detail-hero {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.5rem;
    padding: 2.35rem;
    background: linear-gradient(135deg, #312e81 0%, #6366f1 50%, #7c3aed 100%);
    color: #fff;
    overflow: hidden;
  }

  .company-detail-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.3), transparent 60%);
    opacity: 0.7;
    pointer-events: none;
  }

  .company-detail-hero__content,
  .company-detail-hero__actions {
    position: relative;
    z-index: 2;
  }

  .company-detail-hero__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.85;
  }

  .company-detail-hero__title {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .company-detail-hero__subtitle {
    max-width: 520px;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .company-detail-hero__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .company-detail-hero__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .company-detail-hero__actions .btn {
    border-radius: 999px;
    padding-inline: 1.35rem;
    font-weight: 500;
  }

  .info-tile {
    border-radius: 1rem;
    padding: 1.2rem;
    border: 1px solid #e2e8f0;
    background: #ffffff;
  }

  .info-tile__label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 600;
  }

  .info-tile__value {
    font-size: 1.05rem;
    font-weight: 600;
    color: #1f2937;
    margin-top: 0.35rem;
  }

  .stat-card {
    border-radius: 1.1rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    padding: 1.25rem 1.4rem;
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.07);
  }

  .stat-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.85rem;
    font-size: 1.35rem;
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
  }

  .stat-card__value {
    font-size: 1.65rem;
    font-weight: 600;
    color: #111827;
  }

  .stat-card__caption {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .timeline-item {
    border-left: 2px solid #e2e8f0;
    padding-left: 1rem;
    position: relative;
    margin-bottom: 1rem;
  }

  .timeline-item::before {
    content: '';
    position: absolute;
    left: -7px;
    top: 4px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #4f46e5;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('company-detail-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'company-detail-styles';
  styleElement.textContent = detailStyles;
  document.head.appendChild(styleElement);
}

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useDocumentTitle(company ? `${company.name} · Company Details` : 'Company Details');

  const loadCompanyData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const [companyResult, statsResult] = await Promise.allSettled([
        companyService.getCompanyById(id),
        companyService.getCompanyStats(id)
      ]);

      if (companyResult.status === 'fulfilled' && companyResult.value) {
        const formatted = companyService.formatCompanyListItem(companyResult.value);
        setCompany({
          ...formatted,
          raw: companyResult.value
        });
      } else {
        throw new Error(
          companyResult.reason?.message || 'Data perusahaan tidak ditemukan'
        );
      }

      if (statsResult.status === 'fulfilled') {
        const statsPayload = statsResult.value?.data ?? statsResult.value ?? {};
        setStats(statsPayload);
      } else {
        console.warn('Unable to load company stats:', statsResult.reason);
        setStats(null);
      }
    } catch (err) {
      console.error('Error loading company:', err);
      setError(err.message || 'Gagal memuat data perusahaan');
      setCompany(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const handleToggleStatus = useCallback(async () => {
    if (!id) return;

    try {
      setUpdatingStatus(true);
      await companyService.toggleCompanyStatus(id);
      await loadCompanyData();
    } catch (err) {
      console.error('Error toggling company status:', err);
      setError(err.message || 'Gagal memperbarui status perusahaan');
    } finally {
      setUpdatingStatus(false);
    }
  }, [id, loadCompanyData]);

  const statusBadge = useMemo(() => {
    if (!company) return null;
    return (
      <CBadge color={company.is_active ? 'success' : 'danger'} className="px-3 py-2">
        <CIcon icon={company.is_active ? cilCheckCircle : cilXCircle} className="me-2" />
        {company.is_active ? 'Aktif' : 'Nonaktif'}
      </CBadge>
    );
  }, [company]);

  const contactItems = useMemo(() => {
    if (!company) return [];
    return [
      {
        icon: cilEnvelopeClosed,
        label: 'Email',
        value: company.email || 'Belum diisi',
        href: company.email ? `mailto:${company.email}` : null
      },
      {
        icon: cilPhone,
        label: 'Telepon',
        value: formatPhoneNumber(company.phone) || 'Belum diisi',
        href: company.phone ? `tel:${company.phone}` : null
      },
      {
        icon: cilLocationPin,
        label: 'Alamat',
        value: company.address || 'Belum diisi'
      }
    ];
  }, [company]);

  const timelineItems = useMemo(() => {
    if (!company) return [];
    return [
      {
        title: 'Dibuat',
        value: formatDateTime(company.created_at) || 'Tidak tersedia'
      },
      {
        title: 'Diperbarui',
        value: formatDateTime(company.updated_at || company.created_at) || 'Tidak tersedia'
      }
    ];
  }, [company]);

  const computedStats = useMemo(() => {
    return {
      employees: stats?.employees_count ?? 0,
      payrolls: stats?.payrolls_count ?? 0,
      bpjsK: stats?.bpjs_k_settings_count ?? 0,
      bpjsTk: stats?.bpjs_tk_settings_count ?? 0,
      createdAt: stats?.created_at ?? null
    };
  }, [stats]);

  if (loading) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CSpinner color="primary" />
          <div className="mt-3 text-medium-emphasis">Memuat detail perusahaan...</div>
        </CCardBody>
      </CCard>
    );
  }

  if (error) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CAlert color="danger" className="mb-4 d-inline-block">
            {error}
          </CAlert>
          <div>
            <CButton color="primary" onClick={() => navigate('/companies')}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              Kembali ke daftar perusahaan
            </CButton>
            <CButton
              color="secondary"
              variant="outline"
              className="ms-2"
              onClick={loadCompanyData}
            >
              <CIcon icon={cilReload} className="me-2" />
              Coba lagi
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  if (!company) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CAlert color="warning" className="mb-4 d-inline-block">
            Data perusahaan tidak ditemukan.
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

  return (
    <>
      <CBreadcrumb className="px-0 mb-3">
        <CBreadcrumbItem>
          <Link to="/companies">Perusahaan</Link>
        </CBreadcrumbItem>
        <CBreadcrumbItem active>{company.name}</CBreadcrumbItem>
      </CBreadcrumb>

      <div className="company-detail-hero mb-4">
        <div className="company-detail-hero__content">
          <span className="company-detail-hero__eyebrow">Company Profile</span>
          <h2 className="company-detail-hero__title">{company.name}</h2>
          <p className="company-detail-hero__subtitle mb-0">
            {company.address
              ? company.address
              : 'Alamat perusahaan belum diisi. Lengkapi untuk mempermudah proses audit dan pengiriman dokumen.'}
          </p>

          <div className="company-detail-hero__chips">
            {statusBadge}
            <CBadge color="light" className="px-3 py-2 text-dark border border-light">
              ID #{company.company_id ?? '-'}
            </CBadge>
          </div>
        </div>

        <div className="company-detail-hero__actions">
          <CButton
            color="light"
            variant="outline"
            onClick={() => navigate('/companies')}
          >
            <CIcon icon={cilArrowLeft} className="me-2" />
            Kembali
          </CButton>
          {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
            <CButton
              color={company.is_active ? 'warning' : 'success'}
              variant="outline"
              disabled={updatingStatus}
              onClick={handleToggleStatus}
            >
              {updatingStatus ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <CIcon icon={company.is_active ? cilXCircle : cilCheckCircle} className="me-2" />
                  {company.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </>
              )}
            </CButton>
          )}
          {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
            <CButton color="light" onClick={() => navigate(`/companies/${id}/edit`)}>
              <CIcon icon={cilPencil} className="me-2" />
              Edit Profil
            </CButton>
          )}
        </div>
      </div>

      <CRow className="g-4">
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-white border-0 pb-0">
              <h5 className="mb-1">Informasi Perusahaan</h5>
              <small className="text-medium-emphasis">
                Detail utama yang digunakan untuk kebutuhan payroll dan compliance.
              </small>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                {contactItems.map((item) => (
                  <CCol md={4} key={item.label}>
                    <div className="info-tile h-100">
                      <div className="info-tile__label d-flex align-items-center gap-2">
                        <CIcon icon={item.icon} />
                        {item.label}
                      </div>
                      <div className="info-tile__value">
                        {item.href && item.value !== 'Belum diisi' ? (
                          <a href={item.href} className="text-decoration-none">
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </div>
                    </div>
                  </CCol>
                ))}
              </CRow>

              <CRow className="g-3 mt-1">
                <CCol md={6}>
                  <div className="info-tile">
                    <div className="info-tile__label">Status Perusahaan</div>
                    <div className="info-tile__value">
                      {company.is_active ? 'Aktif' : 'Nonaktif'}
                      <small className="d-block text-medium-emphasis mt-1">
                        Perusahaan aktif dapat dipilih pada master data lainnya.
                      </small>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="info-tile">
                    <div className="info-tile__label">Dokumentasi</div>
                    <div className="info-tile__value">
                      {company.raw?.notes || 'Belum ada catatan tambahan'}
                    </div>
                  </div>
                </CCol>
              </CRow>

              <hr className="my-4" />

              <h6 className="mb-3">Catatan Aktivitas</h6>
              <div>
                {timelineItems.map((item) => (
                  <div className="timeline-item" key={item.title}>
                    <strong>{item.title}</strong>
                    <div className="text-medium-emphasis">{item.value}</div>
                  </div>
                ))}
              </div>
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-white border-0 pb-0">
              <h5 className="mb-1">Ringkasan Data</h5>
              <small className="text-medium-emphasis">
                Ikhtisar data terkait perusahaan dalam sistem payroll.
              </small>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <div className="stat-card h-100">
                    <div className="stat-card__icon">
                      <CIcon icon={cilPeople} />
                    </div>
                    <div>
                      <div className="stat-card__value">{computedStats.employees}</div>
                      <div className="stat-card__caption">Karyawan terhubung</div>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="stat-card h-100">
                    <div className="stat-card__icon">
                      <CIcon icon={cilCash} />
                    </div>
                    <div>
                      <div className="stat-card__value">{computedStats.payrolls}</div>
                      <div className="stat-card__caption">Payroll yang diproses</div>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="stat-card h-100">
                    <div className="stat-card__icon">
                      <CIcon icon={cilMedicalCross} />
                    </div>
                    <div>
                      <div className="stat-card__value">{computedStats.bpjsK}</div>
                      <div className="stat-card__caption">BPJS Kesehatan tercatat</div>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="stat-card h-100">
                    <div className="stat-card__icon">
                      <CIcon icon={cilMedicalCross} />
                    </div>
                    <div>
                      <div className="stat-card__value">{computedStats.bpjsTk}</div>
                      <div className="stat-card__caption">BPJS Ketenagakerjaan tercatat</div>
                    </div>
                  </div>
                </CCol>
              </CRow>

              <div className="mt-4">
                <small className="text-medium-emphasis d-block">
                  <CIcon icon={cilCalendar} className="me-2" />
                  Data statistik diperbarui:{' '}
                  {computedStats.createdAt ? formatDateTime(computedStats.createdAt) : '-'}
                </small>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-white border-0 pb-0">
              <h6 className="mb-1">Kontak Cepat</h6>
              <small className="text-medium-emphasis">
                Detail singkat untuk keperluan komunikasi.
              </small>
            </CCardHeader>
            <CCardBody>
              <CListGroup flush>
                {contactItems.map((item) => (
                  <CListGroupItem key={item.label} className="px-0">
                    <div className="d-flex align-items-start gap-3">
                      <div className="text-primary pt-1">
                        <CIcon icon={item.icon} />
                      </div>
                      <div>
                        <div className="fw-semibold">{item.label}</div>
                        <div className="text-medium-emphasis">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  </CListGroupItem>
                ))}
              </CListGroup>
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-white border-0 pb-0">
              <h6 className="mb-1">Tindakan Cepat</h6>
              <small className="text-medium-emphasis">
                Akses modul terkait perusahaan ini.
              </small>
            </CCardHeader>
            <CCardBody>
              <div className="d-grid gap-2">
                <Link to="/employees" className="btn btn-outline-primary">
                  <CIcon icon={cilPeople} className="me-2" />
                  Lihat Karyawan
                </Link>
                <Link to="/payroll" className="btn btn-outline-success">
                  <CIcon icon={cilCash} className="me-2" />
                  Lihat Payroll
                </Link>
                {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                  <Link to={`/companies/${id}/edit`} className="btn btn-outline-primary">
                    <CIcon icon={cilPencil} className="me-2" />
                    Sunting Perusahaan
                  </Link>
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default CompanyDetail;
