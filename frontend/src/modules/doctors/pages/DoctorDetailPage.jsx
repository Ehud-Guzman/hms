import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import { useOfflineData } from '../../../hooks/useOfflineData'
import doctorsService from '../services/doctorsService'

const DoctorDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  const { data: doctors, loading: listLoading } = useOfflineData('doctors', doctorsService.getDoctors)

  useEffect(() => {
    if (!listLoading && doctors.length > 0) {
      const found = doctors.find(d => d.id === id)
      setDoctor(found || null)
      setLoading(false)
    }
  }, [doctors, listLoading, id])

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
    name: {
      fontSize: theme.fonts.sizes['3xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[2]
    },
    specialty: {
      fontSize: theme.fonts.sizes.lg,
      color: theme.colors.primary.DEFAULT,
      marginBottom: theme.spacing[4]
    }
  }

  if (loading || listLoading) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Loading doctor details...</div>
        </div>
      </AppLayout>
    )
  }

  if (!doctor) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Doctor not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Doctor Profile</h1>
          <div style={styles.actions}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/doctors')}
            >
              ← Back
            </button>
            <button 
              style={styles.editButton}
              onClick={() => navigate(`/doctors/${id}/edit`)}
            >
              Edit Doctor
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.name}>Dr. {doctor.firstName} {doctor.lastName}</h2>
          <div style={styles.specialty}>{doctor.specialty || 'General Practice'}</div>

          {/* Professional Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Professional Information</h3>
            <div style={styles.grid}>
              <div style={styles.infoItem}>
                <div style={styles.label}>License Number</div>
                <div style={styles.value}>{doctor.licenseNo || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Qualification</div>
                <div style={styles.value}>{doctor.qualification || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Experience</div>
                <div style={styles.value}>{doctor.experience ? `${doctor.experience} years` : '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Consultation Fee</div>
                <div style={styles.value}>
                  {doctor.consultationFee ? `KES ${doctor.consultationFee / 100}` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Contact Information</h3>
            <div style={styles.grid}>
              <div style={styles.infoItem}>
                <div style={styles.label}>Email</div>
                <div style={styles.value}>{doctor.user?.email || '—'}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.label}>Phone</div>
                <div style={styles.value}>{doctor.phone || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default DoctorDetailPage