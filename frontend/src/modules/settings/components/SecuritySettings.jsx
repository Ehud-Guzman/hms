import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const SecuritySettings = ({ initialValues = {}, onSubmit, saving }) => {
  const theme = useTheme()
  const [settings, setSettings] = useState({
    passwordMinLength: initialValues.passwordMinLength || 8,
    passwordRequireNumbers: initialValues.passwordRequireNumbers ?? true,
    passwordRequireSpecial: initialValues.passwordRequireSpecial ?? false,
    maxLoginAttempts: initialValues.maxLoginAttempts || 5,
    lockoutDuration: initialValues.lockoutDuration || 30,
    sessionTimeout: initialValues.sessionTimeout || 60,
    twoFactorAuth: initialValues.twoFactorAuth ?? false,
    ipWhitelist: initialValues.ipWhitelist || [],
    ...initialValues
  })

  const [newIp, setNewIp] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addIp = () => {
    if (newIp && !settings.ipWhitelist.includes(newIp)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp]
      }))
      setNewIp('')
    }
  }

  const removeIp = (ip) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(settings)
  }

  const styles = {
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
      fontSize: theme.fonts.sizes.base
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[2]
    },
    ipRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[2],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
    },
    ipAddress: {
      flex: 1,
      fontFamily: theme.fonts.mono,
      fontSize: theme.fonts.sizes.sm
    },
    removeButton: {
      background: 'none',
      border: 'none',
      color: theme.colors.danger.DEFAULT,
      cursor: 'pointer',
      fontSize: '18px'
    },
    addIpRow: {
      display: 'flex',
      gap: theme.spacing[2],
      marginTop: theme.spacing[2]
    },
    addButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
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
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Password Policy</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Minimum Length</label>
          <input
            type="number"
            name="passwordMinLength"
            value={settings.passwordMinLength}
            onChange={handleChange}
            style={styles.input}
            min="4"
            max="20"
          />
        </div>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            name="passwordRequireNumbers"
            checked={settings.passwordRequireNumbers}
            onChange={handleChange}
          />
          <label>Require at least one number</label>
        </div>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            name="passwordRequireSpecial"
            checked={settings.passwordRequireSpecial}
            onChange={handleChange}
          />
          <label>Require at least one special character</label>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Login Security</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Max Login Attempts</label>
          <input
            type="number"
            name="maxLoginAttempts"
            value={settings.maxLoginAttempts}
            onChange={handleChange}
            style={styles.input}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Lockout Duration (minutes)</label>
          <input
            type="number"
            name="lockoutDuration"
            value={settings.lockoutDuration}
            onChange={handleChange}
            style={styles.input}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Session Timeout (minutes)</label>
          <input
            type="number"
            name="sessionTimeout"
            value={settings.sessionTimeout}
            onChange={handleChange}
            style={styles.input}
          />
        </div>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            name="twoFactorAuth"
            checked={settings.twoFactorAuth}
            onChange={handleChange}
          />
          <label>Enable Two-Factor Authentication</label>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>IP Whitelist</h3>
        <p style={{ fontSize: theme.fonts.sizes.sm, color: theme.colors.gray[600], marginBottom: theme.spacing[3] }}>
          Only allow access from these IP addresses (leave empty to allow all).
        </p>
        {settings.ipWhitelist.map((ip, index) => (
          <div key={index} style={styles.ipRow}>
            <span style={styles.ipAddress}>{ip}</span>
            <button type="button" style={styles.removeButton} onClick={() => removeIp(ip)}>✕</button>
          </div>
        ))}
        <div style={styles.addIpRow}>
          <input
            type="text"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="e.g., 192.168.1.100"
            style={styles.input}
          />
          <button type="button" style={styles.addButton} onClick={addIp}>Add</button>
        </div>
      </div>

      <div style={styles.actions}>
        <button type="submit" disabled={saving} style={styles.submitButton}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default SecuritySettings