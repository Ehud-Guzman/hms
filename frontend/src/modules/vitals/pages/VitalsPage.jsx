import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import vitalsService from '../services/vitalsService'

const VitalsPage = () => {
  const [stats, setStats] = useState(null)
  const [recentVitals, setRecentVitals] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData] = await Promise.all([
        vitalsService.getVitalsStats()
      ])
      setStats(statsData.stats)
      // You might also fetch recent vitals from an endpoint
    } catch (error) {
      console.error('Failed to load vitals data:', error)
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
    actions: {
      display: 'flex',
      gap: theme.spacing[3]
    },
    navButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.gray[50]
      }
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
        <div style={styles.container}>Loading vitals dashboard...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Vitals Dashboard</h1>
          <div style={styles.actions}>
            <button 
              style={styles.navButton}
              onClick={() => navigate('/vitals/triage')}
            >
              🚑 Triage
            </button>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Recordings</div>
            <div style={styles.statValue}>{stats?.totalRecords || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Critical Readings</div>
            <div style={styles.statValue}>{stats?.criticalReadings || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Patients with Vitals</div>
            <div style={styles.statValue}>{stats?.uniquePatients || 0}</div>
          </div>
        </div>

        <div style={styles.actionGrid}>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/vitals/record')}
          >
            <div style={styles.actionIcon}>➕</div>
            <div style={styles.actionLabel}>Record Vitals</div>
            <div style={styles.actionDesc}>Enter new vital signs</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/vitals/triage')}
          >
            <div style={styles.actionIcon}>🚑</div>
            <div style={styles.actionLabel}>Triage</div>
            <div style={styles.actionDesc}>View waiting patients</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => {
              const patientId = prompt('Enter Patient ID or UHID:')
              if (patientId) navigate(`/vitals/patient/${patientId}`)
            }}
          >
            <div style={styles.actionIcon}>👤</div>
            <div style={styles.actionLabel}>Patient Vitals</div>
            <div style={styles.actionDesc}>View history for a patient</div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default VitalsPage