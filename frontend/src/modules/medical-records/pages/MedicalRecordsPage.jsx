import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import medicalRecordsService from '../services/medicalRecordsService'

const MedicalRecordsPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await medicalRecordsService.getRecordStats()
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to load medical records stats:', error)
    } finally {
      setLoading(false)
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    statLabel: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    statValue: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6]
    },
    actionCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      textAlign: 'center',
      cursor: 'pointer',
      border: `1px solid ${theme.colors.gray[200]}`,
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md,
        transform: 'translateY(-2px)'
      }
    },
    actionIcon: {
      fontSize: '40px',
      marginBottom: theme.spacing[3]
    },
    actionLabel: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[2]
    },
    actionDesc: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading medical records dashboard...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Medical Records</h1>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Records</div>
            <div style={styles.statValue}>{stats?.totalRecords || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Diagnoses</div>
            <div style={styles.statValue}>{stats?.byType?.find(t => t.recordType === 'DIAGNOSIS')?._count || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Procedures</div>
            <div style={styles.statValue}>{stats?.byType?.find(t => t.recordType === 'PROCEDURE')?._count || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Notes</div>
            <div style={styles.statValue}>{stats?.byType?.find(t => t.recordType === 'NOTE')?._count || 0}</div>
          </div>
        </div>

        <div style={styles.actionGrid}>
          <div 
            style={styles.actionCard}
            onClick={() => {
              const patientId = prompt('Enter Patient ID or UHID:')
              if (patientId) navigate(`/medical-records/patient/${patientId}`)
            }}
          >
            <div style={styles.actionIcon}>👤</div>
            <div style={styles.actionLabel}>Patient Records</div>
            <div style={styles.actionDesc}>View records for a patient</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => {
              const patientId = prompt('Enter Patient ID or UHID:')
              if (patientId) navigate(`/medical-records/patient/${patientId}/new`)
            }}
          >
            <div style={styles.actionIcon}>➕</div>
            <div style={styles.actionLabel}>New Record</div>
            <div style={styles.actionDesc}>Add a medical record</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/medical-records/icd10')}
          >
            <div style={styles.actionIcon}>🔍</div>
            <div style={styles.actionLabel}>ICD-10 Search</div>
            <div style={styles.actionDesc}>Look up diagnosis codes</div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default MedicalRecordsPage