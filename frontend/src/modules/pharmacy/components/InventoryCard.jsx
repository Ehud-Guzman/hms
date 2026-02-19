import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const InventoryCard = ({ item, onEdit, onDelete, onAdjustStock }) => {
  const theme = useTheme()
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustType, setAdjustType] = useState('RECEIVED')
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  const getStockStatus = (item) => {
    if (item.quantityInStock <= 0) return { color: theme.colors.danger.DEFAULT, label: 'Out of Stock' }
    if (item.quantityInStock <= item.reorderLevel) return { color: theme.colors.warning.DEFAULT, label: 'Low Stock' }
    return { color: theme.colors.success.DEFAULT, label: 'In Stock' }
  }

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const monthsLeft = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth())
    if (monthsLeft < 0) return { color: theme.colors.danger.DEFAULT, label: 'Expired' }
    if (monthsLeft < 1) return { color: theme.colors.danger.DEFAULT, label: 'Expires this month' }
    if (monthsLeft < 3) return { color: theme.colors.warning.DEFAULT, label: 'Expires soon' }
    return null
  }

  const stockStatus = getStockStatus(item)
  const expiryStatus = getExpiryStatus(item.expiryDate)

  const handleAdjustSubmit = (e) => {
    e.preventDefault()
    onAdjustStock(item.id, {
      type: adjustType,
      quantity: parseInt(adjustQty),
      notes: adjustNote
    })
    setShowAdjust(false)
    setAdjustQty('')
    setAdjustNote('')
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
    code: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      fontFamily: theme.fonts.mono
    },
    statusBadge: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: `${stockStatus.color}15`,
      color: stockStatus.color
    },
    name: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    brand: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[3]
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
    expiryWarning: {
      marginTop: theme.spacing[2],
      padding: theme.spacing[2],
      borderRadius: theme.radius.md,
      backgroundColor: `${expiryStatus?.color}15`,
      color: expiryStatus?.color,
      fontSize: theme.fonts.sizes.sm,
      textAlign: 'center'
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
      borderTop: `1px solid ${theme.colors.gray[200]}`,
      paddingTop: theme.spacing[4]
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
    adjustButton: {
      backgroundColor: `${theme.colors.accent.DEFAULT}10`,
      color: theme.colors.accent.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.accent.DEFAULT}20`
      }
    },
    editButton: {
      backgroundColor: `${theme.colors.primary.DEFAULT}10`,
      color: theme.colors.primary.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.primary.DEFAULT}20`
      }
    },
    deleteButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.danger.DEFAULT}20`
      }
    },
    adjustForm: {
      marginTop: theme.spacing[4],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    adjustField: {
      marginBottom: theme.spacing[3]
    },
    adjustLabel: {
      display: 'block',
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[1]
    },
    adjustInput: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm
    },
    adjustSelect: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      backgroundColor: 'white'
    },
    adjustActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
      marginTop: theme.spacing[3]
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.code}>{item.drugCode}</span>
        <span style={styles.statusBadge}>{stockStatus.label}</span>
      </div>
      <h3 style={styles.name}>{item.genericName}</h3>
      {item.brandName && <div style={styles.brand}>{item.brandName}</div>}

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Category</div>
          <div style={styles.detailValue}>{item.category || '—'}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Form</div>
          <div style={styles.detailValue}>{item.form} {item.strength}{item.unit}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Stock</div>
          <div style={styles.detailValue}>{item.quantityInStock} {item.unit}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Price</div>
          <div style={styles.detailValue}>KES {item.sellingPrice / 100}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Reorder Level</div>
          <div style={styles.detailValue}>{item.reorderLevel}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Batch</div>
          <div style={styles.detailValue}>{item.batchNo || '—'}</div>
        </div>
      </div>

      {item.expiryDate && expiryStatus && (
        <div style={styles.expiryWarning}>
          ⚠️ {expiryStatus.label}: {new Date(item.expiryDate).toLocaleDateString()}
        </div>
      )}

      {!showAdjust ? (
        <div style={styles.footer}>
          <button
            style={{ ...styles.button, ...styles.adjustButton }}
            onClick={() => setShowAdjust(true)}
          >
            Adjust Stock
          </button>
          <button
            style={{ ...styles.button, ...styles.editButton }}
            onClick={() => onEdit(item)}
          >
            Edit
          </button>
          <button
            style={{ ...styles.button, ...styles.deleteButton }}
            onClick={() => onDelete(item.id)}
          >
            Delete
          </button>
        </div>
      ) : (
        <form style={styles.adjustForm} onSubmit={handleAdjustSubmit}>
          <div style={styles.adjustField}>
            <label style={styles.adjustLabel}>Type</label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
              style={styles.adjustSelect}
            >
              <option value="RECEIVED">📦 Received</option>
              <option value="DISPENSED">💊 Dispensed</option>
              <option value="RETURNED">↩️ Returned</option>
              <option value="EXPIRED">⏰ Expired</option>
              <option value="ADJUSTED">⚖️ Manual Count</option>
            </select>
          </div>
          <div style={styles.adjustField}>
            <label style={styles.adjustLabel}>Quantity</label>
            <input
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              style={styles.adjustInput}
              required
            />
          </div>
          <div style={styles.adjustField}>
            <label style={styles.adjustLabel}>Notes (optional)</label>
            <input
              type="text"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              style={styles.adjustInput}
              placeholder="Reason for adjustment"
            />
          </div>
          <div style={styles.adjustActions}>
            <button
              type="button"
              style={{ ...styles.button, ...styles.deleteButton }}
              onClick={() => setShowAdjust(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...styles.button, ...styles.adjustButton }}
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default InventoryCard