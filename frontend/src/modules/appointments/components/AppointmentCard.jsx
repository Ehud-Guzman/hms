import { useTheme } from '../../../context/ThemeContext'

const AppointmentCard = ({ appointment, onView, onCheckIn, onStart, onCancel }) => {
  const theme = useTheme()

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

  const statusColor = getStatusColor(appointment.status)

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[5],
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing[4]
    },
    time: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900]
    },
    status: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: statusColor.bg,
      color: statusColor.text
    },
    patientInfo: {
      marginBottom: theme.spacing[3]
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    patientUhid: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      fontFamily: theme.fonts.mono
    },
    doctorInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[3],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
    },
    doctorIcon: {
      fontSize: theme.fonts.sizes.lg
    },
    doctorName: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    doctorSpecialty: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    },
    details: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[4]
    },
    detailItem: {
      fontSize: theme.fonts.sizes.sm
    },
    detailLabel: {
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[0.5]
    },
    detailValue: {
      color: theme.colors.gray[900],
      fontWeight: theme.fonts.weights.medium
    },
    reason: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[4],
      padding: theme.spacing[3],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md,
      fontStyle: 'italic'
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2],
      borderTop: `1px solid ${theme.colors.gray[200]}`,
      paddingTop: theme.spacing[4]
    },
    button: {
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      border: 'none'
    },
    viewButton: {
      backgroundColor: `${theme.colors.primary.DEFAULT}10`,
      color: theme.colors.primary.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.primary.DEFAULT}20`
      }
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
    cancelButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.danger.DEFAULT}20`
      }
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.time}>
          {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={styles.status}>{appointment.status}</span>
      </div>

      <div style={styles.patientInfo}>
        <div style={styles.patientName}>{appointment.patientName}</div>
        <div style={styles.patientUhid}>{appointment.patientUhid}</div>
      </div>

      <div style={styles.doctorInfo}>
        <span style={styles.doctorIcon}>👨‍⚕️</span>
        <div>
          <div style={styles.doctorName}>Dr. {appointment.doctorName}</div>
          <div style={styles.doctorSpecialty}>{appointment.doctorSpecialty}</div>
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Type</div>
          <div style={styles.detailValue}>{appointment.type || 'Consultation'}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Priority</div>
          <div style={styles.detailValue}>{appointment.priority}</div>
        </div>
      </div>

      {appointment.reason && (
        <div style={styles.reason}>“{appointment.reason}”</div>
      )}

      <div style={styles.footer}>
        <button
          style={{ ...styles.button, ...styles.viewButton }}
          onClick={() => onView(appointment)}
        >
          View
        </button>
        
        {appointment.status === 'SCHEDULED' && (
          <button
            style={{ ...styles.button, ...styles.checkInButton }}
            onClick={() => onCheckIn(appointment)}
          >
            Check In
          </button>
        )}
        
        {appointment.status === 'WAITING' && (
          <button
            style={{ ...styles.button, ...styles.startButton }}
            onClick={() => onStart(appointment)}
          >
            Start
          </button>
        )}
        
        {['SCHEDULED', 'CHECKED_IN', 'WAITING'].includes(appointment.status) && (
          <button
            style={{ ...styles.button, ...styles.cancelButton }}
            onClick={() => onCancel(appointment)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default AppointmentCard