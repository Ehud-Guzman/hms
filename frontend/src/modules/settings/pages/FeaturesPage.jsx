import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import FeatureFlagsList from '../components/FeatureFlagsList'
import settingsService from '../services/settingsService'

const FeaturesPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [features, setFeatures] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    setLoading(true)
    try {
      const data = await settingsService.getFeatures()
      setFeatures(data.features)
    } catch (error) {
      console.error('Failed to load features:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (updatedFeatures) => {
    setSaving(true)
    try {
      await settingsService.updateFeatures(updatedFeatures)
      navigate('/settings')
    } catch (error) {
      alert('Failed to update features: ' + error.message)
    } finally {
      setSaving(false)
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
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.loadingContainer}>Loading features...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Features</h1>
          <button style={styles.backButton} onClick={() => navigate('/settings')}>
            ← Back
          </button>
        </div>

        <FeatureFlagsList
          features={features}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </AppLayout>
  )
}

export default FeaturesPage