// ========================================
// COMPONENTFORM - PLACEHOLDER
// ========================================

import React from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';

const ComponentForm = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>ComponentForm</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-medium-emphasis">
              Component form page is under development. This is a placeholder component.
            </p>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default ComponentForm;