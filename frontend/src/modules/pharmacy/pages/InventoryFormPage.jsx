import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import pharmacyService from '../pharmacyService'

const InventoryFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    genericName: '',
    brandName: '',
    category: '',
    form: 'TAB',
    strength: '',
    unit: 'mg',
    quantityInStock: '',
    reorderLevel: '10',
    reorderQuantity: '50',
    unitPrice: '',
    sellingPrice: '',
    expiryDate: '',
    batchNo: '',
    requiresPrescription: true
  })

  const isEditMode = !!id

  useEffect(() => {
    if (isEditMode) {
      loadItem()
    }
  }, [id])

  const loadItem = async () => {
    setLoading(true)
    try {
      const data = await pharmacyService.getInventoryItem(id)
      const item = data.item
      setFormData({
        genericName: item.genericName || '',
        brandName: item.brandName || '',
        category: item.category || '',
        form: item.form || 'TAB',
        strength: item.strength || '',
        unit: item.unit || 'mg',
        quantityInStock: item.quantityInStock?.toString() || '',
        reorderLevel: item.reorderLevel?.toString() || '10',
        reorderQuantity: item.reorderQuantity?.toString() || '50',
        unitPrice: item.unitPrice?.toString() || '',
        sellingPrice: item.sellingPrice?.toString() || '',
        expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
        batchNo: item.batchNo || '',
        requiresPrescription: item.requiresPrescription ?? true
      })
    } catch (error) {
      console.error('Failed to load item:', error)
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

    // Convert price strings to numbers (cents)
    const submitData = {
      ...formData,
      unitPrice: parseInt(formData.unitPrice) * 100,
      sellingPrice: parseInt(formData.sellingPrice) * 100,
      quantityInStock: parseInt(formData.quantityInStock),
      reorderLevel: parseInt(formData.reorderLevel),
      reorderQuantity: parseInt(formData.reorderQuantity)
    }

    try {
      if (isEditMode) {
        await pharmacyService.updateInventoryItem(id, submitData)
      } else {
        await pharmacyService.createInventoryItem(submitData)
      }
      navigate('/pharmacy/inventory')
    } catch (error) {
      alert('Error saving item: ' + error.message)
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
      outline: 'none'
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
        <div style={styles.container}>
          <div>Loading item...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isEditMode ? 'Edit Medicine' : 'Add New Medicine'}
          </h1>
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/pharmacy/inventory')}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Basic Information</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Generic Name *</label>
                <input
                  type="text"
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Brand Name</label>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
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
                  placeholder="e.g., ANTIBIOTIC"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Form *</label>
                <select
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="TAB">Tablet</option>
                  <option value="CAP">Capsule</option>
                  <option value="SYR">Syrup</option>
                  <option value="INJ">Injection</option>
                  <option value="CRM">Cream</option>
                  <option value="ONT">Ointment</option>
                  <option value="DPS">Drops</option>
                  <option value="INH">Inhaler</option>
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Strength</label>
                <input
                  type="text"
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 500"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="mg">mg</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="mcg">mcg</option>
                  <option value="IU">IU</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Stock & Pricing</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Initial Stock *</label>
                <input
                  type="number"
                  name="quantityInStock"
                  value={formData.quantityInStock}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Reorder Level *</label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Reorder Quantity *</label>
                <input
                  type="number"
                  name="reorderQuantity"
                  value={formData.reorderQuantity}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Batch No.</label>
                <input
                  type="text"
                  name="batchNo"
                  value={formData.batchNo}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Pricing (KES)</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Unit Price *</label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Selling Price *</label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <div style={styles.checkbox}>
              <input
                type="checkbox"
                name="requiresPrescription"
                checked={formData.requiresPrescription}
                onChange={handleChange}
              />
              <label>Requires Prescription</label>
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Item' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default InventoryFormPage