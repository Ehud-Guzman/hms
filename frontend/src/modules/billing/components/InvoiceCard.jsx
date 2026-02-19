import { useTheme } from '../../../context/ThemeContext'

const InvoiceCard = ({ invoice, onIssue, onVoid, onDelete, onView }) => {
  const theme = useTheme()

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: { bg: theme.colors.gray[200], text: theme.colors.gray[700] },
      ISSUED: { bg: `${theme.colors.primary.DEFAULT}10`, text: theme.colors.primary.DEFAULT },
      PARTIALLY_PAID: { bg: `${theme.colors.warning.DEFAULT}10`, text: theme.colors.warning.DEFAULT },
      PAID: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT },
      VOID: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT }
    }
    return colors[status] || colors.DRAFT
  }

  const statusStyle = getStatusColor(invoice.status)

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[4],
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      cursor: 'pointer',
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing[2]
    },
    invoiceNumber: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.primary.DEFAULT,
      fontFamily: theme.fonts.mono
    },
    status: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: statusStyle.bg,
      color: statusStyle.text
    },
    patientName: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[2]
    },
    details: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: theme.spacing[2],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    amount: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: theme.spacing[3],
      fontSize: theme.fonts.sizes.sm
    },
    total: {
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    paid: {
      color: theme.colors.success.DEFAULT
    },
    balance: {
      color: invoice.balance > 0 ? theme.colors.danger.DEFAULT : theme.colors.success.DEFAULT
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
      borderTop: `1px solid ${theme.colors.gray[200]}`,
      paddingTop: theme.spacing[3],
      marginTop: theme.spacing[2]
    },
    button: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      cursor: 'pointer',
      border: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    issueButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white'
    },
    voidButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT
    },
    deleteButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT
    }
  }

  const formatCurrency = (amount) => {
    return `KES ${(amount / 100).toLocaleString()}`
  }

  return (
    <div style={styles.card} onClick={() => onView(invoice)}>
      <div style={styles.header}>
        <span style={styles.invoiceNumber}>{invoice.billNumber}</span>
        <span style={styles.status}>{invoice.status}</span>
      </div>
      <div style={styles.patientName}>{invoice.patientName}</div>
      <div style={styles.details}>
        <span>Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
      </div>
      <div style={styles.amount}>
        <span>Total: <span style={styles.total}>{formatCurrency(invoice.total)}</span></span>
        <span>Paid: <span style={styles.paid}>{formatCurrency(invoice.paid)}</span></span>
        <span>Balance: <span style={styles.balance}>{formatCurrency(invoice.balance)}</span></span>
      </div>
      <div style={styles.footer} onClick={(e) => e.stopPropagation()}>
        {invoice.status === 'DRAFT' && (
          <button
            style={{ ...styles.button, ...styles.issueButton }}
            onClick={() => onIssue(invoice.id)}
          >
            Issue
          </button>
        )}
        {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
          <button
            style={{ ...styles.button, ...styles.voidButton }}
            onClick={() => onVoid(invoice.id)}
          >
            Void
          </button>
        )}
        {invoice.status === 'DRAFT' && (
          <button
            style={{ ...styles.button, ...styles.deleteButton }}
            onClick={() => onDelete(invoice.id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export default InvoiceCard