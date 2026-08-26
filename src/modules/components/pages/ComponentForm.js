// ========================================
// COMPONENT FORM PAGE
// ========================================

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
  CBadge,
  CDropdown,
  CDropdownMenu,
  CDropdownToggle,
  CFormCheck,
  CBreadcrumb,
  CBreadcrumbItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilSave, cilArrowLeft } from '@coreui/icons'
import { useAuth } from '../../../hooks/useAuth'
import { useDocumentTitle } from '../../../utils/documentTitle'
import { PERMISSIONS } from '../../../constants/userRoles'
import componentService from '../services/componentService'

const isTrueValue = (value) => value === true || value === 'true' || value === '1' || value === 1

const CALCULATION_FORMULAS = [
  {
    value: 'pph21_calculation',
    label: 'PPH 21',
    defaultParams: {
      method: 'ter',
      base_components: [],
      rounding: 'nearest',
      apply_npwp_penalty: false,
      npwp_registered: true,
      deductible_components: [],
      pension_components: [],
      additional_deduction: 0,
      job_expense_max: 500000,
    },
    fields: [
      {
        name: 'method',
        label: 'Tax Method',
        type: 'select',
        required: true,
        helpText:
          'TER memakai tabel PPh21 TER berdasarkan PTKP dan penghasilan bruto bulanan. Progressive menghitung pajak dari penghasilan tahunan, PTKP, dan tarif progresif.',
        options: [
          { value: 'ter', label: 'TER' },
          { value: 'progressive', label: 'Progressive' },
        ],
      },
      {
        name: 'base_components',
        label: 'Base Components',
        type: 'componentCodes',
        required: true,
        helpText:
          'Daftar kode komponen penghasilan yang menjadi dasar bruto PPh21. Contoh: GP, TT, TM, TJ, BONUS, OT.',
      },
      {
        name: 'rounding',
        label: 'Rounding',
        type: 'select',
        required: true,
        helpText:
          'Cara pembulatan hasil pajak bulanan: nearest untuk pembulatan normal, up ke atas, down ke bawah.',
        options: [
          { value: 'nearest', label: 'Nearest' },
          { value: 'up', label: 'Up' },
          { value: 'down', label: 'Down' },
        ],
      },
      {
        name: 'apply_npwp_penalty',
        label: 'Apply NPWP Penalty',
        type: 'boolean',
        helpText:
          'Aktifkan jika perhitungan harus menambahkan penalti 20% untuk karyawan yang tidak memiliki NPWP.',
      },
      {
        name: 'npwp_registered',
        label: 'NPWP Registered',
        type: 'boolean',
        helpText:
          'Status NPWP karyawan. Pilih No agar penalti NPWP diterapkan ketika Apply NPWP Penalty aktif.',
        visibleWhen: (params) => isTrueValue(params.apply_npwp_penalty),
      },
      {
        name: 'deductible_components',
        label: 'Deductible Components',
        type: 'componentCodes',
        helpText:
          'Komponen potongan yang mengurangi penghasilan bruto pada mode Progressive, misalnya BPJS-TK.',
        visibleWhen: (params) => params.method === 'progressive',
      },
      {
        name: 'pension_components',
        label: 'Pension Components',
        type: 'componentCodes',
        helpText:
          'Komponen iuran pensiun tambahan yang ikut menjadi pengurang pada mode Progressive.',
        visibleWhen: (params) => params.method === 'progressive',
      },
      {
        name: 'additional_deduction',
        label: 'Additional Deduction',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Nominal pengurang bulanan tambahan di luar komponen deduction dan pension pada mode Progressive.',
        visibleWhen: (params) => params.method === 'progressive',
      },
      {
        name: 'job_expense_max',
        label: 'Job Expense Max',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Batas maksimal biaya jabatan per bulan pada mode Progressive. Default backend adalah 500000.',
        visibleWhen: (params) => params.method === 'progressive',
      },
    ],
  },
  {
    value: 'bpjs_health_calculation',
    label: 'BPJS Kesehatan',
    defaultParams: {
      base_components: [],
      percentage: 0.01,
      max_base: 12000000,
    },
    fields: [
      {
        name: 'base_components',
        label: 'Base Components',
        type: 'componentCodes',
        required: true,
        helpText:
          'Komponen penghasilan yang menjadi dasar iuran BPJS Kesehatan. Biasanya memakai komponen gaji pokok atau komponen penghasilan tetap.',
      },
      {
        name: 'percentage',
        label: 'Percentage',
        type: 'number',
        min: 0,
        step: 0.0001,
        required: true,
        helpText:
          'Tarif iuran dalam format desimal. Contoh 0.01 berarti 1% dari total Base Components.',
      },
      {
        name: 'max_base',
        label: 'Max Base',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Batas maksimum dasar perhitungan. Jika total Base Components melebihi nilai ini, sistem memakai nilai Max Base.',
      },
    ],
  },
  {
    value: 'bpjs_employment_calculation',
    label: 'BPJS Ketenagakerjaan',
    defaultParams: {
      base_components: [],
      percentage: 0.02,
      max_base: 12000000,
    },
    fields: [
      {
        name: 'base_components',
        label: 'Base Components',
        type: 'componentCodes',
        required: true,
        helpText:
          'Komponen penghasilan yang menjadi dasar iuran BPJS Ketenagakerjaan. Biasanya memakai komponen gaji pokok atau komponen penghasilan tetap.',
      },
      {
        name: 'percentage',
        label: 'Percentage',
        type: 'number',
        min: 0,
        step: 0.0001,
        required: true,
        helpText:
          'Tarif iuran dalam format desimal. Contoh 0.02 berarti 2% dari total Base Components.',
      },
      {
        name: 'max_base',
        label: 'Max Base',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Batas maksimum dasar perhitungan. Jika total Base Components melebihi nilai ini, sistem memakai nilai Max Base.',
      },
    ],
  },
  {
    value: 'ot_mds_horeca_internet_allowance',
    label: 'OT MDS Horeca Internet Allowance',
    defaultParams: {
      min_working_days: 20,
      amount: '',
    },
    fields: [
      {
        name: 'min_working_days',
        label: 'Minimum Working Days',
        type: 'number',
        min: 0,
        step: 1,
        required: true,
        helpText:
          'Jumlah minimum hari kerja aktual dalam periode payroll agar allowance dibayarkan. Jika hari kerja kurang dari nilai ini, hasil perhitungan menjadi 0.',
      },
      {
        name: 'amount',
        label: 'Override Amount',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Nominal allowance yang dipakai saat syarat hari kerja terpenuhi. Kosongkan untuk memakai amount dari employee component.',
      },
    ],
  },
  {
    value: 'sampling_incentive_calculation',
    label: 'Sampling Incentive',
    defaultParams: {
      daily_cap: 25000,
      general_threshold: 20,
      relaunch_threshold: 20,
      relaunch_unique_min: 2,
    },
    fields: [
      {
        name: 'daily_cap',
        label: 'Daily Cap',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Batas maksimum incentive per hari. Backend menjumlahkan incentive harian, tetapi nilai per hari tidak melebihi Daily Cap.',
      },
      {
        name: 'general_threshold',
        label: 'General Threshold',
        type: 'number',
        min: 0,
        step: 1,
        helpText: 'Minimal jumlah produk unik sampling harian agar incentive general diberikan.',
      },
      {
        name: 'relaunch_threshold',
        label: 'Relaunch Threshold',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Minimal total sampling produk relaunch harian agar incentive relaunch dapat diberikan.',
      },
      {
        name: 'relaunch_unique_min',
        label: 'Relaunch Unique Min',
        type: 'number',
        min: 0,
        step: 1,
        helpText:
          'Minimal jumlah produk relaunch unik harian yang harus terpenuhi bersama Relaunch Threshold.',
      },
    ],
  },
]

const FORMULA_BY_VALUE = CALCULATION_FORMULAS.reduce((formulas, formula) => {
  formulas[formula.value] = formula
  return formulas
}, {})

const cloneDefaultParams = (formulaValue) => {
  const formula = FORMULA_BY_VALUE[formulaValue]
  return formula ? JSON.parse(JSON.stringify(formula.defaultParams)) : {}
}

const parseCalculationParams = (params) => {
  if (!params) return {}
  if (typeof params === 'object') return params

  try {
    return JSON.parse(params)
  } catch (error) {
    return {}
  }
}

const normalizeCodeList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((code) =>
        String(code || '')
          .trim()
          .toUpperCase(),
      )
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean)
  }

  return []
}

const getVisibleFormulaFields = (formula, params) => {
  if (!formula) return []
  return formula.fields.filter((field) => !field.visibleWhen || field.visibleWhen(params || {}))
}

const buildCalculationParams = (formulaValue, params) => {
  const formula = FORMULA_BY_VALUE[formulaValue]
  const sourceParams = params || {}
  const nextParams = {}

  getVisibleFormulaFields(formula, sourceParams).forEach((field) => {
    const value = sourceParams[field.name]

    if (field.type === 'componentCodes') {
      const codes = normalizeCodeList(value)
      if (codes.length > 0 || field.required) {
        nextParams[field.name] = codes
      }
      return
    }

    if (field.type === 'number') {
      if (value === '' || value === null || value === undefined) {
        return
      }

      const numberValue = Number(value)
      if (!Number.isNaN(numberValue)) {
        nextParams[field.name] = numberValue
      }
      return
    }

    if (field.type === 'boolean') {
      nextParams[field.name] = isTrueValue(value)
      return
    }

    if (value !== '' && value !== null && value !== undefined) {
      nextParams[field.name] = value
    }
  })

  return nextParams
}

const validateFormulaParams = (formulaValue, params) => {
  const formula = FORMULA_BY_VALUE[formulaValue]
  const nextErrors = {}

  if (!formula) {
    nextErrors.calculation_formula = 'Please select a defined calculation formula'
    return nextErrors
  }

  getVisibleFormulaFields(formula, params).forEach((field) => {
    const key = `calculation_params.${field.name}`
    const value = params ? params[field.name] : undefined

    if (field.type === 'componentCodes') {
      if (field.required && normalizeCodeList(value).length === 0) {
        nextErrors[key] = `${field.label} is required`
      }
      return
    }

    if (field.type === 'number') {
      const isBlank = value === '' || value === null || value === undefined
      if (field.required && isBlank) {
        nextErrors[key] = `${field.label} is required`
        return
      }

      if (!isBlank) {
        const numberValue = Number(value)
        if (Number.isNaN(numberValue)) {
          nextErrors[key] = `${field.label} must be a number`
          return
        }

        if (field.min !== undefined && numberValue < field.min) {
          nextErrors[key] = `${field.label} must be at least ${field.min}`
        }
      }
    }
  })

  return nextErrors
}

const ModernComponentCodeSelect = ({ options, selectedCodes, onChange, invalid }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes])

  const filteredOptions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return options

    return options.filter(
      (option) =>
        option.code.toLowerCase().includes(keyword) || option.label.toLowerCase().includes(keyword),
    )
  }, [options, searchTerm])

  const selectedOptions = useMemo(
    () =>
      selectedCodes.map(
        (code) => options.find((option) => option.code === code) || { code, label: code },
      ),
    [options, selectedCodes],
  )

  const toggleCode = (code) => {
    if (selectedSet.has(code)) {
      onChange(selectedCodes.filter((selectedCode) => selectedCode !== code))
      return
    }

    onChange([...selectedCodes, code])
  }

  const selectVisible = () => {
    const nextCodes = new Set(selectedCodes)
    filteredOptions.forEach((option) => nextCodes.add(option.code))
    onChange(Array.from(nextCodes))
  }

  return (
    <div>
      <CDropdown autoClose="outside" className="w-100">
        <CDropdownToggle
          color="light"
          variant="outline"
          className={`w-100 d-flex align-items-center justify-content-between text-start ${
            invalid ? 'border-danger' : ''
          }`}
        >
          <span className="text-truncate">
            {selectedCodes.length > 0
              ? `${selectedCodes.length} component selected`
              : 'Select components'}
          </span>
          {selectedCodes.length > 0 && (
            <CBadge color="primary" className="ms-2">
              {selectedCodes.length}
            </CBadge>
          )}
        </CDropdownToggle>
        <CDropdownMenu className="w-100 p-3 shadow-sm">
          <CFormInput
            size="sm"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search code or name"
          />
          <div className="d-flex gap-2 my-2">
            <CButton
              type="button"
              color="primary"
              variant="outline"
              size="sm"
              onClick={selectVisible}
              disabled={filteredOptions.length === 0}
            >
              Select Visible
            </CButton>
            <CButton
              type="button"
              color="secondary"
              variant="outline"
              size="sm"
              onClick={() => onChange([])}
              disabled={selectedCodes.length === 0}
            >
              Clear
            </CButton>
          </div>
          <div className="border rounded" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <label
                  key={option.code}
                  className="d-flex align-items-center gap-2 px-2 py-2 border-bottom mb-0"
                  style={{ cursor: 'pointer' }}
                >
                  <CFormCheck
                    checked={selectedSet.has(option.code)}
                    onChange={() => toggleCode(option.code)}
                  />
                  <span>
                    <strong>{option.code}</strong>
                    {option.label !== option.code && (
                      <span className="text-muted ms-1">
                        {option.label.replace(`${option.code} - `, '')}
                      </span>
                    )}
                  </span>
                </label>
              ))
            ) : (
              <div className="text-muted small px-2 py-3">No components found</div>
            )}
          </div>
          {options.length === 0 && (
            <div className="text-muted small mt-2">
              Create payroll components first before selecting base components.
            </div>
          )}
        </CDropdownMenu>
      </CDropdown>

      {selectedOptions.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          {selectedOptions.map((option) => (
            <CBadge
              key={option.code}
              color="primary"
              className="d-inline-flex align-items-center gap-1 px-2 py-2"
            >
              {option.code}
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-1 text-white text-decoration-none"
                onClick={() => toggleCode(option.code)}
                aria-label={`Remove ${option.code}`}
              >
                x
              </button>
            </CBadge>
          ))}
        </div>
      )}
    </div>
  )
}

const ComponentForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const isEdit = Boolean(id)

  useDocumentTitle(isEdit ? 'Edit Component' : 'Add Component')

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    code: '',
    type: '',
    is_active: '1',
    is_integration: '0',
    integration_code: '',
    calculation_type: '',
    calculation_formula: '',
    calculation_params: {},
    attendance_based: '0',
    attendance_type: 'full',
  })

  const [availableComponents, setAvailableComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadAvailableComponents = async () => {
      try {
        const response = await componentService.getComponents()
        if (isMounted) {
          setAvailableComponents(response.data || [])
        }
      } catch (error) {
        if (isMounted) {
          setAvailableComponents([])
        }
      }
    }

    loadAvailableComponents()

    return () => {
      isMounted = false
    }
  }, [])

  // Load component data for edit
  useEffect(() => {
    if (!isEdit) return

    const loadComponent = async () => {
      try {
        setLoading(true)
        const component = await componentService.getComponentById(id)

        if (component) {
          const calculationFormula = component.calculation_formula || ''
          const calculationParams = parseCalculationParams(component.calculation_params)

          setFormData({
            name: component.name || '',
            category: component.category || '',
            description: component.description || '',
            code: component.code || '',
            type: component.type || '',
            is_active: component.is_active ? '1' : '0',
            is_integration: component.is_integration ? '1' : '0',
            integration_code: component.integration_code || '',
            calculation_type: component.calculation_type || '',
            calculation_formula: calculationFormula,
            calculation_params: calculationFormula
              ? { ...cloneDefaultParams(calculationFormula), ...calculationParams }
              : calculationParams,
            attendance_based: component.attendance_based ? '1' : '0',
            attendance_type: component.attendance_type || 'full',
          })
        }
      } catch (error) {
        setError(error.message || 'Failed to load component')
      } finally {
        setLoading(false)
      }
    }

    loadComponent()
  }, [id, isEdit])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'calculation_type') {
      setFormData((prev) => ({
        ...prev,
        calculation_type: value,
        calculation_formula: value === 'auto' ? prev.calculation_formula : '',
        calculation_params: value === 'auto' ? parseCalculationParams(prev.calculation_params) : {},
      }))

      setErrors((prev) =>
        Object.fromEntries(
          Object.entries({
            ...prev,
            calculation_type: '',
            calculation_formula: '',
          }).filter(([key]) => !key.startsWith('calculation_params.')),
        ),
      )
      return
    }

    if (name === 'calculation_formula') {
      setFormData((prev) => ({
        ...prev,
        calculation_formula: value,
        calculation_params: cloneDefaultParams(value),
      }))

      setErrors((prev) =>
        Object.fromEntries(
          Object.entries({
            ...prev,
            calculation_formula: '',
          }).filter(([key]) => !key.startsWith('calculation_params.')),
        ),
      )
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleCalculationParamChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      calculation_params: {
        ...parseCalculationParams(prev.calculation_params),
        [name]: value,
      },
    }))

    const errorKey = `calculation_params.${name}`
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }))
    }
  }

  const calculationParams = parseCalculationParams(formData.calculation_params)
  const formulaDefinition = FORMULA_BY_VALUE[formData.calculation_formula]

  const visibleFormulaFields = useMemo(
    () => getVisibleFormulaFields(formulaDefinition, calculationParams),
    [formulaDefinition, calculationParams],
  )

  const componentCodeOptions = useMemo(() => {
    const options = new Map()

    availableComponents.forEach((component) => {
      if (!component.code) return

      const code = String(component.code).trim().toUpperCase()
      options.set(code, {
        code,
        label: component.name ? `${code} - ${component.name}` : code,
      })
    })

    CALCULATION_FORMULAS.forEach((formula) => {
      formula.fields
        .filter((field) => field.type === 'componentCodes')
        .forEach((field) => {
          normalizeCodeList(calculationParams[field.name]).forEach((code) => {
            if (isEdit && !options.has(code)) {
              options.set(code, { code, label: code })
            }
          })
        })
    })

    return Array.from(options.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [availableComponents, calculationParams, isEdit])

  const renderCalculationParamField = (field) => {
    const fieldError = errors[`calculation_params.${field.name}`]
    const value = calculationParams[field.name]

    if (field.type === 'componentCodes') {
      const selectedCodes = normalizeCodeList(value)

      return (
        <CCol md={6} key={field.name}>
          <div className="mb-3">
            <CFormLabel>
              {field.label}
              {field.required ? ' *' : ''}
            </CFormLabel>
            <ModernComponentCodeSelect
              options={componentCodeOptions}
              selectedCodes={selectedCodes}
              onChange={(nextValue) => handleCalculationParamChange(field.name, nextValue)}
              invalid={!!fieldError}
            />
            {field.helpText && <small className="text-muted d-block mt-1">{field.helpText}</small>}
            {fieldError && <div className="invalid-feedback d-block">{fieldError}</div>}
          </div>
        </CCol>
      )
    }

    if (field.type === 'select') {
      return (
        <CCol md={6} key={field.name}>
          <div className="mb-3">
            <CFormLabel>
              {field.label}
              {field.required ? ' *' : ''}
            </CFormLabel>
            <CFormSelect
              value={value || ''}
              onChange={(event) => handleCalculationParamChange(field.name, event.target.value)}
              invalid={!!fieldError}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CFormSelect>
            {field.helpText && <small className="text-muted d-block mt-1">{field.helpText}</small>}
            {fieldError && <div className="invalid-feedback d-block">{fieldError}</div>}
          </div>
        </CCol>
      )
    }

    if (field.type === 'boolean') {
      return (
        <CCol md={6} key={field.name}>
          <div className="mb-3">
            <CFormLabel>{field.label}</CFormLabel>
            <CFormSelect
              value={String(isTrueValue(value))}
              onChange={(event) =>
                handleCalculationParamChange(field.name, event.target.value === 'true')
              }
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </CFormSelect>
            {field.helpText && <small className="text-muted d-block mt-1">{field.helpText}</small>}
          </div>
        </CCol>
      )
    }

    return (
      <CCol md={6} key={field.name}>
        <div className="mb-3">
          <CFormLabel>
            {field.label}
            {field.required ? ' *' : ''}
          </CFormLabel>
          <CFormInput
            type="number"
            min={field.min}
            step={field.step || 1}
            value={value ?? ''}
            onChange={(event) => handleCalculationParamChange(field.name, event.target.value)}
            invalid={!!fieldError}
          />
          {field.helpText && <small className="text-muted d-block mt-1">{field.helpText}</small>}
          {fieldError && <div className="invalid-feedback d-block">{fieldError}</div>}
        </div>
      </CCol>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = componentService.validateComponentData(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    const formulaErrors =
      formData.calculation_type === 'auto'
        ? validateFormulaParams(formData.calculation_formula, formData.calculation_params)
        : {}

    if (Object.keys(formulaErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...formulaErrors }))
      return
    }

    try {
      setSaving(true)
      setError('')

      // Prepare data for API - exact format as per API.md
      const submitData = { ...formData }

      if (submitData.calculation_type === 'auto') {
        submitData.calculation_params = buildCalculationParams(
          submitData.calculation_formula,
          submitData.calculation_params,
        )
      } else {
        submitData.calculation_formula = null
        submitData.calculation_params = null
      }

      // Set integration_code to null if not used
      if (submitData.is_integration === '0') {
        submitData.integration_code = null
      }

      // For auto calculation type, formula is required
      if (submitData.calculation_type === 'auto' && !submitData.calculation_formula?.trim()) {
        setError('Calculation formula is required for automatic calculation type')
        return
      }

      // Clean empty strings to null for optional fields
      if (!submitData.integration_code?.trim()) {
        submitData.integration_code = null
      }

      if (isEdit) {
        await componentService.updateComponent(id, submitData)
        setSuccess('Component updated successfully!')
      } else {
        await componentService.createComponent(submitData)
        setSuccess('Component created successfully!')
      }

      setTimeout(() => navigate('/components'), 1500)
    } catch (error) {
      setError(error.message || 'Failed to save component')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading component...</span>
      </div>
    )
  }

  return (
    <>
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem href="/components">Components</CBreadcrumbItem>
        <CBreadcrumbItem active>{isEdit ? 'Edit Component' : 'Add Component'}</CBreadcrumbItem>
      </CBreadcrumb>

      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <h4 className="mb-0">
                <CIcon icon={cilSettings} className="me-2" />
                {isEdit ? 'Edit Component' : 'Add New Component'}
              </h4>
            </CCardHeader>

            <CCardBody>
              {success && <CAlert color="success">{success}</CAlert>}
              {error && <CAlert color="danger">{error}</CAlert>}

              <CForm onSubmit={handleSubmit}>
                {/* Basic Information */}
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Name *</CFormLabel>
                      <CFormInput
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        invalid={!!errors.name}
                        placeholder="e.g., Gaji Pokok"
                      />
                      {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Code *</CFormLabel>
                      <CFormInput
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        invalid={!!errors.code}
                        placeholder="e.g., GP, BPJS-K"
                      />
                      {errors.code && <div className="invalid-feedback d-block">{errors.code}</div>}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Category *</CFormLabel>
                      <CFormSelect
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        invalid={!!errors.category}
                      >
                        <option value="">Select Category</option>
                        <option value="Gaji">Gaji</option>
                        <option value="Tunjangan">Tunjangan</option>
                        <option value="Potongan">Potongan</option>
                        <option value="Bonus">Bonus</option>
                        <option value="Lembur">Lembur</option>
                      </CFormSelect>
                      {errors.category && (
                        <div className="invalid-feedback d-block">{errors.category}</div>
                      )}
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Type *</CFormLabel>
                      <CFormSelect
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        invalid={!!errors.type}
                      >
                        <option value="">Select Type</option>
                        <option value="Earning">Earning (Pendapatan)</option>
                        <option value="Deduction">Deduction (Potongan)</option>
                      </CFormSelect>
                      {errors.type && <div className="invalid-feedback d-block">{errors.type}</div>}
                    </div>
                  </CCol>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel>Description</CFormLabel>
                      <CFormTextarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Describe the component purpose and calculation..."
                      />
                    </div>
                  </CCol>
                </CRow>

                {/* Status & Integration */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <h5 className="mb-3">Status & Integration</h5>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Status *</CFormLabel>
                      <CFormSelect
                        name="is_active"
                        value={formData.is_active}
                        onChange={handleInputChange}
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Integration</CFormLabel>
                      <CFormSelect
                        name="is_integration"
                        value={formData.is_integration}
                        onChange={handleInputChange}
                      >
                        <option value="0">No Integration</option>
                        <option value="1">Enable Integration</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                  {formData.is_integration === '1' && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel>Integration Code</CFormLabel>
                        <CFormInput
                          name="integration_code"
                          value={formData.integration_code}
                          onChange={handleInputChange}
                          placeholder="External system integration code"
                        />
                      </div>
                    </CCol>
                  )}
                </CRow>

                {/* Calculation Settings */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <h5 className="mb-3">Calculation Settings</h5>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Calculation Type *</CFormLabel>
                      <CFormSelect
                        name="calculation_type"
                        value={formData.calculation_type}
                        onChange={handleInputChange}
                        invalid={!!errors.calculation_type}
                      >
                        <option value="">Select Calculation Type</option>
                        <option value="manual">Manual</option>
                        <option value="auto">Automatic</option>
                      </CFormSelect>
                      {errors.calculation_type && (
                        <div className="invalid-feedback d-block">{errors.calculation_type}</div>
                      )}
                    </div>
                  </CCol>
                  {formData.calculation_type === 'auto' && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel>Calculation Formula *</CFormLabel>
                        <CFormSelect
                          name="calculation_formula"
                          value={formData.calculation_formula}
                          onChange={handleInputChange}
                          invalid={!!errors.calculation_formula}
                        >
                          <option value="">Select Formula</option>
                          {CALCULATION_FORMULAS.map((formula) => (
                            <option key={formula.value} value={formula.value}>
                              {formula.label}
                            </option>
                          ))}
                        </CFormSelect>
                        {errors.calculation_formula && (
                          <div className="invalid-feedback d-block">
                            {errors.calculation_formula}
                          </div>
                        )}
                      </div>
                    </CCol>
                  )}
                  {formData.calculation_type === 'auto' && formulaDefinition && (
                    <CCol md={12}>
                      <div className="mb-3">
                        <CFormLabel>Calculation Parameters</CFormLabel>
                        <CRow>{visibleFormulaFields.map(renderCalculationParamField)}</CRow>
                      </div>
                    </CCol>
                  )}
                </CRow>

                {/* Attendance Settings */}
                <CRow className="mt-4">
                  <CCol xs={12}>
                    <h5 className="mb-3">Attendance Settings</h5>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel>Attendance Based</CFormLabel>
                      <CFormSelect
                        name="attendance_based"
                        value={formData.attendance_based}
                        onChange={handleInputChange}
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                  {formData.attendance_based === '1' && (
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel>Attendance Type</CFormLabel>
                        <CFormSelect
                          name="attendance_type"
                          value={formData.attendance_type}
                          onChange={handleInputChange}
                        >
                          <option value="full">Full Attendance</option>
                          <option value="prorate">Prorate</option>
                          <option value="daily">Daily</option>
                        </CFormSelect>
                      </div>
                    </CCol>
                  )}
                </CRow>

                <div className="d-flex justify-content-end gap-2">
                  <CButton color="secondary" onClick={() => navigate('/components')}>
                    Cancel
                  </CButton>
                  <CButton type="submit" color="primary" disabled={saving}>
                    {saving ? (
                      <CSpinner size="sm" className="me-2" />
                    ) : (
                      <CIcon icon={cilSave} className="me-1" />
                    )}
                    {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default ComponentForm
