import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import laboratoryService from '../services/laboratoryService'
import patientsService from '../../patients/services/patientsService'
import doctorsService from '../../doctors/services/doctorsService'

const OrderFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [tests, setTests] = useState([])
  const [searchPatient, setSearchPatient] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    testId: '',
    priority: 'ROUTINE',
    clinicalNotes: '',
    indication: '',
    sampleType: 'Blood'
  })

  const isEditMode = !!id

  useEffect(() => {
    loadPatients()
    loadDoctors()
    loadTests()
    if (isEditMode) {
      loadOrder()
    }
  }, [id])

  const loadPatients = async () => {
    try {
      const data = await patientsService.getPatients({ limit: 100 })
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Failed to load patients:', error)
    }
  }

  const loadDoctors = async () => {
    try {
      const data = await doctorsService.getDoctors({ limit: 100 })
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Failed to load doctors:', error)
    }
  }

  const loadTests = async () => {
    try {
      const data = await laboratoryService.getTests({ limit: 100 })
      setTests(data.tests || [])
    } catch (error) {
      console.error('Failed to load tests:', error)
    }
  }

  const loadOrder = async () => {
    setLoading(true)
    try {
      const data = await laboratoryService.getOrder(id)
      const order = data.order
      setFormData({
        patientId: order.patientId || '',
        doctorId: order.doctorId || '',
        testId: order.testId || '',
        priority: order.priority || 'ROUTINE',
        clinicalNotes: order.clinicalNotes || '',
        indication: order.indication || '',
        sampleType: order.sampleType || 'Blood'
      })
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.uhid?.toLowerCase().includes(searchPatient.toLowerCase())
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditMode) {
        await laboratoryService.updateOrderStatus(id, formData) // might need specific update endpoint
      } else {
        await laboratoryService.createOrder(formData)
      }
      navigate('/laboratory/orders')
    } catch (error) {
      alert('Error saving order: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[6]
    },
    title: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    cancelButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    form: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    section: {
      marginBottom: theme.spacing[6]
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    fieldGroup: {
      marginBottom: theme.spacing[4]
    },
    label: {
      display: 'block',
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700],
      marginBottom: theme.spacing[1]
    },
    input: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`
      }
    },
    select: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      backgroundColor: 'white',
      outline: 'none'
    },
    textarea: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical'
    },
    searchWrapper: {
      position: 'relative'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: `1px solid ${theme.colors.gray[200]}`,
      borderRadius: theme.radius.md,
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: theme.shadows.md
    },
    dropdownItem: {
      padding: theme.spacing[2],
      cursor: 'pointer',
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':hover': {
        backgroundColor: theme.colors.gray[50]
      },
      ':last-child': {
        borderBottom: 'none'
      }
    },
    radioGroup: {
      display: 'flex',
      gap: theme.spacing[4],
      marginTop: theme.spacing[2]
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[1],
      fontSize: theme.fonts.sizes.sm
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6],
      paddingTop: theme.spacing[6],
      borderTop: `1px solid ${theme.colors.gray[200]}`
    },
    submitButton: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      },
      ':disabled': {
        opacity: 0.6,
        cursor: 'not-allowed'
      }
    }
  }

  if (loading && isEditMode) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading order...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isEditMode ? 'Edit Order' : 'New Lab Order'}
          </h1>
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/laboratory/orders')}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Patient & Doctor</h2>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Patient</label>
              <div style={styles.searchWrapper}>
                <input
                  type="text"
                  value={searchPatient}
                  onChange={(e) => {
                    setSearchPatient(e.target.value)
                    setShowPatientDropdown(true)
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  style={styles.input}
                  placeholder="Search patient by name or UHID"
                  required
                />
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div style={styles.dropdown}>
                    {filteredPatients.slice(0, 5).map(patient => (
                      <div
                        key={patient.id}
                        style={styles.dropdownItem}
                        onClick={() => {
                          setFormData({ ...formData, patientId: patient.id })
                          setSearchPatient(`${patient.firstName} ${patient.lastName}`)
                          setShowPatientDropdown(false)
                        }}
                      >
                        <div>{patient.firstName} {patient.lastName}</div>
                        <div style={{ fontSize: theme.fonts.sizes.xs, color: theme.colors.gray[500] }}>
                          UHID: {patient.uhid}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Doctor</label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Test Details</h2>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Test</label>
              <select
                name="testId"
                value={formData.testId}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select Test</option>
                {tests.map(test => (
                  <option key={test.id} value={test.id}>
                    {test.name} ({test.code}) - KES {test.price ? test.price / 100 : '—'}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Priority</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priority"
                    value="ROUTINE"
                    checked={formData.priority === 'ROUTINE'}
                    onChange={handleChange}
                  />
                  Routine
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priority"
                    value="URGENT"
                    checked={formData.priority === 'URGENT'}
                    onChange={handleChange}
                  />
                  Urgent
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priority"
                    value="STAT"
                    checked={formData.priority === 'STAT'}
                    onChange={handleChange}
                  />
                  STAT
                </label>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Sample Type</label>
              <select
                name="sampleType"
                value={formData.sampleType}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="Blood">Blood</option>
                <option value="Urine">Urine</option>
                <option value="Stool">Stool</option>
                <option value="Sputum">Sputum</option>
                <option value="Swab">Swab</option>
              </select>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Clinical Information</h2>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Clinical Notes</label>
              <textarea
                name="clinicalNotes"
                value={formData.clinicalNotes}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Relevant clinical information..."
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Indication</label>
              <input
                type="text"
                name="indication"
                value={formData.indication}
                onChange={handleChange}
                style={styles.input}
                placeholder="Reason for test..."
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default OrderFormPage