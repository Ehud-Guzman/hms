import { useTheme } from '../../../context/ThemeContext'
import DoctorCard from './DoctorCard'

const DoctorList = ({ doctors, loading, onEdit, onDelete, onView }) => {
  const theme = useTheme()

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
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        Loading doctors...
      </div>
    )
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>👨‍⚕️</div>
        <h3 style={styles.emptyText}>No doctors found</h3>
        <p style={styles.emptySubtext}>Click "Add Doctor" to add your first doctor.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {doctors.map((doctor) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  )
}

export default DoctorList