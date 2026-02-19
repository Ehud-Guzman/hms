import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import billingService from '../services/billingService'

const BillingPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await billingService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load billing stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `KES ${(amount / 100).toLocaleString()}`
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
    actions: {
      display: 'flex',
      gap: theme.spacing[3]
    },
    navButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    statLabel: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    statValue: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6]
    },
    actionCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      textAlign: 'center',
      cursor: 'pointer',
      border: `1px solid ${theme.colors.gray[200]}`,
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md,
        transform: 'translateY(-2px)'
      }
    },
    actionIcon: {
      fontSize: '40px',
      marginBottom: theme.spacing[3]
    },
    actionLabel: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[2]
    },
    actionDesc: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading billing dashboard...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Billing Dashboard</h1>
          <div style={styles.actions}>
            <button 
              style={styles.navButton}
              onClick={() => navigate('/billing/invoices')}
            >
              📄 Invoices
            </button>
            <button 
              style={styles.navButton}
              onClick={() => navigate('/billing/payments')}
            >
              💰 Payments
            </button>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Today's Revenue</div>
            <div style={styles.statValue}>{formatCurrency(stats?.todayRevenue || 0)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Pending Invoices</div>
            <div style={styles.statValue}>{stats?.pendingBills || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Overdue Invoices</div>
            <div style={styles.statValue}>{stats?.overdueBills || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Outstanding</div>
            <div style={styles.statValue}>{formatCurrency(stats?.outstanding || 0)}</div>
          </div>
        </div>

        <div style={styles.actionGrid}>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/billing/invoices/new')}
          >
            <div style={styles.actionIcon}>➕</div>
            <div style={styles.actionLabel}>New Invoice</div>
            <div style={styles.actionDesc}>Create a new invoice</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/billing/payments/new')}
          >
            <div style={styles.actionIcon}>💰</div>
            <div style={styles.actionLabel}>Record Payment</div>
            <div style={styles.actionDesc}>Record a payment</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => {
              const patientId = prompt('Enter Patient ID or UHID:')
              if (patientId) navigate(`/billing/patient/${patientId}`)
            }}
          >
            <div style={styles.actionIcon}>👤</div>
            <div style={styles.actionLabel}>Patient Billing</div>
            <div style={styles.actionDesc}>View patient billing summary</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/billing/invoices?status=overdue')}
          >
            <div style={styles.actionIcon}>⚠️</div>
            <div style={styles.actionLabel}>Overdue</div>
            <div style={styles.actionDesc}>View overdue invoices</div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default BillingPage