import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const InventoryFilters = ({ filters, setFilters }) => {
  const theme = useTheme()
  const [search, setSearch] = useState(filters.search || '')
  const [category, setCategory] = useState(filters.category || '')
  const [lowStock, setLowStock] = useState(filters.lowStock || false)
  const [expiring, setExpiring] = useState(filters.expiring || false)

  const handleApply = () => {
    setFilters({
      ...filters,
      search,
      category,
      lowStock: lowStock || undefined,
      expiring: expiring || undefined,
      page: 1
    })
  }

  const handleReset = () => {
    setSearch('')
    setCategory('')
    setLowStock(false)
    setExpiring(false)
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
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[3],
      paddingTop: theme.spacing[2]
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[1],
      fontSize: theme.fonts.sizes.sm
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
          placeholder="Name, brand, or code"
          style={styles.input}
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
          <option value="">All</option>
          <option value="ANTIBIOTIC">Antibiotic</option>
          <option value="ANALGESIC">Analgesic</option>
          <option value="ANTIHYPERTENSIVE">Antihypertensive</option>
          <option value="DIABETES">Diabetes</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div style={styles.fieldGroup}>
        <div style={styles.checkboxGroup}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => setLowStock(e.target.checked)}
            />
            Low stock only
          </label>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={expiring}
              onChange={(e) => setExpiring(e.target.checked)}
            />
            Expiring soon
          </label>
        </div>
      </div>
      <div style={styles.buttonGroup}>
        <button
          style={{ ...styles.button, ...styles.applyButton }}
          onClick={handleApply}
        >
          Apply Filters
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

export default InventoryFilters