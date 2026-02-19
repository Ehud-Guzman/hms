import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, useRefreshBranding } from '../../../context/ThemeContext'
import { useAuth } from '../../../core/hooks/useAuth'
import AppLayout from '../../../core/components/layout/AppLayout'
import BrandingForm from '../components/BrandingForm'
import settingsService from '../services/settingsService'

const BrandingPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { user } = useAuth()
  const refreshBranding = useRefreshBranding()
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Get hospitalId from localStorage (or user for non‑admins)
  const hospitalId = localStorage.getItem('hospitalId') || user?.hospitalId

  useEffect(() => {
    if (!hospitalId) {
      console.warn('No hospital selected – branding cannot be loaded.')
      setLoading(false)
      return
    }
    loadBranding()
  }, [hospitalId]) 

  const loadBranding = async () => {
    setLoading(true)
    try {
      const data = await settingsService.getBranding()
     
      
      setBranding(data.branding)
      
    } catch (error) {
      console.error('Failed to load branding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    setSaving(true)
    try {
      await settingsService.updateBranding(values)
      refreshBranding() // updates the theme system‑wide
      window.dispatchEvent(new CustomEvent('brandingUpdated')) // optional, notifies other listeners
      navigate('/settings')
    } catch (error) {
      alert('Failed to update branding: ' + error.message)
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
        <div style={styles.loadingContainer}>Loading branding settings...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Branding</h1>
          <button style={styles.backButton} onClick={() => navigate('/settings')}>
            ← Back
          </button>
        </div>

        <BrandingForm
          key={branding ? branding.brandPrimaryColor : 'loading'}
          initialValues={branding}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </AppLayout>
  )
}

export default BrandingPage