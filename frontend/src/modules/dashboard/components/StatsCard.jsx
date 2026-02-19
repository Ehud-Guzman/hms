import { useTheme } from '../../../context/ThemeContext'

const StatsCard = ({ title, value, icon, color = 'primary', trend, loading }) => {
  const theme = useTheme()
  
  const colors = {
    primary: {
      bg: `${theme.colors.primary.DEFAULT}15`, // 15% opacity
      text: theme.colors.primary.DEFAULT,
      icon: theme.colors.primary.DEFAULT
    },
    green: {
      bg: `${theme.colors.success.DEFAULT}15`,
      text: theme.colors.success.DEFAULT,
      icon: theme.colors.success.DEFAULT
    },
    blue: {
      bg: '#3b82f615',
      text: '#3b82f6',
      icon: '#3b82f6'
    },
    purple: {
      bg: '#8b5cf615',
      text: '#8b5cf6',
      icon: '#8b5cf6'
    },
    orange: {
      bg: '#f9731615',
      text: '#f97316',
      icon: '#f97316'
    }
  }

  const style = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`,
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    title: {
      color: theme.colors.gray[600],
      fontSize: theme.fonts.sizes.sm,
      marginBottom: theme.spacing[1]
    },
    value: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    iconBox: {
      padding: theme.spacing[3],
      borderRadius: theme.radius.lg,
      backgroundColor: colors[color].bg
    },
    icon: {
      fontSize: theme.fonts.sizes.xl,
      color: colors[color].icon
    },
    trend: {
      marginTop: theme.spacing[4],
      fontSize: theme.fonts.sizes.sm
    },
    trendPositive: {
      color: theme.colors.success.DEFAULT
    },
    trendNegative: {
      color: theme.colors.danger.DEFAULT
    },
    loading: {
      height: '32px',
      width: '96px',
      backgroundColor: theme.colors.gray[200],
      borderRadius: theme.radius.sm,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }
  }

  if (loading) {
    return (
      <div style={style.container}>
        <div style={style.header}>
          <div>
            <div style={style.title}>{title}</div>
            <div style={style.loading}></div>
          </div>
          <div style={style.iconBox}>
            <span style={style.icon}>{icon}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={style.container}>
      <div style={style.header}>
        <div>
          <div style={style.title}>{title}</div>
          <div style={style.value}>{value}</div>
        </div>
        <div style={style.iconBox}>
          <span style={style.icon}>{icon}</span>
        </div>
      </div>
      {trend && (
        <div style={style.trend}>
          <span style={trend.positive ? style.trendPositive : style.trendNegative}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
          <span style={{ color: theme.colors.gray[500], marginLeft: theme.spacing[2] }}>
            vs last month
          </span>
        </div>
      )}
    </div>
  )
}

export default StatsCard