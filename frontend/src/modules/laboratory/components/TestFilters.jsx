import { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import laboratoryService from '../services/laboratoryService'

const TestFilters = ({ filters, setFilters }) => {
  const theme = useTheme()
  const [search, setSearch] = useState(filters.search || '')
  const [category, setCategory] = useState(filters.category || '')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await laboratoryService.getTestCategories()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleApply = () => {
    setFilters({
      ...filters,
      search,
      category: category || undefined,
      page: 1
    })
  }

  const handleReset = () => {
    setSearch('')
    setCategory('')
    setFilters({ page: 1, limit: 20 })
  }

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      marginBottom: theme.spacing[6],
      border: `1px solid ${theme.colors.gray[200]}`,
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing[4],
      alignItems: 'flex-end'
    },
    fieldGroup: {
      flex: '1 1 200px'
    },
    label: {
      display: 'block',
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700],
      marginBottom: theme.spacing[1]
    },
    input: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm
    },
    select: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      backgroundColor: 'white'
    },
    buttonGroup: {
      display: 'flex',
      gap: theme.spacing[2],
      marginLeft: 'auto'
    },
    button: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      border: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    applyButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      }
    },
    resetButton: {
      backgroundColor: theme.colors.gray[200],
      color: theme.colors.gray[700],
      ':hover': {
        backgroundColor: theme.colors.gray[300]
      }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Test name or code"
          style={styles.input}
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
          <option value="">All</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div style={styles.buttonGroup}>
        <button
          style={{ ...styles.button, ...styles.applyButton }}
          onClick={handleApply}
        >
          Apply
        </button>
        <button
          style={{ ...styles.button, ...styles.resetButton }}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default TestFilters