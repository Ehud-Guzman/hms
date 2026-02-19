import { useTheme } from '../../../context/ThemeContext'

const VitalsHistory = ({ vitals, loading, onView }) => {
  const theme = useTheme()

  const getBpCategory = (systolic, diastolic) => {
    if (!systolic || !diastolic) return null
    if (systolic < 120 && diastolic < 80) return { label: 'Normal', color: theme.colors.success.DEFAULT }
    if (systolic < 130 && diastolic < 80) return { label: 'Elevated', color: theme.colors.warning.DEFAULT }
    if (systolic < 140 || diastolic < 90) return { label: 'Stage 1', color: theme.colors.warning.DEFAULT }
    if (systolic < 180 || diastolic < 120) return { label: 'Stage 2', color: theme.colors.danger.DEFAULT }
    return { label: 'Crisis', color: theme.colors.danger.DEFAULT }
  }

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[3]
    },
    loading: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    },
    empty: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500],
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[4],
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[3]
    },
    date: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500]
    },
    bpTag: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: theme.spacing[3]
    },
    item: {
      textAlign: 'center'
    },
    itemLabel: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    itemValue: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900]
    },
    itemUnit: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading vitals history...</div>
  }

  if (!vitals || vitals.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: '48px', marginBottom: theme.spacing[3] }}>💓</div>
        <h3>No vitals recorded</h3>
        <p style={{ color: theme.colors.gray[500] }}>Record the first set of vitals for this patient.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {vitals.map((vital) => {
        const bpCategory = getBpCategory(vital.bloodPressureSystolic, vital.bloodPressureDiastolic)
        return (
          <div
            key={vital.id}
            style={styles.card}
            onClick={() => onView(vital)}
          >
            <div style={styles.header}>
              <span style={styles.date}>
                {new Date(vital.recordedAt).toLocaleString()}
              </span>
              {bpCategory && (
                <span
                  style={{
                    ...styles.bpTag,
                    backgroundColor: `${bpCategory.color}15`,
                    color: bpCategory.color
                  }}
                >
                  BP: {bpCategory.label}
                </span>
              )}
            </div>
            <div style={styles.grid}>
              <div style={styles.item}>
                <div style={styles.itemLabel}>BP</div>
                <div style={styles.itemValue}>
                  {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                </div>
                <div style={styles.itemUnit}>mmHg</div>
              </div>
              <div style={styles.item}>
                <div style={styles.itemLabel}>HR</div>
                <div style={styles.itemValue}>{vital.heartRate}</div>
                <div style={styles.itemUnit}>bpm</div>
              </div>
              <div style={styles.item}>
                <div style={styles.itemLabel}>Temp</div>
                <div style={styles.itemValue}>{vital.temperature}</div>
                <div style={styles.itemUnit}>°C</div>
              </div>
              <div style={styles.item}>
                <div style={styles.itemLabel}>SpO₂</div>
                <div style={styles.itemValue}>{vital.oxygenSaturation}</div>
                <div style={styles.itemUnit}>%</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default VitalsHistory