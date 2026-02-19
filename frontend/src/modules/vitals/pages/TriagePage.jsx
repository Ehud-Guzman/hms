import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import vitalsService from '../services/vitalsService'
import appointmentsService from '../../appointments/appointmentsService'

const TriagePage = () => {
  const [triageList, setTriageList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    painScore: '',
    consciousness: 'ALERT',
    notes: ''
  })

  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadTriageList()
    const interval = setInterval(loadTriageList, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const loadTriageList = async () => {
    setLoading(true)
    try {
      const data = await vitalsService.getTriageList()
      setTriageList(data.triageList || [])
    } catch (error) {
      console.error('Failed to load triage list:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordVitals = async (e) => {
    e.preventDefault()
    if (!selectedPatient) return

    try {
      await vitalsService.recordVitals({
        patientId: selectedPatient.patient.id,
        appointmentId: selectedPatient.appointmentId,
        ...vitalsForm,
        bloodPressureSystolic: parseInt(vitalsForm.bloodPressureSystolic),
        bloodPressureDiastolic: parseInt(vitalsForm.bloodPressureDiastolic),
        heartRate: parseInt(vitalsForm.heartRate),
        temperature: parseFloat(vitalsForm.temperature),
        respiratoryRate: parseInt(vitalsForm.respiratoryRate),
        oxygenSaturation: parseInt(vitalsForm.oxygenSaturation),
        painScore: parseInt(vitalsForm.painScore)
      })

      // After recording vitals, check in the patient automatically? Or leave as is.
      // The original triage might allow check-in separately.
      setShowVitalsModal(false)
      setSelectedPatient(null)
      setVitalsForm({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        painScore: '',
        consciousness: 'ALERT',
        notes: ''
      })
      loadTriageList()
    } catch (error) {
      alert('Failed to record vitals: ' + error.message)
    }
  }

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentsService.checkIn(appointmentId)
      loadTriageList()
    } catch (error) {
      alert('Failed to check in patient: ' + error.message)
    }
  }

  const openVitalsModal = (patient) => {
    setSelectedPatient(patient)
    setShowVitalsModal(true)
  }

  const getPriorityColor = (priority) => {
    const colors = {
      RESUSCITATION: theme.colors.danger.DEFAULT,
      EMERGENCY: theme.colors.warning.DEFAULT,
      URGENT: theme.colors.accent.DEFAULT,
      'SEMI-URGENT': theme.colors.primary.DEFAULT,
      'NON-URGENT': theme.colors.success.DEFAULT
    }
    return colors[priority] || theme.colors.gray[500]
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      RESUSCITATION: 'Immediate',
      EMERGENCY: '10 min',
      URGENT: '30 min',
      'SEMI-URGENT': '60 min',
      'NON-URGENT': '120 min'
    }
    return labels[priority] || priority
  }

  const styles = {
    container: {
      maxWidth: '1200px',
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
    refreshButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      border: `1px solid ${theme.colors.gray[200]}`
    },
    statLabel: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    statValue: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[3]
    },
    patientCard: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      border: `1px solid ${theme.colors.gray[200]}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    patientInfo: {
      flex: 1
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[1]
    },
    patientDetails: {
      display: 'flex',
      gap: theme.spacing[4],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[2]
    },
    priorityBadge: {
      display: 'inline-block',
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
      color: 'white',
      marginRight: theme.spacing[2]
    },
    actions: {
      display: 'flex',
      gap: theme.spacing[2]
    },
    actionButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      border: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`
    },
    vitalsButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      }
    },
    checkInButton: {
      backgroundColor: theme.colors.success.DEFAULT,
      color: 'white',
      ':hover': {
        backgroundColor: theme.colors.success.dark
      }
    },
    emptyState: {
      textAlign: 'center',
      padding: theme.spacing[12],
      color: theme.colors.gray[500],
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: theme.radius.xl,
      padding: theme.spacing[6],
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[4]
    },
    modalTitle: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900]
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: theme.colors.gray[500]
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[4]
    },
    fieldGroup: {
      marginBottom: theme.spacing[3]
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
      fontSize: theme.fonts.sizes.sm,
      outline: 'none'
    },
    select: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      backgroundColor: 'white'
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[3],
      marginTop: theme.spacing[4]
    },
    cancelButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.gray[200],
      color: theme.colors.gray[700],
      border: 'none',
      borderRadius: theme.radius.md,
      cursor: 'pointer'
    },
    saveButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      cursor: 'pointer'
    }
  }

  const stats = {
    total: triageList.length,
    critical: triageList.filter(p => p.triagePriority === 'RESUSCITATION' || p.triagePriority === 'EMERGENCY').length,
    waiting: triageList.filter(p => !p.hasVitals).length,
    triaged: triageList.filter(p => p.hasVitals && p.status !== 'CHECKED_IN').length
  }

  if (loading && !triageList.length) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading triage list...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Emergency Triage</h1>
          <button style={styles.refreshButton} onClick={loadTriageList}>
            ↻ Refresh
          </button>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total in Queue</div>
            <div style={styles.statValue}>{stats.total}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Critical</div>
            <div style={styles.statValue}>{stats.critical}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Awaiting Vitals</div>
            <div style={styles.statValue}>{stats.waiting}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Triaged</div>
            <div style={styles.statValue}>{stats.triaged}</div>
          </div>
        </div>

        {triageList.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing[3] }}>🚑</div>
            <h3>No patients in triage</h3>
            <p>The waiting area is empty.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {triageList.map((item) => (
              <div key={item.appointmentId} style={styles.patientCard}>
                <div style={styles.patientInfo}>
                  <div style={styles.patientName}>
                    {item.patient?.firstName} {item.patient?.lastName}
                  </div>
                  <div style={styles.patientDetails}>
                    <span>UHID: {item.patient?.uhid}</span>
                    <span>Wait: {item.waitingTime} min</span>
                  </div>
                  <div>
                    <span
                      style={{
                        ...styles.priorityBadge,
                        backgroundColor: getPriorityColor(item.triagePriority)
                      }}
                    >
                      {getPriorityLabel(item.triagePriority)}
                    </span>
                    <span style={{ fontSize: theme.fonts.sizes.sm, color: theme.colors.gray[600] }}>
                      Status: {item.status}
                    </span>
                  </div>
                </div>
                <div style={styles.actions}>
                  {!item.hasVitals ? (
                    <button
                      style={{ ...styles.actionButton, ...styles.vitalsButton }}
                      onClick={() => openVitalsModal(item)}
                    >
                      Record Vitals
                    </button>
                  ) : item.status === 'SCHEDULED' ? (
                    <button
                      style={{ ...styles.actionButton, ...styles.checkInButton }}
                      onClick={() => handleCheckIn(item.appointmentId)}
                    >
                      Check In
                    </button>
                  ) : (
                    <span style={{ padding: theme.spacing[2], color: theme.colors.gray[500] }}>
                      Checked In
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vitals Modal */}
      {showVitalsModal && selectedPatient && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Record Vitals</h2>
              <button style={styles.closeButton} onClick={() => setShowVitalsModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: theme.spacing[3] }}>
              <strong>{selectedPatient.patient?.firstName} {selectedPatient.patient?.lastName}</strong>
              <div style={{ fontSize: theme.fonts.sizes.sm, color: theme.colors.gray[600] }}>
                UHID: {selectedPatient.patient?.uhid}
              </div>
            </div>
            <form onSubmit={handleRecordVitals} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>BP Systolic</label>
                <input
                  type="number"
                  value={vitalsForm.bloodPressureSystolic}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureSystolic: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>BP Diastolic</label>
                <input
                  type="number"
                  value={vitalsForm.bloodPressureDiastolic}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Heart Rate</label>
                <input
                  type="number"
                  value={vitalsForm.heartRate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalsForm.temperature}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Respiratory Rate</label>
                <input
                  type="number"
                  value={vitalsForm.respiratoryRate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>O2 Saturation (%)</label>
                <input
                  type="number"
                  value={vitalsForm.oxygenSaturation}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Pain Score (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={vitalsForm.painScore}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, painScore: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Consciousness</label>
                <select
                  value={vitalsForm.consciousness}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, consciousness: e.target.value })}
                  style={styles.select}
                >
                  <option value="ALERT">Alert</option>
                  <option value="CONFUSED">Confused</option>
                  <option value="VOICE">Responds to Voice</option>
                  <option value="PAIN">Responds to Pain</option>
                  <option value="UNRESPONSIVE">Unresponsive</option>
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                  style={styles.input}
                  rows="3"
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowVitalsModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.saveButton}>
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default TriagePage