import { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const VitalsForm = ({ initialData = {}, patientId, appointmentId, onSubmit, onCancel }) => {
  const theme = useTheme()
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    appointmentId: appointmentId || '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    painScore: '',
    consciousness: 'ALERT',
    notes: '',
    ...initialData
  })

  const [calculatedBmi, setCalculatedBmi] = useState(null)

  useEffect(() => {
    if (formData.weight && formData.height) {
      const heightInM = formData.height / 100
      const bmi = (formData.weight / (heightInM * heightInM)).toFixed(1)
      setCalculatedBmi(bmi)
    } else {
      setCalculatedBmi(null)
    }
  }, [formData.weight, formData.height])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const styles = {
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[4]
    },
    section: {
      marginBottom: theme.spacing[4]
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[3],
      paddingBottom: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: theme.spacing[4]
    },
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
      fontSize: theme.fonts.sizes.sm,
      outline: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`
      }
    },
    select: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      backgroundColor: 'white'
    },
    textarea: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      minHeight: '80px',
      resize: 'vertical'
    },
    bmiDisplay: {
      marginTop: theme.spacing[2],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[700]
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[3],
      marginTop: theme.spacing[4]
    },
    button: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      border: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    submitButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      }
    },
    cancelButton: {
      backgroundColor: theme.colors.gray[200],
      color: theme.colors.gray[700],
      ':hover': {
        backgroundColor: theme.colors.gray[300]
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Vital Signs */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Vital Signs</h3>
        <div style={styles.grid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>BP Systolic (mmHg)</label>
            <input
              type="number"
              name="bloodPressureSystolic"
              value={formData.bloodPressureSystolic}
              onChange={handleChange}
              style={styles.input}
              placeholder="120"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>BP Diastolic (mmHg)</label>
            <input
              type="number"
              name="bloodPressureDiastolic"
              value={formData.bloodPressureDiastolic}
              onChange={handleChange}
              style={styles.input}
              placeholder="80"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Heart Rate (bpm)</label>
            <input
              type="number"
              name="heartRate"
              value={formData.heartRate}
              onChange={handleChange}
              style={styles.input}
              placeholder="72"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              style={styles.input}
              placeholder="36.6"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Respiratory Rate</label>
            <input
              type="number"
              name="respiratoryRate"
              value={formData.respiratoryRate}
              onChange={handleChange}
              style={styles.input}
              placeholder="16"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>O2 Saturation (%)</label>
            <input
              type="number"
              name="oxygenSaturation"
              value={formData.oxygenSaturation}
              onChange={handleChange}
              style={styles.input}
              placeholder="98"
            />
          </div>
        </div>
      </div>

      {/* Anthropometrics */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Anthropometrics</h3>
        <div style={styles.grid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              style={styles.input}
              placeholder="70.5"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Height (cm)</label>
            <input
              type="number"
              step="0.1"
              name="height"
              value={formData.height}
              onChange={handleChange}
              style={styles.input}
              placeholder="175"
            />
          </div>
        </div>
        {calculatedBmi && (
          <div style={styles.bmiDisplay}>
            <strong>BMI:</strong> {calculatedBmi}
          </div>
        )}
      </div>

      {/* Pain & Consciousness */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Pain & Consciousness</h3>
        <div style={styles.grid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Pain Score (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              name="painScore"
              value={formData.painScore}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Consciousness</label>
            <select
              name="consciousness"
              value={formData.consciousness}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="ALERT">Alert</option>
              <option value="CONFUSED">Confused</option>
              <option value="VOICE">Responds to Voice</option>
              <option value="PAIN">Responds to Pain</option>
              <option value="UNRESPONSIVE">Unresponsive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Notes</h3>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          style={styles.textarea}
          placeholder="Additional observations..."
        />
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          type="button"
          style={{ ...styles.button, ...styles.cancelButton }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ ...styles.button, ...styles.submitButton }}
        >
          Save Vitals
        </button>
      </div>
    </form>
  )
}

export default VitalsForm