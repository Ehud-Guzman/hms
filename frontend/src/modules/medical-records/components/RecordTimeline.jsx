import { useTheme } from '../../../context/ThemeContext'

const RecordTimeline = ({ timeline, loading }) => {
  const theme = useTheme()

  const getTypeIcon = (type) => {
    const icons = {
      DIAGNOSIS: '🏥',
      PROCEDURE: '🔧',
      NOTE: '📝',
      PRESCRIPTION: '💊',
      LAB_RESULT: '🧪',
      IMAGING: '📡',
      VACCINATION: '💉',
      ALLERGY: '⚠️'
    }
    return icons[type] || '📄'
  }

  const getTypeColor = (type) => {
    const colors = {
      DIAGNOSIS: theme.colors.danger.DEFAULT,
      PROCEDURE: theme.colors.primary.DEFAULT,
      NOTE: theme.colors.success.DEFAULT,
      PRESCRIPTION: theme.colors.accent.DEFAULT,
      LAB_RESULT: theme.colors.warning.DEFAULT,
      IMAGING: theme.colors.purple,
      VACCINATION: theme.colors.teal,
      ALLERGY: theme.colors.pink
    }
    return colors[type] || theme.colors.gray[500]
  }

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    loading: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    },
    empty: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    },
    timeline: {
      position: 'relative',
      marginLeft: theme.spacing[4]
    },
    line: {
      position: 'absolute',
      left: '11px',
      top: 0,
      bottom: 0,
      width: '2px',
      backgroundColor: theme.colors.gray[200]
    },
    item: {
      position: 'relative',
      display: 'flex',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6],
      ':last-child': {
        marginBottom: 0
      }
    },
    dot: (color) => ({
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      zIndex: 1,
      flexShrink: 0
    }),
    content: {
      flex: 1,
      paddingBottom: theme.spacing[4],
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':last-child': {
        borderBottom: 'none'
      }
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[2]
    },
    date: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500]
    },
    type: {
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.primary.DEFAULT
    },
    title: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    description: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[2]
    },
    doctor: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading timeline...</div>
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: '48px', marginBottom: theme.spacing[3] }}>📅</div>
        <h3>No timeline events</h3>
        <p style={{ color: theme.colors.gray[500] }}>Records will appear here in chronological order.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.timeline}>
        <div style={styles.line} />
        {timeline.map((event, index) => (
          <div key={index} style={styles.item}>
            <div style={styles.dot(getTypeColor(event.type))}>
              {getTypeIcon(event.type)}
            </div>
            <div style={styles.content}>
              <div style={styles.header}>
                <span style={styles.date}>{new Date(event.date).toLocaleString()}</span>
                <span style={styles.type}>{event.type}</span>
              </div>
              <div style={styles.title}>{event.title}</div>
              {event.description && <div style={styles.description}>{event.description}</div>}
              <div style={styles.doctor}>Dr. {event.doctor}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecordTimeline