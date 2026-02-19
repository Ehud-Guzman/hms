import { useTheme } from '../../../context/ThemeContext'

const TestCard = ({ test, onEdit, onDelete }) => {
  const theme = useTheme()

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
      marginBottom: theme.spacing[3]
    },
    code: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      fontFamily: theme.fonts.mono
    },
    name: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    category: {
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
    editButton: {
      backgroundColor: `${theme.colors.primary.DEFAULT}10`,
      color: theme.colors.primary.DEFAULT,
      ':hover': {
        backgroundColor: `${theme.colors.primary.DEFAULT}20`
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
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.code}>{test.code}</span>
      </div>
      <h3 style={styles.name}>{test.name}</h3>
      <div style={styles.category}>{test.category}</div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Sample Type</div>
          <div style={styles.detailValue}>{test.sampleType || '—'}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Price</div>
          <div style={styles.detailValue}>KES {test.price ? test.price / 100 : '—'}</div>
        </div>
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>Status</div>
          <div style={styles.detailValue}>{test.isActive ? 'Active' : 'Inactive'}</div>
        </div>
      </div>

      {test.description && (
        <div style={{ marginBottom: theme.spacing[3], fontSize: theme.fonts.sizes.sm, color: theme.colors.gray[600] }}>
          {test.description}
        </div>
      )}

      <div style={styles.footer}>
        <button
          style={{ ...styles.button, ...styles.editButton }}
          onClick={() => onEdit(test)}
        >
          Edit
        </button>
        <button
          style={{ ...styles.button, ...styles.deleteButton }}
          onClick={() => onDelete(test.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default TestCard