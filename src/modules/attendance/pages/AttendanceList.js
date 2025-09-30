// ========================================
// ATTENDANCE LIST PAGE
// ========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CAlert,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CBadge,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilFilter } from '@coreui/icons';
import { useDocumentTitle } from '../../../utils/documentTitle';
import attendanceService from '../services/attendanceService';

const AttendanceList = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState(''); // Current input value
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // Search term that's been applied
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);

  useDocumentTitle('Attendance List');

  const loadAttendances = async () => {
    try {
      setLoading(true);
      
      const serviceParams = {
        page: currentPage,
        rows: pageSize,
        search: appliedSearchTerm
      };
      
      const response = await attendanceService.getAttendances(serviceParams);
      
      if (response) {
        setAttendances(response.data || []);
        const pages = response.pages || 1;
        const total = response.total || 0;
        setTotalPages(pages);
        setTotalRecords(total);
      } else {
        setAttendances([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error loading attendances:', error);
      setError(error.message || 'Failed to load attendances');
      setAttendances([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Load attendances when page, page size, or applied search term changes
  useEffect(() => {
    loadAttendances();
  }, [currentPage, pageSize, appliedSearchTerm]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle search input change without triggering immediate search
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search form submission - only time we hit the API
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  // Remove the auto-search debounce effect completely
  // We only want to search when user explicitly submits

  const resetFilters = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading attendances...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        <h4>Error Loading Attendances</h4>
        <p>{error}</p>
        <CButton color="primary" onClick={loadAttendances}>Retry</CButton>
      </CAlert>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="align-items-center">
              <CCol>
                <strong>Attendance Management</strong>
              </CCol>
              <CCol xs="auto">
                <CButton 
                  color="secondary" 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <CIcon icon={cilFilter} className="me-1" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </CButton>
              </CCol>
            </CRow>
          </CCardHeader>
          <CCardBody>
            {/* Search Form */}
            <CForm onSubmit={handleSearchSubmit} className="mb-4">
              <CRow>
                <CCol md={6} className="mb-3">
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      placeholder="Search by employee name..."
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      ref={searchInputRef}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={6} className="mb-3">
                  <div className="d-grid d-md-flex gap-2">
                    <CButton type="submit" color="primary">
                      <CIcon icon={cilSearch} className="me-1" />
                      Search
                    </CButton>
                    <CButton type="button" color="secondary" variant="outline" onClick={resetFilters}>
                      Reset
                    </CButton>
                  </div>
                </CCol>
              </CRow>
            </CForm>

            {attendances.length > 0 ? (
              <>
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Employee</CTableHeaderCell>
                      <CTableHeaderCell>Period</CTableHeaderCell>
                      <CTableHeaderCell>Working Days</CTableHeaderCell>
                      <CTableHeaderCell>Absent Days</CTableHeaderCell>
                      <CTableHeaderCell>Actual Days</CTableHeaderCell>
                      <CTableHeaderCell>Created At</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {attendances.map((attendance) => (
                      <CTableRow key={attendance.attendance_id}>
                        <CTableDataCell>
                          <div>
                            <strong>{attendance.employee?.name || 'N/A'}</strong>
                            <div className="small text-medium-emphasis">
                              ID: {attendance.employee_id}
                            </div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.payroll_periode || '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.total_working_days || 0}
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.absent_days || 0}
                        </CTableDataCell>
                        <CTableDataCell>
                          {attendance.actual_working_days || 0}
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(attendance.created_at).toLocaleDateString('id-ID')}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                    </div>
                    <div className="d-flex align-items-center">
                      <label className="me-2">Rows per page:</label>
                      <CFormSelect
                        size="sm"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        style={{ width: 'auto' }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </CFormSelect>
                    </div>
                  </div>
                  <CPagination align="center" className="mb-0">
                    <CPaginationItem 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </CPaginationItem>
                    
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum >= 1 && pageNum <= totalPages) {
                        return (
                          <CPaginationItem 
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </CPaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <CPaginationItem 
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <p className="text-medium-emphasis">
                  No attendance records found.
                </p>
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default AttendanceList;