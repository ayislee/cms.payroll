// ========================================
// LOGIN PAGE COMPONENT
// ========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser } from '@coreui/icons';
import { useAuth } from '../../../hooks/useAuth';
import config from '../../../config/environment';
import { useDocumentTitle } from '../../../utils/documentTitle';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  
  // Set document title
  useDocumentTitle('Login');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setAlertMessage('');
    
    try {
      await login({
        email: formData.email,
        password: formData.password
      });
      
      setAlertMessage('Login successful! Redirecting...');
      setAlertType('success');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error) {
      setAlertMessage(error.message || 'Login failed. Please try again.');
      setAlertType('danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={6} className="text-center">
              <CSpinner color="primary" />
              <div className="mt-3">Loading...</div>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Login</h1>
                    <p className="text-medium-emphasis">
                      Sign in to {config.ui.companyName} Payroll System
                    </p>
                    
                    {alertMessage && (
                      <CAlert color={alertType} className="mb-3">
                        {alertMessage}
                      </CAlert>
                    )}
                    
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        name="email"
                        placeholder="Email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        invalid={!!errors.email}
                      />
                    </CInputGroup>
                    {errors.email && (
                      <div className="text-danger small mb-2">{errors.email}</div>
                    )}
                    
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        name="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleInputChange}
                        invalid={!!errors.password}
                      />
                    </CInputGroup>
                    {errors.password && (
                      <div className="text-danger small mb-2">{errors.password}</div>
                    )}
                    
                    <CRow>
                      <CCol xs={6}>
                        <CButton
                          type="submit"
                          color="primary"
                          className="px-4"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Signing in...
                            </>
                          ) : (
                            'Login'
                          )}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton color="link" className="px-0">
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Payroll Management</h2>
                    <p>
                      Comprehensive payroll system for managing employee salaries, 
                      attendance, and company components.
                    </p>
                    
                    {config.auth.enableRegistration && (
                      <>
                        <p>Don't have an account?</p>
                        <Link to="/register">
                          <CButton color="primary" className="mt-3" active tabIndex={-1}>
                            Register Now!
                          </CButton>
                        </Link>
                      </>
                    )}
                    
                    <div className="mt-4">
                      <small>
                        © 2024 {config.ui.companyName}
                      </small>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;
