import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import appointmentsService from '../appointmentsService'

const AppointmentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointment()
  }, [id])

  const loadAppointment = async () => {
    setLoading(true)
    try {
      const data = await appointmentsService.getAppointment(id)
      setAppointment(data.appointment)
    } catch (error) {
      console.error('Failed to load appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      await appointmentsService.checkIn(id)
      loadAppointment()
    } catch (error) {
      alert('Failed to check in: ' + error.message)
    }
  }

  const handleStart = async () => {
    try {
      await appointmentsService.startAppointment(id)
      loadAppointment()
    } catch (error) {
      alert('Failed to start: ' + error.message)
    }
  }

  const handleCancel = async () => {
    const reason = prompt('Please enter cancellation reason:')
    if (reason) {
      try {
        await appointmentsService.cancelAppointment(id, reason)
        navigate('/appointments')
      } catch (error) {
        alert('Failed to cancel: ' + error.message)
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: { bg: `${theme.colors.primary.DEFAULT}10`, text: theme.colors.primary.DEFAULT },
      CHECKED_IN: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT },
      WAITING: { bg: `${theme.colors.warning.DEFAULT}10`, text: theme.colors.warning.DEFAULT },
      IN_PROGRESS: { bg: `${theme.colors.accent.DEFAULT}10`, text: theme.colors.accent.DEFAULT },
      COMPLETED: { bg: `${theme.colors.gray[200]}`, text: theme.colors.gray[600] },
      CANCELLED: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT },
      NO_SHOW: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT }
    }
    return colors[status] || colors.SCHEDULED
  }

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
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
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
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    statusBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[6],
      paddingBottom: theme.spacing[4],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    statusBadge: (status) => ({
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: getStatusColor(status).bg,
      color: getStatusColor(status).text
    }),
    datetime: {
      fontSize: theme.fonts.sizes.lg,
      color: theme.colors.gray[700]
    },
    section: {
      marginBottom: theme.spacing[6]
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4]
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4]
    },
    infoCard: {
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4]
    },
    infoTitle: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    infoValue: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900]
    },
    infoSubValue: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginTop: theme.spacing[1]
    },
    reasonBox: {
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      marginTop: theme.spacing[4]
    },
    reasonLabel: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[2]
    },
    reasonText: {
      fontSize: theme.fonts.sizes.base,
      color: theme.colors.gray[900],
      lineHeight: 1.6
    },
    actionButtons: {
      display: 'flex',
      gap: theme.spacing[3],
      marginTop: theme.spacing[6]
    },
    actionButton: (color) => ({
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: color,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        opacity: 0.9
      }
    })
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Loading appointment details...</div>
        </div>
      </AppLayout>
    )
  }

  if (!appointment) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Appointment not found</div>
        </div>
      </AppLayout>
    )
  }

  const statusColor = getStatusColor(appointment.status)

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Appointment Details</h1>
          <div style={styles.actions}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/appointments')}
            >
              ← Back
            </button>
            <button 
              style={styles.editButton}
              onClick={() => navigate(`/appointments/${id}/edit`)}
            >
              Edit
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.statusBar}>
            <span style={styles.statusBadge(appointment.status)}>
              {appointment.status}
            </span>
            <span style={styles.datetime}>
              {new Date(appointment.startTime).toLocaleString()}
            </span>
          </div>

          <div style={styles.grid}>
            {/* Patient Info */}
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Patient</div>
              <div style={styles.infoValue}>
                {appointment.patient?.firstName} {appointment.patient?.lastName}
              </div>
              <div style={styles.infoSubValue}>UHID: {appointment.patient?.uhid}</div>
              {appointment.patient?.phone && (
                <div style={styles.infoSubValue}>📞 {appointment.patient.phone}</div>
              )}
            </div>

            {/* Doctor Info */}
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Doctor</div>
              <div style={styles.infoValue}>
                Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
              </div>
              <div style={styles.infoSubValue}>{appointment.doctor?.specialty}</div>
            </div>

            {/* Type & Priority */}
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Type</div>
              <div style={styles.infoValue}>{appointment.type || 'Consultation'}</div>
              <div style={styles.infoSubValue}>Priority: {appointment.priority}</div>
            </div>

            {/* Duration */}
            <div style={styles.infoCard}>
              <div style={styles.infoTitle}>Duration</div>
              <div style={styles.infoValue}>
                {new Date(appointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={styles.infoSubValue}>
                {Math.round((new Date(appointment.endTime) - new Date(appointment.startTime)) / 60000)} minutes
              </div>
            </div>
          </div>

          {/* Reason */}
          {appointment.reason && (
            <div style={styles.reasonBox}>
              <div style={styles.reasonLabel}>Reason for Visit</div>
              <div style={styles.reasonText}>{appointment.reason}</div>
            </div>
          )}

          {/* Symptoms */}
          {appointment.symptoms && (
            <div style={styles.reasonBox}>
              <div style={styles.reasonLabel}>Symptoms</div>
              <div style={styles.reasonText}>{appointment.symptoms}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            {appointment.status === 'SCHEDULED' && (
              <button
                style={styles.actionButton(theme.colors.success.DEFAULT)}
                onClick={handleCheckIn}
              >
                Check In
              </button>
            )}
            {appointment.status === 'WAITING' && (
              <button
                style={styles.actionButton(theme.colors.accent.DEFAULT)}
                onClick={handleStart}
              >
                Start Appointment
              </button>
            )}
            {['SCHEDULED', 'CHECKED_IN', 'WAITING'].includes(appointment.status) && (
              <button
                style={styles.actionButton(theme.colors.danger.DEFAULT)}
                onClick={handleCancel}
              >
                Cancel Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default AppointmentDetailPage