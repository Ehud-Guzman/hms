// modules/laboratory/pages/ResultsPage.jsx
import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import { AuthContext } from '../../../core/context/AuthContext'
import laboratoryService from '../services/laboratoryService'

const ResultsPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await laboratoryService.getOrders()

      if (Array.isArray(data)) {
        setOrders(data)
      } else if (Array.isArray(data?.data)) {
        setOrders(data.data)
      } else if (Array.isArray(data?.orders)) {
        setOrders(data.orders)
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error('Failed to fetch results:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEnterResults = async (id) => {
    const input = prompt('Enter results in JSON format')
    if (!input) return

    try {
      const parsed = JSON.parse(input)
      await laboratoryService.enterResults(id, parsed)
      fetchOrders()
    } catch (err) {
      alert('Invalid JSON or submission failed')
    }
  }

  const handleVerifyResults = async (id) => {
    if (!window.confirm('Verify these results?')) return

    try {
      await laboratoryService.verifyResults(id)
      fetchOrders()
    } catch (err) {
      alert('Verification failed')
    }
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
    navButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    tableWrapper: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      boxShadow: theme.shadows.sm,
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: theme.spacing[3],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    td: {
      padding: theme.spacing[3],
      borderBottom: `1px solid ${theme.colors.gray[100]}`,
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[800]
    },
    actionButton: {
      padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
      borderRadius: theme.radius.sm,
      fontSize: theme.fonts.sizes.xs,
      cursor: 'pointer',
      border: 'none',
      marginRight: theme.spacing[2]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading laboratory results...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Laboratory Results</h1>
          <button
            style={styles.navButton}
            onClick={() => navigate('/laboratory')}
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div style={{ color: theme.colors.error }}>
            {error}
          </div>
        )}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order #</th>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Tests</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={5}>
                    No laboratory results found.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td style={styles.td}>{order.orderNumber || '-'}</td>
                    <td style={styles.td}>
                      {order.patientName || order.patient?.fullName || '-'}
                    </td>
                    <td style={styles.td}>
                      {Array.isArray(order.tests)
                        ? order.tests.map(t => t.name || t).join(', ')
                        : '-'}
                    </td>
                    <td style={styles.td}>{order.status}</td>
                    <td style={styles.td}>
                      {user &&
                        ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'].includes(user.role) &&
                        order.status === 'PENDING' && (
                          <button
                            style={{
                              ...styles.actionButton,
                              backgroundColor: theme.colors.primary[600],
                              color: 'white'
                            }}
                            onClick={() => handleEnterResults(order.id)}
                          >
                            Enter
                          </button>
                        )}

                      {user &&
                        ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'].includes(user.role) &&
                        order.status === 'ENTERED' && (
                          <button
                            style={{
                              ...styles.actionButton,
                              backgroundColor: theme.colors.success,
                              color: 'white'
                            }}
                            onClick={() => handleVerifyResults(order.id)}
                          >
                            Verify
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

export default ResultsPage
