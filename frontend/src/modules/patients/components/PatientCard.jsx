import { useTheme } from '../../../context/ThemeContext'

const PatientCard = ({ patient, onEdit, onDelete, onView }) => {
  const theme = useTheme()

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[5],
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      cursor: 'pointer',
      ':hover': {
        boxShadow: theme.shadows.md,
        transform: 'translateY(-2px)'
      }
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
      fontSize: '24px',
      fontWeight: theme.fonts.weights.bold
    },
    uhid: {
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
      color: theme.colors.primary.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.primary.DEFAULT}20`
      }
    },
    editButton: {
      backgroundColor: `${theme.colors.accent.DEFAULT}10`,
      color: theme.colors.accent.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.accent.DEFAULT}20`
      }
    },
    deleteButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.danger.DEFAULT}20`
      }
    }
  }

  return (
    <div 
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.md
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={styles.header}>
        <div style={styles.avatar}>
          {patient.firstName?.[0]}{patient.lastName?.[0]}
        </div>
        <div>
          <div style={styles.uhid}>{patient.uhid}</div>
        </div>
      </div>

      <h3 style={styles.name}>
        {patient.firstName} {patient.lastName}
      </h3>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Gender</div>
          <div style={styles.detailValue}>{patient.gender || '—'}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Blood Group</div>
          <div style={styles.detailValue}>{patient.bloodGroup || '—'}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Phone</div>
          <div style={styles.detailValue}>{patient.phone || '—'}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>DOB</div>
          <div style={styles.detailValue}>
            {patient.dob ? new Date(patient.dob).toLocaleDateString() : '—'}
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <button
          style={{ ...styles.button, ...styles.viewButton }}
          onClick={() => onView(patient)}
          onMouseEnter={(e) => e.target.style.backgroundColor = `${theme.colors.primary.DEFAULT}20`}
          onMouseLeave={(e) => e.target.style.backgroundColor = `${theme.colors.primary.DEFAULT}10`}
        >
          View
        </button>
        <button
          style={{ ...styles.button, ...styles.editButton }}
          onClick={() => onEdit(patient)}
          onMouseEnter={(e) => e.target.style.backgroundColor = `${theme.colors.accent.DEFAULT}20`}
          onMouseLeave={(e) => e.target.style.backgroundColor = `${theme.colors.accent.DEFAULT}10`}
        >
          Edit
        </button>
        <button
          style={{ ...styles.button, ...styles.deleteButton }}
          onClick={() => onDelete(patient.id)}
          onMouseEnter={(e) => e.target.style.backgroundColor = `${theme.colors.danger.DEFAULT}20`}
          onMouseLeave={(e) => e.target.style.backgroundColor = `${theme.colors.danger.DEFAULT}10`}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default PatientCard