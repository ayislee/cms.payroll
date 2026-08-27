// ========================================
// COMPONENT LIST PAGE
// ========================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CButtonGroup,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CWidgetStatsA,
  CForm,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormSelect
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSettings,
  cilPlus,
  cilInfo,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilReload,
  cilCheckCircle,
  cilXCircle,
  cilList,
  cilFilter
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { PERMISSIONS } from '../../../constants/userRoles';
import componentService from '../services/componentService';
import { formatNumber } from '../../../utils/formatters';
import { readSessionFilter, writeSessionFilter } from '../../../utils/filterPersistence';

const COMPONENT_FILTER_STORAGE_KEY = 'cms.payroll.filters.components';

const createDefaultComponentFilters = () => ({
  search: '',
  type: 'all',
  status: 'all',
  category: 'all'
});

const COMPONENT_TYPE_FILTERS = ['all', 'Earning', 'Deduction'];
const COMPONENT_STATUS_FILTERS = ['all', 'active', 'inactive'];

const readComponentFilters = () =>
  readSessionFilter(COMPONENT_FILTER_STORAGE_KEY, createDefaultComponentFilters(), (filters, fallback) => ({
    search: String(filters.search || ''),
    type: COMPONENT_TYPE_FILTERS.includes(filters.type) ? filters.type : fallback.type,
    status: COMPONENT_STATUS_FILTERS.includes(filters.status) ? filters.status : fallback.status,
    category: String(filters.category || fallback.category)
  }));

const ComponentList = () => {
  const { hasPermission } = useAuth();
  useDocumentTitle('Payroll Components');
  const persistedFilters = useMemo(() => readComponentFilters(), []);

  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => persistedFilters.search);
  const [typeFilter, setTypeFilter] = useState(() => persistedFilters.type);
  const [statusFilter, setStatusFilter] = useState(() => persistedFilters.status);
  const [categoryFilter, setCategoryFilter] = useState(() => persistedFilters.category);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const response = await componentService.getComponents();
      setComponents(response.data || []);
      setError('');
    } catch (error) {
      setSuccess('');
      setError(error.message || 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (component) => {
    setComponentToDelete(component);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!componentToDelete) return;

    try {
      setDeleting(true);
      const response = await componentService.deleteComponent(componentToDelete.main_component_id);
      setShowDeleteModal(false);
      setComponentToDelete(null);
      setError('');
      setSuccess(response.message || 'Component deleted successfully');
      await loadComponents(); // Reload data
    } catch (error) {
      setSuccess('');
      setError(error.message || 'Failed to delete component');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    writeSessionFilter(COMPONENT_FILTER_STORAGE_KEY, {
      search: searchTerm,
      type: typeFilter,
      status: statusFilter,
      category: categoryFilter
    });
  }, [categoryFilter, searchTerm, statusFilter, typeFilter]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      components.map((component) => component.category).filter(Boolean)
    );
    return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b));
  }, [components]);

  useEffect(() => {
    if (categoryFilter !== 'all' && categories.length > 0 && !categories.includes(categoryFilter)) {
      setCategoryFilter('all');
    }
  }, [categories, categoryFilter]);

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const matchesSearch =
        !searchTerm ||
        `${component.name || ''} ${component.code || ''} ${component.description || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === 'all' || (component.type || '').toLowerCase() === typeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && component.is_active) ||
        (statusFilter === 'inactive' && !component.is_active);

      const matchesCategory =
        categoryFilter === 'all' ||
        (component.category || '').toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });
  }, [components, searchTerm, typeFilter, statusFilter, categoryFilter]);

  const componentStats = useMemo(() => {
    const total = components.length;
    const active = components.filter((component) => component.is_active).length;
    const inactive = total - active;
    const earning = components.filter((component) => component.type === 'Earning').length;
    const deduction = components.filter((component) => component.type === 'Deduction').length;

    return {
      total,
      active,
      inactive,
      earning,
      deduction
    };
  }, [components]);

  const resetFilters = () => {
    const defaultFilters = createDefaultComponentFilters();
    setSearchTerm(defaultFilters.search);
    setTypeFilter(defaultFilters.type);
    setStatusFilter(defaultFilters.status);
    setCategoryFilter(defaultFilters.category);
    writeSessionFilter(COMPONENT_FILTER_STORAGE_KEY, defaultFilters);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Memuat daftar komponen...</span>
      </div>
    );
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 border-0 shadow-sm">
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  <h4 className="mb-0">
                    <CIcon icon={cilSettings} className="me-2" />
                    Payroll Components
                  </h4>
                  <p className="text-medium-emphasis mb-0">
                    Kelola komponen perhitungan payroll dengan ringkas dan mudah diatur.
                  </p>
                </CCol>
                <CCol xs="auto">
                  <CButtonGroup>
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={loadComponents}
                      disabled={loading}
                    >
                      <CIcon icon={cilReload} className={loading ? 'spin' : ''} />
                      {loading ? ' Memuat...' : ' Refresh'}
                    </CButton>
                    {hasPermission(PERMISSIONS.COMPONENTS_CREATE) && (
                      <Link to="/components/create">
                        <CButton color="primary">
                          <CIcon icon={cilPlus} className="me-1" />
                          Tambah Komponen
                        </CButton>
                      </Link>
                    )}
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody className="pt-4">
              {error && (
                <CAlert color="danger" className="mb-4">
                  {error}
                </CAlert>
              )}

              {success && (
                <CAlert color="success" className="mb-4">
                  {success}
                </CAlert>
              )}

              <CRow className="g-3 mb-4">
                <CCol sm={6} xl={3}>
                  <CWidgetStatsA
                    color="primary"
                    className="h-100 shadow-sm"
                    value={formatNumber(componentStats.total)}
                    title="Total Komponen"
                    action={<CIcon icon={cilList} height={48} className="text-white-50" />}
                  />
                </CCol>
                <CCol sm={6} xl={3}>
                  <CWidgetStatsA
                    color="success"
                    className="h-100 shadow-sm"
                    value={formatNumber(componentStats.active)}
                    title="Aktif"
                    action={<CIcon icon={cilCheckCircle} height={48} className="text-white-50" />}
                  />
                </CCol>
                <CCol sm={6} xl={3}>
                  <CWidgetStatsA
                    color="danger"
                    className="h-100 shadow-sm"
                    value={formatNumber(componentStats.inactive)}
                    title="Tidak Aktif"
                    action={<CIcon icon={cilXCircle} height={48} className="text-white-50" />}
                  />
                </CCol>
                <CCol sm={6} xl={3}>
                  <CWidgetStatsA
                    color="info"
                    className="h-100 shadow-sm"
                    value={`${formatNumber(componentStats.earning)} / ${formatNumber(componentStats.deduction)}`}
                    title="Earning / Deduction"
                    action={<CIcon icon={cilFilter} height={48} className="text-white-50" />}
                  />
                </CCol>
              </CRow>

              <CCard className="border-0 shadow-sm mb-4">
                <CCardHeader className="bg-light">
                  <CIcon icon={cilFilter} className="me-2" />
                  Filter & Pencarian
                </CCardHeader>
                <CCardBody>
                  <CForm>
                    <CRow className="g-3 align-items-end">
                      <CCol lg={4}>
                        <label className="form-label">Pencarian</label>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilMagnifyingGlass} />
                          </CInputGroupText>
                          <CFormInput
                            placeholder="Cari nama, kode, atau deskripsi..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                          />
                        </CInputGroup>
                      </CCol>
                      <CCol lg={3}>
                        <label className="form-label">Tipe Komponen</label>
                        <CFormSelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                          <option value="all">Semua Tipe</option>
                          <option value="Earning">Earning</option>
                          <option value="Deduction">Deduction</option>
                        </CFormSelect>
                      </CCol>
                      <CCol lg={3}>
                        <label className="form-label">Status</label>
                        <CFormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                          <option value="all">Semua Status</option>
                          <option value="active">Aktif</option>
                          <option value="inactive">Tidak Aktif</option>
                        </CFormSelect>
                      </CCol>
                      <CCol lg={2}>
                        <label className="form-label">Kategori</label>
                        <CFormSelect
                          value={categoryFilter}
                          onChange={(event) => setCategoryFilter(event.target.value)}
                        >
                          <option value="all">Semua</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                      <CCol xs="auto">
                        <CButton color="secondary" variant="outline" className="mt-3" onClick={resetFilters}>
                          Reset Filter
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              <CTable responsive hover align="middle" className="mb-0">
                <CTableHead className="text-medium-emphasis">
                  <CTableRow>
                    <CTableHeaderCell width="60">ID</CTableHeaderCell>
                    <CTableHeaderCell>Kode</CTableHeaderCell>
                    <CTableHeaderCell>Nama Komponen</CTableHeaderCell>
                    <CTableHeaderCell>Tipe</CTableHeaderCell>
                    <CTableHeaderCell>Kategori</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell width="120">Aksi</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredComponents.length > 0 ? (
                    filteredComponents.map((component) => (
                      <CTableRow key={component.main_component_id}>
                        <CTableDataCell>
                          <CBadge color="info">#{component.main_component_id}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{component.code}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{component.name}</strong>
                          {component.description && (
                            <div className="small text-muted">{component.description}</div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={component.type === 'Earning' ? 'success' : 'danger'}>
                            {component.type}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="secondary">{component.category}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={component.is_active ? 'success' : 'secondary'}>
                            {component.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <Link to={`/components/${component.main_component_id}`}>
                              <CButton color="info" variant="outline" size="sm" title="Lihat Detail">
                                <CIcon icon={cilInfo} />
                              </CButton>
                            </Link>
                            {hasPermission(PERMISSIONS.COMPONENTS_UPDATE) && (
                              <Link to={`/components/${component.main_component_id}/edit`}>
                                <CButton color="warning" variant="outline" size="sm" title="Ubah Komponen">
                                  <CIcon icon={cilPencil} />
                                </CButton>
                              </Link>
                            )}
                            {hasPermission(PERMISSIONS.COMPONENTS_DELETE) && (
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                title="Hapus Komponen"
                                onClick={() => handleDelete(component)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            )}
                          </CButtonGroup>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center py-4">
                        <div className="text-medium-emphasis">
                          Tidak ada komponen yang sesuai dengan filter saat ini.
                          <br />
                          {hasPermission(PERMISSIONS.COMPONENTS_CREATE) && (
                            <Link to="/components/create">
                              <CButton color="primary" size="sm" className="mt-2">
                                Tambah Komponen Pertama
                              </CButton>
                            </Link>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Konfirmasi Hapus</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {componentToDelete && (
            <>
              Apakah Anda yakin ingin menghapus komponen:
              <br />
              <strong>{componentToDelete.name}</strong> ({componentToDelete.code})?
              <br />
              <br />
              <small className="text-danger">
                Tindakan ini tidak dapat dibatalkan dan berpotensi mempengaruhi perhitungan payroll yang berjalan.
              </small>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Batal
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <CSpinner size="sm" className="me-2" />
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

export default ComponentList;
