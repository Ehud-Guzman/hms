import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import NotificationSettingsForm from '../components/NotificationSettingsForm'
import settingsService from '../services/settingsService'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [settings, setSettings] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [settingsData, templatesData] = await Promise.all([
        settingsService.getNotificationSettings(),
        settingsService.getTemplates()
      ])
      setSettings(settingsData.settings)
      setTemplates(templatesData.templates || [])
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    setSaving(true)
    try {
      await settingsService.updateNotificationSettings(values)
      navigate('/settings')
    } catch (error) {
      alert('Failed to update notification settings: ' + error.message)
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
        <div style={styles.loadingContainer}>Loading notification settings...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Notifications</h1>
          <button style={styles.backButton} onClick={() => navigate('/settings')}>
            ← Back
          </button>
        </div>

        <NotificationSettingsForm
          initialSettings={settings}
          initialTemplates={templates}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </AppLayout>
  )
}

export default NotificationsPage