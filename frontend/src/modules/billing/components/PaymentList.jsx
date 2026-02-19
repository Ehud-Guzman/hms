import { useTheme } from '../../../context/ThemeContext'
import PaymentCard from './PaymentCard'
import { useNavigate } from 'react-router-dom'

const PaymentList = ({ payments, loading, pagination, onRefresh }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: theme.spacing[4],
      marginTop: theme.spacing[4]
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      color: theme.colors.gray[500]
    },
    emptyContainer: {
      textAlign: 'center',
      padding: theme.spacing[12],
      color: theme.colors.gray[500],
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: theme.spacing[4],
      opacity: 0.5
    },
    emptyText: {
      fontSize: theme.fonts.sizes.lg,
      marginBottom: theme.spacing[2]
    },
    emptySubtext: {
      fontSize: theme.fonts.sizes.sm
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginTop: theme.spacing[6],
      paddingTop: theme.spacing[4],
      borderTop: `1px solid ${theme.colors.gray[200]}`
    },
    pageButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.gray[300]}`,
      backgroundColor: 'white',
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    pageInfo: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      margin: `0 ${theme.spacing[2]}`
    }
  }

  if (loading) {
    return <div style={styles.loadingContainer}>Loading payments...</div>
  }

  if (!payments || payments.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>💰</div>
        <h3 style={styles.emptyText}>No payments found</h3>
        <p style={styles.emptySubtext}>Record a payment to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div style={styles.container}>
        {payments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onView={(p) => navigate(`/billing/payments/${p.id}`)}
          />
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageButton} disabled={pagination.page === 1} onClick={() => onRefresh({ page: pagination.page - 1 })}>← Prev</button>
          <span style={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
          <button style={styles.pageButton} disabled={pagination.page === pagination.pages} onClick={() => onRefresh({ page: pagination.page + 1 })}>Next →</button>
        </div>
      )}
    </>
  )
}

export default PaymentList