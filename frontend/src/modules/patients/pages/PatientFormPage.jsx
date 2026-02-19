import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import { useOfflineData } from '../../../hooks/useOfflineData'
import patientsService from '../services/patientsService'

const PatientFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    allergies: '',
    chronicConditions: '',
    insuranceProvider: '',
    insurancePolicyNo: ''
  })

  const isEditMode = !!id

  // Use the offline hook – we only need the create/update methods
  const { create, update } = useOfflineData('patients', patientsService.getPatients)

  // For edit mode, load existing patient data
  useEffect(() => {
    if (isEditMode) {
      loadPatient()
    }
  }, [id])

  const loadPatient = async () => {
    setLoading(true)
    try {
      const data = await patientsService.getPatient(id)
      const patient = data.patient
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        gender: patient.gender || '',
        dob: patient.dob ? patient.dob.split('T')[0] : '',
        bloodGroup: patient.bloodGroup || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactPhone: patient.emergencyContactPhone || '',
        emergencyContactRelation: patient.emergencyContactRelation || '',
        allergies: patient.allergies ? (Array.isArray(patient.allergies) ? patient.allergies.join(', ') : '') : '',
        chronicConditions: patient.chronicConditions ? (Array.isArray(patient.chronicConditions) ? patient.chronicConditions.join(', ') : '') : '',
        insuranceProvider: patient.insuranceProvider || '',
        insurancePolicyNo: patient.insurancePolicyNo || ''
      })
    } catch (error) {
      console.error('Failed to load patient:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitData = {
      ...formData,
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : []
    }

    try {
      if (isEditMode) {
        await update(id, submitData)
      } else {
        await create(submitData)
      }
      navigate('/patients')
    } catch (error) {
      alert('Error saving patient: ' + error.message)
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
      cursor: 'pointer',
      marginRight: theme.spacing[2]
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4]
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
      cursor: 'pointer'
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

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

  if (loading && isEditMode) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Loading patient data...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isEditMode ? 'Edit Patient' : 'Add New Patient'}
          </h1>
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/patients')}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Personal Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Personal Information</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Contact Information</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Emergency Contact</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Relation</label>
                <input
                  type="text"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Medical Information</h2>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Allergies (comma separated)</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="e.g., Penicillin, Peanuts, Latex"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Chronic Conditions (comma separated)</label>
              <textarea
                name="chronicConditions"
                value={formData.chronicConditions}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="e.g., Hypertension, Diabetes, Asthma"
              />
            </div>
          </div>

          {/* Insurance Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Insurance Information</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Provider</label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Policy Number</label>
                <input
                  type="text"
                  name="insurancePolicyNo"
                  value={formData.insurancePolicyNo}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => navigate('/patients')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Patient' : 'Create Patient')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default PatientFormPage