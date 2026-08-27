// ========================================
// USER LIST PAGE - PROFESSIONAL VERSION
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
  cilUser,
  cilPlus,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilReload,
  cilInfo,
  cilCheckCircle,
  cilXCircle,
  cilShieldAlt,
  cilClock
} from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useDocumentTitle } from '../../../utils/documentTitle';
import { formatDate, formatDateTime, formatPhoneNumber } from '../../../utils/formatters';
import { PERMISSIONS, USER_ROLES } from '../../../constants/userRoles';
import userService from '../services/userService';
import config from '../../../config/environment';
import { readSessionFilter, writeSessionFilter, normalizePageSize } from '../../../utils/filterPersistence';

const userListStyles = `
  .users-hero {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem;
    border-radius: 1.5rem;
    padding: 2.4rem;
    background: linear-gradient(135deg, #1d4ed8 0%, #6366f1 50%, #8b5cf6 100%);
    color: #fff;
    overflow: hidden;
  }

  .users-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.35), transparent 65%);
    opacity: 0.75;
    pointer-events: none;
  }

  .users-hero__content,
  .users-hero__actions {
    position: relative;
    z-index: 2;
  }

  .users-hero__eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .users-hero__title {
    font-size: 1.9rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
  }

  .users-hero__subtitle {
    max-width: 520px;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .users-hero__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .users-hero__actions .btn {
    border-radius: 999px;
    padding-inline: 1.35rem;
    font-weight: 500;
  }

  .user-stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba(59, 130, 246, 0.08);
    border-radius: 1.1rem;
    padding: 1.2rem 1.4rem;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .user-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  }

  .user-stat-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.9rem;
    font-size: 1.35rem;
  }

  .user-stat-card__icon--primary {
    background: rgba(59, 130, 246, 0.15);
    color: #1d4ed8;
  }

  .user-stat-card__icon--success {
    background: rgba(16, 185, 129, 0.15);
    color: #047857;
  }

  .user-stat-card__icon--warning {
    background: rgba(251, 191, 36, 0.15);
    color: #b45309;
  }

  .user-stat-card__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    font-weight: 600;
  }

  .user-stat-card__value {
    font-size: 1.85rem;
    font-weight: 600;
    color: #111827;
  }

  .user-filter-chip {
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

  .user-filter-chip:hover {
    background: #e0e7ff;
    color: #312e81;
  }

  .user-filter-chip.active {
    color: #ffffff;
    box-shadow: 0 12px 20px rgba(59, 130, 246, 0.25);
    background: #1d4ed8;
  }

  .user-search-container {
    position: relative;
  }

  .user-search-suggestions {
    position: absolute;
    inset: auto 0 0 0;
    transform: translateY(100%);
    margin-top: 0.35rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
    z-index: 1050;
  }

  .user-search-suggestion {
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

  .user-search-suggestion:hover {
    background-color: #f1f5f9;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('user-list-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'user-list-styles';
  styleElement.textContent = userListStyles;
  document.head.appendChild(styleElement);
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'active', label: 'Aktif' },
  { id: 'inactive', label: 'Nonaktif' }
];

const SUGGESTION_LIMIT = 6;
const SEARCH_HISTORY_LIMIT = 8;
const SEARCH_HISTORY_STORAGE_KEY = 'cms.payroll.user-search-history';
const USER_FILTER_STORAGE_KEY = 'cms.payroll.filters.users';

const createDefaultUserFilters = () => ({
  search: '',
  status: 'all',
  rows: config.pagination.defaultRows
});

const readUserFilters = () =>
  readSessionFilter(USER_FILTER_STORAGE_KEY, createDefaultUserFilters(), (filters, fallback) => {
    const status = STATUS_FILTERS.some((filter) => filter.id === filters.status)
      ? filters.status
      : fallback.status;

    return {
      search: String(filters.search || ''),
      status,
      rows: normalizePageSize(filters.rows, fallback.rows, config.pagination.pageSizeOptions)
    };
  });

const UserList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  useDocumentTitle('User Management');
  const persistedFiltersRef = useRef(readUserFilters());
  const hasLoadedInitialUsersRef = useRef(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState(() => persistedFiltersRef.current.search);
  const [searchInput, setSearchInput] = useState(() => persistedFiltersRef.current.search);
  const [isSearching, setIsSearching] = useState(false);
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
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchIndex, setSearchIndex] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [rows, setRows] = useState(() => persistedFiltersRef.current.rows);
  const [statusFilter, setStatusFilter] = useState(() => persistedFiltersRef.current.status);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const searchContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify(searchHistory.slice(0, SEARCH_HISTORY_LIMIT))
    );
  }, [searchHistory]);
  const loadUsers = useCallback(
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

        if (status !== 'all') {
          params.is_active = status === 'active';
        }

        const response = await userService.getUsers(params);
        const formatted = (response.data || []).map((user) =>
          userService.formatUserListItem(user)
        );

        setUsers(formatted);

        const total = response.total ?? formatted.length ?? 0;
        const perPage = response.perPage ?? effectiveRows;
        const resolvedPage = response.page ?? page;
        const lastPage =
          response.lastPage ?? Math.max(1, Math.ceil(total / (perPage || 1)));

        setTotalUsers(total);
        setTotalPages(lastPage);
        setCurrentPage(resolvedPage);
        setSearchIndex(userService.buildSearchIndex(formatted));

        const { latestUpdate } = userService.calculateSummary(formatted);
        setLastUpdatedAt(latestUpdate || null);
      } catch (err) {
        console.error('Error loading users:', err);
        setError(err.message || 'Gagal memuat data pengguna');
        setUsers([]);
        setTotalUsers(0);
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
    if (hasLoadedInitialUsersRef.current) {
      return;
    }

    hasLoadedInitialUsersRef.current = true;
    const persistedFilters = persistedFiltersRef.current;
    loadUsers(1, persistedFilters.search, persistedFilters.status, persistedFilters.rows);
  }, [loadUsers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
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

  const summaryStats = useMemo(
    () => userService.calculateSummary(users),
    [users]
  );

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

    if (totalUsers > 0) {
      const start = (currentPage - 1) * rows + 1;
      const end = Math.min(currentPage * rows, totalUsers);
      let base = `Menampilkan ${start}-${end} dari ${totalUsers} pengguna`;

      if (trimmedSearch) {
        base += ` untuk pencarian "${trimmedSearch}"`;
      }

      if (statusFilter !== 'all') {
        base += ` (status ${statusFilterLabel})`;
      }

      return base;
    }

    if (trimmedSearch) {
      return `Tidak ditemukan pengguna untuk "${trimmedSearch}"`;
    }

    return 'Belum ada pengguna yang tercatat';
  }, [currentPage, rows, totalUsers, searchTerm, statusFilter, statusFilterLabel]);

  const summaryCards = useMemo(
    () => [
      {
        id: 'total',
        label: 'Total Pengguna',
        value: summaryStats.total,
        caption: 'Seluruh akun terdaftar',
        icon: cilUser,
        tone: 'primary'
      },
      {
        id: 'active',
        label: 'Aktif',
        value: summaryStats.active,
        caption: summaryStats.total
          ? `${Math.round((summaryStats.active / summaryStats.total) * 100)}% dari total`
          : 'Belum ada data',
        icon: cilCheckCircle,
        tone: 'success'
      },
      {
        id: 'admin',
        label: 'Administrator',
        value: summaryStats.admin,
        caption: summaryStats.total
          ? `${Math.round((summaryStats.admin / summaryStats.total) * 100)}% memiliki akses tinggi`
          : 'Belum ada data',
        icon: cilShieldAlt,
        tone: 'warning'
      }
    ],
    [summaryStats]
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

      writeSessionFilter(USER_FILTER_STORAGE_KEY, {
        search: trimmed,
        status: statusFilter,
        rows
      });
      loadUsers(1, trimmed, statusFilter);
    },
    [loadUsers, rows, statusFilter]
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
          writeSessionFilter(USER_FILTER_STORAGE_KEY, {
            search: '',
            status: statusFilter,
            rows
          });
          loadUsers(1, '', statusFilter);
        }, 300);
        return;
      }

      const lowerTrimmed = trimmed.toLowerCase();
      const suggestions = searchIndex
        .filter((token) => token.includes(lowerTrimmed))
        .slice(0, SUGGESTION_LIMIT)
        .map((token) => ({
          value: token,
          subtitle: 'Cari berdasarkan kata kunci ini'
        }));

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);

      searchDebounceRef.current = setTimeout(() => {
        setSearchTerm(trimmed);
        writeSessionFilter(USER_FILTER_STORAGE_KEY, {
          search: trimmed,
          status: statusFilter,
          rows
        });
        loadUsers(1, trimmed, statusFilter);
      }, 400);
    },
    [loadUsers, rows, searchIndex, statusFilter]
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
      applySearch(suggestion.value);
    },
    [applySearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchInput('');
    setShowSuggestions(false);
    setShowSearchHistory(false);
    writeSessionFilter(USER_FILTER_STORAGE_KEY, {
      search: '',
      status: statusFilter,
      rows
    });
    loadUsers(1, '', statusFilter);
  }, [loadUsers, rows, statusFilter]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    setShowSearchHistory(false);
  }, []);

  const handleStatusFilterChange = useCallback(
    (filterId) => {
      if (filterId === statusFilter) return;
      setStatusFilter(filterId);
      setCurrentPage(1);
      writeSessionFilter(USER_FILTER_STORAGE_KEY, {
        search: searchTerm,
        status: filterId,
        rows
      });
      loadUsers(1, searchTerm, filterId);
    },
    [loadUsers, rows, searchTerm, statusFilter]
  );

  const handleRowsChange = useCallback(
    (value) => {
      const size = Number(value) || config.pagination.defaultRows;
      setRows(size);
      setCurrentPage(1);
      writeSessionFilter(USER_FILTER_STORAGE_KEY, {
        search: searchTerm,
        status: statusFilter,
        rows: size
      });
      loadUsers(1, searchTerm, statusFilter, size);
    },
    [loadUsers, searchTerm, statusFilter]
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      loadUsers(page, searchTerm, statusFilter);
    },
    [loadUsers, searchTerm, statusFilter]
  );

  const handleRefresh = useCallback(() => {
    loadUsers(currentPage, searchTerm, statusFilter, rows);
  }, [currentPage, loadUsers, rows, searchTerm, statusFilter]);

  const handleDelete = useCallback((user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await userService.deleteUser(userToDelete.user_id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Gagal menghapus pengguna');
    } finally {
      setDeleting(false);
    }
  }, [currentPage, loadUsers, searchTerm, statusFilter, userToDelete]);

  const handleToggleStatus = useCallback(
    async (user) => {
      try {
        await userService.toggleUserStatus(user.user_id);
        loadUsers(currentPage, searchTerm, statusFilter);
      } catch (err) {
        console.error('Error toggling user status:', err);
        setError(err.message || 'Gagal memperbarui status pengguna');
      }
    },
    [currentPage, loadUsers, searchTerm, statusFilter]
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

  if (loading && users.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '320px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Memuat data pengguna...</span>
      </div>
    );
  }
  return (
    <>
      <CRow className="mb-4">
        <CCol xs={12}>
          <div className="users-hero">
            <div className="users-hero__content">
              <span className="users-hero__eyebrow">Access Control</span>
              <h2 className="users-hero__title">Direktori Pengguna</h2>
              <p className="users-hero__subtitle mb-0">
                Kelola akses aplikasi payroll dengan data akun yang selalu tervalidasi dan mudah diaudit.
              </p>
            </div>
            <div className="users-hero__actions">
              <span className="last-updated-indicator text-white-75">
                <CIcon icon={cilClock} className="me-2" />
                {lastUpdatedLabel}
              </span>
              <CButton color="light" variant="outline" onClick={handleRefresh} disabled={loading}>
                <CIcon icon={cilReload} className={loading ? 'spin me-2' : 'me-2'} />
                Muat Ulang
              </CButton>
              {hasPermission(PERMISSIONS.USERS_CREATE) && (
                <CButton color="light" onClick={() => navigate('/users/create')}>
                  <CIcon icon={cilPlus} className="me-2" />
                  Tambah Pengguna
                </CButton>
              )}
            </div>
          </div>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        {summaryCards.map((card) => (
          <CCol sm={6} lg={4} key={card.id}>
            <div className="user-stat-card h-100">
              <div className={`user-stat-card__icon user-stat-card__icon--${card.tone}`}>
                <CIcon icon={card.icon} />
              </div>
              <div>
                <div className="user-stat-card__label">{card.label}</div>
                <div className="user-stat-card__value">{card.value}</div>
                <div className="text-medium-emphasis small">{card.caption}</div>
              </div>
            </div>
          </CCol>
        ))}
      </CRow>

      <CCard className="mb-4 shadow-sm border-0">
        <CCardHeader className="bg-transparent border-0 pb-0">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Daftar Pengguna</h4>
              <small className="text-medium-emphasis">{summaryText}</small>
            </div>
            <div className="text-end">
              <small className="text-medium-emphasis">
                {totalUsers} data • {rows} per halaman
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

          <div className="mb-4">
            <CRow className="align-items-center g-3">
              <CCol lg={6}>
                <div ref={searchContainerRef} className="user-search-container">
                  <CInputGroup>
                    <CInputGroupText className="bg-transparent border-end-0">
                      <CIcon icon={cilMagnifyingGlass} className="text-primary" />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Cari nama, email, peran, atau perusahaan..."
                      value={searchInput}
                      onChange={handleSearchInputChange}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={handleSearchFocus}
                    />
                    {searchTerm && (
                      <CButton color="light" variant="ghost" onClick={handleClearSearch} className="px-3">
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
                                    <CIcon icon={cilMagnifyingGlass} className="me-2 text-muted" />
                                    {historyItem}
                                  </CDropdownItem>
                                ))}
                                <CDropdownItem onClick={clearSearchHistory} className="text-danger">
                                  <CIcon icon={cilTrash} className="me-2" />
                                  Hapus Riwayat
                                </CDropdownItem>
                              </>
                            ) : (
                              <CDropdownItem disabled>Belum ada riwayat pencarian</CDropdownItem>
                            )}
                          </CDropdownMenu>
                        </CDropdown>
                      </div>
                    )}
                  </CInputGroup>

                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="user-search-suggestions">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.value}
                          type="button"
                          className="user-search-suggestion"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <CIcon icon={cilMagnifyingGlass} className="text-muted" />
                          <div>
                            <div className="fw-semibold">{suggestion.value}</div>
                            <small className="text-medium-emphasis">{suggestion.subtitle}</small>
                          </div>
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
                        className={`user-filter-chip${statusFilter === filter.id ? ' active' : ''}`}
                        onClick={() => handleStatusFilterChange(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="d-flex align-items-center">
                    <small className="me-2 text-medium-emphasis">Baris:</small>
                    <CFormSelect
                      size="sm"
                      value={rows}
                      onChange={(event) => handleRowsChange(event.target.value)}
                    >
                      {config.pagination.pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </div>
              </CCol>
            </CRow>
          </div>
          <CTable responsive hover className="align-middle">
            <CTableHead className="bg-body-tertiary">
              <CTableRow>
                <CTableHeaderCell width="80">ID</CTableHeaderCell>
                <CTableHeaderCell>Pengguna</CTableHeaderCell>
                <CTableHeaderCell>Kontak</CTableHeaderCell>
                <CTableHeaderCell>Peran</CTableHeaderCell>
                <CTableHeaderCell>Perusahaan</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Dibuat</CTableHeaderCell>
                <CTableHeaderCell width="160" className="text-end">
                  Aksi
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <CTableRow key={user.user_id ?? `user-${index}`}>
                    <CTableDataCell>
                      <CBadge color="primary" className="fs-6">
                        #{user.user_id ?? '-'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                        <CIcon icon={cilUser} className="text-primary" />
                        {user.name}
                      </div>
                      <small className="text-medium-emphasis">{user.username || user.email}</small>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div>
                        <small className="d-block text-dark">{user.email || '-'}</small>
                        <small className="text-medium-emphasis">
                          {formatPhoneNumber(user.phone) || 'Telepon belum diisi'}
                        </small>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={user.type === USER_ROLES.ADMIN ? 'primary' : 'secondary'}>
                        {user.type?.toUpperCase() || USER_ROLES.USER.toUpperCase()}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <small className="text-medium-emphasis">
                        {user.company_name || (user.company_id ? `Company #${user.company_id}` : '-')}
                      </small>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={user.is_active ? 'success' : 'danger'}>
                        <CIcon icon={user.is_active ? cilCheckCircle : cilXCircle} className="me-1" />
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <small className="text-medium-emphasis">{formatDate(user.created_at) || '-'}</small>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButtonGroup size="sm">
                        <Link to={`/users/${user.user_id}`}>
                          <CButton color="info" variant="outline" title="Lihat detail">
                            <CIcon icon={cilInfo} />
                          </CButton>
                        </Link>
                        {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                          <Link to={`/users/${user.user_id}/edit`}>
                            <CButton color="warning" variant="outline" title="Ubah data">
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </Link>
                        )}
                        {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                          <CButton
                            color={user.is_active ? 'secondary' : 'success'}
                            variant="outline"
                            title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            onClick={() => handleToggleStatus(user)}
                          >
                            <CIcon icon={user.is_active ? cilXCircle : cilCheckCircle} />
                          </CButton>
                        )}
                        {hasPermission(PERMISSIONS.USERS_DELETE) && (
                          <CButton
                            color="danger"
                            variant="outline"
                            title="Hapus pengguna"
                            onClick={() => handleDelete(user)}
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
                  <CTableDataCell colSpan={8} className="text-center py-5">
                    <div className="text-medium-emphasis">
                      <CIcon icon={cilUser} className="me-2" size="xl" />
                      <div className="fw-semibold mt-2">Tidak ada data pengguna</div>
                      <small className="d-block mt-1">
                        Tambahkan pengguna baru atau ubah filter pencarian.
                      </small>
                      {searchTerm && (
                        <CButton color="link" size="sm" className="mt-2" onClick={handleClearSearch}>
                          Bersihkan pencarian
                        </CButton>
                      )}
                    </div>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>

          {totalUsers > 0 && (
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

      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Konfirmasi Penghapusan</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {userToDelete && (
            <>
              Apakah Anda yakin ingin menghapus pengguna{' '}
              <strong>{userToDelete.name || userToDelete.email}</strong>?
              <br />
              <small className="text-medium-emphasis">
                Pengguna yang dihapus tidak dapat mengakses sistem ini lagi, namun data terkait akan tetap tersimpan.
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
              'Hapus Pengguna'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default UserList;
