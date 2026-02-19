import { useTheme } from '../../../context/ThemeContext'

const PaymentCard = ({ payment, onView }) => {
  const theme = useTheme()

  const getMethodIcon = (method) => {
    const icons = {
      CASH: '💵',
      CARD: '💳',
      MPESA: '📱',
      BANK_TRANSFER: '🏦',
      CHEQUE: '📝',
      INSURANCE: '🏥'
    }
    return icons[method] || '💰'
  }

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
      alignItems: 'center',
      marginBottom: theme.spacing[2]
    },
    receipt: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.primary.DEFAULT,
      fontFamily: theme.fonts.mono
    },
    method: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[1],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[700]
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
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.success.DEFAULT,
      textAlign: 'right'
    }
  }

  const formatCurrency = (amount) => {
    return `KES ${(amount / 100).toLocaleString()}`
  }

  return (
    <div style={styles.card} onClick={() => onView(payment)}>
      <div style={styles.header}>
        <span style={styles.receipt}>{payment.receiptNumber}</span>
        <span style={styles.method}>
          {getMethodIcon(payment.method)} {payment.method}
        </span>
      </div>
      <div style={styles.patientName}>{payment.patientName}</div>
      <div style={styles.details}>
        <span>{new Date(payment.receivedAt).toLocaleString()}</span>
        {payment.reference && <span>Ref: {payment.reference}</span>}
      </div>
      <div style={styles.amount}>{formatCurrency(payment.amount)}</div>
    </div>
  )
}

export default PaymentCard