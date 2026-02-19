import api from '../../../services/api'

class DashboardService {
  async getStats() {
    try {
      const [patients, appointments, revenue] = await Promise.all([
        api.get('/patients/stats').catch(() => ({ data: { stats: { totalPatients: 0 } } })),
        api.get('/appointments/stats').catch(() => ({
          data: {
            stats: {
              today: { total: 0 },
              current: { checkedIn: 0, waiting: 0, inProgress: 0 }
            }
          }
        })),
        api.get('/billing/revenue/stats?period=today').catch(() => ({ data: { stats: { totalRevenue: 0 } } }))
      ])

      return {
        patients: patients.data.stats || { totalPatients: 0 },
        appointments: appointments.data.stats || {
          today: { total: 0 },
          current: { checkedIn: 0, waiting: 0, inProgress: 0 }
        },
        revenue: revenue.data.stats || { totalRevenue: 0 }
      }
    } catch (error) {
      console.error('Dashboard stats error:', error)
      return {
        patients: { totalPatients: 0 },
        appointments: { today: { total: 0 }, current: { checkedIn: 0, waiting: 0, inProgress: 0 } },
        revenue: { totalRevenue: 0 }
      }
    }
  }

  async getRecentActivity() {
    try {
      const [appointments, payments] = await Promise.all([
        api.get('/appointments/today').catch(() => ({ data: { appointments: [] } })),
        api.get('/billing/payments?limit=5').catch(() => ({ data: { payments: [] } }))
      ])

      const activities = []

      // Add appointments to activity feed
      if (appointments.data.appointments) {
        appointments.data.appointments.forEach(apt => {
          activities.push({
            type: 'appointment',
            description: `${apt.patientName} checked in`,
            time: new Date(apt.startTime)
          })
        })
      }

      // Add payments to activity feed
      if (payments.data.payments) {
        payments.data.payments.forEach(pmt => {
          activities.push({
            type: 'payment',
            description: `Payment of KES ${pmt.amount / 100} received`,
            time: new Date(pmt.receivedAt)
          })
        })
      }

      // Sort by time descending and take top 10
      return activities
        .sort((a, b) => b.time - a.time)
        .slice(0, 10)
        .map(act => ({
          ...act,
          time: act.time.toLocaleTimeString() // format time for display
        }))
    } catch (error) {
      console.error('Recent activity error:', error)
      return []
    }
  }

  async getAlerts() {
    try {
      const [lowStock, appointments] = await Promise.all([
        api.get('/pharmacy/inventory/alerts/low-stock').catch(() => ({ data: { alerts: [] } })),
        api.get('/appointments/stats').catch(() => ({
          data: { stats: { current: { checkedIn: 0, waiting: 0 } } }
        }))
      ])

      return {
        lowStock: lowStock.data.alerts || [],
        pendingTasks: appointments.data.stats?.current || { checkedIn: 0, waiting: 0 }
      }
    } catch (error) {
      console.error('Alerts error:', error)
      return { lowStock: [], pendingTasks: { checkedIn: 0, waiting: 0 } }
    }
  }
}

export default new DashboardService()
