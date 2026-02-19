import { useTheme } from '../../../context/ThemeContext'

const ActivityFeed = ({ activities, loading }) => {
  const theme = useTheme()

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`,
      height: '100%'
    },
    title: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[4],
      color: theme.colors.gray[900]
    },
    loadingItem: {
      display: 'flex',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[4]
    },
    loadingAvatar: {
      width: '40px',
      height: '40px',
      backgroundColor: theme.colors.gray[200],
      borderRadius: theme.radius.full,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    loadingContent: {
      flex: 1
    },
    loadingLine: {
      height: '16px',
      backgroundColor: theme.colors.gray[200],
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing[2],
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    loadingSmall: {
      height: '12px',
      width: '60%',
      backgroundColor: theme.colors.gray[200],
      borderRadius: theme.radius.sm,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    empty: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500],
      fontSize: theme.fonts.sizes.sm
    },
    activityItem: {
      display: 'flex',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[4],
      paddingBottom: theme.spacing[4],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: theme.radius.full,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: theme.fonts.sizes.lg
    },
    content: {
      flex: 1
    },
    description: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    time: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    }
  }

  const getActivityColor = (type) => {
    const colors = {
      appointment: '#3b82f6',
      lab: '#8b5cf6',
      payment: '#10b981',
      patient: '#f97316'
    }
    return colors[type] || theme.colors.gray[500]
  }

  const getActivityIcon = (type) => {
    const icons = {
      appointment: '📅',
      lab: '🧪',
      payment: '💰',
      patient: '👤'
    }
    return icons[type] || '📌'
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Recent Activity</h2>
        {[1, 2, 3].map(i => (
          <div key={i} style={styles.loadingItem}>
            <div style={styles.loadingAvatar}></div>
            <div style={styles.loadingContent}>
              <div style={{ ...styles.loadingLine, width: '80%' }}></div>
              <div style={styles.loadingSmall}></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Recent Activity</h2>
        <div style={styles.empty}>
          No recent activity
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recent Activity</h2>
      {activities.map((activity, index) => (
        <div 
          key={index} 
          style={{
            ...styles.activityItem,
            ...(index === activities.length - 1 ? {
              borderBottom: 'none',
              marginBottom: 0,
              paddingBottom: 0
            } : {})
          }}
        >
          <div style={{ 
            ...styles.avatar, 
            backgroundColor: `${getActivityColor(activity.type)}15`,
            color: getActivityColor(activity.type)
          }}>
            {getActivityIcon(activity.type)}
          </div>
          <div style={styles.content}>
            <div style={styles.description}>{activity.description}</div>
            <div style={styles.time}>{activity.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityFeed