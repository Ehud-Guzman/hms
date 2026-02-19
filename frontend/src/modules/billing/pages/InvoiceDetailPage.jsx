import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import billingService from '../services/billingService'

const InvoiceDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoice()
  }, [id])

  const loadInvoice = async () => {
    setLoading(true)
    try {
      const data = await billingService.getInvoice(id)
      setInvoice(data.bill)
    } catch (error) {
      console.error('Failed to load invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleIssue = async () => {
    try {
      await billingService.issueInvoice(id)
      loadInvoice()
    } catch (error) {
      alert('Failed to issue invoice: ' + error.message)
    }
  }

  const handleVoid = async () => {
    const reason = prompt('Reason for voiding:')
    if (reason) {
      try {
        await billingService.voidInvoice(id, reason)
        navigate('/billing/invoices')
      } catch (error) {
        alert('Failed to void invoice: ' + error.message)
      }
    }
  }

  const handleRecordPayment = () => {
    navigate(`/billing/payments/new?invoiceId=${id}`)
  }

  const formatCurrency = (amount) => {
    return `KES ${(amount / 100).toLocaleString()}`
  }

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

  const styles = {
    container: {
      maxWidth: '1000px',
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
    infoBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[6],
      paddingBottom: theme.spacing[4],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    invoiceNumber: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.primary.DEFAULT,
      fontFamily: theme.fonts.mono
    },
    statusBadge: (status) => ({
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: getStatusColor(status).bg,
      color: getStatusColor(status).text
    }),
    patientInfo: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[6]
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[2]
    },
    patientMeta: {
      display: 'flex',
      gap: theme.spacing[4],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    table: {
      width: '100%',
      marginBottom: theme.spacing[6],
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: theme.spacing[2],
      borderBottom: `2px solid ${theme.colors.gray[200]}`,
      fontWeight: theme.fonts.weights.semibold
    },
    td: {
      padding: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    totals: {
      width: '300px',
      marginLeft: 'auto',
      marginTop: theme.spacing[4]
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    grandTotal: {
      fontWeight: theme.fonts.weights.bold,
      fontSize: theme.fonts.sizes.lg,
      color: theme.colors.primary.DEFAULT,
      borderBottom: 'none',
      paddingTop: theme.spacing[4]
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
    editButton: {
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white'
    },
    issueButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white'
    },
    voidButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT
    },
    payButton: {
      backgroundColor: theme.colors.success.DEFAULT,
      color: 'white'
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading invoice...</div>
      </AppLayout>
    )
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div style={styles.container}>Invoice not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Invoice Details</h1>
          <button style={styles.backButton} onClick={() => navigate('/billing/invoices')}>
            ← Back
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.infoBar}>
            <span style={styles.invoiceNumber}>{invoice.billNumber}</span>
            <span style={styles.statusBadge(invoice.status)}>{invoice.status}</span>
          </div>

          <div style={styles.patientInfo}>
            <div style={styles.patientName}>{invoice.patient?.firstName} {invoice.patient?.lastName}</div>
            <div style={styles.patientMeta}>
              <span>UHID: {invoice.patient?.uhid}</span>
              <span>Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
              <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Unit Price</th>
                <th style={styles.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{item.description}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>{formatCurrency(item.unitPrice)}</td>
                  <td style={styles.td}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.totals}>
            <div style={styles.totalRow}>
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>Discount:</span>
              <span>-{formatCurrency(invoice.discount)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>Tax:</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>Paid:</span>
              <span style={{ color: theme.colors.success.DEFAULT }}>{formatCurrency(invoice.paid)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>Balance:</span>
              <span style={{ color: invoice.balance > 0 ? theme.colors.danger.DEFAULT : theme.colors.success.DEFAULT }}>
                {formatCurrency(invoice.balance)}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: theme.spacing[4], padding: theme.spacing[3], backgroundColor: theme.colors.gray[50], borderRadius: theme.radius.md }}>
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}

          <div style={styles.actions}>
            {invoice.status === 'DRAFT' && (
              <>
                <button style={{ ...styles.button, ...styles.editButton }} onClick={() => navigate(`/billing/invoices/${id}/edit`)}>
                  Edit
                </button>
                <button style={{ ...styles.button, ...styles.issueButton }} onClick={handleIssue}>
                  Issue Invoice
                </button>
                <button style={{ ...styles.button, ...styles.voidButton }} onClick={handleVoid}>
                  Void
                </button>
              </>
            )}
            {invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID' ? (
              <>
                <button style={{ ...styles.button, ...styles.payButton }} onClick={handleRecordPayment}>
                  Record Payment
                </button>
                <button style={{ ...styles.button, ...styles.voidButton }} onClick={handleVoid}>
                  Void
                </button>
              </>
            ) : null}
            {invoice.status === 'PAID' && (
              <button style={{ ...styles.button, ...styles.editButton }} disabled>
                Paid
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default InvoiceDetailPage