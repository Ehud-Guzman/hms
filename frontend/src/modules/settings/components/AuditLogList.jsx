import { useTheme } from '../../../context/ThemeContext'

const AuditLogList = ({ logs, loading, pagination, onRefresh }) => {
  const theme = useTheme()

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return theme.colors.success.DEFAULT
    if (action.includes('UPDATE')) return theme.colors.warning.DEFAULT
    if (action.includes('DELETE')) return theme.colors.danger.DEFAULT
    if (action.includes('LOGIN')) return theme.colors.primary.DEFAULT
    return theme.colors.gray[600]
  }

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`,
      overflowX: 'auto' // allow horizontal scroll on small screens
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '800px' // ensures table doesn't squish on small screens
    },
    th: {
      textAlign: 'left',
      padding: theme.spacing[3],
      borderBottom: `2px solid ${theme.colors.gray[200]}`,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[700],
      whiteSpace: 'nowrap'
    },
    td: {
      padding: theme.spacing[3],
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      fontSize: theme.fonts.sizes.sm,
      verticalAlign: 'top'
    },
    actionBadge: (action) => ({
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: `${getActionColor(action)}15`,
      color: getActionColor(action),
      display: 'inline-block',
      whiteSpace: 'nowrap'
    }),
    metadata: {
      maxWidth: '300px',
      overflow: 'auto',
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[600],
      fontFamily: theme.fonts.mono,
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[1],
      borderRadius: theme.radius.sm,
      margin: 0
    },
    loadingContainer: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    },
    empty: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginTop: theme.spacing[4],
      paddingTop: theme.spacing[4],
      borderTop: `1px solid ${theme.colors.gray[200]}`
    },
    pageButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.gray[300]}`,
      backgroundColor: 'white',
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    pageButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    pageInfo: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    }
  }

  if (loading) {
    return <div style={styles.loadingContainer}>Loading logs...</div>
  }

  if (!logs || logs.length === 0) {
    return <div style={styles.empty}>No audit logs found.</div>
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Timestamp</th>
            <th style={styles.th}>User</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>Target</th>
            <th style={styles.th}>Details</th>
            <th style={styles.th}>IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td style={styles.td}>{new Date(log.createdAt).toLocaleString()}</td>
              <td style={styles.td}>
                <div>{log.actorEmail}</div>
                <div style={{ fontSize: theme.fonts.sizes.xs, color: theme.colors.gray[500] }}>{log.actorRole}</div>
              </td>
              <td style={styles.td}>
                <span style={styles.actionBadge(log.action)}>{log.action}</span>
              </td>
              <td style={styles.td}>
                {log.targetType}: {log.targetId?.substring(0, 8)}...
              </td>
              <td style={styles.td}>
                {log.metadata && <pre style={styles.metadata}>{JSON.stringify(log.metadata, null, 2)}</pre>}
              </td>
              <td style={styles.td}>{log.ip || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.pages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.pageButton,
              ...(pagination.page === 1 ? styles.pageButtonDisabled : {})
            }}
            disabled={pagination.page === 1}
            onClick={() => onRefresh({ page: pagination.page - 1 })}
          >
            ← Prev
          </button>
          <span style={styles.pageInfo}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            style={{
              ...styles.pageButton,
              ...(pagination.page === pagination.pages ? styles.pageButtonDisabled : {})
            }}
            disabled={pagination.page === pagination.pages}
            onClick={() => onRefresh({ page: pagination.page + 1 })}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default AuditLogList