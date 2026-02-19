import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const featureCategories = [
  {
    name: 'Core Modules',
    features: [
      { key: 'patients', label: 'Patients' },
      { key: 'doctors', label: 'Doctors' },
      { key: 'appointments', label: 'Appointments' },
      { key: 'pharmacy', label: 'Pharmacy' },
      { key: 'laboratory', label: 'Laboratory' },
      { key: 'vitals', label: 'Vitals' },
      { key: 'billing', label: 'Billing' },
      { key: 'admissions', label: 'Admissions' },
      { key: 'medicalRecords', label: 'Medical Records' }
    ]
  },
  {
    name: 'Advanced Features',
    features: [
      { key: 'patientPortal', label: 'Patient Portal' },
      { key: 'telemedicine', label: 'Telemedicine' },
      { key: 'reports', label: 'Advanced Reports' },
      { key: 'insurance', label: 'Insurance Management' },
      { key: 'inventory', label: 'Inventory Management' }
    ]
  }
]

const FeatureFlagsList = ({ features = {}, onSubmit, saving }) => {
  const theme = useTheme()
  const [localFeatures, setLocalFeatures] = useState(features)

  const handleToggle = (key) => {
    setLocalFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(localFeatures)
  }

  const styles = {
    form: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    category: {
      marginBottom: theme.spacing[6]
    },
    categoryTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: theme.spacing[4]
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer'
    },
    label: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700],
      cursor: 'pointer'
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
      ':disabled': {
        opacity: 0.6,
        cursor: 'not-allowed'
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {featureCategories.map(cat => (
        <div key={cat.name} style={styles.category}>
          <h3 style={styles.categoryTitle}>{cat.name}</h3>
          <div style={styles.grid}>
            {cat.features.map(f => (
              <div key={f.key} style={styles.featureItem}>
                <input
                  type="checkbox"
                  id={f.key}
                  checked={!!localFeatures[f.key]}
                  onChange={() => handleToggle(f.key)}
                  style={styles.checkbox}
                />
                <label htmlFor={f.key} style={styles.label}>{f.label}</label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={styles.actions}>
        <button type="submit" disabled={saving} style={styles.submitButton}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default FeatureFlagsList