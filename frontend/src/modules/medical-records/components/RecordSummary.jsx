import { useTheme } from '../../../context/ThemeContext'

const RecordSummary = ({ summary, loading }) => {
  const theme = useTheme()

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    section: {
      marginBottom: theme.spacing[6]
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: theme.spacing[4]
    },
    card: {
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg
    },
    cardTitle: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700],
      marginBottom: theme.spacing[2]
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    listItem: {
      padding: `${theme.spacing[2]} 0`,
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':last-child': {
        borderBottom: 'none'
      }
    },
    itemMain: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    itemTitle: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    itemDate: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    },
    itemDetail: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[600],
      marginTop: theme.spacing[1]
    },
    loading: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading summary...</div>
  }

  if (!summary) {
    return <div style={styles.loading}>No summary available.</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Diagnoses</h3>
        {summary.diagnoses?.length > 0 ? (
          <div style={styles.grid}>
            {summary.diagnoses.map((d, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.itemMain}>
                  <span style={styles.itemTitle}>{d.diagnosis}</span>
                  <span style={styles.itemDate}>{new Date(d.date).toLocaleDateString()}</span>
                </div>
                {d.icd10 && <div style={styles.itemDetail}>ICD-10: {d.icd10}</div>}
                <div style={styles.itemDetail}>Dr. {d.doctor}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: theme.colors.gray[500] }}>No diagnoses recorded.</p>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Medications</h3>
        {summary.medications?.length > 0 ? (
          <div style={styles.grid}>
            {summary.medications.map((m, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.itemMain}>
                  <span style={styles.itemTitle}>{m.medication}</span>
                  <span style={styles.itemDate}>{new Date(m.date).toLocaleDateString()}</span>
                </div>
                <div style={styles.itemDetail}>{m.instructions}</div>
                <div style={styles.itemDetail}>Dr. {m.doctor}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: theme.colors.gray[500] }}>No medications recorded.</p>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Allergies</h3>
        {summary.allergies?.length > 0 ? (
          <div style={styles.grid}>
            {summary.allergies.map((a, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.itemMain}>
                  <span style={styles.itemTitle}>{a.allergy}</span>
                  <span style={styles.itemDate}>{new Date(a.date).toLocaleDateString()}</span>
                </div>
                <div style={styles.itemDetail}>Reaction: {a.reaction}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: theme.colors.gray[500] }}>No allergies recorded.</p>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Immunizations</h3>
        {summary.immunizations?.length > 0 ? (
          <div style={styles.grid}>
            {summary.immunizations.map((v, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.itemMain}>
                  <span style={styles.itemTitle}>{v.vaccine}</span>
                  <span style={styles.itemDate}>{new Date(v.date).toLocaleDateString()}</span>
                </div>
                <div style={styles.itemDetail}>Dr. {v.doctor}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: theme.colors.gray[500] }}>No immunizations recorded.</p>
        )}
      </div>
    </div>
  )
}

export default RecordSummary