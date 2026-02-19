import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import VitalsHistory from '../components/VitalsHistory'
import VitalsChart from '../components/VitalsChart'
import vitalsService from '../services/vitalsService'
import patientsService from '../../patients/services/patientsService'

const PatientVitalsPage = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [patient, setPatient] = useState(null)
  const [vitals, setVitals] = useState([])
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [patientData, vitalsData, trendsData] = await Promise.all([
        patientsService.getPatient(patientId),
        vitalsService.getPatientVitals(patientId),
        vitalsService.getVitalsTrends(patientId)
      ])
      setPatient(patientData.patient)
      setVitals(vitalsData.vitals || [])
      setTrends(trendsData.trends)
    } catch (error) {
      console.error('Failed to load patient vitals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewVital = (vital) => {
    // Could navigate to detail or show modal
    console.log('View vital:', vital)
  }

  const styles = {
    container: {
      maxWidth: '1200px',
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
      marginBottom: theme.spacing[6]
    },
    patientName: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[2]
    },
    patientMeta: {
      display: 'flex',
      gap: theme.spacing[4],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    section: {
      marginBottom: theme.spacing[8]
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading patient vitals...</div>
      </AppLayout>
    )
  }

  if (!patient) {
    return (
      <AppLayout>
        <div style={styles.container}>Patient not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Vitals History</h1>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/vitals')}
          >
            ← Back
          </button>
        </div>

        <div style={styles.patientInfo}>
          <div style={styles.patientName}>
            {patient.firstName} {patient.lastName}
          </div>
          <div style={styles.patientMeta}>
            <span>UHID: {patient.uhid}</span>
            <span>DOB: {patient.dob ? new Date(patient.dob).toLocaleDateString() : '—'}</span>
            <span>Gender: {patient.gender || '—'}</span>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Trends</h2>
          <VitalsChart data={trends} />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>All Recordings</h2>
          <VitalsHistory
            vitals={vitals}
            loading={loading}
            onView={handleViewVital}
          />
        </div>
      </div>
    </AppLayout>
  )
}

export default PatientVitalsPage