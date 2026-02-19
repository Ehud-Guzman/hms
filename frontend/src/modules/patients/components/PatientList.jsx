import { useTheme } from '../../../context/ThemeContext'
import PatientCard from './PatientCard'

const PatientList = ({ patients, loading, onEdit, onDelete, onView }) => {
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
        Loading patients...
      </div>
    )
  }

  if (!patients || patients.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>👤</div>
        <h3 style={styles.emptyText}>No patients found</h3>
        <p style={styles.emptySubtext}>Click "Add Patient" to create your first patient record.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  )
}

export default PatientList