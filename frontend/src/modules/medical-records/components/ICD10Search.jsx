import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import medicalRecordsService from '../services/medicalRecordsService'

const ICD10Search = ({ onSelect }) => {
  const theme = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async () => {
    if (query.length < 2) return
    setLoading(true)
    try {
      const data = await medicalRecordsService.searchICD10(query)
      setResults(data.results || [])
      setShowResults(true)
    } catch (error) {
      console.error('ICD-10 search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    container: {
      position: 'relative',
      width: '100%'
    },
    searchBox: {
      display: 'flex',
      gap: theme.spacing[2]
    },
    input: {
      flex: 1,
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`
      }
    },
    button: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: `1px solid ${theme.colors.gray[200]}`,
      borderRadius: theme.radius.md,
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: theme.shadows.md,
      marginTop: theme.spacing[1]
    },
    resultItem: {
      padding: theme.spacing[3],
      cursor: 'pointer',
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':hover': {
        backgroundColor: theme.colors.gray[50]
      },
      ':last-child': {
        borderBottom: 'none'
      }
    },
    code: {
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.primary.DEFAULT,
      marginRight: theme.spacing[2]
    },
    description: {
      color: theme.colors.gray[700]
    },
    loading: {
      padding: theme.spacing[3],
      textAlign: 'center',
      color: theme.colors.gray[500]
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.searchBox}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search ICD-10 code or description..."
          style={styles.input}
        />
        <button onClick={handleSearch} style={styles.button} disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div style={styles.dropdown}>
          {results.map((item, idx) => (
            <div
              key={idx}
              style={styles.resultItem}
              onClick={() => {
                onSelect(item)
                setShowResults(false)
                setQuery('')
              }}
            >
              <span style={styles.code}>{item.code}</span>
              <span style={styles.description}>{item.description}</span>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && (
        <div style={styles.dropdown}>
          <div style={styles.loading}>No results found</div>
        </div>
      )}
    </div>
  )
}

export default ICD10Search