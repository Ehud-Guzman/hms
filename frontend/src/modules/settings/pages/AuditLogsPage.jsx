import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import AuditLogList from '../components/AuditLogList'
import settingsService from '../services/settingsService'

const AuditLogsPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({ page: 1, limit: 50 })

  useEffect(() => {
    loadLogs()
  }, [filters])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await settingsService.getAuditLogs(filters)
      setLogs(data.logs || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      maxWidth: '1200px',
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
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    }
  }

  if (loading && !logs.length) {
    return (
      <AppLayout>
        <div style={styles.loadingContainer}>Loading audit logs...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Audit Logs</h1>
          <button style={styles.backButton} onClick={() => navigate('/settings')}>
            ← Back
          </button>
        </div>

        <AuditLogList
          logs={logs}
          loading={loading}
          pagination={pagination}
          onRefresh={loadLogs}
        />
      </div>
    </AppLayout>
  )
}

export default AuditLogsPage