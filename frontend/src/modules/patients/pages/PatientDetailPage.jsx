import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import { useOfflineData } from '../../../hooks/useOfflineData'
import patientsService from '../services/patientsService'

const PatientDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  const { data: patients, loading: listLoading } = useOfflineData('patients', patientsService.getPatients)

  useEffect(() => {
    if (!listLoading && patients.length > 0) {
      const found = patients.find(p => p.id === id)
      setPatient(found || null)
      setLoading(false)
    }
  }, [patients, listLoading, id])

  const styles = {
    container: {
      maxWidth: '1000px',
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
    editButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
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
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    section: {
      marginBottom: theme.spacing[6]
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4]
    },
    infoItem: {
      marginBottom: theme.spacing[3]
    },
    label: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    value: {
      fontSize: theme.fonts.sizes.base,
      color: theme.colors.gray[900],
      fontWeight: theme.fonts.weights.medium
    },
    badge: {
      display: 'inline-block',
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      backgroundColor: `${theme.colors.primary.DEFAULT}10`,
      color: theme.colors.primary.DEFAULT,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      marginRight: theme.spacing[2],
      marginBottom: theme.spacing[2]
    },
    uhid: {
      fontFamily: theme.fonts.mono,
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[2]
    },
    name: {
      fontSize: theme.fonts.sizes['3xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4]
    }
  }

  if (loading || listLoading) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Loading patient details...</div>
        </div>
      </AppLayout>
    )
  }

  if (!patient) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Patient not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Patient Details</h1>
          <div style={styles.actions}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/patients')}
            >
              ← Back
            </button>
            <button 
              style={styles.editButton}
              onClick={() => navigate(`/patients/${id}/edit`)}
            >
              Edit Patient
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.uhid}>{patient.uhid}</div>
          <h2 style={styles.name}>{patient.firstName} {patient.lastName}</h2>

          {/* Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            <div style={styles.grid}>
              <div style={styles.infoItem}>
                <div style={styles.label}>Gender</div>
                <div style={styles.value}>{patient.gender || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Date of Birth</div>
                <div style={styles.value}>
                  {patient.dob ? new Date(patient.dob).toLocaleDateString() : '—'}
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Blood Group</div>
                <div style={styles.value}>{patient.bloodGroup || '—'}</div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Contact Information</h3>
            <div style={styles.grid}>
              <div style={styles.infoItem}>
                <div style={styles.label}>Phone</div>
                <div style={styles.value}>{patient.phone || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Email</div>
                <div style={styles.value}>{patient.email || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Address</div>
                <div style={styles.value}>{patient.address || '—'}</div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Emergency Contact</h3>
            <div style={styles.grid}>
              <div style={styles.infoItem}>
                <div style={styles.label}>Name</div>
                <div style={styles.value}>{patient.emergencyContactName || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Phone</div>
                <div style={styles.value}>{patient.emergencyContactPhone || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Relation</div>
                <div style={styles.value}>{patient.emergencyContactRelation || '—'}</div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Medical Information</h3>
            <div style={styles.infoItem}>
              <div style={styles.label}>Allergies</div>
              <div>
                {patient.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((allergy, index) => (
                    <span key={index} style={styles.badge}>{allergy}</span>
                  ))
                ) : (
                  <span style={styles.value}>None recorded</span>
                )}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.label}>Chronic Conditions</div>
              <div>
                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                  patient.chronicConditions.map((condition, index) => (
                    <span key={index} style={styles.badge}>{condition}</span>
                  ))
                ) : (
                  <span style={styles.value}>None recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Insurance Information</h3>
            <div style={styles.grid}>
              <div style={styles.infoItem}>
                <div style={styles.label}>Provider</div>
                <div style={styles.value}>{patient.insuranceProvider || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Policy Number</div>
                <div style={styles.value}>{patient.insurancePolicyNo || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default PatientDetailPage