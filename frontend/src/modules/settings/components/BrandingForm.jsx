import { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import settingsService from '../services/settingsService'

const BrandingForm = ({ initialValues = {}, onSubmit, saving }) => {
  const theme = useTheme()

  // Frontend state (matches form field names)
  const [formData, setFormData] = useState({
    primaryColor: theme.colors.primary.DEFAULT,
    secondaryColor: theme.colors.secondary.DEFAULT,
    accentColor: theme.colors.accent.DEFAULT,
    logoUrl: null,
    faviconUrl: null,
    hospitalName: '',
    themeMode: 'light',
    fontFamily: 'Inter',
    borderRadius: 'md',
    mode: null,
    density: 'comfortable',
    printShowLogo: true,
    printHeaderText: null,
    printFooterText: null,
  })

  const [uploading, setUploading] = useState(false)

  // Map backend response (initialValues) to frontend state
  useEffect(() => {
    if (!initialValues || Object.keys(initialValues).length === 0) return

    setFormData({
      primaryColor: initialValues.brandPrimaryColor || theme.colors.primary.DEFAULT,
      secondaryColor: initialValues.brandSecondaryColor || theme.colors.secondary.DEFAULT,
      accentColor: initialValues.accentColor || theme.colors.accent.DEFAULT,
      logoUrl: initialValues.brandLogoUrl || null,
      faviconUrl: initialValues.faviconUrl || null,
      hospitalName: initialValues.hospitalName || '',
      themeMode: initialValues.themeKey || 'light',
      fontFamily: initialValues.fontFamily || 'Inter',
      borderRadius: initialValues.radius || 'md',
      mode: initialValues.mode,
      density: initialValues.density || 'comfortable',
      printShowLogo: initialValues.printShowLogo ?? true,
      printHeaderText: initialValues.printHeaderText,
      printFooterText: initialValues.printFooterText,
    })
  }, [initialValues, theme])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await settingsService.uploadLogo(file)
      setFormData(prev => ({ ...prev, logoUrl: data.logoUrl }))
    } catch (error) {
      alert('Failed to upload logo: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove logo?')) return
    try {
      await settingsService.removeLogo()
      setFormData(prev => ({ ...prev, logoUrl: null }))
    } catch (error) {
      alert('Failed to remove logo: ' + error.message)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Transform frontend keys to backend‑expected keys before submitting
    const payload = {
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      accentColor: formData.accentColor,
      logoUrl: formData.logoUrl,
      faviconUrl: formData.faviconUrl,
      hospitalName: formData.hospitalName,
      theme: formData.themeMode,          // frontend themeMode → backend theme
      radius: formData.borderRadius,       // frontend borderRadius → backend radius
      mode: formData.mode,
      density: formData.density,
      printShowLogo: formData.printShowLogo,
      printHeaderText: formData.printHeaderText,
      printFooterText: formData.printFooterText,
      // fontFamily is intentionally omitted – not saved on server
    }
    onSubmit(payload)
  }

  const styles = {
    form: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`,
    },
    section: {
      marginBottom: theme.spacing[6],
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
    },
    fieldGroup: {
      marginBottom: theme.spacing[4],
    },
    label: {
      display: 'block',
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700],
      marginBottom: theme.spacing[1],
    },
    input: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`,
      },
    },
    colorInput: {
      width: '100%',
      height: '40px',
      padding: theme.spacing[1],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      cursor: 'pointer',
    },
    select: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      backgroundColor: 'white',
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[4],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg,
    },
    logoPreview: {
      width: '100px',
      height: '100px',
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.gray[300]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'white',
    },
    logoImg: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
    },
    logoPlaceholder: {
      color: theme.colors.gray[400],
      fontSize: theme.fonts.sizes.sm,
      textAlign: 'center',
    },
    logoActions: {
      flex: 1,
    },
    fileInput: {
      display: 'none',
    },
    uploadButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      marginRight: theme.spacing[2],
    },
    removeButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT,
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6],
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
        cursor: 'not-allowed',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Logo & Favicon Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Logo & Favicon</h3>
        <div style={styles.logoSection}>
          <div style={styles.logoPreview}>
            {formData.logoUrl ? (
              <img
                src={`http://localhost:5001${formData.logoUrl}`}
                alt="Logo"
                style={styles.logoImg}
              />
            ) : (
              <div style={styles.logoPlaceholder}>No logo</div>
            )}
          </div>
          <div style={styles.logoActions}>
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              style={styles.fileInput}
              disabled={uploading}
            />
            <label htmlFor="logo-upload" style={styles.uploadButton}>
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </label>
            {formData.logoUrl && (
              <button
                type="button"
                style={styles.removeButton}
                onClick={handleRemoveLogo}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Colors</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme.spacing[4],
          }}
        >
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Primary</label>
            <input
              type="color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
              style={styles.colorInput}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Secondary</label>
            <input
              type="color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleChange}
              style={styles.colorInput}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Accent</label>
            <input
              type="color"
              name="accentColor"
              value={formData.accentColor}
              onChange={handleChange}
              style={styles.colorInput}
            />
          </div>
        </div>
      </div>

      {/* Theme Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Theme</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[4],
          }}
        >
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Theme Mode</label>
            <select
              name="themeMode"
              value={formData.themeMode}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Font Family</label>
            <select
              name="fontFamily"
              value={formData.fontFamily}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
            </select>
            <small style={{ color: theme.colors.gray[500], display: 'block', marginTop: 4 }}>
              (Font is not saved on server)
            </small>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Border Radius</label>
            <select
              name="borderRadius"
              value={formData.borderRadius}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="none">None</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Density</label>
            <select
              name="density"
              value={formData.density}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mode (advanced)</label>
            <input
              type="text"
              name="mode"
              value={formData.mode || ''}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., professional"
            />
          </div>
        </div>
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

export default BrandingForm