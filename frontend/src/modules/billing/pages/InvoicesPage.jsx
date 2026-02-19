import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import InvoiceList from '../components/InvoiceList'
import InvoiceFilters from '../components/InvoiceFilters'
import billingService from '../services/billingService'

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadInvoices()
  }, [filters])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const data = await billingService.getInvoices(filters)
      setInvoices(data.bills || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleIssue = async (id) => {
    try {
      await billingService.issueInvoice(id)
      loadInvoices()
    } catch (error) {
      alert('Failed to issue invoice: ' + error.message)
    }
  }

  const handleVoid = async (id) => {
    const reason = prompt('Reason for voiding:')
    if (reason) {
      try {
        await billingService.voidInvoice(id, reason)
        loadInvoices()
      } catch (error) {
        alert('Failed to void invoice: ' + error.message)
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await billingService.voidInvoice(id, 'Deleted by user')
        loadInvoices()
      } catch (error) {
        alert('Failed to delete invoice: ' + error.message)
      }
    }
  }

  const styles = {
    container: {
      maxWidth: '1400px',
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
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.gray[50]
      }
    },
    addButton: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      }
    }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/billing')}
            >
              ← Back
            </button>
            <h1 style={styles.title}>Invoices</h1>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => navigate('/billing/invoices/new')}
          >
            + New Invoice
          </button>
        </div>

        <InvoiceFilters filters={filters} setFilters={setFilters} />

        <InvoiceList
          invoices={invoices}
          loading={loading}
          pagination={pagination}
          onIssue={handleIssue}
          onVoid={handleVoid}
          onDelete={handleDelete}
          onRefresh={loadInvoices}
        />
      </div>
    </AppLayout>
  )
}

export default InvoicesPage