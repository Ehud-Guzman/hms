import { useTheme } from '../../../context/ThemeContext'

const DoctorCard = ({ doctor, onEdit, onDelete, onView }) => {
  const theme = useTheme()

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—'
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[5],
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      cursor: 'pointer'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing[4]
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: theme.radius.full,
      backgroundColor: `${theme.colors.primary.DEFAULT}15`,
      color: theme.colors.primary.DEFAULT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: theme.fonts.weights.bold
    },
    license: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      fontFamily: theme.fonts.mono,
      marginBottom: theme.spacing[1]
    },
    name: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    specialty: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.primary.DEFAULT,
      marginBottom: theme.spacing[3]
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
      color: theme.colors.primary.DEFAULT
    },
    editButton: {
      backgroundColor: `${theme.colors.accent.DEFAULT}10`,
      color: theme.colors.accent.DEFAULT
    },
    deleteButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT
    }
  }

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.md
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={styles.header}>
        <div style={styles.avatar}>👨‍⚕️</div>
        <div style={styles.license}>
          {doctor.licenseNo || 'No License'}
        </div>
      </div>

      <h3 style={styles.name}>
        Dr. {doctor.firstName || ''} {doctor.lastName || ''}
      </h3>

      <div style={styles.specialty}>
        {doctor.specialty || 'General Practice'}
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Phone</div>
          <div style={styles.detailValue}>{doctor.phone || '—'}</div>
        </div>

        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Experience</div>
          <div style={styles.detailValue}>
            {doctor.experience ? `${doctor.experience} years` : '—'}
          </div>
        </div>

        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Consultation Fee</div>
          <div style={styles.detailValue}>
            {formatCurrency(doctor.consultationFee)}
          </div>
        </div>

        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Email</div>
          <div style={styles.detailValue}>
            {doctor.user?.email || '—'}
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <button
          style={{ ...styles.button, ...styles.viewButton }}
          onClick={() => onView(doctor)}
        >
          View
        </button>

        <button
          style={{ ...styles.button, ...styles.editButton }}
          onClick={() => onEdit(doctor)}
        >
          Edit
        </button>

        <button
          style={{ ...styles.button, ...styles.deleteButton }}
          onClick={() => onDelete(doctor.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default DoctorCard