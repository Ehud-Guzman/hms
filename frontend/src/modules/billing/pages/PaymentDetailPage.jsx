import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import billingService from '../services/billingService'

const PaymentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayment()
  }, [id])

  const loadPayment = async () => {
    setLoading(true)
    try {
      const data = await billingService.getPayment(id)
      setPayment(data.payment)
    } catch (error) {
      console.error('Failed to load payment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    const reason = prompt('Reason for refund:')
    if (!reason) return
    try {
      await billingService.refundPayment(id, { reason })
      loadPayment()
    } catch (error) {
      alert('Failed to refund payment: ' + error.message)
    }
  }

  const formatCurrency = (amount) => {
    return `KES ${(amount / 100).toLocaleString()}`
  }

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
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[6]
    },
    title: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    receiptHeader: {
      textAlign: 'center',
      marginBottom: theme.spacing[6],
      paddingBottom: theme.spacing[4],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    receiptNumber: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.primary.DEFAULT,
      fontFamily: theme.fonts.mono
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    infoItem: {
      padding: theme.spacing[3],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
    },
    infoLabel: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    infoValue: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    patientInfo: {
      marginBottom: theme.spacing[6],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[2]
    },
    patientMeta: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    amount: {
      fontSize: theme.fonts.sizes['3xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.success.DEFAULT,
      textAlign: 'center',
      marginBottom: theme.spacing[4]
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
      border: 'none'
    },
    refundButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading payment...</div>
      </AppLayout>
    )
  }

  if (!payment) {
    return (
      <AppLayout>
        <div style={styles.container}>Payment not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Payment Details</h1>
          <button style={styles.backButton} onClick={() => navigate('/billing/payments')}>
            ← Back
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.receiptHeader}>
            <div style={styles.receiptNumber}>{payment.receiptNumber}</div>
          </div>

          <div style={styles.amount}>{formatCurrency(payment.amount)}</div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Date & Time</div>
              <div style={styles.infoValue}>{new Date(payment.receivedAt).toLocaleString()}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Payment Method</div>
              <div style={styles.infoValue}>{getMethodIcon(payment.method)} {payment.method}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Reference</div>
              <div style={styles.infoValue}>{payment.reference || '—'}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Status</div>
              <div style={styles.infoValue}>{payment.isRefunded ? 'Refunded' : 'Completed'}</div>
            </div>
          </div>

          {payment.bill && (
            <div style={styles.patientInfo}>
              <div style={styles.patientName}>{payment.bill.patient?.firstName} {payment.bill.patient?.lastName}</div>
              <div style={styles.patientMeta}>
                UHID: {payment.bill.patient?.uhid}<br />
                Invoice: {payment.bill.billNumber}
              </div>
            </div>
          )}

          {payment.notes && (
            <div style={{ padding: theme.spacing[3], backgroundColor: theme.colors.gray[50], borderRadius: theme.radius.md }}>
              <strong>Notes:</strong> {payment.notes}
            </div>
          )}

          {payment.isRefunded && (
            <div style={{ marginTop: theme.spacing[4], padding: theme.spacing[3], backgroundColor: `${theme.colors.danger.DEFAULT}10`, borderRadius: theme.radius.md, color: theme.colors.danger.DEFAULT }}>
              <strong>Refunded</strong> on {new Date(payment.refundedAt).toLocaleString()}<br />
              Reason: {payment.refundReason}
            </div>
          )}

          <div style={styles.actions}>
            {!payment.isRefunded && (
              <button style={{ ...styles.button, ...styles.refundButton }} onClick={handleRefund}>
                Refund Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default PaymentDetailPage