import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import ICD10Search from '../components/ICD10Search'
import medicalRecordsService from '../services/medicalRecordsService'
import patientsService from '../../patients/services/patientsService'

const RecordFormPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patientId')
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [patient, setPatient] = useState(null)
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    doctorId: '',
    recordType: 'DIAGNOSIS',
    title: '',
    description: '',
    icd10Code: '',
    icd10Description: '',
    isConfidential: false
  })

  const isEditMode = !!id

  useEffect(() => {
    if (patientId) {
      loadPatient()
    }
    if (isEditMode) {
      loadRecord()
    }
  }, [patientId, id])

  const loadPatient = async () => {
    try {
      const data = await patientsService.getPatient(patientId)
      setPatient(data.patient)
    } catch (error) {
      console.error('Failed to load patient:', error)
    }
  }

  const loadRecord = async () => {
    setLoading(true)
    try {
      const data = await medicalRecordsService.getRecord(id)
      const rec = data.record
      setFormData({
        patientId: rec.patientId,
        doctorId: rec.doctorId || '',
        recordType: rec.recordType,
        title: rec.title,
        description: rec.description || '',
        icd10Code: rec.icd10Code || '',
        icd10Description: rec.icd10Description || '',
        isConfidential: rec.isConfidential || false
      })
    } catch (error) {
      console.error('Failed to load record:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleICD10Select = (item) => {
    setFormData(prev => ({
      ...prev,
      icd10Code: item.code,
      icd10Description: item.description
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientId) {
      alert('Patient ID is required')
      return
    }
    if (!formData.title) {
      alert('Title is required')
      return
    }
    setLoading(true)
    try {
      if (isEditMode) {
        await medicalRecordsService.updateRecord(id, formData)
      } else {
        await medicalRecordsService.createRecord(formData)
      }
      navigate(`/medical-records/patient/${formData.patientId}`)
    } catch (error) {
      alert('Error saving record: ' + error.message)
    } finally {
      setLoading(false)
    }
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
    cancelButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
    },
    form: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    fieldGroup: {
      marginBottom: theme.spacing[4]
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
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none'
    },
    select: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      backgroundColor: 'white'
    },
    textarea: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      minHeight: '120px',
      resize: 'vertical'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginTop: theme.spacing[2]
    },
    patientInfo: {
      backgroundColor: theme.colors.gray[50],
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing[4]
    },
    patientName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold
    },
    patientUhid: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600],
      marginTop: theme.spacing[1]
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6]
    },
    submitButton: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.lg,
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      ':disabled': {
        opacity: 0.6,
        cursor: 'not-allowed'
      }
    }
  }

  if (loading && isEditMode) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading record...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{isEditMode ? 'Edit Record' : 'New Medical Record'}</h1>
          <button style={styles.cancelButton} onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {patient && (
            <div style={styles.patientInfo}>
              <div style={styles.patientName}>{patient.firstName} {patient.lastName}</div>
              <div style={styles.patientUhid}>UHID: {patient.uhid}</div>
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Record Type</label>
            <select
              name="recordType"
              value={formData.recordType}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="DIAGNOSIS">Diagnosis</option>
              <option value="PROCEDURE">Procedure</option>
              <option value="NOTE">Clinical Note</option>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="LAB_RESULT">Lab Result</option>
              <option value="IMAGING">Imaging</option>
              <option value="VACCINATION">Vaccination</option>
              <option value="ALLERGY">Allergy</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>

          {formData.recordType === 'DIAGNOSIS' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>ICD-10 Code</label>
              <ICD10Search onSelect={handleICD10Select} />
              {formData.icd10Code && (
                <div style={{ marginTop: theme.spacing[2], padding: theme.spacing[2], backgroundColor: theme.colors.gray[50], borderRadius: theme.radius.md }}>
                  <strong>{formData.icd10Code}</strong> – {formData.icd10Description}
                </div>
              )}
            </div>
          )}

          <div style={styles.checkbox}>
            <input
              type="checkbox"
              name="isConfidential"
              checked={formData.isConfidential}
              onChange={handleChange}
            />
            <label>Confidential (restricted access)</label>
          </div>

          <div style={styles.actions}>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Record' : 'Create Record')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default RecordFormPage