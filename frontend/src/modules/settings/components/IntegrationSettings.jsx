import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const IntegrationSettings = ({ integrations = [], onUpdate, saving }) => {
  const theme = useTheme()
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})

  const handleEdit = (integration) => {
    setEditingId(integration.id)
    setFormData({ ...integration })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    onUpdate(editingId, formData)
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    integration: {
      marginBottom: theme.spacing[4],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[3]
    },
    name: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900]
    },
    status: (enabled) => ({
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: enabled ? `${theme.colors.success.DEFAULT}15` : `${theme.colors.gray[200]}`,
      color: enabled ? theme.colors.success.DEFAULT : theme.colors.gray[600]
    }),
    fieldGroup: {
      marginBottom: theme.spacing[3]
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
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
      marginTop: theme.spacing[3]
    },
    button: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      border: 'none'
    },
    saveButton: {
      backgroundColor: theme.colors.success.DEFAULT,
      color: 'white'
    },
    cancelButton: {
      backgroundColor: theme.colors.gray[200],
      color: theme.colors.gray[700]
    },
    editButton: {
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      marginRight: theme.spacing[2]
    },
    empty: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    }
  }

  if (!integrations.length) {
    return (
      <div style={styles.card}>
        <div style={styles.empty}>No integrations configured.</div>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      {integrations.map(integration => (
        <div key={integration.id} style={styles.integration}>
          <div style={styles.header}>
            <span style={styles.name}>{integration.name}</span>
            <span style={styles.status(integration.enabled)}>
              {integration.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {editingId === integration.id ? (
            // Edit mode
            <div>
              {Object.entries(formData).map(([key, value]) => {
                if (key === 'id' || key === 'name') return null
                return (
                  <div key={key} style={styles.fieldGroup}>
                    <label style={styles.label}>{key}</label>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        name={key}
                        checked={formData[key]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    ) : (
                      <input
                        type="text"
                        name={key}
                        value={formData[key] || ''}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    )}
                  </div>
                )
              })}
              <div style={styles.actions}>
                <button
                  style={{ ...styles.button, ...styles.cancelButton }}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  style={{ ...styles.button, ...styles.saveButton }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div>
              {integration.apiKey && (
                <div style={styles.fieldGroup}>
                  <span style={styles.label}>API Key:</span>{' '}
                  <code>••••••••{integration.apiKey.slice(-4)}</code>
                </div>
              )}
              {integration.endpoint && (
                <div style={styles.fieldGroup}>
                  <span style={styles.label}>Endpoint:</span> {integration.endpoint}
                </div>
              )}
              <div style={styles.actions}>
                <button
                  style={{ ...styles.button, ...styles.editButton }}
                  onClick={() => handleEdit(integration)}
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default IntegrationSettings