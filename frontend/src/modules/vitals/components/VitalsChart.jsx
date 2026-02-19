import { useTheme } from '../../../context/ThemeContext'

// Simple placeholder chart – in production you'd use a library like recharts
const VitalsChart = ({ data, type = 'bp' }) => {
  const theme = useTheme()

  // This is a simplified representation; in a real app you'd use a chart library
  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      border: `1px solid ${theme.colors.gray[200]}`,
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    placeholder: {
      textAlign: 'center',
      color: theme.colors.gray[500]
    },
    icon: {
      fontSize: '48px',
      marginBottom: theme.spacing[3]
    }
  }

  if (!data || data.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          <div style={styles.icon}>📊</div>
          <p>No trend data available</p>
        </div>
      </div>
    )
  }

  // In a real implementation, render a chart here
  return (
    <div style={styles.container}>
      <div style={styles.placeholder}>
        <div style={styles.icon}>📈</div>
        <p>Chart would render here with {data.length} data points</p>
        <p style={{ fontSize: theme.fonts.sizes.sm }}>(Integrate recharts or similar)</p>
      </div>
    </div>
  )
}

export default VitalsChart