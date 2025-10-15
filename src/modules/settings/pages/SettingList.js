// ========================================
// SYSTEM SETTINGS PAGE (ADMIN)
// ========================================

import React, { useEffect, useMemo, useState } from 'react';
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
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormSwitch,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CPagination,
  CPaginationItem,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCheckCircle,
  cilClipboard,
  cilPencil,
  cilPlus,
  cilReload,
  cilSearch,
  cilSettings,
  cilTrash,
  cilXCircle,
} from '@coreui/icons';

import { useAuth } from '../../../hooks/useAuth';
import { PERMISSIONS } from '../../../constants/userRoles';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDateTime, truncateText } from '../../../utils/formatters';
import settingService from '../services/settingService';
import config from '../../../config/environment';

const pageStyles = `
  .settings-hero {
    position: relative;
    border-radius: 20px;
    padding: 36px;
    color: #fff;
    overflow: hidden;
    background: linear-gradient(135deg, #0f172a 0%, #1e40af 45%, #3b82f6 100%);
  }

  .settings-hero::before,
  .settings-hero::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    filter: blur(0);
    opacity: 0.25;
  }

  .settings-hero::before {
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 65%);
    top: -120px;
    right: -140px;
  }

  .settings-hero::after {
    width: 260px;
    height: 260px;
    background: radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%);
    bottom: -120px;
    left: -120px;
  }

  .settings-hero__content {
    position: relative;
    z-index: 2;
    max-width: 540px;
  }

  .settings-stat-card {
    border-radius: 18px;
    border: 1px solid rgba(14, 116, 144, 0.1);
    padding: 20px;
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.88);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .settings-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 30px rgba(15, 23, 42, 0.12);
  }

  .settings-form__grid {
    display: grid;
    gap: 1rem;
  }

  .settings-form__grid > .span-2 {
    grid-column: span 1;
  }

  @media (min-width: 768px) {
    .settings-form__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .settings-form__grid > .span-2 {
      grid-column: span 2;
    }
  }
`;

const pageSizeOptions = config.pagination?.pageSizeOptions ?? [5, 10, 25, 50, 100];
const defaultPageSize = config.pagination?.defaultRows ?? 10;

const getSettingId = (setting) => setting?.id ?? setting?.setting_id ?? setting?.uuid;
const isSettingActive = (setting) =>
  setting?.is_active === true ||
  setting?.is_active === 1 ||
  setting?.is_active === '1' ||
  setting?.is_active === 'true';

const SettingList = () => {
  const { hasPermission } = useAuth();
  useDocumentTitle('System Settings');

  const [settings, setSettings] = useState([]);
  const [meta, setMeta] = useState({ total: 0, per_page: defaultPageSize, current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  const authorized = hasPermission(PERMISSIONS.SYSTEM_SETTINGS);

  const stats = useMemo(() => {
    const total = Number(meta?.total ?? settings.length ?? 0);
    const active = settings.filter((item) => isSettingActive(item)).length;
    return {
      total,
      active,
      inactive: Math.max(total - active, 0),
    };
  }, [settings, meta]);

  const totalPages = Math.max(
    1,
    Number(
      meta?.last_page ??
        (meta?.total
          ? Math.ceil(Number(meta.total) / (rowsPerPage || 1))
          : 1)
    )
  );

  const paginationItems = useMemo(() => {
    const pages = [];
    const maxButtons = 5;

    if (!totalPages) {
      return pages;
    }

    if (totalPages <= maxButtons) {
      for (let page = 1; page <= totalPages; page += 1) {
        pages.push(page);
      }
      return pages;
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const summaryText = useMemo(() => {
    const total = Number(meta?.total ?? 0);
    if (total === 0 || settings.length === 0) {
      return 'Tidak ada data pengaturan';
    }

    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = start + settings.length - 1;

    return `Menampilkan ${start}-${Math.min(end, total)} dari ${total} pengaturan sistem`;
  }, [meta, currentPage, rowsPerPage, settings.length]);

  const resetFormState = () => {
    setFormData({
      key: '',
      value: '',
      description: '',
      is_active: true,
    });
    setFormErrors({});
    setSuccessMessage('');
    setEditingSetting(null);
    setFormLoading(false);
  };

  const loadSettings = async ({
    page = currentPage,
    perPage = rowsPerPage,
    search = searchTerm,
    status = statusFilter,
  } = {}) => {
    if (!authorized) return;

    try {
      setLoading(true);
      setError('');

      const filters = {
        search: search?.trim() || undefined,
        is_active:
          status === ''
            ? undefined
            : status === 'active'
              ? 1
              : status === 'inactive'
                ? 0
                : undefined,
        per_page: perPage,
        page,
      };

      const response = await settingService.getSettings(filters);
      const fetchedData = Array.isArray(response?.data) ? response.data : [];
      const metaRaw = response?.meta || {};
      const totalValue = Number(metaRaw.total ?? fetchedData.length ?? 0);
      const perPageValue =
        Number(metaRaw.per_page ?? metaRaw.perPage ?? perPage ?? fetchedData.length ?? defaultPageSize) ||
        defaultPageSize;
      const currentPageValue = Number(metaRaw.current_page ?? metaRaw.page ?? page ?? 1) || 1;
      const lastPageValue =
        Number(metaRaw.last_page ?? metaRaw.lastPage) ||
        Math.max(1, Math.ceil(totalValue / (perPageValue || defaultPageSize)));

      const normalizedMeta = {
        total: totalValue,
        per_page: perPageValue,
        current_page: currentPageValue,
        last_page: lastPageValue,
      };

      setSettings(fetchedData);
      setMeta(normalizedMeta);

      if (normalizedMeta.current_page && normalizedMeta.current_page !== currentPage) {
        setCurrentPage(normalizedMeta.current_page);
      }

      if (normalizedMeta.per_page && normalizedMeta.per_page !== rowsPerPage) {
        setRowsPerPage(normalizedMeta.per_page);
      }

      setLastLoadedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Gagal memuat data pengaturan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const targetPage = 1;
    setCurrentPage(targetPage);
    loadSettings({ page: targetPage, perPage: rowsPerPage, search: searchTerm, status: statusFilter });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSuccessMessage('');
    const targetPage = 1;
    setCurrentPage(targetPage);
    loadSettings({ page: targetPage, perPage: rowsPerPage, search: '', status: '' });
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    loadSettings({ page, perPage: rowsPerPage });
  };

  const handlePerPageChange = (event) => {
    const value = Number(event.target.value) || defaultPageSize;
    if (value === rowsPerPage) return;
    setRowsPerPage(value);
    const targetPage = 1;
    setCurrentPage(targetPage);
    loadSettings({ page: targetPage, perPage: value });
  };

  const openCreateModal = () => {
    resetFormState();
    setShowFormModal(true);
  };

  const openEditModal = async (setting) => {
    const settingId = getSettingId(setting);
    if (!settingId) return;

    resetFormState();
    setFormLoading(true);
    setEditingSetting(setting);
    setShowFormModal(true);

    try {
      const detail = await settingService.getSettingById(settingId);
      const data = detail?.data || detail || {};
      setFormData({
        key: data.key || '',
        value: data.value ?? '',
        description: data.description || '',
        is_active: isSettingActive(data),
      });
    } catch (err) {
      setFormErrors({ submit: err.message || 'Gagal mengambil detail pengaturan' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormErrors((prev) => ({ ...prev, [field]: undefined, submit: undefined }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');

    const validation = settingService.validateSetting(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setFormSubmitting(true);
      setFormErrors({});

      if (editingSetting) {
        await settingService.updateSetting(getSettingId(editingSetting), formData);
        setSuccessMessage('Pengaturan berhasil diperbarui');
      } else {
        await settingService.createSetting(formData);
        setSuccessMessage('Pengaturan baru berhasil ditambahkan');
      }

      setShowFormModal(false);
      await loadSettings();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Gagal menyimpan data pengaturan' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (setting) => {
    const settingId = getSettingId(setting);
    if (!settingId) return;

    try {
      setToggleLoadingId(settingId);
      await settingService.toggleSettingStatus(settingId);
      await loadSettings();
      setSuccessMessage('Status pengaturan berhasil diperbarui');
    } catch (err) {
      setError(err.message || 'Gagal memperbarui status pengaturan');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleDelete = (setting) => {
    setSettingToDelete(setting);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!settingToDelete) return;
    const settingId = getSettingId(settingToDelete);
    if (!settingId) return;

    try {
      setDeleting(true);
      await settingService.deleteSetting(settingId);
      setShowDeleteModal(false);
      setSettingToDelete(null);
      await loadSettings();
      setSuccessMessage('Pengaturan berhasil dihapus');
    } catch (err) {
      setError(err.message || 'Gagal menghapus pengaturan');
    } finally {
      setDeleting(false);
    }
  };

  if (!authorized) {
    return (
      <CAlert color='danger' className='border-0 shadow-sm'>
        Anda tidak memiliki akses ke halaman pengaturan sistem.
      </CAlert>
    );
  }

  return (
    <>
      <style>{pageStyles}</style>

      <CRow className='mb-4'>
        <CCol xs={12}>
          <div className='settings-hero'>
            <div className='settings-hero__content'>
              <span className='text-uppercase text-white-50 fw-semibold mb-2 d-inline-flex align-items-center gap-2'>
                <CIcon icon={cilSettings} /> Administrative Console
              </span>
              <h2 className='fw-semibold mb-2'>System Settings Control Center</h2>
              <p className='mb-0 text-white-50'>
                Kelola konfigurasi inti aplikasi payroll Anda secara terpusat. Pastikan setiap
                parameter selalu terkini, terstandarisasi, dan terdokumentasi dengan baik.
              </p>
            </div>
          </div>
        </CCol>
      </CRow>

      <CRow className='mb-4'>
        <CCol md={4} className='mb-3 mb-md-0'>
          <CCard className='settings-stat-card shadow-sm h-100'>
            <CCardBody>
              <div className='d-flex align-items-center justify-content-between mb-3'>
                <div>
                  <small className='text-muted text-uppercase fw-semibold'>Total Setting</small>
                  <h3 className='mb-0 fw-bold'>{stats.total}</h3>
                </div>
                <div className='rounded-circle bg-primary bg-opacity-10 p-3'>
                  <CIcon icon={cilClipboard} className='text-primary' size='lg' />
                </div>
              </div>
              <p className='text-medium-emphasis small mb-0'>
                Semua konfigurasi sistem yang tersedia saat ini.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4} className='mb-3 mb-md-0'>
          <CCard className='settings-stat-card shadow-sm h-100'>
            <CCardBody>
              <div className='d-flex align-items-center justify-content-between mb-3'>
                <div>
                  <small className='text-muted text-uppercase fw-semibold'>Aktif</small>
                  <h3 className='mb-0 fw-bold text-success'>{stats.active}</h3>
                </div>
                <div className='rounded-circle bg-success bg-opacity-10 p-3'>
                  <CIcon icon={cilCheckCircle} className='text-success' size='lg' />
                </div>
              </div>
              <p className='text-medium-emphasis small mb-0'>
                Pengaturan yang sedang aktif dan digunakan dalam sistem.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className='settings-stat-card shadow-sm h-100'>
            <CCardBody>
              <div className='d-flex align-items-center justify-content-between mb-3'>
                <div>
                  <small className='text-muted text-uppercase fw-semibold'>Nonaktif</small>
                  <h3 className='mb-0 fw-bold text-danger'>{stats.inactive}</h3>
                </div>
                <div className='rounded-circle bg-danger bg-opacity-10 p-3'>
                  <CIcon icon={cilXCircle} className='text-danger' size='lg' />
                </div>
              </div>
              <p className='text-medium-emphasis small mb-0'>
                Pengaturan yang dinonaktifkan tetapi tetap tersimpan untuk referensi.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className='shadow-sm border-0 mb-4'>
        <CCardHeader className='bg-white border-0 pb-0'>
          <CRow className='align-items-center'>
            <CCol>
              <h4 className='fw-semibold mb-2'>Daftar Pengaturan Sistem</h4>
              <p className='text-medium-emphasis mb-0'>
                Telusuri, ubah, dan dokumentasikan konfigurasi sistem dengan aman.
              </p>
            </CCol>
            <CCol xs='auto'>
              <CButtonGroup role='group'>
                <CButton color='secondary' variant='outline' onClick={loadSettings} disabled={loading}>
                  {loading ? (
                    <>
                      <CSpinner size='sm' className='me-2' />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilReload} className='me-2' />
                      Refresh
                    </>
                  )}
                </CButton>
                <CButton color='primary' onClick={openCreateModal}>
                  <CIcon icon={cilPlus} className='me-2' />
                  Pengaturan Baru
                </CButton>
              </CButtonGroup>
            </CCol>
          </CRow>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color='danger' className='mb-4 border-0 shadow-sm'>
              {error}
            </CAlert>
          )}

          {successMessage && (
            <CAlert
              color='success'
              className='mb-4 border-0 shadow-sm'
              onClose={() => setSuccessMessage('')}
              dismissible
            >
              {successMessage}
            </CAlert>
          )}

          <CForm onSubmit={handleSearchSubmit} className='mb-4'>
            <CRow className='g-3 align-items-end'>
              <CCol md={6}>
                <CFormLabel htmlFor='search-setting' className='text-medium-emphasis'>
                  Cari berdasarkan key atau deskripsi
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText className='bg-light'>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    id='search-setting'
                    placeholder='Contoh: payroll.cutoff_date'
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </CInputGroup>
              </CCol>
              <CCol md={3}>
                <CFormLabel htmlFor='status-filter' className='text-medium-emphasis'>
                  Status
                </CFormLabel>
                <select
                  id='status-filter'
                  className='form-select'
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value=''>Semua status</option>
                  <option value='active'>Aktif</option>
                  <option value='inactive'>Nonaktif</option>
                </select>
              </CCol>
              <CCol md={3} className='text-md-end'>
                <CButton type='submit' color='primary' className='me-2'>
                  Terapkan
                </CButton>
                <CButton color='secondary' variant='outline' onClick={handleResetFilters}>
                  Reset
                </CButton>
              </CCol>
            </CRow>
          </CForm>

          <div className='table-responsive'>
            <CTable align='middle' hover responsive className='mb-0'>
              <CTableHead color='light'>
                <CTableRow>
                  <CTableHeaderCell style={{ width: '18%' }}>Key</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '22%' }}>Value</CTableHeaderCell>
                  <CTableHeaderCell>Description</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '12%' }}>Status</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '15%' }}>Terakhir Diperbarui</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '14%' }} className='text-end'>
                    Aksi
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className='text-center py-5'>
                      <CSpinner color='primary' />
                      <p className='mt-3 mb-0 text-medium-emphasis'>Mengambil data pengaturan...</p>
                    </CTableDataCell>
                  </CTableRow>
                ) : settings.length > 0 ? (
                  settings.map((setting) => {
                    const settingId = getSettingId(setting);
                    const active = isSettingActive(setting);
                    return (
                      <CTableRow key={settingId}>
                        <CTableDataCell>
                          <span className='fw-semibold text-dark'>{setting?.key}</span>
                        </CTableDataCell>
                        <CTableDataCell>
                          <span
                            className='text-break'
                            title={String(setting?.value ?? '')}
                          >
                            {truncateText(String(setting?.value ?? ''), 50)}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small
                            className='text-medium-emphasis'
                            title={setting?.description || undefined}
                          >
                            {setting?.description || <span className='fst-italic'>Belum ada deskripsi</span>}
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={active ? 'success' : 'secondary'} className='px-3 py-2 rounded-pill'>
                            {active ? 'Active' : 'Inactive'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small className='text-medium-emphasis d-block'>
                            {formatDateTime(setting?.updated_at || setting?.created_at)}
                          </small>
                          {setting?.updated_by && (
                            <small className='text-muted'>oleh {setting.updated_by}</small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className='text-end'>
                          <CButtonGroup size='sm'>
                            <CButton
                              type='button'
                              color='info'
                              variant='outline'
                              onClick={() => openEditModal(setting)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton
                              type='button'
                              color={active ? 'secondary' : 'success'}
                              variant='outline'
                              disabled={toggleLoadingId === settingId}
                              onClick={() => handleToggleStatus(setting)}
                            >
                              {toggleLoadingId === settingId ? (
                                <CSpinner size='sm' />
                              ) : (
                                <CIcon icon={active ? cilXCircle : cilCheckCircle} />
                              )}
                            </CButton>
                            <CButton
                              type='button'
                              color='danger'
                              variant='outline'
                              onClick={() => handleDelete(setting)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CButtonGroup>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className='text-center py-5'>
                      <div className='py-4'>
                        <CIcon icon={cilSettings} size='xl' className='text-medium-emphasis mb-3' />
                        <div className='fw-semibold mb-1'>Belum ada data pengaturan</div>
                        <small className='text-medium-emphasis d-block mb-3'>
                          Tambahkan pengaturan baru untuk menstandarisasi konfigurasi sistem Anda.
                        </small>
                        <CButton color='primary' onClick={openCreateModal}>
                          Tambah Pengaturan Pertama
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </div>

          {!loading && (
            <div className='d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4'>
              <div className='text-medium-emphasis small'>
                <div>{summaryText}</div>
                <div>
                  Terakhir dimuat: {lastLoadedAt ? formatDateTime(lastLoadedAt) : '-'}
                </div>
              </div>
              <div className='d-flex flex-wrap align-items-center gap-3'>
                <div className='d-flex align-items-center gap-2 text-medium-emphasis small'>
                  <span>Tampilkan</span>
                  <CFormSelect
                    size='sm'
                    value={rowsPerPage}
                    onChange={handlePerPageChange}
                    style={{ width: '135px' }}
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size} / halaman
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                {totalPages > 1 && (
                  <CPagination className='mb-0'>
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(1)}
                    >
                      Awal
                    </CPaginationItem>
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Sebelumnya
                    </CPaginationItem>
                    {paginationItems.map((page) => (
                      <CPaginationItem
                        key={page}
                        active={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Berikutnya
                    </CPaginationItem>
                    <CPaginationItem
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      Akhir
                    </CPaginationItem>
                  </CPagination>
                )}
              </div>
            </div>
          )}
        </CCardBody>
      </CCard>

      <CModal
        scrollable
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        alignment='center'
        size='lg'
      >
        <CModalHeader className='border-0 pb-0'>
          <CModalTitle className='fw-semibold'>
            {editingSetting ? 'Edit Pengaturan Sistem' : 'Tambah Pengaturan Baru'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {formLoading ? (
            <div className='d-flex align-items-center justify-content-center py-5'>
              <CSpinner color='primary' />
              <span className='ms-2'>Memuat detail pengaturan...</span>
            </div>
          ) : (
            <CForm onSubmit={handleFormSubmit} className='settings-form__grid'>
              <div className='span-2'>
                <CFormLabel htmlFor='setting-key'>Key *</CFormLabel>
                <CFormInput
                  id='setting-key'
                  placeholder='Contoh: payroll.cutoff_date'
                  value={formData.key}
                  onChange={(event) => handleFormChange('key', event.target.value)}
                  disabled={!!editingSetting}
                  invalid={!!formErrors.key}
                />
                {formErrors.key && <div className='text-danger small mt-1'>{formErrors.key}</div>}
              </div>

              <div className='span-2'>
                <CFormLabel htmlFor='setting-value'>Value *</CFormLabel>
                <CFormTextarea
                  id='setting-value'
                  rows={3}
                  placeholder='Masukkan nilai pengaturan'
                  value={formData.value}
                  onChange={(event) => handleFormChange('value', event.target.value)}
                  invalid={!!formErrors.value}
                />
                <small className='text-medium-emphasis d-block mt-1'>
                  Gunakan format JSON jika diperlukan. Sistem akan menyimpan sesuai input Anda.
                </small>
                {formErrors.value && <div className='text-danger small mt-1'>{formErrors.value}</div>}
              </div>

              <div className='span-2'>
                <CFormLabel htmlFor='setting-description'>Deskripsi</CFormLabel>
                <CFormTextarea
                  id='setting-description'
                  rows={2}
                  placeholder='Catatan singkat mengenai fungsi pengaturan ini'
                  value={formData.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                  invalid={!!formErrors.description}
                />
                {formErrors.description && (
                  <div className='text-danger small mt-1'>{formErrors.description}</div>
                )}
              </div>

              <div className='span-2'>
                <CFormLabel className='mb-2 d-block'>Status Pengaturan</CFormLabel>
                <CFormSwitch
                  id='setting-active'
                  label={formData.is_active ? 'Active' : 'Inactive'}
                  checked={formData.is_active}
                  onChange={(event) => handleFormChange('is_active', event.target.checked)}
                />
              </div>
              <div className='span-2 text-end'>
                <CButton
                  type='button'
                  color='secondary'
                  variant='outline'
                  className='me-2'
                  onClick={() => setShowFormModal(false)}
                >
                  Batal
                </CButton>
                <CButton type='submit' color='primary' disabled={formSubmitting}>
                  {formSubmitting ? (
                    <>
                      <CSpinner size='sm' className='me-2' />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Pengaturan'
                  )}
                </CButton>
              </div>

              {formErrors.submit && (
                <CAlert color='danger' className='span-2 mt-3 mb-0 border-0'>
                  {formErrors.submit}
                </CAlert>
              )}
            </CForm>
          )}
        </CModalBody>
      </CModal>

      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        alignment='center'
      >
        <CModalHeader>
          <CModalTitle>Konfirmasi Penghapusan</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {settingToDelete ? (
            <>
              Apakah Anda yakin ingin menghapus pengaturan{' '}
              <strong>{settingToDelete.key}</strong>?
              <br />
              <small className='text-medium-emphasis d-block mt-2'>
                Pengaturan ini dapat ditambahkan kembali kapan saja, tetapi tindakan ini tidak dapat dibatalkan.
              </small>
            </>
          ) : (
            'Tidak ada pengaturan yang dipilih.'
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color='secondary'
            variant='outline'
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Batal
          </CButton>
          <CButton color='danger' onClick={confirmDelete} disabled={deleting}>
            {deleting ? (
              <>
                <CSpinner size='sm' className='me-2' />
                Menghapus...
              </>
            ) : (
              'Hapus'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default SettingList;
