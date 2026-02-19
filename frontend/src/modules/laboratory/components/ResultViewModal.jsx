import { useTheme } from '../../../context/ThemeContext'

const ResultViewModal = ({ order, onClose }) => {
  const theme = useTheme()

  const getAbnormalFlag = (value, reference) => {
    if (!reference || value === undefined) return null
    const num = parseFloat(value)
    if (isNaN(num)) return null

    // Simple parsing – in a real app you'd have proper ranges
    if (reference.includes('-')) {
      const [min, max] = reference.split('-').map(Number)
      if (num < min || num > max) return '⚠️ Abnormal'
    } else if (reference.startsWith('<')) {
      const max = parseFloat(reference.slice(1))
      if (num > max) return '⚠️ Abnormal'
    } else if (reference.startsWith('>')) {
      const min = parseFloat(reference.slice(1))
      if (num < min) return '⚠️ Abnormal'
    }
    return null
  }

  // Example reference ranges – in production, these would come from the test definition
  const referenceRanges = {
    WBC: '4.0-11.0',
    RBC: '4.5-5.5',
    HGB: '13.5-17.5',
    HCT: '41-53',
    PLT: '150-450',
    Glucose: '70-99',
    Creatinine: '0.6-1.2',
    ALT: '10-40',
    AST: '10-40'
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
    infoCard: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4]
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[1]
    },
    meta: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[2]
    },
    resultTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: theme.spacing[4]
    },
    th: {
      textAlign: 'left',
      padding: theme.spacing[2],
      borderBottom: `2px solid ${theme.colors.gray[200]}`,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[700]
    },
    td: {
      padding: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    abnormal: {
      color: theme.colors.danger.DEFAULT,
      fontWeight: theme.fonts.weights.bold
    },
    notes: {
      marginTop: theme.spacing[4],
      padding: theme.spacing[3],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[700]
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: theme.spacing[6]
    },
    closeBtn: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer'
    }
  }

  const resultData = order.result?.resultData || {}

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Test Results</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.patientName}>{order.patientName}</div>
          <div style={styles.meta}>
            UHID: {order.patientUhid} • {order.testName} • {order.orderNumber}
          </div>
          <div style={styles.meta}>
            Collected: {order.collectedAt ? new Date(order.collectedAt).toLocaleString() : '—'} •
            Reported: {order.completedAt ? new Date(order.completedAt).toLocaleString() : '—'}
          </div>
          {order.verifiedAt && (
            <div style={styles.meta}>
              Verified: {new Date(order.verifiedAt).toLocaleString()}
            </div>
          )}
        </div>

        {Object.keys(resultData).length > 0 ? (
          <table style={styles.resultTable}>
            <thead>
              <tr>
                <th style={styles.th}>Parameter</th>
                <th style={styles.th}>Result</th>
                <th style={styles.th}>Reference Range</th>
                <th style={styles.th}>Flag</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(resultData).map(([key, value]) => {
                if (key === 'notes') return null
                const range = referenceRanges[key] || '—'
                const flag = getAbnormalFlag(value, range)
                return (
                  <tr key={key}>
                    <td style={styles.td}>{key}</td>
                    <td style={styles.td}>{value}</td>
                    <td style={styles.td}>{range}</td>
                    <td style={{ ...styles.td, ...(flag ? styles.abnormal : {}) }}>{flag}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: theme.spacing[8], color: theme.colors.gray[500] }}>
            No result data available.
          </div>
        )}

        {order.result?.notes && (
          <div style={styles.notes}>
            <strong>Notes:</strong> {order.result.notes}
          </div>
        )}

        <div style={styles.footer}>
          <button style={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultViewModal