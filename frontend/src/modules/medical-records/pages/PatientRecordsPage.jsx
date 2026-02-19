import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import RecordList from '../components/RecordList'
import RecordFilters from '../components/RecordFilters'
import RecordSummary from '../components/RecordSummary'
import RecordTimeline from '../components/RecordTimeline'
import medicalRecordsService from '../services/medicalRecordsService'
import patientsService from '../../patients/services/patientsService'

const PatientRecordsPage = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [patient, setPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('records')
  const [filters, setFilters] = useState({ page: 1, limit: 20 })

  useEffect(() => {
    loadData()
  }, [patientId, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const [patientData, recordsData, summaryData, timelineData] = await Promise.all([
        patientsService.getPatient(patientId),
        medicalRecordsService.getPatientRecords(patientId, filters),
        medicalRecordsService.getPatientSummary(patientId),
        medicalRecordsService.getPatientTimeline(patientId)
      ])
      setPatient(patientData.patient)
      setRecords(recordsData.records || [])
      setSummary(summaryData.summary)
      setTimeline(timelineData.timeline || [])
    } catch (error) {
      console.error('Failed to load patient records:', error)
    } finally {
      setLoading(false)
    }
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
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    addButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      marginLeft: theme.spacing[3]
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
      color: theme.colors.gray[600],
      flexWrap: 'wrap'
    },
    tabs: {
      display: 'flex',
      gap: theme.spacing[4],
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      marginBottom: theme.spacing[6]
    },
    tab: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      color: theme.colors.gray[600],
      fontWeight: theme.fonts.weights.medium,
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    activeTab: {
      borderBottomColor: theme.colors.primary.DEFAULT,
      color: theme.colors.primary.DEFAULT
    }
  }

  if (loading && !patient) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading patient records...</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <button style={styles.backButton} onClick={() => navigate('/medical-records')}>
              ← Back
            </button>
            <h1 style={styles.title}>Medical Records</h1>
          </div>
          <button style={styles.addButton} onClick={() => navigate(`/medical-records/patient/${patientId}/new`)}>
            + New Record
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
            <span>Blood Group: {patient.bloodGroup || '—'}</span>
          </div>
        </div>

        <div style={styles.tabs}>
          <div
            style={{ ...styles.tab, ...(activeTab === 'records' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('records')}
          >
            Records
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'summary' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'timeline' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </div>
        </div>

        {activeTab === 'records' && (
          <>
            <RecordFilters filters={filters} setFilters={setFilters} />
            <RecordList
              records={records}
              loading={loading}
              onRefresh={() => loadData()}
            />
          </>
        )}

        {activeTab === 'summary' && (
          <RecordSummary summary={summary} loading={loading} />
        )}

        {activeTab === 'timeline' && (
          <RecordTimeline timeline={timeline} loading={loading} />
        )}
      </div>
    </AppLayout>
  )
}

export default PatientRecordsPage