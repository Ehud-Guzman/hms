import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const ResultEntryModal = ({ order, onClose, onSubmit }) => {
  const theme = useTheme()
  const [results, setResults] = useState({})
  const [notes, setNotes] = useState('')

  // Example fields – in a real app, you'd fetch test parameters from the test definition
  const commonFields = ['WBC', 'RBC', 'HGB', 'HCT', 'PLT', 'Glucose', 'Creatinine', 'ALT', 'AST']

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(results)
    onClose()
  }

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: theme.radius.xl,
      padding: theme.spacing[6],
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[4]
    },
    title: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: theme.colors.gray[500]
    },
    orderInfo: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[3],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4]
    },
    patientName: {
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[1]
    },
    testName: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[4]
    },
    field: {
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
    textarea: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      minHeight: '80px',
      resize: 'vertical',
      marginBottom: theme.spacing[4]
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
    cancelButton: {
      backgroundColor: theme.colors.gray[200],
      color: theme.colors.gray[700],
      ':hover': {
        backgroundColor: theme.colors.gray[300]
      }
    },
    submitButton: {
      backgroundColor: theme.colors.success.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.success.dark
      }
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Enter Results</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div style={styles.orderInfo}>
          <div style={styles.patientName}>{order.patientName}</div>
          <div style={styles.testName}>{order.testName} • {order.orderNumber}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            {commonFields.map(field => (
              <div key={field} style={styles.field}>
                <label style={styles.label}>{field}</label>
                <input
                  type="text"
                  value={results[field] || ''}
                  onChange={(e) => setResults({ ...results, [field]: e.target.value })}
                  style={styles.input}
                  placeholder="Value"
                />
              </div>
            ))}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            placeholder="Additional notes..."
          />

          <div style={styles.actions}>
            <button
              type="button"
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...styles.button, ...styles.submitButton }}
            >
              Save Results
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResultEntryModal