import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import BackupSettings from '../components/BackupSettings'
import settingsService from '../services/settingsService'

const BackupPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const blob = await settingsService.exportSettings()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Export failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (file) => {
    setLoading(true)
    try {
      await settingsService.importSettings(file)
      alert('Settings imported successfully')
      navigate('/settings')
    } catch (error) {
      alert('Import failed: ' + error.message)
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
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Backup & Restore</h1>
          <button style={styles.backButton} onClick={() => navigate('/settings')}>
            ← Back
          </button>
        </div>

        <BackupSettings
          onExport={handleExport}
          onImport={handleImport}
          loading={loading}
        />
      </div>
    </AppLayout>
  )
}

export default BackupPage