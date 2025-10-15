import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CSpinner,
} from '@coreui/react'
import { cilSettings, cilUser, cilExitToApp } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import avatar8 from './../../assets/images/avatars/8.jpg'
import { useAuth } from '../../hooks/useAuth'

const AppHeaderDropdown = () => {
  const { user, logout, loading } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (loggingOut) return
    try {
      setLoggingOut(true)
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Failed to logout:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  const displayName =
    user?.name || [user?.firstname, user?.lastname].filter(Boolean).join(' ') || 'Pengguna'
  const userEmail = user?.email || '-'

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2 text-center">
          <div className="fw-semibold">{displayName}</div>
          <div className="small text-medium-emphasis">{userEmail}</div>
        </CDropdownHeader>

        <CDropdownItem as={Link} to="/profile">
          <CIcon icon={cilUser} className="me-2" />
          Profil
        </CDropdownItem>
        <CDropdownItem as={Link} to="/settings">
          <CIcon icon={cilSettings} className="me-2" />
          Pengaturan
        </CDropdownItem>

        <CDropdownDivider />

        <CDropdownItem
          as="button"
          type="button"
          className="w-100 text-start text-danger"
          onClick={handleLogout}
          disabled={loggingOut || loading}
        >
          {loggingOut ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Keluar...
            </>
          ) : (
            <>
              <CIcon icon={cilExitToApp} className="me-2" />
              Keluar
            </>
          )}
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
