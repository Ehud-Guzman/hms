import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import WardList from '../components/WardList'
import admissionsService from '../services/admissionsService'

const WardsPage = () => {
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadWards()
  }, [])

  const loadWards = async () => {
    setLoading(true)
    try {
      const data = await admissionsService.getWards()
      setWards(data.wards || [])
    } catch (error) {
      console.error('Failed to load wards:', error)
    } finally {
      setLoading(false)
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
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
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
    addButton: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      }
    }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/admissions')}
            >
              ← Back
            </button>
            <h1 style={styles.title}>Wards</h1>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => navigate('/admissions/wards/new')}
          >
            + New Ward
          </button>
        </div>

        <WardList
          wards={wards}
          loading={loading}
          onRefresh={loadWards}
        />
      </div>
    </AppLayout>
  )
}

export default WardsPage