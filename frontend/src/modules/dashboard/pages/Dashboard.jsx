// frontend/src/modules/dashboard/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../../core/hooks/useAuth'
import AppLayout from '../../../core/components/layout/AppLayout'
import StatsCard from '../../../modules/dashboard/components/StatsCard'
import ActivityFeed from '../../../modules/dashboard/components/ActivityFeed'
import QuickActions from '../../../modules/dashboard/components/QuickActions'
import dashboardService from '../../../modules/dashboard/services/dashboardService'

const Dashboard = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const role = user?.role

  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()

  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, activitiesData, alertsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getAlerts()
      ])

      setStats(statsData)
      setActivities(activitiesData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `KES ${(amount / 100).toLocaleString()}`
  }

  // Determine which stats cards to show and their labels
  const showRevenue = ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'].includes(role)
  const showLowStockAlert = ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)
  const showPendingTasksAlert = ['RECEPTIONIST', 'NURSE', 'DOCTOR', 'HOSPITAL_ADMIN', 'SYSTEM_ADMIN'].includes(role)

  const patientsLabel = role === 'DOCTOR' ? 'My Patients' : 'Total Patients'
  const appointmentsLabel = role === 'DOCTOR' ? 'My Appointments Today' : "Today's Appointments"

  const styles = {
    container: {
      padding: theme.spacing[6]
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
    refreshButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'white',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.gray[50]
      }
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing[6],
      marginBottom: theme.spacing[6]
    },
    twoColumnGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: theme.spacing[6],
      marginBottom: theme.spacing[6]
    },
    alertBox: {
      backgroundColor: `${theme.colors.warning.DEFAULT}15`,
      border: `1px solid ${theme.colors.warning.DEFAULT}30`,
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    alertTitle: {
      color: theme.colors.warning.DEFAULT,
      fontWeight: theme.fonts.weights.medium,
      marginBottom: theme.spacing[2]
    },
    alertList: {
      display: 'flex',
      gap: theme.spacing[4],
      flexWrap: 'wrap'
    },
    alertItem: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[700]
    }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <button
            onClick={loadDashboardData}
            style={styles.refreshButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.gray[50]}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Alerts */}
        {alerts && (
          <div style={styles.alertBox}>
            <div style={styles.alertTitle}>⚠️ Alerts</div>
            <div style={styles.alertList}>
              {showLowStockAlert && alerts.lowStock?.length > 0 && (
                <span style={styles.alertItem}>
                  {alerts.lowStock.length} items low in stock
                </span>
              )}
              {showPendingTasksAlert && alerts.pendingTasks?.checkedIn > 0 && (
                <span style={styles.alertItem}>
                  {alerts.pendingTasks.checkedIn} patients checked in
                </span>
              )}
              {showPendingTasksAlert && alerts.pendingTasks?.waiting > 0 && (
                <span style={styles.alertItem}>
                  {alerts.pendingTasks.waiting} patients waiting
                </span>
              )}
              {/* If no alerts, show nothing or a friendly message? */}
              {!(
                (showLowStockAlert && alerts.lowStock?.length > 0) ||
                (showPendingTasksAlert && (alerts.pendingTasks?.checkedIn > 0 || alerts.pendingTasks?.waiting > 0))
              ) && (
                <span style={styles.alertItem}>No current alerts</span>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <StatsCard
            title={patientsLabel}
            value={stats?.patients?.totalPatients?.toLocaleString() || '0'}
            icon="👤"
            color="primary"
            loading={loading}
          />
          <StatsCard
            title={appointmentsLabel}
            value={stats?.appointments?.today?.total?.toString() || '0'}
            icon="📅"
            color="blue"
            loading={loading}
          />
          {showRevenue && (
            <StatsCard
              title="Today's Revenue"
              value={stats?.revenue?.totalRevenue ? formatCurrency(stats.revenue.totalRevenue) : 'KES 0'}
              icon="💰"
              color="green"
              loading={loading}
            />
          )}
          <StatsCard
            title="Active Patients"
            value={
              alerts?.pendingTasks
                ? (alerts.pendingTasks.checkedIn + alerts.pendingTasks.waiting).toString()
                : '0'
            }
            icon="👥"
            color="purple"
            loading={loading}
          />
        </div>

        {/* Activity Feed and Quick Actions */}
        <div style={styles.twoColumnGrid}>
          <ActivityFeed activities={activities} loading={loading} />
          <QuickActions />
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard