// ========================================
// USER FORM PAGE - PROFESSIONAL VERSION
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
  CFormSelect,
  CFormCheck,
  CButton,
  CSpinner,
  CAlert,
  CBreadcrumb,
  CBreadcrumbItem
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilSave,
  cilCheck,
  cilUser,
  cilShieldAlt,
  cilEnvelopeClosed,
  cilPhone
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS, USER_ROLES } from '../../../constants/userRoles';
import userService from '../services/userService';
import companyService from '../../companies/services/companyService';

const USER_TYPE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: 'Administrator' },
  { value: USER_ROLES.USER, label: 'Member' }
];

const formStyles = `
  .user-form-hero {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.5rem;
    padding: 2.3rem;
    background: linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #8b5cf6 100%);
    color: #fff;
    overflow: hidden;
  }

  .user-form-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.35), transparent 60%);
    opacity: 0.7;
    pointer-events: none;
  }

  .user-form-hero__content,
  .user-form-hero__actions {
    position: relative;
    z-index: 2;
  }

  .user-form-hero__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.85;
  }

  .user-form-hero__title {
    font-size: 1.9rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
  }

  .user-form-hero__subtitle {
    max-width: 540px;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .user-form-hero__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .user-form-hero__actions .btn {
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

if (typeof document !== 'undefined' && !document.getElementById('user-form-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'user-form-styles';
  styleElement.textContent = formStyles;
  document.head.appendChild(styleElement);
}
const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isEdit = Boolean(id);

  useDocumentTitle(isEdit ? 'Edit User' : 'Add User');

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    name: '',
    email: '',
    phone: '',
    type: USER_ROLES.USER,
    company_id: '',
    is_active: true,
    password: '',
    password_confirmation: ''
  });
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyFallbackOption, setCompanyFallbackOption] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const userRoleLabel = useMemo(() => {
    return formData.type === USER_ROLES.ADMIN ? 'Administrator' : 'Member';
  }, [formData.type]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const options = await companyService.getCompanyOptions();
      setCompanyOptions(options);
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (!isEdit || !id) return;

    try {
      setLoading(true);
      setError('');
      const userData = await userService.getUserById(id);
      const formatted = userService.formatUserListItem(userData);
      const typeValue = formatted.type || USER_ROLES.USER;
      const nameParts = (formatted.name || '').trim().split(' ').filter(Boolean);
      const derivedFirstname = userData?.firstname ?? nameParts[0] ?? '';
      const derivedLastname =
        userData?.lastname ??
        (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
      const cleanedPhone = formatted.phone && formatted.phone !== '-' ? formatted.phone : '';

      if (typeValue === USER_ROLES.USER && formatted.company_id) {
        setCompanyFallbackOption({
          value: String(formatted.company_id),
          label: formatted.company_name || `Company #${formatted.company_id}`
        });
      } else {
        setCompanyFallbackOption(null);
      }

      setFormData({
        firstname: derivedFirstname,
        lastname: derivedLastname,
        name: formatted.name || `${derivedFirstname} ${derivedLastname}`.trim(),
        email: formatted.email || '',
        phone: cleanedPhone || '',
        type: typeValue,
        company_id: typeValue === USER_ROLES.USER && formatted.company_id ? String(formatted.company_id) : '',
        is_active: formatted.is_active,
        password: '',
        password_confirmation: ''
      });
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err.message || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (isEdit) {
      loadUser();
    }
  }, [isEdit, loadUser]);

  const companySelectOptions = useMemo(() => {
    const options = companyOptions.length ? companyOptions : [];

    if (companyFallbackOption) {
      const exists = options.some(
        (option) => String(option.value) === String(companyFallbackOption.value)
      );
      if (!exists) {
        return [companyFallbackOption, ...options];
      }
    }

    return options;
  }, [companyFallbackOption, companyOptions]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: nextValue
      };

      if (name === 'firstname' || name === 'lastname') {
        const first = name === 'firstname' ? nextValue : updated.firstname;
        const last = name === 'lastname' ? nextValue : updated.lastname;
        updated.name = `${first || ''} ${last || ''}`.trim();
      }

      return updated;
    });

    const fieldsToClear = [name];
    if (name === 'firstname' || name === 'lastname') {
      fieldsToClear.push('name');
    }

    setValidationErrors((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;

      const nextErrors = { ...prev };
      let changed = false;

      fieldsToClear.forEach((field) => {
        if (nextErrors[field]) {
          delete nextErrors[field];
          changed = true;
        }
      });

      return changed ? nextErrors : prev;
    });

    if (error) {
      setError('');
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value
    }));

    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }

    if (passwordSuccess) {
      setPasswordSuccess('');
    }
    if (passwordErrorMessage) {
      setPasswordErrorMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasPermission(isEdit ? PERMISSIONS.USERS_UPDATE : PERMISSIONS.USERS_CREATE)) {
      setError('Anda tidak memiliki izin untuk melakukan aksi ini.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setValidationErrors({});

      const payload = {
        ...formData,
        name: `${formData.firstname || ''} ${formData.lastname || ''}`.trim()
      };

      const fieldErrors = {};

      if (!formData.firstname?.trim()) {
        fieldErrors.firstname = 'Nama depan wajib diisi';
      }

      if (!formData.lastname?.trim()) {
        fieldErrors.lastname = 'Nama belakang wajib diisi';
      }

      if (!isEdit) {
        if (!formData.password?.trim()) {
          fieldErrors.password = 'Password wajib diisi';
        } else if (formData.password.length < 8) {
          fieldErrors.password = 'Password minimal 8 karakter';
        }

        if (!formData.password_confirmation?.trim()) {
          fieldErrors.password_confirmation = 'Konfirmasi password wajib diisi';
        } else if (formData.password_confirmation !== formData.password) {
          fieldErrors.password_confirmation = 'Konfirmasi password tidak cocok';
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        setSaving(false);
        setValidationErrors(fieldErrors);
        return;
      }

      const validation = userService.validateUserData(payload);
      if (!validation.isValid) {
        setSaving(false);
        setValidationErrors(validation.errors);
        return;
      }

      const requestData = { ...payload };

      if (isEdit) {
        delete requestData.password;
        delete requestData.password_confirmation;
        await userService.updateUser(id, requestData);
      } else {
        await userService.createUser(requestData);
      }

      setSaving(false);
      setPasswordSuccess('Data pengguna berhasil disimpan.');
      navigate('/users');
    } catch (err) {
      setSaving(false);
      console.error('Error saving user:', err);
      if (err.message && err.message.includes('Validation')) {
        try {
          const payload = JSON.parse(err.message.split(': ')[1]);
          setValidationErrors(payload.errors || {});
        } catch {
          setError(err.message);
        }
      } else {
        setError(err.message || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} pengguna`);
      }
    }
  };

  const handleChangePassword = async () => {
    if (!isEdit || !id) return;

    const errors = {};
    if (!passwordForm.new_password?.trim()) {
      errors.new_password = 'Password baru wajib diisi';
    } else if (passwordForm.new_password.length < 8) {
      errors.new_password = 'Password minimal 8 karakter';
    }

    if (!passwordForm.confirm_password?.trim()) {
      errors.confirm_password = 'Konfirmasi password wajib diisi';
    } else if (passwordForm.confirm_password !== passwordForm.new_password) {
      errors.confirm_password = 'Konfirmasi password tidak cocok';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordSuccess('');
      setPasswordErrorMessage('');

      await userService.changePassword(id, {
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });

      setPasswordSuccess('Password pengguna berhasil diperbarui.');
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordErrorMessage(err.message || 'Gagal mengubah password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CSpinner color="primary" />
          <div className="mt-3 text-medium-emphasis">Memuat data pengguna...</div>
        </CCardBody>
      </CCard>
    );
  }

  if (!hasPermission(isEdit ? PERMISSIONS.USERS_UPDATE : PERMISSIONS.USERS_CREATE)) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CAlert color="danger" className="mb-3">
            Akses ditolak: Anda tidak memiliki izin untuk {isEdit ? 'mengubah' : 'menambahkan'} pengguna.
          </CAlert>
          <CButton color="primary" onClick={() => navigate('/users')}>
            <CIcon icon={cilArrowLeft} className="me-2" />
            Kembali ke pengguna
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <CBreadcrumb className="px-0 mb-3">
        <CBreadcrumbItem>
          <Link to="/users">Pengguna</Link>
        </CBreadcrumbItem>
        <CBreadcrumbItem active>{isEdit ? 'Edit Pengguna' : 'Pengguna Baru'}</CBreadcrumbItem>
      </CBreadcrumb>

      <div className="user-form-hero mb-4">
        <div className="user-form-hero__content">
          <span className="user-form-hero__eyebrow">Access Control</span>
          <h2 className="user-form-hero__title">{isEdit ? 'Perbarui Pengguna' : 'Tambah Pengguna'}</h2>
          <p className="user-form-hero__subtitle mb-0">
            Pastikan data akun lengkap agar hak akses payroll tetap aman dan mudah diaudit.
          </p>
        </div>
        <div className="user-form-hero__actions">
          <CButton
            color="light"
            variant="outline"
            onClick={() => navigate('/users')}
            disabled={saving}
          >
            <CIcon icon={cilArrowLeft} className="me-2" />
            Kembali
          </CButton>
          <CButton color="light" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <CIcon icon={cilSave} className="me-2" />
                Simpan Pengguna
              </>
            )}
          </CButton>
        </div>
      </div>

      <CRow className="g-4">
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="section-title mb-1">Informasi Pengguna</div>
                  <div className="section-subtitle">
                    Lengkapi identitas utama untuk pengaturan akses.
                  </div>
                </div>
                <div className="hint-badge">
                  <CIcon icon={cilUser} /> Data akun utama
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-4">
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

              {passwordSuccess && (
                <CAlert color="success" className="mb-4">
                  <CIcon icon={cilCheck} className="me-2" />
                  {passwordSuccess}
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                <CRow className="g-3">
                    <CCol md={6}>
                      <CFormLabel htmlFor="firstname">
                        Nama Depan <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama depan"
                        className={validationErrors.firstname ? 'is-invalid' : ''}
                        disabled={saving}
                      />
                      {validationErrors.firstname && (
                        <div className="invalid-feedback">{validationErrors.firstname}</div>
                      )}
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel htmlFor="lastname">
                        Nama Belakang <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama belakang"
                        className={validationErrors.lastname ? 'is-invalid' : ''}
                        disabled={saving}
                      />
                      {validationErrors.lastname && (
                        <div className="invalid-feedback">{validationErrors.lastname}</div>
                      )}
                    </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="email">Email <span className="text-danger">*</span></CFormLabel>
                    <CFormInput
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="pengguna@perusahaan.com"
                      className={validationErrors.email ? 'is-invalid' : ''}
                      disabled={saving}
                    />
                    {validationErrors.email && (
                      <div className="invalid-feedback">{validationErrors.email}</div>
                    )}
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="phone">Telepon</CFormLabel>
                    <CFormInput
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Contoh: +628123456789"
                      className={validationErrors.phone ? 'is-invalid' : ''}
                      disabled={saving}
                    />
                    {validationErrors.phone && (
                      <div className="invalid-feedback">{validationErrors.phone}</div>
                    )}
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="type">Peran <span className="text-danger">*</span></CFormLabel>
                    <CFormSelect
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      disabled={saving}
                    >
                      {USER_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CFormSelect>
                    {validationErrors.type && (
                      <div className="invalid-feedback d-block">{validationErrors.type}</div>
                    )}
                  </CCol>

                  {formData.type === USER_ROLES.USER && (
                    <CCol md={6}>
                      <CFormLabel htmlFor="company_id">Perusahaan</CFormLabel>
                      <CFormSelect
                        id="company_id"
                        name="company_id"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        disabled={saving || loadingCompanies}
                        className={validationErrors.company_id ? 'is-invalid' : ''}
                      >
                        <option value="">Pilih perusahaan</option>
                        {companySelectOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </CFormSelect>
                      {validationErrors.company_id && (
                        <div className="invalid-feedback d-block">{validationErrors.company_id}</div>
                      )}
                    </CCol>
                  )}

                  {!isEdit && (
                    <>
                      <CCol md={6}>
                        <CFormLabel htmlFor="password">
                          Password <span className="text-danger">*</span>
                        </CFormLabel>
                        <CFormInput
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Minimal 8 karakter"
                          className={validationErrors.password ? 'is-invalid' : ''}
                          disabled={saving}
                        />
                        {validationErrors.password && (
                          <div className="invalid-feedback">{validationErrors.password}</div>
                        )}
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel htmlFor="password_confirmation">
                          Konfirmasi Password <span className="text-danger">*</span>
                        </CFormLabel>
                        <CFormInput
                          id="password_confirmation"
                          name="password_confirmation"
                          type="password"
                          value={formData.password_confirmation}
                          onChange={handleInputChange}
                          placeholder="Ulangi password"
                          className={validationErrors.password_confirmation ? 'is-invalid' : ''}
                          disabled={saving}
                        />
                        {validationErrors.password_confirmation && (
                          <div className="invalid-feedback">{validationErrors.password_confirmation}</div>
                        )}
                      </CCol>
                    </>
                  )}

                  <CCol md={6}>
                    <CFormLabel className="d-block">Status Akun</CFormLabel>
                    <CFormCheck
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      label={formData.is_active ? 'Pengguna aktif' : 'Pengguna nonaktif'}
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-between mt-4">
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    disabled={saving}
                    onClick={() => navigate('/users')}
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
                        {isEdit ? 'Simpan Perubahan' : 'Simpan Pengguna'}
                      </>
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>

          {isEdit && (
            <CCard className="border-0 shadow-sm">
              <CCardHeader className="bg-white border-0 pb-0">
                <div className="section-title mb-1">Reset Password</div>
                <div className="section-subtitle">Perbarui password pengguna secara manual.</div>
              </CCardHeader>
              <CCardBody>
                {passwordErrorMessage && (
                  <CAlert color="danger" className="mb-3">
                    {passwordErrorMessage}
                  </CAlert>
                )}

                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="new_password">Password Baru</CFormLabel>
                    <CFormInput
                      id="new_password"
                      name="new_password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
                      className={passwordErrors.new_password ? 'is-invalid' : ''}
                    />
                    {passwordErrors.new_password && (
                      <div className="invalid-feedback">{passwordErrors.new_password}</div>
                    )}
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="confirm_password">Konfirmasi Password</CFormLabel>
                    <CFormInput
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
                      className={passwordErrors.confirm_password ? 'is-invalid' : ''}
                    />
                    {passwordErrors.confirm_password && (
                      <div className="invalid-feedback">{passwordErrors.confirm_password}</div>
                    )}
                  </CCol>
                </CRow>

                <div className="mt-4 d-flex justify-content-end">
                  <CButton
                    color="primary"
                    variant="outline"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilCheck} className="me-2" />
                        Perbarui Password
                      </>
                    )}
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          )}
        </CCol>

        <CCol lg={4}>
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-white border-0 pb-0">
              <div className="section-title mb-1">Panduan Data</div>
              <div className="section-subtitle">Tips singkat agar data siap audit.</div>
            </CCardHeader>
            <CCardBody>
              <ul className="text-medium-emphasis small mb-0">
                <li>Pastikan email unik dan aktif.</li>
                <li>Peran menentukan hak akses pengguna.</li>
                <li>Hubungkan ke perusahaan jika pengguna adalah member.</li>
                <li>Nonaktifkan pengguna bila akses sementara tidak dibutuhkan.</li>
              </ul>
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-white border-0 pb-0">
              <div className="section-title mb-1">Ringkasan Hak Akses</div>
              <div className="section-subtitle">Informasi cepat mengenai level akses.</div>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex align-items-start gap-3">
                <div className="text-primary">
                  <CIcon icon={cilShieldAlt} size="lg" />
                </div>
                <div className="small text-medium-emphasis">
                  {userRoleLabel === 'Administrator'
                    ? 'Administrator memiliki akses penuh terhadap modul pengguna, payroll, dan konfigurasi.'
                    : 'Member hanya dapat mengakses fitur yang berkaitan dengan aktivitas sehari-hari.'}
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default UserForm;
