import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import pharmacyService from '../pharmacyService'
import { formatNumberWithCommas } from '../utils/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const PharmacyPage = () => {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, alertsData] = await Promise.all([
        pharmacyService.getInventoryStats(),
        pharmacyService.getLowStockAlerts()
      ])
      setStats(statsData.stats)
      setAlerts(alertsData.alerts || [])
    } catch (error) {
      console.error('Failed to load pharmacy data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartColors = {
    inventory: ['#4caf50', '#ff9800'], // green for total, orange for low stock
    expiring: '#f44336' // red for expiring soon
  }

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
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
    actions: {
      display: 'flex',
      gap: theme.spacing[3]
    },
    navButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    statLabel: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    statValue: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    chartContainer: {
      width: '100%',
      height: 200,
      marginBottom: theme.spacing[6]
    },
    alertSection: {
      backgroundColor: `${theme.colors.warning.DEFAULT}10`,
      border: `1px solid ${theme.colors.warning.DEFAULT}30`,
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      marginBottom: theme.spacing[6]
    },
    alertTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.warning.DEFAULT,
      marginBottom: theme.spacing[3]
    },
    alertList: {
      display: 'grid',
      gap: theme.spacing[3]
    },
    alertItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing[3],
      backgroundColor: 'white',
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    alertName: {
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    alertStock: {
      color: theme.colors.warning.DEFAULT,
      fontWeight: theme.fonts.weights.bold
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6]
    },
    actionCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      textAlign: 'center',
      cursor: 'pointer',
      border: `1px solid ${theme.colors.gray[200]}`,
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md,
        transform: 'translateY(-2px)'
      }
    },
    actionIcon: {
      fontSize: '40px',
      marginBottom: theme.spacing[3]
    },
    actionLabel: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[2]
    },
    actionDesc: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Loading pharmacy dashboard...</div>
        </div>
      </AppLayout>
    )
  }

  const inventoryData = [
    { name: 'Low Stock', value: stats?.lowStock || 0 },
    { name: 'Available', value: (stats?.totalItems || 0) - (stats?.lowStock || 0) }
  ]

  const expiringData = [
    { name: 'Expiring Soon', value: stats?.expiringSoon || 0 },
    { name: 'Good', value: (stats?.totalItems || 0) - (stats?.expiringSoon || 0) }
  ]

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Pharmacy Dashboard</h1>
          <div style={styles.actions}>
            <button 
              style={styles.navButton}
              onClick={() => navigate('/pharmacy/inventory')}
            >
              📦 Inventory
            </button>
            <button 
              style={styles.navButton}
              onClick={() => navigate('/pharmacy/prescriptions')}
            >
              💊 Prescriptions
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Items</div>
            <div style={styles.statValue}>{formatNumberWithCommas(stats?.totalItems || 0)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Value</div>
            <div style={styles.statValue}>KES {formatNumberWithCommas(stats?.totalValue || 0)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Low Stock Items</div>
            <div style={styles.statValue}>{formatNumberWithCommas(stats?.lowStock || 0)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Expiring Soon</div>
            <div style={styles.statValue}>{formatNumberWithCommas(stats?.expiringSoon || 0)}</div>
          </div>
        </div>



        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={styles.alertSection}>
            <h2 style={styles.alertTitle}>⚠️ Low Stock Alerts</h2>
            <div style={styles.alertList}>
              {alerts.slice(0, 5).map(item => (
                <div key={item.id} style={styles.alertItem}>
                  <span style={styles.alertName}>{item.genericName} ({item.brandName})</span>
                  <span style={styles.alertStock}>{formatNumberWithCommas(item.quantityInStock)} left</span>
                </div>
              ))}
              {alerts.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: theme.spacing[2] }}>
                  <button 
                    style={styles.navButton}
                    onClick={() => navigate('/pharmacy/inventory?filter=lowStock')}
                  >
                    View all {alerts.length} alerts
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={styles.actionGrid}>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/pharmacy/inventory/new')}
          >
            <div style={styles.actionIcon}>➕</div>
            <div style={styles.actionLabel}>Add Medicine</div>
            <div style={styles.actionDesc}>Add new item to inventory</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/pharmacy/prescriptions/new')}
          >
            <div style={styles.actionIcon}>💊</div>
            <div style={styles.actionLabel}>New Prescription</div>
            <div style={styles.actionDesc}>Create a prescription</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/pharmacy/prescriptions?status=pending')}
          >
            <div style={styles.actionIcon}>⏳</div>
            <div style={styles.actionLabel}>Pending Dispense</div>
            <div style={styles.actionDesc}>View prescriptions to dispense</div>
          </div>
          <div 
            style={styles.actionCard}
            onClick={() => navigate('/pharmacy/inventory?filter=expiring')}
          >
            <div style={styles.actionIcon}>⏰</div>
            <div style={styles.actionLabel}>Expiring Soon</div>
            <div style={styles.actionDesc}>Check expiring medications</div>
          </div>
        </div>
        {/* Inventory Pie Chart */}
        <div style={styles.chartContainer}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={inventoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                label
              >
                {inventoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors.inventory[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumberWithCommas(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expiring Items Bar Chart */}
        <div style={styles.chartContainer}>
          <ResponsiveContainer>
            <BarChart data={expiringData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumberWithCommas(value)} />
              <Legend />
              <Bar dataKey="value" fill={chartColors.expiring} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </AppLayout>
  )
}

export default PharmacyPage
