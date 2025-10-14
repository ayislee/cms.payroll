// ========================================
// USER DETAIL PAGE - PROFESSIONAL VERSION
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
  cilUser,
  cilEnvelopeClosed,
  cilPhone,
  cilCalendar,
  cilCheckCircle,
  cilXCircle,
  cilShieldAlt,
  cilBuilding,
  cilClock
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDateTime, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS, USER_ROLES } from '../../../constants/userRoles';
import userService from '../services/userService';

const detailStyles = `
  .user-detail-hero {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.5rem;
    padding: 2.3rem;
    background: linear-gradient(135deg, #312e81 0%, #6366f1 50%, #7c3aed 100%);
    color: #fff;
    overflow: hidden;
  }

  .user-detail-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.3), transparent 60%);
    opacity: 0.7;
    pointer-events: none;
  }

  .user-detail-hero__content,
  .user-detail-hero__actions {
    position: relative;
    z-index: 2;
  }

  .user-detail-hero__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.85;
  }

  .user-detail-hero__title {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
  }

  .user-detail-hero__subtitle {
    max-width: 520px;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .user-detail-hero__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .user-detail-hero__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .user-detail-hero__actions .btn {
    border-radius: 999px;
    padding-inline: 1.35rem;
    font-weight: 500;
  }

  .info-tile {
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    padding: 1.1rem;
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
    margin-top: 0.3rem;
  }

  .stat-card {
    border-radius: 1.1rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    padding: 1.2rem 1.3rem;
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('user-detail-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'user-detail-styles';
  styleElement.textContent = detailStyles;
  document.head.appendChild(styleElement);
}
const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  useDocumentTitle('User Details');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadUser = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const data = await userService.getUserById(id);
      const formatted = userService.formatUserListItem(data);
      setUser(formatted);
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err.message || 'Gagal memuat data pengguna');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleToggleStatus = useCallback(async () => {
    if (!id) return;

    try {
      setUpdatingStatus(true);
      await userService.toggleUserStatus(id);
      await loadUser();
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err.message || 'Gagal memperbarui status pengguna');
    } finally {
      setUpdatingStatus(false);
    }
  }, [id, loadUser]);

  const statusBadge = useMemo(() => {
    if (!user) return null;
    return (
      <CBadge color={user.is_active ? 'success' : 'danger'} className="px-3 py-2">
        <CIcon icon={user.is_active ? cilCheckCircle : cilXCircle} className="me-1" />
        {user.is_active ? 'Aktif' : 'Nonaktif'}
      </CBadge>
    );
  }, [user]);

  if (loading) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CSpinner color="primary" />
          <div className="mt-3 text-medium-emphasis">Memuat detail pengguna...</div>
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
            <CButton color="primary" onClick={() => navigate('/users')}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              Kembali ke daftar pengguna
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  if (!user) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CAlert color="warning" className="mb-4 d-inline-block">
            Data pengguna tidak ditemukan.
          </CAlert>
          <div>
            <CButton color="primary" onClick={() => navigate('/users')}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              Kembali ke daftar pengguna
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  const userRoleLabel = user.type === USER_ROLES.ADMIN ? 'Administrator' : 'Member';

  const contactItems = [
    {
      icon: cilEnvelopeClosed,
      label: 'Email',
      value: user.email || '-',
      href: user.email ? `mailto:${user.email}` : null
    },
    {
      icon: cilPhone,
      label: 'Telepon',
      value: formatPhoneNumber(user.phone) || '-',
      href: user.phone ? `tel:${user.phone}` : null
    },
    {
      icon: cilBuilding,
      label: 'Perusahaan',
      value: user.company_name || (user.company_id ? `Company #${user.company_id}` : '-')
    }
  ];

  return (
    <>
      <CBreadcrumb className="px-0 mb-3">
        <CBreadcrumbItem>
          <Link to="/users">Pengguna</Link>
        </CBreadcrumbItem>
        <CBreadcrumbItem active>{user.name}</CBreadcrumbItem>
      </CBreadcrumb>

      <div className="user-detail-hero mb-4">
        <div className="user-detail-hero__content">
          <span className="user-detail-hero__eyebrow">Access Profile</span>
          <h2 className="user-detail-hero__title">{user.name}</h2>
          <p className="user-detail-hero__subtitle mb-0">
            {user.email || 'Email belum diisi'} · {userRoleLabel}
          </p>
          <div className="user-detail-hero__chips">
            {statusBadge}
            <CBadge color="light" className="px-3 py-2 text-dark border border-light">
              ID #{user.user_id ?? '-'}
            </CBadge>
            <CBadge color="info" className="px-3 py-2">
              {userRoleLabel}
            </CBadge>
          </div>
        </div>
        <div className="user-detail-hero__actions">
          <CButton color="light" variant="outline" onClick={() => navigate('/users')}>
            <CIcon icon={cilArrowLeft} className="me-2" />
            Kembali
          </CButton>
          {hasPermission(PERMISSIONS.USERS_UPDATE) && (
            <CButton
              color={user.is_active ? 'warning' : 'success'}
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
                  <CIcon icon={user.is_active ? cilXCircle : cilCheckCircle} className="me-2" />
                  {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </>
              )}
            </CButton>
          )}
          {hasPermission(PERMISSIONS.USERS_UPDATE) && (
            <CButton color="light" onClick={() => navigate(`/users/${id}/edit`)}>
              <CIcon icon={cilPencil} className="me-2" />
              Edit Pengguna
            </CButton>
          )}
        </div>
      </div>
      <CRow className="g-4">
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-white border-0 pb-0">
              <h5 className="mb-1">Informasi Pengguna</h5>
              <small className="text-medium-emphasis">
                Data penting untuk memastikan akses sistem terkendali.
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
                        {item.href && item.value !== '-'
                          ? (
                              <a href={item.href} className="text-decoration-none">
                                {item.value}
                              </a>
                            )
                          : item.value}
                      </div>
                    </div>
                  </CCol>
                ))}
              </CRow>

              <CRow className="g-3 mt-1">
                <CCol md={6}>
                  <div className="info-tile">
                    <div className="info-tile__label">Status Pengguna</div>
                    <div className="info-tile__value">
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                      <small className="d-block text-medium-emphasis mt-1">
                        Pengguna aktif dapat mengakses sistem sesuai perannya.
                      </small>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="info-tile">
                    <div className="info-tile__label">Peran</div>
                    <div className="info-tile__value">
                      {userRoleLabel}
                      <small className="d-block text-medium-emphasis mt-1">
                        Administrator memiliki hak penuh, sedangkan member akses terbatas.
                      </small>
                    </div>
                  </div>
                </CCol>
              </CRow>

              <hr className="my-4" />

              <h6 className="mb-3">Timeline Akses</h6>
              <CListGroup flush>
                <CListGroupItem className="px-0 d-flex justify-content-between align-items-center">
                  <span>
                    <CIcon icon={cilCalendar} className="me-2 text-primary" />
                    Dibuat
                  </span>
                  <span className="text-medium-emphasis">{formatDateTime(user.created_at) || '-'}</span>
                </CListGroupItem>
                <CListGroupItem className="px-0 d-flex justify-content-between align-items-center">
                  <span>
                    <CIcon icon={cilClock} className="me-2 text-primary" />
                    Terakhir diperbarui
                  </span>
                  <span className="text-medium-emphasis">{formatDateTime(user.updated_at) || '-'}</span>
                </CListGroupItem>
              </CListGroup>
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-white border-0 pb-0">
              <h5 className="mb-1">Ringkasan Aktivitas</h5>
              <small className="text-medium-emphasis">
                Ikhtisar status akun membantu audit dan pengelolaan akses.
              </small>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <div className="stat-card h-100">
                    <div>
                      <div className="fw-semibold">Status Akun</div>
                      <div className="text-medium-emphasis">{user.is_active ? 'Pengguna aktif' : 'Pengguna nonaktif'}</div>
                    </div>
                    <CBadge color={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </CBadge>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="stat-card h-100">
                    <div>
                      <div className="fw-semibold">Peran</div>
                      <div className="text-medium-emphasis">{userRoleLabel}</div>
                    </div>
                    <CBadge color={user.type === USER_ROLES.ADMIN ? 'primary' : 'secondary'}>
                      {user.type?.toUpperCase() || USER_ROLES.USER.toUpperCase()}
                    </CBadge>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-white border-0 pb-0">
              <h6 className="mb-1">Kontak Cepat</h6>
              <small className="text-medium-emphasis">Gunakan detail ini untuk verifikasi manual.</small>
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
                        <div className="text-medium-emphasis">{item.value}</div>
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
              <small className="text-medium-emphasis">Kelola akses atau audit aktivitas.</small>
            </CCardHeader>
            <CCardBody>
              <div className="d-grid gap-2">
                <Link to="/users" className="btn btn-outline-primary">
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  Lihat Daftar Pengguna
                </Link>
                {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                  <Link to={`/users/${id}/edit`} className="btn btn-outline-warning">
                    <CIcon icon={cilPencil} className="me-2" />
                    Sunting Pengguna
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

export default UserDetail;
