import { useTheme } from '../../../context/ThemeContext'
import AppointmentCard from './AppointmentCard'

const AppointmentList = ({ appointments, loading, onView, onCheckIn, onStart, onCancel }) => {
  const theme = useTheme()

  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
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
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        Loading appointments...
      </div>
    )
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>📅</div>
        <h3 style={styles.emptyText}>No appointments found</h3>
        <p style={styles.emptySubtext}>Click "New Appointment" to schedule one.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onView={onView}
          onCheckIn={onCheckIn}
          onStart={onStart}
          onCancel={onCancel}
        />
      ))}
    </div>
  )
}

export default AppointmentList