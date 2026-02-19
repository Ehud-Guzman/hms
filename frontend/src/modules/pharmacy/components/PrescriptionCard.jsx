import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import DispenseModal from './DispenseModal'

const PrescriptionCard = ({ prescription, onDispense, onCancel }) => {
  const theme = useTheme()
  const [showDispense, setShowDispense] = useState(false)

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: { bg: `${theme.colors.primary.DEFAULT}10`, text: theme.colors.primary.DEFAULT },
      DISPENSED: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT },
      PARTIALLY_DISPENSED: { bg: `${theme.colors.warning.DEFAULT}10`, text: theme.colors.warning.DEFAULT },
      CANCELLED: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT },
      EXPIRED: { bg: `${theme.colors.gray[200]}`, text: theme.colors.gray[600] }
    }
    return colors[status] || colors.ACTIVE
  }

  const statusColor = getStatusColor(prescription.status)

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
    ref: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      fontFamily: theme.fonts.mono
    },
    status: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: statusColor.bg,
      color: statusColor.text
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
    doctorInfo: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[3]
    },
    items: {
      marginBottom: theme.spacing[4]
    },
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${theme.spacing[2]} 0`,
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':last-child': {
        borderBottom: 'none'
      }
    },
    itemName: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    itemDetails: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    },
    itemQuantity: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
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
    dispenseButton: {
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
    viewButton: {
      backgroundColor: `${theme.colors.primary.DEFAULT}10`,
      color: theme.colors.primary.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.primary.DEFAULT}20`
      }
    }
  }

  return (
    <>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.ref}>#{prescription.id?.slice(-8)}</span>
          <span style={styles.status}>{prescription.status}</span>
        </div>
        <h3 style={styles.patientName}>{prescription.patientName}</h3>
        <div style={styles.patientUhid}>UHID: {prescription.patientUhid}</div>
        <div style={styles.doctorInfo}>Dr. {prescription.doctorName}</div>

        <div style={styles.items}>
          {prescription.items?.map((item, idx) => (
            <div key={idx} style={styles.item}>
              <div>
                <div style={styles.itemName}>{item.medication}</div>
                <div style={styles.itemDetails}>
                  {item.dosage} • {item.frequency} • {item.duration}
                </div>
              </div>
              <div style={styles.itemQuantity}>x{item.quantity}</div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <button style={{ ...styles.button, ...styles.viewButton }}>
            View
          </button>
          {prescription.status === 'ACTIVE' && (
            <>
              <button
                style={{ ...styles.button, ...styles.dispenseButton }}
                onClick={() => setShowDispense(true)}
              >
                Dispense
              </button>
              <button
                style={{ ...styles.button, ...styles.cancelButton }}
                onClick={() => onCancel(prescription.id)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {showDispense && (
        <DispenseModal
          prescription={prescription}
          onClose={() => setShowDispense(false)}
          onDispense={onDispense}
        />
      )}
    </>
  )
}

export default PrescriptionCard