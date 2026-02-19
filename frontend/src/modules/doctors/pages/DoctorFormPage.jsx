import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import { useOfflineData } from '../../../hooks/useOfflineData'
import doctorsService from '../services/doctorsService'

const DoctorFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    specialty: '',
    licenseNo: '',
    phone: '',
    qualification: '',
    experience: '',
    consultationFee: ''
  })

  const isEditMode = !!id

  const { create, update } = useOfflineData('doctors', doctorsService.getDoctors)

  useEffect(() => {
    if (isEditMode) {
      loadDoctor()
    }
  }, [id])

  const loadDoctor = async () => {
    setLoading(true)
    try {
      const data = await doctorsService.getDoctor(id)
      const doctor = data.doctor
      setFormData({
        firstName: doctor.firstName || '',
        lastName: doctor.lastName || '',
        email: doctor.user?.email || '',
        password: '',
        specialty: doctor.specialty || '',
        licenseNo: doctor.licenseNo || '',
        phone: doctor.phone || '',
        qualification: doctor.qualification || '',
        experience: doctor.experience?.toString() || '',
        consultationFee: doctor.consultationFee?.toString() || ''
      })
    } catch (error) {
      console.error('Failed to load doctor:', error)
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
      experience: formData.experience ? parseInt(formData.experience) : null,
      consultationFee: formData.consultationFee ? parseInt(formData.consultationFee) * 100 : null
    }

    try {
      if (isEditMode) {
        await update(id, submitData)
      } else {
        await create(submitData)
      }
      navigate('/doctors')
    } catch (error) {
      alert('Error saving doctor: ' + error.message)
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
        <div style={styles.container}>
          <div>Loading doctor data...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isEditMode ? 'Edit Doctor' : 'Add New Doctor'}
          </h1>
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/doctors')}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Account Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Account Information</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  required={!isEditMode}
                  disabled={isEditMode}
                />
              </div>
              {!isEditMode && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.input}
                    required={!isEditMode}
                  />
                </div>
              )}
            </div>
          </div>

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
                <label style={styles.label}>Specialty</label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Cardiology"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>License Number</label>
                <input
                  type="text"
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
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
                <label style={styles.label}>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., MD, FACC"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Experience (years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Consultation Fee (KES)</label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
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
              onClick={() => navigate('/doctors')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Doctor' : 'Create Doctor')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default DoctorFormPage