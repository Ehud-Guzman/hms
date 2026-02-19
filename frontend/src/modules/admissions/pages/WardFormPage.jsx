import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import admissionsService from '../services/admissionsService'

const WardFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'GENERAL',
    location: '',
    totalBeds: '',
    phone: ''
  })

  const isEditMode = !!id

  useEffect(() => {
    if (isEditMode) {
      loadWard()
    }
  }, [id])

  const loadWard = async () => {
    setLoading(true)
    try {
      const data = await admissionsService.getWard(id)
      const ward = data.ward
      setFormData({
        name: ward.name || '',
        code: ward.code || '',
        type: ward.type || 'GENERAL',
        location: ward.location || '',
        totalBeds: ward.totalBeds?.toString() || '',
        phone: ward.phone || ''
      })
    } catch (error) {
      console.error('Failed to load ward:', error)
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
    try {
      if (isEditMode) {
        await admissionsService.updateWard(id, formData)
      } else {
        await admissionsService.createWard(formData)
      }
      navigate('/admissions/wards')
    } catch (error) {
      alert('Error saving ward: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      maxWidth: '600px',
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
      backgroundColor: 'white'
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6]
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
        <div style={styles.container}>Loading ward...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{isEditMode ? 'Edit Ward' : 'New Ward'}</h1>
          <button style={styles.cancelButton} onClick={() => navigate('/admissions/wards')}>
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Ward Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Ward Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Type</label>
            <select name="type" value={formData.type} onChange={handleChange} style={styles.select}>
              <option value="GENERAL">General</option>
              <option value="ICU">ICU</option>
              <option value="PRIVATE">Private</option>
              <option value="MATERNITY">Maternity</option>
              <option value="PEDIATRICS">Pediatrics</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., Floor 2, East Wing"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Total Beds *</label>
            <input
              type="number"
              name="totalBeds"
              value={formData.totalBeds}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Phone (ext)</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.actions}>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Ward' : 'Create Ward')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default WardFormPage