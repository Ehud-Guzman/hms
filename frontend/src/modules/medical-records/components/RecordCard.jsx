import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'

const RecordCard = ({ record }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const getTypeIcon = (type) => {
    const icons = {
      DIAGNOSIS: '🏥',
      PROCEDURE: '🔧',
      NOTE: '📝',
      PRESCRIPTION: '💊',
      LAB_RESULT: '🧪',
      IMAGING: '📡',
      VACCINATION: '💉',
      ALLERGY: '⚠️'
    }
    return icons[type] || '📄'
  }

  const getTypeColor = (type) => {
    const colors = {
      DIAGNOSIS: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT },
      PROCEDURE: { bg: `${theme.colors.primary.DEFAULT}10`, text: theme.colors.primary.DEFAULT },
      NOTE: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT },
      PRESCRIPTION: { bg: `${theme.colors.accent.DEFAULT}10`, text: theme.colors.accent.DEFAULT },
      LAB_RESULT: { bg: `${theme.colors.warning.DEFAULT}10`, text: theme.colors.warning.DEFAULT },
      IMAGING: { bg: `${theme.colors.purple}10`, text: theme.colors.purple },
      VACCINATION: { bg: `${theme.colors.teal}10`, text: theme.colors.teal },
      ALLERGY: { bg: `${theme.colors.pink}10`, text: theme.colors.pink }
    }
    return colors[type] || { bg: theme.colors.gray[100], text: theme.colors.gray[700] }
  }

  const typeStyle = getTypeColor(record.recordType)

  const styles = {
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
      alignItems: 'flex-start',
      marginBottom: theme.spacing[2]
    },
    type: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[1],
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: typeStyle.bg,
      color: typeStyle.text
    },
    date: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    },
    title: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    description: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[2],
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    },
    meta: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      borderTop: `1px solid ${theme.colors.gray[200]}`,
      paddingTop: theme.spacing[2],
      marginTop: theme.spacing[2]
    },
    icd10: {
      fontFamily: theme.fonts.mono,
      color: theme.colors.primary.DEFAULT
    },
    doctor: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[1]
    }
  }

  return (
    <div style={styles.card} onClick={() => navigate(`/medical-records/${record.id}`)}>
      <div style={styles.header}>
        <span style={styles.type}>
          {getTypeIcon(record.recordType)} {record.recordType}
        </span>
        <span style={styles.date}>{new Date(record.recordedAt).toLocaleDateString()}</span>
      </div>
      <div style={styles.title}>{record.title}</div>
      {record.description && <div style={styles.description}>{record.description}</div>}
      <div style={styles.meta}>
        {record.icd10Code && <span style={styles.icd10}>{record.icd10Code}</span>}
        <span style={styles.doctor}>👨‍⚕️ Dr. {record.doctorName}</span>
      </div>
    </div>
  )
}

export default RecordCard