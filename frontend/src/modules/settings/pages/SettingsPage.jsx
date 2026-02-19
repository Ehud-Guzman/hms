// src/modules/settings/pages/SettingsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import settingsService from '../services/settingsService'

const SettingsPage = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const theme = useTheme()

  // Helper to get current hospital ID
  const getHospitalId = useCallback(() => localStorage.getItem('hospitalId'), [])

  // Load settings when hospital is available
  const loadSettings = useCallback(async () => {
     console.log('hospitalId from localStorage:', localStorage.getItem('hospitalId'));
    const hospitalId = getHospitalId()
    if (!hospitalId) {
      setError('No hospital selected. Please choose a hospital from the dropdown above.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await settingsService.getSettings()
      setSettings(data.settings)
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [getHospitalId])

  // Initial load
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Listen for hospital changes (triggered by AppLayout after selection)
  useEffect(() => {
    const handleHospitalChange = () => {
      loadSettings()
    }
    window.addEventListener('hospitalChanged', handleHospitalChange)
    return () => window.removeEventListener('hospitalChanged', handleHospitalChange)
  }, [loadSettings])

  // Categories definition (unchanged, but kept here for clarity)
  const settingCategories = [
    {
      title: 'General',
      description: 'Basic system settings',
      icon: '⚙️',
      color: theme.colors.gray[700],
      bgColor: theme.colors.gray[100],
      path: '/settings/general'
    },
    {
      title: 'Branding',
      description: 'Logo, colors, theme',
      icon: '🎨',
      color: theme.colors.purple,
      bgColor: `${theme.colors.purple}15`,
      path: '/settings/branding'
    },
    {
      title: 'Business Hours',
      description: 'Working days, holidays',
      icon: '⏰',
      color: theme.colors.primary.DEFAULT,
      bgColor: `${theme.colors.primary.DEFAULT}15`,
      path: '/settings/hours'
    },
    {
      title: 'Notifications',
      description: 'Email, SMS, templates',
      icon: '🔔',
      color: theme.colors.warning.DEFAULT,
      bgColor: `${theme.colors.warning.DEFAULT}15`,
      path: '/settings/notifications'
    },
    {
      title: 'Features',
      description: 'Enable/disable modules',
      icon: '🚀',
      color: theme.colors.success.DEFAULT,
      bgColor: `${theme.colors.success.DEFAULT}15`,
      path: '/settings/features'
    },
    {
      title: 'Backup & Restore',
      description: 'Export/import settings',
      icon: '💾',
      color: theme.colors.accent.DEFAULT,
      bgColor: `${theme.colors.accent.DEFAULT}15`,
      path: '/settings/backup'
    },
    {
      title: 'Security',
      description: 'Password policy, 2FA',
      icon: '🔒',
      color: theme.colors.danger.DEFAULT,
      bgColor: `${theme.colors.danger.DEFAULT}15`,
      path: '/settings/security'
    },
    {
      title: 'Integrations',
      description: 'API keys, webhooks',
      icon: '🔌',
      color: theme.colors.teal,
      bgColor: `${theme.colors.teal}15`,
      path: '/settings/integrations'
    },
    {
      title: 'Audit Logs',
      description: 'View system activity',
      icon: '📋',
      color: theme.colors.pink,
      bgColor: `${theme.colors.pink}15`,
      path: '/settings/audit-logs'
    }
  ]

  // Styles (slightly enhanced for better readability)
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      padding: theme.spacing[4]
    },
    header: {
      marginBottom: theme.spacing[8]
    },
    title: {
      fontSize: theme.fonts.sizes['3xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[2]
    },
    subtitle: {
      fontSize: theme.fonts.sizes.base,
      color: theme.colors.gray[600]
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: theme.spacing[5]
    },
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md,
        transform: 'translateY(-2px)'
      },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    iconWrapper: (color, bgColor) => ({
      width: '48px',
      height: '48px',
      borderRadius: theme.radius.lg,
      backgroundColor: bgColor,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      marginBottom: theme.spacing[4]
    }),
    cardTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[2]
    },
    cardDescription: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      lineHeight: 1.5
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      color: theme.colors.gray[500]
    },
    errorContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      color: theme.colors.danger.DEFAULT,
      fontWeight: theme.fonts.weights.semibold,
      textAlign: 'center',
      padding: theme.spacing[4]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.loadingContainer}>Loading settings...</div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div style={styles.errorContainer}>{error}</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Configure your hospital system</p>
        </div>

        <div style={styles.grid}>
          {settingCategories.map((category, index) => (
            <div
              key={index}
              style={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => navigate(category.path)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(category.path)}
            >
              <div style={styles.iconWrapper(category.color, category.bgColor)}>
                {category.icon}
              </div>
              <h3 style={styles.cardTitle}>{category.title}</h3>
              <p style={styles.cardDescription}>{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export default SettingsPage