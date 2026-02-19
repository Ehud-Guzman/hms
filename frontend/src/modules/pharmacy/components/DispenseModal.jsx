import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const DispenseModal = ({ prescription, onClose, onDispense }) => {
  const theme = useTheme()
  const [items, setItems] = useState(
    prescription.items?.map(item => ({ ...item, dispensedQuantity: item.quantity })) || []
  )
  const [pharmacistId, setPharmacistId] = useState('')
  const [notes, setNotes] = useState('')

  const handleQuantityChange = (index, value) => {
    const newItems = [...items]
    newItems[index].dispensedQuantity = parseInt(value) || 0
    setItems(newItems)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onDispense(prescription.id, {
      pharmacistId,
      items: items.map(({ id, dispensedQuantity }) => ({ id, quantity: dispensedQuantity })),
      notes
    })
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
      maxWidth: '500px',
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
    patientInfo: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[3],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4]
    },
    patientName: {
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[1]
    },
    patientDetail: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    itemsList: {
      marginBottom: theme.spacing[4]
    },
    itemRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':last-child': {
        borderBottom: 'none'
      }
    },
    itemInfo: {
      flex: 2
    },
    itemName: {
      fontWeight: theme.fonts.weights.medium,
      fontSize: theme.fonts.sizes.sm
    },
    itemDosage: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    },
    quantityControl: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2]
    },
    quantityInput: {
      width: '70px',
      padding: theme.spacing[1],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      textAlign: 'center'
    },
    maxQuantity: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    },
    field: {
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
      resize: 'vertical'
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[3],
      marginTop: theme.spacing[6]
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
          <h2 style={styles.title}>Dispense Prescription</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div style={styles.patientInfo}>
          <div style={styles.patientName}>{prescription.patientName}</div>
          <div style={styles.patientDetail}>UHID: {prescription.patientUhid}</div>
          <div style={styles.patientDetail}>Dr. {prescription.doctorName}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.itemsList}>
            <h3 style={{ marginBottom: theme.spacing[2] }}>Medications</h3>
            {items.map((item, index) => (
              <div key={index} style={styles.itemRow}>
                <div style={styles.itemInfo}>
                  <div style={styles.itemName}>{item.medication}</div>
                  <div style={styles.itemDosage}>
                    {item.dosage} • {item.frequency}
                  </div>
                </div>
                <div style={styles.quantityControl}>
                  <input
                    type="number"
                    min="1"
                    max={item.quantity}
                    value={item.dispensedQuantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    style={styles.quantityInput}
                  />
                  <span style={styles.maxQuantity}>/ {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Pharmacist ID</label>
            <input
              type="text"
              value={pharmacistId}
              onChange={(e) => setPharmacistId(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
            />
          </div>

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
              Dispense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DispenseModal