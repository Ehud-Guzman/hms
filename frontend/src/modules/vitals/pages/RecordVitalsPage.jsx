import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import VitalsForm from '../components/VitalsForm'
import vitalsService from '../services/vitalsService'
import patientsService from '../../patients/services/patientsService'

const RecordVitalsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(false)

  const patientId = searchParams.get('patientId')
  const appointmentId = searchParams.get('appointmentId')

  useEffect(() => {
    if (patientId) {
      loadPatient()
    }
  }, [patientId])

  const loadPatient = async () => {
    try {
      const data = await patientsService.getPatient(patientId)
      setPatient(data.patient)
    } catch (error) {
      console.error('Failed to load patient:', error)
    }
  }

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      await vitalsService.recordVitals(formData)
      if (appointmentId) {
        navigate(`/appointments/${appointmentId}`)
      } else if (patientId) {
        navigate(`/vitals/patient/${patientId}`)
      } else {
        navigate('/vitals')
      }
    } catch (error) {
      alert('Failed to record vitals: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      maxWidth: '800px',
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
    patientInfo: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4]
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold
    },
    patientUhid: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginTop: theme.spacing[1]
    },
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Record Vitals</h1>
        </div>

        {patient && (
          <div style={styles.patientInfo}>
            <div style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </div>
            <div style={styles.patientUhid}>UHID: {patient.uhid}</div>
          </div>
        )}

        <div style={styles.card}>
          <VitalsForm
            patientId={patientId}
            appointmentId={appointmentId}
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
          />
        </div>
      </div>
    </AppLayout>
  )
}

export default RecordVitalsPage