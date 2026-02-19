import { useTheme } from '../../../context/ThemeContext'
import WardCard from './WardCard'

const WardList = ({ wards, loading, onRefresh }) => {
  const theme = useTheme()

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[4]
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
    }
  }

  if (loading) {
    return <div style={styles.loadingContainer}>Loading wards...</div>
  }

  if (!wards || wards.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🏥</div>
        <h3 style={styles.emptyText}>No wards found</h3>
        <p style={styles.emptySubtext}>Create your first ward.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {wards.map(ward => (
        <WardCard key={ward.id} ward={ward} onUpdate={onRefresh} />
      ))}
    </div>
  )
}

export default WardList