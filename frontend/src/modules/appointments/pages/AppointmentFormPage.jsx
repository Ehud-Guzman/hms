import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import TimeSlotPicker from '../components/TimeSlotPicker'
import appointmentsService from '../appointmentsService'
import patientsService from '../../patients/services/patientsService'
import doctorsService from '../../doctors/services/doctorsService'

const AppointmentFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    startTime: '',
    reason: '',
    symptoms: '',
    type: 'CONSULTATION',
    priority: 'ROUTINE'
  })

  const isEditMode = !!id

  useEffect(() => {
    loadPatients()
    loadDoctors()
    if (isEditMode) {
      loadAppointment()
    }
  }, [id])

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      loadAvailableSlots()
    }
  }, [formData.doctorId, formData.date])

  const loadPatients = async () => {
    try {
      const data = await patientsService.getPatients()
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Failed to load patients:', error)
    }
  }

  const loadDoctors = async () => {
    try {
      const data = await doctorsService.getDoctors()
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Failed to load doctors:', error)
    }
  }

  const loadAppointment = async () => {
    setLoading(true)
    try {
      const data = await appointmentsService.getAppointment(id)
      const apt = data.appointment
      setFormData({
        patientId: apt.patientId || '',
        doctorId: apt.doctorId || '',
        date: apt.date ? apt.date.split('T')[0] : '',
        startTime: apt.startTime ? apt.startTime.split('T')[1]?.substring(0, 5) : '',
        reason: apt.reason || '',
        symptoms: apt.symptoms || '',
        type: apt.type || 'CONSULTATION',
        priority: apt.priority || 'ROUTINE'
      })
    } catch (error) {
      console.error('Failed to load appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    setSlotsLoading(true)
    try {
      const data = await appointmentsService.getAvailableSlots(formData.doctorId, formData.date)
      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error('Failed to load slots:', error)
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditMode) {
        await appointmentsService.updateAppointment(id, formData)
      } else {
        await appointmentsService.createAppointment(formData)
      }
      navigate('/appointments')
    } catch (error) {
      alert('Error saving appointment: ' + error.message)
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
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4]
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
    select: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      backgroundColor: 'white',
      outline: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`
      }
    },
    input: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`
      }
    },
    textarea: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical',
      ':focus': {
        borderColor: theme.colors.primary.DEFAULT,
        boxShadow: `0 0 0 3px ${theme.colors.primary.DEFAULT}20`
      }
    },
    radioGroup: {
      display: 'flex',
      gap: theme.spacing[4],
      marginTop: theme.spacing[2]
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[700]
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing[4],
      marginTop: theme.spacing[6],
      paddingTop: theme.spacing[6],
      borderTop: `1px solid ${theme.colors.gray[200]}`
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
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        backgroundColor: theme.colors.primary.dark
      },
      ':disabled': {
        opacity: 0.6,
        cursor: 'not-allowed'
      }
    }
  }

  if (loading && isEditMode) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div>Loading appointment data...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isEditMode ? 'Edit Appointment' : 'New Appointment'}
          </h1>
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/appointments')}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Appointment Details</h2>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Patient *</label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} - {patient.uhid}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Doctor *</label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="PROCEDURE">Procedure</option>
                </select>
              </div>
            </div>

            {formData.doctorId && formData.date && (
              <TimeSlotPicker
                slots={availableSlots}
                selectedSlot={formData.startTime}
                onSelectSlot={(time) => setFormData({ ...formData, startTime: time })}
                loading={slotsLoading}
              />
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Priority</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priority"
                    value="ROUTINE"
                    checked={formData.priority === 'ROUTINE'}
                    onChange={handleChange}
                  />
                  Routine
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priority"
                    value="URGENT"
                    checked={formData.priority === 'URGENT'}
                    onChange={handleChange}
                  />
                  Urgent
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priority"
                    value="STAT"
                    checked={formData.priority === 'STAT'}
                    onChange={handleChange}
                  />
                  STAT
                </label>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Clinical Information</h2>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Reason for Visit *</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., Chest pain, Follow-up"
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Symptoms</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Describe the patient's symptoms..."
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Appointment' : 'Schedule Appointment')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default AppointmentFormPage