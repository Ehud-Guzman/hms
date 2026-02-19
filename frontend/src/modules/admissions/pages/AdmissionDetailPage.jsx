import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import admissionsService from '../services/admissionsService'

const AdmissionDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [admission, setAdmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dischargeForm, setDischargeForm] = useState({
    dischargeNotes: '',
    dischargeInstructions: '',
    diagnosis: ''
  })
  const [showDischarge, setShowDischarge] = useState(false)

  useEffect(() => {
    loadAdmission()
  }, [id])

  const loadAdmission = async () => {
    setLoading(true)
    try {
      const data = await admissionsService.getAdmission(id)
      setAdmission(data.admission)
    } catch (error) {
      console.error('Failed to load admission:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDischarge = async (e) => {
    e.preventDefault()
    try {
      await admissionsService.dischargePatient(id, dischargeForm)
      navigate('/admissions/list')
    } catch (error) {
      alert('Failed to discharge patient: ' + error.message)
    }
  }

  const handleTransfer = () => {
    // Could navigate to a transfer form
    alert('Transfer functionality coming soon')
  }

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this admission?')) {
      try {
        await admissionsService.cancelAdmission(id, 'Cancelled by user')
        navigate('/admissions/list')
      } catch (error) {
        alert('Failed to cancel admission: ' + error.message)
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      REQUESTED: { bg: `${theme.colors.warning.DEFAULT}10`, text: theme.colors.warning.DEFAULT },
      APPROVED: { bg: `${theme.colors.primary.DEFAULT}10`, text: theme.colors.primary.DEFAULT },
      ADMITTED: { bg: `${theme.colors.success.DEFAULT}10`, text: theme.colors.success.DEFAULT },
      DISCHARGED: { bg: theme.colors.gray[200], text: theme.colors.gray[700] },
      CANCELLED: { bg: `${theme.colors.danger.DEFAULT}10`, text: theme.colors.danger.DEFAULT }
    }
    return colors[status] || colors.REQUESTED
  }

  const styles = {
    container: {
      maxWidth: '1000px',
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
    infoBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[6],
      paddingBottom: theme.spacing[4],
      borderBottom: `1px solid ${theme.colors.gray[200]}`
    },
    admissionNumber: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.primary.DEFAULT,
      fontFamily: theme.fonts.mono
    },
    statusBadge: (status) => ({
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      backgroundColor: getStatusColor(status).bg,
      color: getStatusColor(status).text
    }),
    patientInfo: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[6]
    },
    patientName: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.semibold,
      marginBottom: theme.spacing[2]
    },
    patientMeta: {
      display: 'flex',
      gap: theme.spacing[4],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      flexWrap: 'wrap'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6]
    },
    infoItem: {
      padding: theme.spacing[3],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
    },
    infoLabel: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1]
    },
    infoValue: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    notes: {
      marginBottom: theme.spacing[6],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
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
    dischargeButton: {
      backgroundColor: theme.colors.success.DEFAULT,
      color: 'white'
    },
    transferButton: {
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white'
    },
    cancelButton: {
      backgroundColor: `${theme.colors.danger.DEFAULT}10`,
      color: theme.colors.danger.DEFAULT
    },
    editButton: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white'
    },
    dischargeForm: {
      marginTop: theme.spacing[6],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg
    },
    fieldGroup: {
      marginBottom: theme.spacing[3]
    },
    label: {
      display: 'block',
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing[1]
    },
    input: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm
    },
    textarea: {
      width: '100%',
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      minHeight: '80px'
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[2]
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading admission...</div>
      </AppLayout>
    )
  }

  if (!admission) {
    return (
      <AppLayout>
        <div style={styles.container}>Admission not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admission Details</h1>
          <button style={styles.backButton} onClick={() => navigate('/admissions/list')}>
            ← Back
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.infoBar}>
            <span style={styles.admissionNumber}>{admission.admissionNumber}</span>
            <span style={styles.statusBadge(admission.status)}>{admission.status}</span>
          </div>

          <div style={styles.patientInfo}>
            <div style={styles.patientName}>
              {admission.patient?.firstName} {admission.patient?.lastName}
            </div>
            <div style={styles.patientMeta}>
              <span>UHID: {admission.patient?.uhid}</span>
              <span>DOB: {admission.patient?.dob ? new Date(admission.patient.dob).toLocaleDateString() : '—'}</span>
              <span>Gender: {admission.patient?.gender || '—'}</span>
              {admission.patient?.phone && <span>📞 {admission.patient.phone}</span>}
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Doctor</div>
              <div style={styles.infoValue}>Dr. {admission.doctor?.firstName} {admission.doctor?.lastName}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Ward / Bed</div>
              <div style={styles.infoValue}>
                {admission.bed?.ward?.name || '—'} {admission.bed ? `/ ${admission.bed.bedNumber}` : ''}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Admitted</div>
              <div style={styles.infoValue}>{new Date(admission.admissionDate).toLocaleString()}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Expected Discharge</div>
              <div style={styles.infoValue}>
                {admission.expectedDischarge ? new Date(admission.expectedDischarge).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>

          {admission.diagnosis && (
            <div style={styles.notes}>
              <strong>Diagnosis:</strong> {admission.diagnosis}
            </div>
          )}

          {admission.notes && (
            <div style={styles.notes}>
              <strong>Notes:</strong> {admission.notes}
            </div>
          )}

          {admission.status === 'ADMITTED' && !showDischarge && (
            <div style={styles.actions}>
              <button style={{ ...styles.button, ...styles.editButton }} onClick={() => navigate(`/admissions/${id}/edit`)}>
                Edit
              </button>
              <button style={{ ...styles.button, ...styles.transferButton }} onClick={handleTransfer}>
                Transfer
              </button>
              <button style={{ ...styles.button, ...styles.dischargeButton }} onClick={() => setShowDischarge(true)}>
                Discharge
              </button>
              <button style={{ ...styles.button, ...styles.cancelButton }} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}

          {admission.status === 'REQUESTED' && (
            <div style={styles.actions}>
              <button style={{ ...styles.button, ...styles.editButton }} onClick={() => navigate(`/admissions/${id}/edit`)}>
                Edit
              </button>
              <button style={{ ...styles.button, ...styles.cancelButton }} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}

          {showDischarge && (
            <div style={styles.dischargeForm}>
              <h3 style={{ marginBottom: theme.spacing[3] }}>Discharge Patient</h3>
              <form onSubmit={handleDischarge}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Final Diagnosis</label>
                  <input
                    type="text"
                    value={dischargeForm.diagnosis}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, diagnosis: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Discharge Notes</label>
                  <textarea
                    value={dischargeForm.dischargeNotes}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeNotes: e.target.value })}
                    style={styles.textarea}
                    required
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Discharge Instructions</label>
                  <textarea
                    value={dischargeForm.dischargeInstructions}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeInstructions: e.target.value })}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.formActions}>
                  <button type="button" style={{ ...styles.button, ...styles.cancelButton }} onClick={() => setShowDischarge(false)}>
                    Cancel
                  </button>
                  <button type="submit" style={{ ...styles.button, ...styles.dischargeButton }}>
                    Confirm Discharge
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default AdmissionDetailPage