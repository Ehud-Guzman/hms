import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const GeneralSettingsForm = ({ initialValues = {}, onSubmit, saving }) => {
  const theme = useTheme()
  const [formData, setFormData] = useState({
    hospitalName: initialValues.hospitalName || '',
    hospitalCode: initialValues.hospitalCode || '',
    contactEmail: initialValues.contactEmail || '',
    contactPhone: initialValues.contactPhone || '',
    address: initialValues.address || '',
    defaultSlotDuration: initialValues.defaultSlotDuration || 15,
    allowWalkIns: initialValues.allowWalkIns ?? true,
    requirePrepayment: initialValues.requirePrepayment ?? false,
    allowOnlineBooking: initialValues.allowOnlineBooking ?? true,
    maxAdvanceBooking: initialValues.maxAdvanceBooking || 30,
    taxRate: initialValues.taxRate || 16,
    currency: initialValues.currency || 'KES',
    timezone: initialValues.timezone || 'Africa/Nairobi',
    dateFormat: initialValues.dateFormat || 'DD/MM/YYYY',
    ...initialValues
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4]
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
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`
      }
    },
    select: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      backgroundColor: 'white'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[2]
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
        <h3 style={styles.sectionTitle}>Hospital Information</h3>
        <div style={styles.grid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Hospital Name</label>
            <input
              type="text"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Hospital Code</label>
            <input
              type="text"
              name="hospitalCode"
              value={formData.hospitalCode}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Contact Phone</label>
            <input
              type="text"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Appointment Settings</h3>
        <div style={styles.grid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Default Slot Duration (min)</label>
            <input
              type="number"
              name="defaultSlotDuration"
              value={formData.defaultSlotDuration}
              onChange={handleChange}
              style={styles.input}
              min="5"
              max="60"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Max Advance Booking (days)</label>
            <input
              type="number"
              name="maxAdvanceBooking"
              value={formData.maxAdvanceBooking}
              onChange={handleChange}
              style={styles.input}
              min="1"
              max="365"
            />
          </div>
        </div>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            name="allowWalkIns"
            checked={formData.allowWalkIns}
            onChange={handleChange}
          />
          <label>Allow Walk‑in Appointments</label>
        </div>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            name="requirePrepayment"
            checked={formData.requirePrepayment}
            onChange={handleChange}
          />
          <label>Require Prepayment for Online Bookings</label>
        </div>
        <div style={styles.checkbox}>
          <input
            type="checkbox"
            name="allowOnlineBooking"
            checked={formData.allowOnlineBooking}
            onChange={handleChange}
          />
          <label>Allow Online Booking</label>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Financial Settings</h3>
        <div style={styles.grid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Tax Rate (%)</label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              style={styles.input}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Currency</label>
            <select name="currency" value={formData.currency} onChange={handleChange} style={styles.select}>
              <option value="KES">KES (Kenya Shilling)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Regional Settings</h3>
        <div style={styles.grid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Timezone</label>
            <select name="timezone" value={formData.timezone} onChange={handleChange} style={styles.select}>
              <option value="Africa/Nairobi">Nairobi (EAT)</option>
              <option value="Africa/Lagos">Lagos (WAT)</option>
              <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="America/New_York">New York (EST/EDT)</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Date Format</label>
            <select name="dateFormat" value={formData.dateFormat} onChange={handleChange} style={styles.select}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
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

export default GeneralSettingsForm