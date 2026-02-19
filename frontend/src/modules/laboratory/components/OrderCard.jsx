import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import ResultEntryModal from './ResultEntryModal'
import ResultViewModal from './ResultViewModal'

const OrderCard = ({ order, onStatusUpdate }) => {
  const theme = useTheme()
  const [showResultsEntry, setShowResultsEntry] = useState(false)
  const [showResultView, setShowResultView] = useState(false)
  const [showCollect, setShowCollect] = useState(false)
  const [sampleData, setSampleData] = useState({ sampleId: '', sampleType: order.sampleType || 'Blood' })

  const getPriorityColor = (priority) => {
    const colors = {
      STAT: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT },
      URGENT: { bg: `${theme.colors.warning.DEFAULT}10`, text: theme.colors.warning.DEFAULT },
      ROUTINE: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT }
    }
    return colors[priority] || colors.ROUTINE
  }

  const getStatusColor = (status) => {
    const colors = {
      ORDERED: { bg: theme.colors.gray[200], text: theme.colors.gray[700] },
      COLLECTED: { bg: `${theme.colors.accent.DEFAULT}10`, text: theme.colors.accent.DEFAULT },
      PROCESSING: { bg: `${theme.colors.primary.DEFAULT}10`, text: theme.colors.primary.DEFAULT },
      COMPLETED: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT },
      CANCELLED: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT }
    }
    return colors[status] || colors.ORDERED
  }

  const priorityStyle = getPriorityColor(order.priority)
  const statusStyle = getStatusColor(order.status)

  const handleCollect = () => {
    onStatusUpdate(order.id, 'COLLECTED', sampleData)
    setShowCollect(false)
  }

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[5],
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing[3]
    },
    orderNumber: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      fontFamily: theme.fonts.mono
    },
    priority: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: priorityStyle.bg,
      color: priorityStyle.text
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    patientUhid: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[2]
    },
    testInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[3],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
    },
    testName: {
      fontWeight: theme.fonts.weights.medium
    },
    doctor: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[2]
    },
    details: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[4]
    },
    detailItem: {
      fontSize: theme.fonts.sizes.sm
    },
    detailLabel: {
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[0.5]
    },
    detailValue: {
      color: theme.colors.gray[900],
      fontWeight: theme.fonts.weights.medium
    },
    status: {
      display: 'inline-block',
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: statusStyle.bg,
      color: statusStyle.text
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
      borderTop: `1px solid ${theme.colors.gray[200]}`,
      paddingTop: theme.spacing[4],
      marginTop: theme.spacing[2]
    },
    button: {
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      border: 'none'
    },
    collectButton: {
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.accent.dark
      }
    },
    processButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      }
    },
    resultButton: {
      backgroundColor: theme.colors.success.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.success.dark
      }
    },
    cancelButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.danger.DEFAULT}20`
      }
    },
    sampleForm: {
      marginTop: theme.spacing[4],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg
    },
    sampleField: {
      marginBottom: theme.spacing[3]
    },
    sampleLabel: {
      display: 'block',
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[1]
    },
    sampleInput: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm
    },
    sampleActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
      marginTop: theme.spacing[2]
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.orderNumber}>{order.orderNumber}</span>
        <span style={styles.priority}>{order.priority}</span>
      </div>

      <h3 style={styles.patientName}>{order.patientName}</h3>
      <div style={styles.patientUhid}>UHID: {order.patientUhid}</div>

      <div style={styles.testInfo}>
        <span style={styles.testName}>{order.testName}</span>
        <span style={styles.status}>{order.status}</span>
      </div>

      <div style={styles.doctor}>Dr. {order.doctorName}</div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Ordered</div>
          <div style={styles.detailValue}>
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
        {order.sampleId && (
          <div style={styles.detailItem}>
            <div style={styles.detailLabel}>Sample ID</div>
            <div style={styles.detailValue}>{order.sampleId}</div>
          </div>
        )}
        {order.collectedAt && (
          <div style={styles.detailItem}>
            <div style={styles.detailLabel}>Collected</div>
            <div style={styles.detailValue}>
              {new Date(order.collectedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {!showCollect ? (
        <div style={styles.footer}>
          {order.status === 'ORDERED' && (
            <button
              style={{ ...styles.button, ...styles.collectButton }}
              onClick={() => setShowCollect(true)}
            >
              Collect Sample
            </button>
          )}
          {order.status === 'COLLECTED' && (
            <button
              style={{ ...styles.button, ...styles.processButton }}
              onClick={() => onStatusUpdate(order.id, 'PROCESSING')}
            >
              Start Processing
            </button>
          )}
          {order.status === 'PROCESSING' && (
            <button
              style={{ ...styles.button, ...styles.resultButton }}
              onClick={() => setShowResultsEntry(true)}
            >
              Enter Results
            </button>
          )}
          {order.status === 'COMPLETED' && (
            <button
              style={{ ...styles.button, ...styles.resultButton }}
              onClick={() => setShowResultView(true)}
            >
              View Results
            </button>
          )}
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <button
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={() => onStatusUpdate(order.id, 'CANCELLED', { reason: 'Cancelled by user' })}
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div style={styles.sampleForm}>
          <div style={styles.sampleField}>
            <label style={styles.sampleLabel}>Sample ID</label>
            <input
              type="text"
              value={sampleData.sampleId}
              onChange={(e) => setSampleData({ ...sampleData, sampleId: e.target.value })}
              style={styles.sampleInput}
              placeholder="Auto-generated if blank"
            />
          </div>
          <div style={styles.sampleField}>
            <label style={styles.sampleLabel}>Sample Type</label>
            <select
              value={sampleData.sampleType}
              onChange={(e) => setSampleData({ ...sampleData, sampleType: e.target.value })}
              style={styles.sampleInput}
            >
              <option value="Blood">Blood</option>
              <option value="Urine">Urine</option>
              <option value="Stool">Stool</option>
              <option value="Sputum">Sputum</option>
              <option value="Swab">Swab</option>
            </select>
          </div>
          <div style={styles.sampleActions}>
            <button
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={() => setShowCollect(false)}
            >
              Cancel
            </button>
            <button
              style={{ ...styles.button, ...styles.collectButton }}
              onClick={handleCollect}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {showResultsEntry && (
        <ResultEntryModal
          order={order}
          onClose={() => setShowResultsEntry(false)}
          onSubmit={(data) => onStatusUpdate(order.id, 'COMPLETED', { resultData: data })}
        />
      )}

      {showResultView && (
        <ResultViewModal
          order={order}
          onClose={() => setShowResultView(false)}
        />
      )}
    </div>
  )
}

export default OrderCard