import { useRef } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const BackupSettings = ({ onExport, onImport, loading }) => {
  const theme = useTheme()
  const fileInputRef = useRef()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      onImport(file)
      e.target.value = '' // reset
    }
  }

  const styles = {
    card: {
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
      marginBottom: theme.spacing[4]
    },
    description: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[4],
      lineHeight: 1.6
    },
    buttonGroup: {
      display: 'flex',
      gap: theme.spacing[4],
      alignItems: 'center'
    },
    button: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      border: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':disabled': {
        opacity: 0.6,
        cursor: 'not-allowed'
      }
    },
    exportButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white'
    },
    importButton: {
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white'
    },
    note: {
      marginTop: theme.spacing[4],
      padding: theme.spacing[3],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Export Settings</h3>
        <p style={styles.description}>
          Download a complete backup of all your system settings, including branding, business hours,
          notification templates, feature flags, and more. This file can be used to restore your settings later.
        </p>
        <div style={styles.buttonGroup}>
          <button
            onClick={onExport}
            disabled={loading}
            style={{ ...styles.button, ...styles.exportButton }}
          >
            {loading ? 'Processing...' : 'Export Settings'}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Import Settings</h3>
        <p style={styles.description}>
          Upload a previously exported backup file to restore your settings. This will overwrite all current settings.
        </p>
        <div style={styles.buttonGroup}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            style={{ ...styles.button, ...styles.importButton }}
          >
            {loading ? 'Processing...' : 'Import Settings'}
          </button>
        </div>
        <div style={styles.note}>
          <strong>Note:</strong> Importing settings will immediately apply them to your system. It's recommended to export your current settings first as a backup.
        </div>
      </div>
    </div>
  )
}

export default BackupSettings