import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import billingService from '../services/billingService'

const PaymentFormPage = () => {
  const [searchParams] = useSearchParams()
  const invoiceId = searchParams.get('invoiceId')
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [formData, setFormData] = useState({
    billId: invoiceId || '',
    amount: '',
    method: 'CASH',
    reference: '',
    notes: ''
  })

  useEffect(() => {
    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      const data = await billingService.getInvoice(invoiceId)
      setInvoice(data.bill)
    } catch (error) {
      console.error('Failed to load invoice:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.billId) {
      alert('Please enter an invoice number or select an invoice')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      await billingService.recordPayment({
        ...formData,
        amount: parseFloat(formData.amount) * 100 // convert to cents
      })
      navigate('/billing/payments')
    } catch (error) {
      alert('Failed to record payment: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      maxWidth: '600px',
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
    cancelButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    form: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    fieldGroup: {
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
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base
    },
    select: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      backgroundColor: 'white'
    },
    invoiceInfo: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4]
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6]
    },
    submitButton: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer'
    }
  }

  const formatCurrency = (amount) => {
    return `KES ${(amount / 100).toLocaleString()}`
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Record Payment</h1>
          <button style={styles.cancelButton} onClick={() => navigate('/billing/payments')}>
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {invoice && (
            <div style={styles.invoiceInfo}>
              <strong>Invoice: {invoice.billNumber}</strong><br />
              Patient: {invoice.patient?.firstName} {invoice.patient?.lastName}<br />
              Total: {formatCurrency(invoice.total)} | Balance: {formatCurrency(invoice.balance)}
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Invoice ID / Number</label>
            <input
              type="text"
              name="billId"
              value={formData.billId}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Enter invoice ID or number"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Amount (KES)</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Payment Method</label>
            <select name="method" value={formData.method} onChange={handleChange} style={styles.select}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MPESA">M-Pesa</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="INSURANCE">Insurance</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Reference (optional)</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              style={styles.input}
              placeholder="Transaction ID, cheque number, etc."
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              style={{ ...styles.input, minHeight: '80px' }}
            />
          </div>

          <div style={styles.actions}>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default PaymentFormPage