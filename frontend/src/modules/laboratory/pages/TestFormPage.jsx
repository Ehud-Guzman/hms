import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import laboratoryService from '../services/laboratoryService'

const TestFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    sampleType: 'Blood',
    price: '',
    isActive: true
  })

  const isEditMode = !!id

  useEffect(() => {
    if (isEditMode) {
      loadTest()
    }
  }, [id])

  const loadTest = async () => {
    setLoading(true)
    try {
      const data = await laboratoryService.getTest(id)
      const test = data.test
      setFormData({
        name: test.name || '',
        code: test.code || '',
        category: test.category || '',
        description: test.description || '',
        sampleType: test.sampleType || 'Blood',
        price: test.price ? (test.price / 100).toString() : '',
        isActive: test.isActive ?? true
      })
    } catch (error) {
      console.error('Failed to load test:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitData = {
      ...formData,
      price: formData.price ? parseInt(formData.price) * 100 : null
    }

    try {
      if (isEditMode) {
        await laboratoryService.updateTest(id, submitData)
      } else {
        await laboratoryService.createTest(submitData)
      }
      navigate('/laboratory/tests')
    } catch (error) {
      alert('Error saving test: ' + error.message)
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
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginTop: theme.spacing[2]
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
        <div style={styles.container}>Loading test...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isEditMode ? 'Edit Test' : 'New Test'}
          </h1>
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/laboratory/tests')}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Test Name *</label>
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
            <label style={styles.label}>Test Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., HEMATOLOGY"
            />
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
              <option value="Tissue">Tissue</option>
              <option value="CSF">CSF</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Price (KES)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>

          <div style={styles.checkbox}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <label>Active</label>
          </div>

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Test' : 'Create Test')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default TestFormPage