// src/modules/dashboard/components/QuickActions.jsx
import { useTheme } from '../../../context/ThemeContext'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../core/hooks/useAuth'

const QuickActions = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const role = user?.role

  // Define all possible actions with their allowed roles
  const allActions = [
    { path: '/patients/new', icon: '👤', label: 'New Patient', color: '#3b82f6', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
    { path: '/appointments/new', icon: '📅', label: 'Book Appointment', color: '#10b981', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { path: '/vitals', icon: '💓', label: 'Record Vitals', color: '#8b5cf6', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'] },
    { path: '/billing', icon: '💰', label: 'New Invoice', color: '#f97316', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] }
  ]

  // Filter actions based on user role
  const actions = allActions.filter(action => action.roles.includes(role))

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    title: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[4],
      color: theme.colors.gray[900]
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing[4]
    },
    action: {
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      textAlign: 'center',
      textDecoration: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      cursor: 'pointer',
      border: `1px solid ${theme.colors.gray[200]}`,
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.md
      }
    },
    icon: {
      fontSize: theme.fonts.sizes['2xl'],
      marginBottom: theme.spacing[2]
    },
    label: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700]
    }
  }

  // If no actions are allowed for this role, don't render the component at all
  if (actions.length === 0) {
    return null
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Quick Actions</h2>
      <div style={styles.grid}>
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            style={{
              ...styles.action,
              backgroundColor: `${action.color}10`,
              borderColor: `${action.color}30`
            }}
          >
            <div style={styles.icon}>{action.icon}</div>
            <div style={{ ...styles.label, color: action.color }}>{action.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActions