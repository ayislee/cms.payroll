// ========================================
// COMPANY LIST PAGE - PROFESSIONAL VERSION
// ========================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormSelect,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilBuilding,
  cilPlus,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilReload,
  cilInfo,
  cilCheckCircle,
  cilXCircle,
  cilClock,
  cilSync
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatDateTime, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../constants/userRoles';
import companyService from '../services/companyService';
import config from '../../../config/environment';

const companyListStyles = `
  .companies-hero {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.5rem;
    padding: 2.5rem;
    background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%);
    color: #fff;
    overflow: hidden;
  }

  .companies-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.35), transparent 60%);
    opacity: 0.7;
    pointer-events: none;
  }

  .companies-hero__content,
  .companies-hero__actions {
    position: relative;
    z-index: 2;
  }

  .companies-hero__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .companies-hero__title {
    font-size: 1.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .companies-hero__subtitle {
    max-width: 540px;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .companies-hero__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .companies-hero__actions .btn {
    border-radius: 999px;
    padding-inline: 1.35rem;
    font-weight: 500;
  }

  .company-stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba(79, 70, 229, 0.08);
    border-radius: 1.1rem;
    padding: 1.25rem 1.5rem;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .company-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
  }

  .company-stat-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.9rem;
    font-size: 1.35rem;
  }

  .company-stat-card__icon--primary {
    background: rgba(99, 102, 241, 0.12);
    color: #4338ca;
  }

  .company-stat-card__icon--success {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  .company-stat-card__icon--warning {
    background: rgba(234, 179, 8, 0.15);
    color: #d97706;
  }

  .company-stat-card__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    font-weight: 600;
    margin-bottom: 0.35rem;
  }

  .company-stat-card__value {
    font-size: 1.85rem;
    font-weight: 600;
    color: #111827;
  }

  .company-stat-card__caption {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .company-filter-card {
    border-radius: 1rem;
    border: 1px solid #e5e7eb;
    background-color: #f9fafb;
    padding: 1.5rem;
  }

  .company-search-container {
    position: relative;
  }

  .company-search-suggestions {
    position: absolute;
    inset: auto 0 0 0;
    transform: translateY(100%);
    margin-top: 0.35rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
    z-index: 1050;
    padding: 0.25rem 0;
  }

  .company-search-suggestion {
    width: 100%;
    border: none;
    background: transparent;
    padding: 0.65rem 1rem;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: #334155;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .company-search-suggestion:hover {
    background-color: #f1f5f9;
  }

  .company-filter-chip {
    border-radius: 999px;
    border: 1px solid transparent;
    background: #ffffff;
    color: #4b5563;
    padding: 0.45rem 1.05rem;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .company-filter-chip:hover {
    background: #eef2ff;
    color: #312e81;
  }

  .company-filter-chip.active {
    color: #ffffff;
    box-shadow: 0 12px 20px rgba(79, 70, 229, 0.25);
  }

  .company-filter-chip.active[data-variant="secondary"] {
    background: #4338ca;
  }

  .company-filter-chip.active[data-variant="success"] {
    background: #059669;
  }

  .company-filter-chip.active[data-variant="danger"] {
    background: #dc2626;
  }

  .companies-table thead {
    background-color: #f5f5ff;
  }

  .companies-table tbody tr:hover {
    background-color: rgba(79, 70, 229, 0.05);
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('company-list-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'company-list-styles';
  styleElement.textContent = companyListStyles;
  document.head.appendChild(styleElement);
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Status', variant: 'secondary' },
  { id: 'active', label: 'Aktif', variant: 'success' },
  { id: 'inactive', label: 'Nonaktif', variant: 'danger' }
];

const SUGGESTION_LIMIT = 6;
const SEARCH_HISTORY_LIMIT = 8;
const SEARCH_HISTORY_STORAGE_KEY = 'cms.payroll.company-search-history';

const CompanyList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  useDocumentTitle('Company Management');

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [rows, setRows] = useState(config.pagination.defaultRows);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchIndex, setSearchIndex] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const [searchHistory, setSearchHistory] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.slice(0, SEARCH_HISTORY_LIMIT) : [];
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify(searchHistory.slice(0, SEARCH_HISTORY_LIMIT))
    );
  }, [searchHistory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    },
    []
  );

  const loadCompanies = useCallback(
    async (page = 1, search = '', status = 'all', rowsOverride) => {
      try {
        setLoading(true);
        setIsSearching(search.trim() !== '');
        setError('');

        const effectiveRows =
          rowsOverride && Number.isFinite(Number(rowsOverride))
            ? Number(rowsOverride)
            : rows;

        const params = {
          page,
          rows: effectiveRows,
          search: search.trim()
        };

        if (status && status !== 'all') {
          params.is_active = status === 'active';
        }

        const response = await companyService.getCompanies(params);
        const formatted = (response.data || []).map((company) =>
          companyService.formatCompanyListItem(company)
        );

        setCompanies(formatted);

        const total = response.total ?? formatted.length ?? 0;
        const perPage = response.perPage ?? effectiveRows;
        const resolvedPage = response.page ?? page;
        const lastPage =
          response.lastPage ?? Math.max(1, Math.ceil(total / (perPage || 1)));

        setTotalCompanies(total);
        setTotalPages(lastPage);
        setCurrentPage(resolvedPage);
        setSearchIndex(companyService.buildSearchIndex(formatted));

        const { latestUpdate } = companyService.calculateSummary(formatted);
        setLastUpdatedAt(latestUpdate || null);
      } catch (err) {
        console.error('Error loading companies:', err);
        setError(err.message || 'Gagal memuat data perusahaan');
        setInfoMessage('');
        setCompanies([]);
        setTotalCompanies(0);
        setTotalPages(1);
        setSearchIndex([]);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [rows]
  );

  useEffect(() => {
    loadCompanies(1);
  }, [loadCompanies]);

  const summaryStats = useMemo(
    () => companyService.calculateSummary(companies),
    [companies]
  );

  const activePercentage = useMemo(() => {
    if (!summaryStats.total) return 0;
    return Math.round((summaryStats.active / summaryStats.total) * 100);
  }, [summaryStats]);

  const inactivePercentage = useMemo(() => {
    if (!summaryStats.total) return 0;
    return 100 - activePercentage;
  }, [summaryStats, activePercentage]);

  const statusFilterLabel = useMemo(() => {
    const current = STATUS_FILTERS.find((filter) => filter.id === statusFilter);
    return current ? current.label.toLowerCase() : 'semua status';
  }, [statusFilter]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return 'Belum ada pembaruan data';
    }

    return `Pembaruan terakhir ${formatDateTime(lastUpdatedAt)}`;
  }, [lastUpdatedAt]);

  const summaryText = useMemo(() => {
    const trimmedSearch = searchTerm.trim();

    if (totalCompanies > 0) {
      const start = (currentPage - 1) * rows + 1;
      const end = Math.min(currentPage * rows, totalCompanies);
      let base = `Menampilkan ${start}-${end} dari ${totalCompanies} perusahaan`;

      if (trimmedSearch) {
        base += ` untuk pencarian "${trimmedSearch}"`;
      }

      if (statusFilter !== 'all') {
        base += ` (status ${statusFilterLabel})`;
      }

      return base;
    }

    if (trimmedSearch) {
      return `Tidak ditemukan perusahaan untuk "${trimmedSearch}"`;
    }

    return 'Belum ada perusahaan yang tercatat';
  }, [currentPage, rows, totalCompanies, searchTerm, statusFilter, statusFilterLabel]);

  const summaryCards = useMemo(
    () => [
      {
        id: 'total',
        label: 'Total Perusahaan',
        value: summaryStats.total,
        caption: 'Seluruh entitas terdaftar',
        icon: cilBuilding,
        tone: 'primary'
      },
      {
        id: 'active',
        label: 'Aktif',
        value: summaryStats.active,
        caption: summaryStats.total
          ? `${activePercentage}% dari total`
          : 'Belum ada data',
        icon: cilCheckCircle,
        tone: 'success'
      },
      {
        id: 'inactive',
        label: 'Nonaktif',
        value: summaryStats.inactive,
        caption: summaryStats.total
          ? `${inactivePercentage}% dari total`
          : 'Belum ada data',
        icon: cilXCircle,
        tone: 'warning'
      }
    ],
    [summaryStats, activePercentage, inactivePercentage]
  );

  const applySearch = useCallback(
    (term) => {
      const trimmed = term.trim();

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      setSearchTerm(trimmed);
      setSearchInput(trimmed);
      setCurrentPage(1);
      setShowSuggestions(false);
      setShowSearchHistory(false);

      if (trimmed) {
        setSearchHistory((previous) => {
          const existingIndex = previous.findIndex(
            (entry) => entry.toLowerCase() === trimmed.toLowerCase()
          );

          const updated =
            existingIndex >= 0
              ? [
                  trimmed,
                  ...previous.filter(
                    (entry) => entry.toLowerCase() !== trimmed.toLowerCase()
                  )
                ]
              : [trimmed, ...previous];

          return updated.slice(0, SEARCH_HISTORY_LIMIT);
        });
      }

      loadCompanies(1, trimmed, statusFilter);
    },
    [loadCompanies, statusFilter]
  );

  const handleSearchInputChange = useCallback(
    (event) => {
      const { value } = event.target;
      setSearchInput(value);
      setShowSearchHistory(false);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      const trimmed = value.trim();

      if (!trimmed) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        searchDebounceRef.current = setTimeout(() => {
          setSearchTerm('');
          loadCompanies(1, '', statusFilter);
        }, 300);
        return;
      }

      const lowerTrimmed = trimmed.toLowerCase();
      const suggestions = searchIndex
        .filter((token) => token.includes(lowerTrimmed))
        .slice(0, SUGGESTION_LIMIT);

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);

      searchDebounceRef.current = setTimeout(() => {
        setSearchTerm(trimmed);
        loadCompanies(1, trimmed, statusFilter);
      }, 400);
    },
    [loadCompanies, searchIndex, statusFilter]
  );

  const handleSearchKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applySearch(searchInput);
      }

      if (event.key === 'Escape') {
        setShowSuggestions(false);
        setShowSearchHistory(false);
      }
    },
    [applySearch, searchInput]
  );

  const handleSearchFocus = useCallback(() => {
    if (searchHistory.length > 0) {
      setShowSearchHistory(true);
    }
  }, [searchHistory.length]);

  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      applySearch(suggestion);
    },
    [applySearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchInput('');
    setShowSuggestions(false);
    setShowSearchHistory(false);
    loadCompanies(1, '', statusFilter);
  }, [loadCompanies, statusFilter]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    setShowSearchHistory(false);
  }, []);

  const handleStatusFilterChange = useCallback(
    (filterId) => {
      if (filterId === statusFilter) return;
      setStatusFilter(filterId);
      setCurrentPage(1);
      loadCompanies(1, searchTerm, filterId);
    },
    [loadCompanies, searchTerm, statusFilter]
  );

  const handleRowsChange = useCallback(
    (value) => {
      const size = Number(value) || config.pagination.defaultRows;
      setRows(size);
      setCurrentPage(1);
      loadCompanies(1, searchTerm, statusFilter, size);
    },
    [loadCompanies, searchTerm, statusFilter]
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      loadCompanies(page, searchTerm, statusFilter);
    },
    [loadCompanies, searchTerm, statusFilter]
  );

  const handleRefresh = useCallback(() => {
    loadCompanies(currentPage, searchTerm, statusFilter, rows);
  }, [currentPage, loadCompanies, rows, searchTerm, statusFilter]);

  const handleDelete = useCallback((company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!companyToDelete) return;

    try {
      setDeleting(true);
      await companyService.deleteCompany(companyToDelete.company_id);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      loadCompanies(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error('Error deleting company:', err);
      setError(err.message || 'Gagal menghapus perusahaan');
    } finally {
      setDeleting(false);
    }
  }, [companyToDelete, currentPage, loadCompanies, searchTerm, statusFilter]);

  const handleToggleStatus = useCallback(
    async (company) => {
      try {
        await companyService.toggleCompanyStatus(company.company_id);
        loadCompanies(currentPage, searchTerm, statusFilter);
      } catch (err) {
        console.error('Error toggling company status:', err);
        setError(err.message || 'Gagal memperbarui status perusahaan');
      }
    },
    [currentPage, loadCompanies, searchTerm, statusFilter]
  );

  const getPaginationItems = useCallback(() => {
    const items = [];
    const maxPages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      items.push(
        <CPaginationItem
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </CPaginationItem>
      );
    }

    return items;
  }, [currentPage, handlePageChange, totalPages]);

  const handleOpenSyncModal = useCallback(() => {
    setShowSyncModal(true);
  }, []);

  const handleCloseSyncModal = useCallback(() => {
    if (!syncing) {
      setShowSyncModal(false);
    }
  }, [syncing]);

  const confirmSync = useCallback(async () => {
    try {
      setSyncing(true);
      setError('');

      await companyService.syncExternalCompanies();

      setShowSyncModal(false);
      setInfoMessage(
        'Sinkronisasi perusahaan sedang diproses. Data akan diperbarui setelah proses backend selesai.'
      );
      loadCompanies(currentPage, searchTerm, statusFilter, rows);
    } catch (err) {
      console.error('Error syncing companies:', err);
      setShowSyncModal(false);
      setError(err.message || 'Gagal melakukan sinkronisasi perusahaan');
    } finally {
      setSyncing(false);
    }
  }, [currentPage, loadCompanies, rows, searchTerm, statusFilter]);

  const canCreateCompany = hasPermission(PERMISSIONS.COMPANIES_CREATE);
  const canUpdateCompany = hasPermission(PERMISSIONS.COMPANIES_UPDATE);
  const canSyncCompanies = canCreateCompany || canUpdateCompany;

  return (
    <>
      <CRow className="mb-4">
        <CCol xs={12}>
          <div className="companies-hero">
            <div className="companies-hero__content">
              <span className="companies-hero__eyebrow">Company Operations</span>
              <h2 className="companies-hero__title">Direktori Perusahaan</h2>
              <p className="companies-hero__subtitle mb-0">
                Kelola master data entitas bisnis agar payroll, legal, dan compliance
                tetap selaras dalam satu sumber kebenaran.
              </p>
            </div>
            <div className="companies-hero__actions">
              <span className="last-updated-indicator text-white-75">
                <CIcon icon={cilClock} className="me-2" />
                {lastUpdatedLabel}
              </span>
              <CButton
                color="light"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <CIcon icon={cilReload} className={loading ? 'spin me-2' : 'me-2'} />
                Muat Ulang
              </CButton>
              {canSyncCompanies && (
                <CButton
                  color="light"
                  variant="outline"
                  onClick={handleOpenSyncModal}
                  disabled={syncing}
                >
                  <CIcon icon={cilSync} className="me-2" />
                  Sinkronisasi
                </CButton>
              )}
              {canCreateCompany && (
                <CButton color="light" onClick={() => navigate('/companies/create')}>
                  <CIcon icon={cilPlus} className="me-2" />
                  Tambah Perusahaan
                </CButton>
              )}
            </div>
          </div>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        {summaryCards.map((card) => (
          <CCol sm={6} lg={4} key={card.id}>
            <div className="company-stat-card h-100">
              <div
                className={`company-stat-card__icon company-stat-card__icon--${card.tone}`}
              >
                <CIcon icon={card.icon} />
              </div>
              <div>
                <div className="company-stat-card__label">{card.label}</div>
                <div className="company-stat-card__value">{card.value}</div>
                <div className="company-stat-card__caption">{card.caption}</div>
              </div>
            </div>
          </CCol>
        ))}
      </CRow>

      <CCard className="mb-4 shadow-sm border-0">
        <CCardHeader className="bg-transparent border-0 pb-0">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Daftar Perusahaan</h4>
              <small className="text-medium-emphasis">{summaryText}</small>
            </div>
            <div className="text-end">
              <small className="text-medium-emphasis">
                {totalCompanies} data • {rows} per halaman
              </small>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" className="mb-4">
              <strong>Terjadi kesalahan:</strong> {error}
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
          {infoMessage && (
            <CAlert color="success" className="mb-4">
              <CIcon icon={cilCheckCircle} className="me-2" />
              {infoMessage}
              <CButton
                color="success"
                variant="outline"
                size="sm"
                className="ms-2"
                onClick={() => setInfoMessage('')}
              >
                Tutup
              </CButton>
            </CAlert>
          )}

          <div className="company-filter-card mb-4">
            <CRow className="align-items-center g-3">
              <CCol lg={6}>
                <div ref={searchContainerRef} className="company-search-container">
                  <CInputGroup>
                    <CInputGroupText className="bg-transparent border-end-0">
                      <CIcon icon={cilMagnifyingGlass} className="text-primary" />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Cari nama, email, atau telepon..."
                      value={searchInput}
                      onChange={handleSearchInputChange}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={handleSearchFocus}
                    />
                    {searchTerm && (
                      <CButton
                        color="light"
                        variant="ghost"
                        onClick={handleClearSearch}
                        className="px-3"
                      >
                        Bersihkan
                      </CButton>
                    )}
                    <CButton
                      color="primary"
                      type="button"
                      onClick={() => applySearch(searchInput)}
                      disabled={loading}
                    >
                      <CIcon icon={cilMagnifyingGlass} className="me-2" />
                      Cari
                    </CButton>
                    {searchHistory.length > 0 && (
                      <div className="search-history-container ms-2">
                        <CDropdown
                          alignment="end"
                          visible={showSearchHistory}
                          onVisibleChange={setShowSearchHistory}
                        >
                          <CDropdownToggle color="light" className="shadow-none px-3">
                            <CIcon icon={cilClock} />
                          </CDropdownToggle>
                          <CDropdownMenu className="w-100">
                            {searchHistory.length > 0 ? (
                              <>
                                {searchHistory.map((historyItem, index) => (
                                  <CDropdownItem
                                    key={`${historyItem}-${index}`}
                                    onClick={() => applySearch(historyItem)}
                                  >
                                    <CIcon
                                      icon={cilMagnifyingGlass}
                                      className="me-2 text-muted"
                                    />
                                    {historyItem}
                                  </CDropdownItem>
                                ))}
                                <CDropdownItem
                                  onClick={clearSearchHistory}
                                  className="text-danger"
                                >
                                  <CIcon icon={cilTrash} className="me-2" />
                                  Hapus Riwayat
                                </CDropdownItem>
                              </>
                            ) : (
                              <CDropdownItem disabled>
                                Belum ada riwayat pencarian
                              </CDropdownItem>
                            )}
                          </CDropdownMenu>
                        </CDropdown>
                      </div>
                    )}
                  </CInputGroup>

                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="company-search-suggestions">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="company-search-suggestion"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <CIcon icon={cilMagnifyingGlass} className="text-muted" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <small className="text-info mt-2 d-inline-flex align-items-center">
                      <CSpinner size="sm" className="me-2" />
                      Mencari data...
                    </small>
                  )}
                </div>
              </CCol>

              <CCol lg={6}>
                <div className="d-flex flex-wrap justify-content-lg-end align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2">
                    {STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`company-filter-chip${
                          statusFilter === filter.id ? ' active' : ''
                        }`}
                        data-variant={filter.variant}
                        onClick={() => handleStatusFilterChange(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="d-flex align-items-center">
                    <small className="me-2 text-medium-emphasis">Tampil:</small>
                    <CFormSelect
                      size="sm"
                      value={rows}
                      onChange={(event) => handleRowsChange(event.target.value)}
                    >
                      {config.pagination.pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size} / halaman
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </div>
              </CCol>
            </CRow>
          </div>

          <CTable responsive hover className="companies-table align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell width="80">ID</CTableHeaderCell>
                <CTableHeaderCell>Perusahaan</CTableHeaderCell>
                <CTableHeaderCell>Kontak</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Timeline</CTableHeaderCell>
                <CTableHeaderCell className="text-end" width="160">
                  Aksi
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading && companies.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-5">
                    <div className="d-inline-flex align-items-center gap-2 text-medium-emphasis">
                      <CSpinner color="primary" />
                      Memuat data perusahaan...
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : companies.length > 0 ? (
                companies.map((company, index) => (
                  <CTableRow key={company.company_id ?? `company-${index}`}>
                    <CTableDataCell>
                      <CBadge color="primary" className="fs-6">
                        #{company.company_id ?? '–'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="fw-semibold text-dark">{company.name}</div>
                      <div className="text-medium-emphasis">
                        {company.address ? (
                          <small>
                            {company.address.length > 70
                              ? `${company.address.substring(0, 70)}...`
                              : company.address}
                          </small>
                        ) : (
                          <small className="fst-italic">Alamat belum diisi</small>
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div>
                        <small className="d-block text-dark">
                          {company.email || (
                            <span className="text-medium-emphasis">Email belum diisi</span>
                          )}
                        </small>
                        <small className="text-medium-emphasis">
                          {formatPhoneNumber(company.phone) || 'Telepon belum diisi'}
                        </small>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={company.is_active ? 'success' : 'danger'}>
                        <CIcon
                          icon={company.is_active ? cilCheckCircle : cilXCircle}
                          className="me-1"
                        />
                        {company.is_active ? 'Aktif' : 'Nonaktif'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div>
                        <small className="d-block text-medium-emphasis">
                          Dibuat: {formatDate(company.created_at)}
                        </small>
                        <small className="text-medium-emphasis">
                          Diperbarui: {formatDateTime(company.updated_at || company.created_at)}
                        </small>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButtonGroup size="sm">
                        <Link to={`/companies/${company.company_id}`}>
                          <CButton color="info" variant="outline" title="Lihat detail">
                            <CIcon icon={cilInfo} />
                          </CButton>
                        </Link>
                        {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                          <Link to={`/companies/${company.company_id}/edit`}>
                            <CButton color="warning" variant="outline" title="Ubah data">
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </Link>
                        )}
                        {hasPermission(PERMISSIONS.COMPANIES_UPDATE) && (
                          <CButton
                            color={company.is_active ? 'secondary' : 'success'}
                            variant="outline"
                            title={company.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            onClick={() => handleToggleStatus(company)}
                          >
                            <CIcon icon={company.is_active ? cilXCircle : cilCheckCircle} />
                          </CButton>
                        )}
                        {hasPermission(PERMISSIONS.COMPANIES_DELETE) && (
                          <CButton
                            color="danger"
                            variant="outline"
                            title="Hapus perusahaan"
                            onClick={() => handleDelete(company)}
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
                  <CTableDataCell colSpan={6} className="text-center py-5">
                    <div className="text-medium-emphasis">
                      <CIcon icon={cilBuilding} className="me-2" size="xl" />
                      <div className="fw-semibold mt-2">Data perusahaan belum tersedia</div>
                      <small className="d-block mt-1">
                        Mulai dengan menambahkan perusahaan baru atau ubah filter pencarian.
                      </small>
                      {searchTerm && (
                        <CButton
                          color="link"
                          size="sm"
                          className="mt-2"
                          onClick={handleClearSearch}
                        >
                          Bersihkan pencarian
                        </CButton>
                      )}
                    </div>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>

          {totalCompanies > 0 && (
            <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 gap-3">
              <div>
                <small className="text-medium-emphasis">{summaryText}</small>
              </div>
              {totalPages > 1 && (
                <CPagination className="mb-0">
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
                  {getPaginationItems()}
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
          )}
        </CCardBody>
      </CCard>

      <CModal visible={showSyncModal} onClose={handleCloseSyncModal}>
        <CModalHeader>
          <CModalTitle>Konfirmasi Sinkronisasi</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Sinkronisasi akan mengambil data perusahaan terbaru dari sistem eksternal. Proses ini
          dapat memakan waktu beberapa menit. Lanjutkan?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={handleCloseSyncModal} disabled={syncing}>
            Batal
          </CButton>
          <CButton color="primary" onClick={confirmSync} disabled={syncing}>
            {syncing ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Menyinkronkan...
              </>
            ) : (
              'Mulai Sinkronisasi'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Konfirmasi Penghapusan</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {companyToDelete && (
            <>
              Apakah Anda yakin ingin menghapus perusahaan{' '}
              <strong>{companyToDelete.name}</strong>
              {companyToDelete.company_id ? ` (ID #${companyToDelete.company_id})` : ''}?
              <br />
              <small className="text-medium-emphasis">
                Tindakan ini akan mengarsipkan perusahaan dari daftar aktif namun data tetap
                tersimpan untuk kebutuhan historis.
              </small>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Batal
          </CButton>
          <CButton color="danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Menghapus...
              </>
            ) : (
              'Hapus Perusahaan'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CompanyList;
