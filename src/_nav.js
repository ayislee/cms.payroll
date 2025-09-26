import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPeople,
  cilBuilding,
  cilUser,
  cilSettings,
  cilCash,
  cilCalendar,
  cilChart,
  cilClipboard
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW'
    }
  },
  {
    component: CNavTitle,
    name: 'Master Data'
  },
  {
    component: CNavItem,
    name: 'Employee Management',
    to: '/employees',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />
  },
  {
    component: CNavItem,
    name: 'Company Management',
    to: '/companies',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />
  },
  {
    component: CNavGroup,
    name: 'User Management',
    to: '/users',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'User List',
        to: '/users'
      },
      {
        component: CNavItem,
        name: 'Add User',
        to: '/users/create'
      }
    ]
  },
  {
    component: CNavItem,
    name: 'Payroll Components',
    to: '/components',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />
  },
  {
    component: CNavTitle,
    name: 'Payroll Operations'
  },
  {
    component: CNavGroup,
    name: 'Payroll Management',
    to: '/payroll',
    icon: <CIcon icon={cilCash} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Payroll List',
        to: '/payroll'
      },
      {
        component: CNavItem,
        name: 'Generate Payroll',
        to: '/payroll/generate'
      },
      {
        component: CNavItem,
        name: 'Mass Generate',
        to: '/payroll/mass-generate'
      }
    ]
  },
  {
    component: CNavGroup,
    name: 'Attendance',
    to: '/attendance',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Attendance Data',
        to: '/attendance'
      },
      {
        component: CNavItem,
        name: 'Sync Attendance',
        to: '/attendance/sync'
      }
    ]
  },
  {
    component: CNavTitle,
    name: 'Reports & Analytics'
  },
  {
    component: CNavGroup,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Reports',
        to: '/reports'
      },
      {
        component: CNavItem,
        name: 'Payroll Report',
        to: '/reports/payroll'
      },
      {
        component: CNavItem,
        name: 'Employee Report',
        to: '/reports/employee'
      }
    ]
  },
  {
    component: CNavItem,
    name: 'System Health',
    to: '/system/health',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />
  }
]

export default _nav