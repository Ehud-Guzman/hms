import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import TestList from '../components/TestList'
import TestFilters from '../components/TestFilters'
import laboratoryService from '../services/laboratoryService'

const TestsPage = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadTests()
  }, [filters])

  const loadTests = async () => {
    setLoading(true)
    try {
      const data = await laboratoryService.getTests(filters)
      setTests(data.tests || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await laboratoryService.deleteTest(id)
        loadTests()
      } catch (error) {
        alert('Failed to delete test: ' + error.message)
      }
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
              onClick={() => navigate('/laboratory')}
            >
              ← Back
            </button>
            <h1 style={styles.title}>Test Catalog</h1>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => navigate('/laboratory/tests/new')}
          >
            + New Test
          </button>
        </div>

        <TestFilters filters={filters} setFilters={setFilters} />

        <TestList
          tests={tests}
          loading={loading}
          pagination={pagination}
          onDelete={handleDelete}
          onRefresh={loadTests}
        />
      </div>
    </AppLayout>
  )
}

export default TestsPage