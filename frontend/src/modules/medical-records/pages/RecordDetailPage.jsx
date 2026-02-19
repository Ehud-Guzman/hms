import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import medicalRecordsService from '../services/medicalRecordsService'

const RecordDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecord()
  }, [id])

  const loadRecord = async () => {
    setLoading(true)
    try {
      const data = await medicalRecordsService.getRecord(id)
      setRecord(data.record)
    } catch (error) {
      console.error('Failed to load record:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await medicalRecordsService.deleteRecord(id)
        navigate(`/medical-records/patient/${record.patientId}`)
      } catch (error) {
        alert('Failed to delete record: ' + error.message)
      }
    }
  }

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
      DIAGNOSIS: theme.colors.danger.DEFAULT,
      PROCEDURE: theme.colors.primary.DEFAULT,
      NOTE: theme.colors.success.DEFAULT,
      PRESCRIPTION: theme.colors.accent.DEFAULT,
      LAB_RESULT: theme.colors.warning.DEFAULT,
      IMAGING: theme.colors.purple,
      VACCINATION: theme.colors.teal,
      ALLERGY: theme.colors.pink
    }
    return colors[type] || theme.colors.gray[500]
  }

  const styles = {
    container: {
      maxWidth: '800px',
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
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    typeBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing[1],
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: `${getTypeColor(record?.recordType)}15`,
      color: getTypeColor(record?.recordType),
      marginBottom: theme.spacing[4]
    },
    date: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[4]
    },
    recordTitle: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4]
    },
    description: {
      fontSize: theme.fonts.sizes.base,
      color: theme.colors.gray[700],
      lineHeight: 1.6,
      marginBottom: theme.spacing[4],
      whiteSpace: 'pre-wrap'
    },
    meta: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4]
    },
    metaRow: {
      display: 'flex',
      marginBottom: theme.spacing[2],
      ':last-child': {
        marginBottom: 0
      }
    },
    metaLabel: {
      width: '120px',
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    metaValue: {
      flex: 1,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    icd10: {
      fontFamily: theme.fonts.mono,
      color: theme.colors.primary.DEFAULT
    },
    confidential: {
      marginTop: theme.spacing[4],
      padding: theme.spacing[3],
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      borderRadius: theme.radius.md,
      color: theme.colors.danger.DEFAULT,
      textAlign: 'center'
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[3],
      marginTop: theme.spacing[6]
    },
    button: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      border: 'none'
    },
    editButton: {
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white'
    },
    deleteButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading record...</div>
      </AppLayout>
    )
  }

  if (!record) {
    return (
      <AppLayout>
        <div style={styles.container}>Record not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Record Details</h1>
          <button style={styles.backButton} onClick={() => navigate(`/medical-records/patient/${record.patientId}`)}>
            ← Back
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.typeBadge}>
            {getTypeIcon(record.recordType)} {record.recordType}
          </div>
          <div style={styles.date}>
            Recorded: {new Date(record.recordedAt).toLocaleString()}
          </div>
          <div style={styles.recordTitle}>{record.title}</div>
          {record.description && <div style={styles.description}>{record.description}</div>}

          <div style={styles.meta}>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Patient</span>
              <span style={styles.metaValue}>
                {record.patient?.firstName} {record.patient?.lastName} (UHID: {record.patient?.uhid})
              </span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Doctor</span>
              <span style={styles.metaValue}>Dr. {record.doctor?.firstName} {record.doctor?.lastName}</span>
            </div>
            {record.icd10Code && (
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>ICD-10</span>
                <span style={styles.metaValue}>
                  <span style={styles.icd10}>{record.icd10Code}</span> – {record.icd10Description}
                </span>
              </div>
            )}
          </div>

          {record.isConfidential && (
            <div style={styles.confidential}>
              🔒 This record is confidential and has restricted access.
            </div>
          )}

          <div style={styles.actions}>
            <button
              style={{ ...styles.button, ...styles.editButton }}
              onClick={() => navigate(`/medical-records/${id}/edit`)}
            >
              Edit
            </button>
            <button
              style={{ ...styles.button, ...styles.deleteButton }}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default RecordDetailPage