import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import PatientList from '../components/PatientList'
import { useOfflineData } from '../../../hooks/useOfflineData'
import patientsService from '../services/patientsService'

const PatientsPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()

  const {
    data: patients,
    loading,
    delete: deletePatient,
    refresh
  } = useOfflineData('patients', patientsService.getPatients)

  const handleView = (patient) => {
    navigate(`/patients/${patient.id}`)
  }

  const handleEdit = (patient) => {
    navigate(`/patients/${patient.id}/edit`)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(id)
      } catch (error) {
        alert('Failed to delete patient: ' + error.message)
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
          <h1 style={styles.title}>Patients</h1>
          <button 
            style={styles.addButton}
            onClick={() => navigate('/patients/new')}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.primary.dark}
            onMouseLeave={(e) => e.target.style.backgroundColor = theme.colors.primary.DEFAULT}
          >
            + Add Patient
          </button>
        </div>

        <PatientList
          patients={patients}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  )
}

export default PatientsPage