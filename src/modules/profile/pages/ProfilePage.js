import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from '@coreui/react'

import { useAuth } from '../../../hooks/useAuth'
import { useDocumentTitle } from '../../../utils/documentTitle'

const ProfilePage = () => {
  const { user, changePassword } = useAuth()
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useDocumentTitle('Profile')

  const displayName = useMemo(() => {
    const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(' ').trim()
    return fullName || user?.name || 'Pengguna'
  }, [user])

  const companyName = user?.company?.name || '-'
  const userRole = user?.type || '-'
  const userEmail = user?.email || '-'

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }

    if (success) {
      setSuccess('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.current_password.trim()) {
      setError('Password saat ini wajib diisi.')
      return
    }

    if (!formData.new_password.trim()) {
      setError('Password baru wajib diisi.')
      return
    }

    if (formData.new_password.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }

    if (formData.confirm_password !== formData.new_password) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      await changePassword(formData)

      setSuccess('Password berhasil diperbarui.')
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (submitError) {
      setError(submitError.message || 'Gagal mengubah password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol lg={5}>
        <CCard>
          <CCardHeader className="bg-white">
            <strong>Profil</strong>
          </CCardHeader>
          <CCardBody>
            <div className="mb-3">
              <div className="text-medium-emphasis small">Nama</div>
              <div className="fw-semibold">{displayName}</div>
            </div>
            <div className="mb-3">
              <div className="text-medium-emphasis small">Email</div>
              <div>{userEmail}</div>
            </div>
            <div className="mb-3">
              <div className="text-medium-emphasis small">Role</div>
              <div className="text-uppercase">{userRole}</div>
            </div>
            <div>
              <div className="text-medium-emphasis small">Company</div>
              <div>{companyName}</div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg={7}>
        <CCard>
          <CCardHeader className="bg-white">
            <strong>Ganti Password</strong>
          </CCardHeader>
          <CCardBody>
            {error && (
              <CAlert color="danger" className="mb-3">
                {error}
              </CAlert>
            )}
            {success && (
              <CAlert color="success" className="mb-3">
                {success}
              </CAlert>
            )}

            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel htmlFor="current_password">Password Saat Ini</CFormLabel>
                <CFormInput
                  id="current_password"
                  name="current_password"
                  type="password"
                  value={formData.current_password}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="new_password">Password Baru</CFormLabel>
                <CFormInput
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="mb-4">
                <CFormLabel htmlFor="confirm_password">Konfirmasi Password Baru</CFormLabel>
                <CFormInput
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <CButton color="primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Menyimpan...
                  </>
                ) : (
                  'Perbarui Password'
                )}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ProfilePage
