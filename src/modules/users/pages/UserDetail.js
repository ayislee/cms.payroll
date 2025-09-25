// ========================================
// USERDETAIL - PLACEHOLDER
// ========================================

import React from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';

const UserDetail = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>UserDetail</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-medium-emphasis">
              User detail page is under development. This is a placeholder component.
            </p>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default UserDetail;