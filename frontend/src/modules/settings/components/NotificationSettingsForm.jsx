import { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const NotificationSettingsForm = ({ initialSettings = {}, initialTemplates = [], onSubmit, saving }) => {
  const theme = useTheme()

  // Initialize settings with defaults + incoming props
  const [settings, setSettings] = useState({
    email: {
      enabled: initialSettings.email?.enabled ?? true,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: ''
    },
    sms: {
      enabled: initialSettings.sms?.enabled ?? false,
      provider: 'africastalking',
      apiKey: '',
      senderId: ''
    },
    ...initialSettings
  })

  // Ensure templates is always an array
  const [templates, setTemplates] = useState(() =>
    Array.isArray(initialTemplates) ? initialTemplates : []
  )
  const [activeTemplate, setActiveTemplate] = useState(null)

  // Sync templates when the prop changes (e.g., after async load)
  useEffect(() => {
    setTemplates(Array.isArray(initialTemplates) ? initialTemplates : [])
  }, [initialTemplates])

  const handleSettingChange = (type, field, value) => {
    setSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }))
  }

  const handleTemplateChange = (id, field, value) => {
    setTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    )
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
    templateCard: {
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4],
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.gray[100]
      }
    },
    templateHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[2]
    },
    templateName: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900]
    },
    templateExpanded: {
      marginTop: theme.spacing[4],
      padding: theme.spacing[4],
      backgroundColor: 'white',
      borderRadius: theme.radius.md
    },
    textarea: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'monospace'
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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ settings, templates })
      }}
      style={styles.form}
    >
      {/* Email Settings Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Email Settings</h3>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            id="emailEnabled"
            checked={settings.email.enabled}
            onChange={(e) => handleSettingChange('email', 'enabled', e.target.checked)}
          />
          <label htmlFor="emailEnabled">Enable Email Notifications</label>
        </div>
        {settings.email.enabled && (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="smtpHost">SMTP Host</label>
              <input
                id="smtpHost"
                type="text"
                value={settings.email.smtpHost}
                onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="smtpPort">SMTP Port</label>
              <input
                id="smtpPort"
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => handleSettingChange('email', 'smtpPort', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="smtpUser">SMTP User</label>
              <input
                id="smtpUser"
                type="text"
                value={settings.email.smtpUser}
                onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="smtpPass">SMTP Password</label>
              <input
                id="smtpPass"
                type="password"
                value={settings.email.smtpPass}
                onChange={(e) => handleSettingChange('email', 'smtpPass', e.target.value)}
                style={styles.input}
              />
            </div>
          </>
        )}
      </div>

      {/* SMS Settings Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>SMS Settings</h3>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            id="smsEnabled"
            checked={settings.sms.enabled}
            onChange={(e) => handleSettingChange('sms', 'enabled', e.target.checked)}
          />
          <label htmlFor="smsEnabled">Enable SMS Notifications</label>
        </div>
        {settings.sms.enabled && (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="smsProvider">Provider</label>
              <select
                id="smsProvider"
                value={settings.sms.provider}
                onChange={(e) => handleSettingChange('sms', 'provider', e.target.value)}
                style={styles.input}
              >
                <option value="africastalking">Africa's Talking</option>
                <option value="twilio">Twilio</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="smsApiKey">API Key</label>
              <input
                id="smsApiKey"
                type="text"
                value={settings.sms.apiKey}
                onChange={(e) => handleSettingChange('sms', 'apiKey', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="smsSenderId">Sender ID</label>
              <input
                id="smsSenderId"
                type="text"
                value={settings.sms.senderId}
                onChange={(e) => handleSettingChange('sms', 'senderId', e.target.value)}
                style={styles.input}
              />
            </div>
          </>
        )}
      </div>

      {/* Templates Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Templates</h3>
        {templates.length === 0 ? (
          <p style={{ color: theme.colors.gray[500] }}>No templates available.</p>
        ) : (
          templates.map(template => (
            <div
              key={template.id}
              style={styles.templateCard}
              onClick={() => setActiveTemplate(activeTemplate === template.id ? null : template.id)}
            >
              <div style={styles.templateHeader}>
                <span style={styles.templateName}>{template.name}</span>
                <span>{activeTemplate === template.id ? '▼' : '▶'}</span>
              </div>
              {activeTemplate === template.id && (
                <div style={styles.templateExpanded} onClick={e => e.stopPropagation()}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label} htmlFor={`subject-${template.id}`}>Subject</label>
                    <input
                      id={`subject-${template.id}`}
                      type="text"
                      value={template.subject || ''}
                      onChange={(e) => handleTemplateChange(template.id, 'subject', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label} htmlFor={`body-${template.id}`}>Body</label>
                    <textarea
                      id={`body-${template.id}`}
                      value={template.body || ''}
                      onChange={(e) => handleTemplateChange(template.id, 'body', e.target.value)}
                      style={styles.textarea}
                    />
                  </div>
                  <div style={{ fontSize: theme.fonts.sizes.xs, color: theme.colors.gray[500] }}>
                    Available variables: {'{{patientName}}'}, {'{{date}}'}, {'{{time}}'}, {'{{doctor}}'}, etc.
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form Actions */}
      <div style={styles.actions}>
        <button type="submit" disabled={saving} style={styles.submitButton}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default NotificationSettingsForm