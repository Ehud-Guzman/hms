import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import appointmentsService from '../appointmentsService'

const WaitingListPage = () => {
  const [waiting, setWaiting] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadWaitingList()
    const interval = setInterval(loadWaitingList, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadWaitingList = async () => {
    try {
      const data = await appointmentsService.getWaitingList()
      setWaiting(data.waiting || [])
    } catch (error) {
      console.error('Failed to load waiting list:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentsService.checkIn(appointmentId)
      loadWaitingList()
    } catch (error) {
      alert('Failed to check in: ' + error.message)
    }
  }

  const handleStart = async (appointmentId) => {
    try {
      await appointmentsService.startAppointment(appointmentId)
      loadWaitingList()
    } catch (error) {
      alert('Failed to start: ' + error.message)
    }
  }

  const handleNoShow = async (appointmentId) => {
    if (window.confirm('Mark this patient as no-show?')) {
      try {
        await appointmentsService.markNoShow(appointmentId)
        loadWaitingList()
      } catch (error) {
        alert('Failed to mark no-show: ' + error.message)
      }
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      RESUSCITATION: theme.colors.danger.DEFAULT,
      EMERGENCY: theme.colors.warning.DEFAULT,
      URGENT: theme.colors.accent.DEFAULT,
      'SEMI-URGENT': theme.colors.primary.DEFAULT,
      'NON-URGENT': theme.colors.success.DEFAULT
    }
    return colors[priority] || theme.colors.gray[500]
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      RESUSCITATION: 'Immediate',
      EMERGENCY: '10 min',
      URGENT: '30 min',
      'SEMI-URGENT': '60 min',
      'NON-URGENT': '120 min'
    }
    return labels[priority] || priority
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
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
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[3]
    },
    patientCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      border: `1px solid ${theme.colors.gray[200]}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    patientInfo: {
      flex: 1
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    patientDetails: {
      display: 'flex',
      gap: theme.spacing[4],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    priorityBadge: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      color: 'white',
      marginRight: theme.spacing[2]
    },
    actions: {
      display: 'flex',
      gap: theme.spacing[2]
    },
    actionButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      border: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    checkInButton: {
      backgroundColor: theme.colors.success.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.success.dark
      }
    },
    startButton: {
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.accent.dark
      }
    },
    noShowButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.danger.DEFAULT}20`
      }
    },
    emptyState: {
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
    }
  }

  const stats = {
    total: waiting.length,
    checkedIn: waiting.filter(w => w.status === 'CHECKED_IN').length,
    waiting: waiting.filter(w => w.status === 'WAITING').length,
    inProgress: waiting.filter(w => w.status === 'IN_PROGRESS').length
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Loading waiting list...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Waiting List</h1>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/appointments')}
          >
            ← Back to List
          </button>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Waiting</div>
            <div style={styles.statValue}>{stats.total}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Checked In</div>
            <div style={styles.statValue}>{stats.checkedIn}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>In Waiting Room</div>
            <div style={styles.statValue}>{stats.waiting}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>In Progress</div>
            <div style={styles.statValue}>{stats.inProgress}</div>
          </div>
        </div>

        {waiting.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👥</div>
            <h3>No patients waiting</h3>
            <p>The waiting list is empty</p>
          </div>
        ) : (
          <div style={styles.list}>
            {waiting.map((patient, index) => (
              <div key={patient.appointmentId} style={styles.patientCard}>
                <div style={styles.patientInfo}>
                  <div style={styles.patientName}>
                    {patient.patient?.firstName} {patient.patient?.lastName}
                  </div>
                  <div style={styles.patientDetails}>
                    <span>UHID: {patient.patient?.uhid}</span>
                    <span>Dr. {patient.doctorName}</span>
                    <span>Wait: {patient.waitingTime} min</span>
                  </div>
                  <div style={{ marginTop: theme.spacing[2] }}>
                    <span
                      style={{
                        ...styles.priorityBadge,
                        backgroundColor: getPriorityColor(patient.triagePriority)
                      }}
                    >
                      {getPriorityLabel(patient.triagePriority)}
                    </span>
                    <span style={styles.patientDetails}>
                      Status: {patient.status}
                    </span>
                  </div>
                </div>

                <div style={styles.actions}>
                  {patient.status === 'CHECKED_IN' && (
                    <button
                      style={{ ...styles.actionButton, ...styles.startButton }}
                      onClick={() => handleStart(patient.appointmentId)}
                    >
                      Start
                    </button>
                  )}
                  {patient.status === 'WAITING' && (
                    <button
                      style={{ ...styles.actionButton, ...styles.startButton }}
                      onClick={() => handleStart(patient.appointmentId)}
                    >
                      Call
                    </button>
                  )}
                  {patient.status === 'SCHEDULED' && (
                    <button
                      style={{ ...styles.actionButton, ...styles.checkInButton }}
                      onClick={() => handleCheckIn(patient.appointmentId)}
                    >
                      Check In
                    </button>
                  )}
                  <button
                    style={{ ...styles.actionButton, ...styles.noShowButton }}
                    onClick={() => handleNoShow(patient.appointmentId)}
                  >
                    No Show
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default WaitingListPage