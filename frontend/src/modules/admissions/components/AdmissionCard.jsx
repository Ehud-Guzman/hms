import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'

const AdmissionCard = ({ admission }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const getStatusColor = (status) => {
    const colors = {
      REQUESTED: { bg: `${theme.colors.warning.DEFAULT}10`, text: theme.colors.warning.DEFAULT },
      APPROVED: { bg: `${theme.colors.primary.DEFAULT}10`, text: theme.colors.primary.DEFAULT },
      ADMITTED: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT },
      DISCHARGED: { bg: theme.colors.gray[200], text: theme.colors.gray[700] },
      CANCELLED: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT }
    }
    return colors[status] || colors.REQUESTED
  }

  const statusStyle = getStatusColor(admission.status)

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[4],
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing[2]
    },
    admissionNumber: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.primary.DEFAULT,
      fontFamily: theme.fonts.mono
    },
    status: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: statusStyle.bg,
      color: statusStyle.text
    },
    patientName: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    patientUhid: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[2]
    },
    details: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[2],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    doctor: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[2]
    },
    dates: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      borderTop: `1px solid ${theme.colors.gray[200]}`,
      paddingTop: theme.spacing[2],
      marginTop: theme.spacing[2]
    }
  }

  return (
    <div style={styles.card} onClick={() => navigate(`/admissions/${admission.id}`)}>
      <div style={styles.header}>
        <span style={styles.admissionNumber}>{admission.admissionNumber}</span>
        <span style={styles.status}>{admission.status}</span>
      </div>
      <div style={styles.patientName}>{admission.patientName}</div>
      <div style={styles.patientUhid}>UHID: {admission.patientUhid}</div>
      <div style={styles.details}>
        {admission.wardName && <span>Ward: {admission.wardName}</span>}
        {admission.bedNumber && <span>Bed: {admission.bedNumber}</span>}
      </div>
      <div style={styles.doctor}>Dr. {admission.doctorName}</div>
      <div style={styles.dates}>
        <span>Admitted: {new Date(admission.admissionDate).toLocaleDateString()}</span>
        {admission.expectedDischarge && (
          <span>Expected: {new Date(admission.expectedDischarge).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  )
}

export default AdmissionCard