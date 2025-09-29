import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// We use those styles to show code examples, you should remove them in your application.
import './scss/examples.scss'

// Authentication
import { AuthProvider } from './hooks/useAuth'
import AuthGuard from './components/AuthGuard'
import ProtectedRoute from './components/ProtectedRoute'

// Containers
const DefaultLayout = React.lazy(() => {
  return import('./layout/DefaultLayout');
});

// Pages
const Login = React.lazy(() => {
  return import('./modules/auth/pages/Login');
});
const Register = React.lazy(() => {
  return import('./views/pages/register/Register');
});
const Page404 = React.lazy(() => {
  return import('./views/pages/page404/Page404');
});
const Page500 = React.lazy(() => {
  return import('./views/pages/page500/Page500');
});

// Global Error Boundary
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global Error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h2>Something went wrong in the application.</h2>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details (Click to expand)</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <HashRouter>
            <Suspense
              fallback={
                <div className="pt-3 text-center">
                  <CSpinner color="primary" variant="grow" />
                </div>
              }
            >
              <Routes>
                <Route exact path="/login" name="Login Page" element={<Login />} />
                <Route exact path="/register" name="Register Page" element={<Register />} />
                <Route exact path="/404" name="Page 404" element={<Page404 />} />
                <Route exact path="/500" name="Page 500" element={<Page500 />} />
                <Route 
                  path="*" 
                  name="Home" 
                  element={
                    <ProtectedRoute>
                      <DefaultLayout />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Suspense>
          </HashRouter>
        </AuthGuard>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
