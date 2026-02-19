import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const RecordFilters = ({ filters, setFilters }) => {
  const theme = useTheme()
  const [search, setSearch] = useState(filters.search || '')
  const [recordType, setRecordType] = useState(filters.recordType || '')
  const [fromDate, setFromDate] = useState(filters.fromDate || '')
  const [toDate, setToDate] = useState(filters.toDate || '')

  const recordTypes = [
    'DIAGNOSIS', 'PROCEDURE', 'NOTE', 'PRESCRIPTION',
    'LAB_RESULT', 'IMAGING', 'VACCINATION', 'ALLERGY'
  ]

  const handleApply = () => {
    setFilters({
      ...filters,
      search,
      recordType: recordType || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: 1
    })
  }

  const handleReset = () => {
    setSearch('')
    setRecordType('')
    setFromDate('')
    setToDate('')
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
      flex: '1 1 150px'
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
      border: 'none'
    },
    applyButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white'
    },
    resetButton: {
      backgroundColor: theme.colors.gray[200],
      color: theme.colors.gray[700]
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
          placeholder="Title, description, ICD-10"
          style={styles.input}
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Record Type</label>
        <select value={recordType} onChange={(e) => setRecordType(e.target.value)} style={styles.select}>
          <option value="">All</option>
          {recordTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>From Date</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>To Date</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.buttonGroup}>
        <button style={{ ...styles.button, ...styles.applyButton }} onClick={handleApply}>
          Apply
        </button>
        <button style={{ ...styles.button, ...styles.resetButton }} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  )
}

export default RecordFilters