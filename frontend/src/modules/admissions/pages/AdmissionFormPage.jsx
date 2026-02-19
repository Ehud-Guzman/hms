import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import admissionsService from '../services/admissionsService'
import patientsService from '../../patients/services/patientsService'
import doctorsService from '../../doctors/services/doctorsService'

const AdmissionFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [wards, setWards] = useState([])
  const [availableBeds, setAvailableBeds] = useState([])
  const [searchPatient, setSearchPatient] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  const isEditMode = !!id

  const [formData, setFormData] = useState({
    patientId: '',
    admittingDoctorId: '',
    wardId: '',
    bedId: '',
    expectedDischarge: '',
    diagnosis: '',
    notes: ''
  })

  // Load all initial data
  useEffect(() => {
    loadPatients()
    loadDoctors()
    loadWards()
    if (isEditMode) {
      loadAdmission()
    }
  }, [id])

  // Load patients
  const loadPatients = async () => {
    try {
      const data = await patientsService.getPatients({ limit: 100 })
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Failed to load patients:', error)
    }
  }

  // Load doctors
  const loadDoctors = async () => {
    try {
      const data = await doctorsService.getDoctors({ limit: 100 })
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Failed to load doctors:', error)
    }
  }

  // Load wards
  const loadWards = async () => {
    try {
      const data = await admissionsService.getWards()
      setWards(data.wards || [])
    } catch (error) {
      console.error('Failed to load wards:', error)
    }
  }

  // Load beds based on ward selection
const loadAvailableBeds = async (wardId) => {
  try {
    const data = await admissionsService.getAvailableBeds(wardId)
    console.log('Available beds response:', data) // debug

    // Handle both array response and object with beds property
    if (Array.isArray(data)) {
      setAvailableBeds(data)
    } else if (data.beds && Array.isArray(data.beds)) {
      setAvailableBeds(data.beds)
    } else {
      setAvailableBeds([])
    }
  } catch (error) {
    console.error('Failed to load available beds:', error)
    setAvailableBeds([])
  }
}

  // Load admission for edit mode
  const loadAdmission = async () => {
    setLoading(true)
    try {
      const { admission } = await admissionsService.getAdmission(id)
      setFormData({
        patientId: admission.patientId || '',
        admittingDoctorId: admission.admittingDoctorId || '',
        wardId: admission.wardId || '',
        bedId: admission.bedId || '',
        expectedDischarge: admission.expectedDischarge
          ? admission.expectedDischarge.split('T')[0]
          : '',
        diagnosis: admission.diagnosis || '',
        notes: admission.notes || ''
      })

      // Load beds for the ward
      if (admission.wardId) {
        await loadAvailableBeds(admission.wardId)
      }
    } catch (error) {
      console.error('Failed to load admission:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter patients for search
  const filteredPatients = patients.filter(
    (p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPatient.toLowerCase()) ||
      p.uhid?.toLowerCase().includes(searchPatient.toLowerCase())
  )

  // Handle generic input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle ward change
  const handleWardChange = (e) => {
    const wardId = e.target.value
    setFormData((prev) => ({ ...prev, wardId, bedId: '' }))
    if (wardId) loadAvailableBeds(wardId)
    else setAvailableBeds([])
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientId) return alert('Please select a patient')
    if (!formData.admittingDoctorId) return alert('Please select a doctor')

    setLoading(true)
    try {
      if (isEditMode) await admissionsService.updateAdmission(id, formData)
      else await admissionsService.createAdmission(formData)
      navigate('/admissions/list')
    } catch (error) {
      alert('Error saving admission: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Loading screen for edit mode
  if (loading && isEditMode) {
    return (
      <AppLayout>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>Loading admission...</div>
      </AppLayout>
    )
  }

  // Styles
  const styles = {
    container: { maxWidth: '800px', margin: '0 auto', width: '100%' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[6] },
    title: { fontSize: theme.fonts.sizes['2xl'], fontWeight: theme.fonts.weights.bold, color: theme.colors.gray[900] },
    cancelButton: { padding: `${theme.spacing[2]} ${theme.spacing[4]}`, backgroundColor: 'transparent', border: `1px solid ${theme.colors.gray[300]}`, borderRadius: theme.radius.md, color: theme.colors.gray[700], fontSize: theme.fonts.sizes.sm, cursor: 'pointer' },
    form: { backgroundColor: 'white', borderRadius: theme.radius.lg, padding: theme.spacing[6], boxShadow: theme.shadows.sm, border: `1px solid ${theme.colors.gray[200]}` },
    section: { marginBottom: theme.spacing[6] },
    sectionTitle: { fontSize: theme.fonts.sizes.lg, fontWeight: theme.fonts.weights.semibold, color: theme.colors.gray[900], marginBottom: theme.spacing[4], paddingBottom: theme.spacing[2], borderBottom: `1px solid ${theme.colors.gray[200]}` },
    fieldGroup: { marginBottom: theme.spacing[4] },
    label: { display: 'block', fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.medium, color: theme.colors.gray[700], marginBottom: theme.spacing[1] },
    input: { width: '100%', padding: theme.spacing[3], border: `1px solid ${theme.colors.gray[300]}`, borderRadius: theme.radius.md, fontSize: theme.fonts.sizes.base, outline: 'none' },
    select: { width: '100%', padding: theme.spacing[3], border: `1px solid ${theme.colors.gray[300]}`, borderRadius: theme.radius.md, fontSize: theme.fonts.sizes.base, backgroundColor: 'white' },
    textarea: { width: '100%', padding: theme.spacing[3], border: `1px solid ${theme.colors.gray[300]}`, borderRadius: theme.radius.md, fontSize: theme.fonts.sizes.base, minHeight: '100px', resize: 'vertical' },
    searchWrapper: { position: 'relative' },
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: `1px solid ${theme.colors.gray[200]}`, borderRadius: theme.radius.md, maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: theme.shadows.md },
    dropdownItem: { padding: theme.spacing[2], cursor: 'pointer', borderBottom: `1px solid ${theme.colors.gray[200]}` },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: theme.spacing[4], marginTop: theme.spacing[6] },
    submitButton: { padding: `${theme.spacing[3]} ${theme.spacing[6]}`, backgroundColor: theme.colors.primary.DEFAULT, color: 'white', border: 'none', borderRadius: theme.radius.lg, fontSize: theme.fonts.sizes.base, fontWeight: theme.fonts.weights.medium, cursor: 'pointer', opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{isEditMode ? 'Edit Admission' : 'New Admission'}</h1>
          <button style={styles.cancelButton} onClick={() => navigate('/admissions/list')}>Cancel</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Patient & Doctor */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Patient & Doctor</h2>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Patient</label>
              <div style={styles.searchWrapper}>
                <input
                  type="text"
                  value={searchPatient}
                  onChange={(e) => {
                    setSearchPatient(e.target.value)
                    setShowPatientDropdown(true)
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  style={styles.input}
                  placeholder="Search patient by name or UHID"
                  required
                />
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div style={styles.dropdown}>
                    {filteredPatients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        style={styles.dropdownItem}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, patientId: patient.id }))
                          setSearchPatient(`${patient.firstName} ${patient.lastName}`)
                          setShowPatientDropdown(false)
                        }}
                      >
                        <div>{patient.firstName} {patient.lastName}</div>
                        <div style={{ fontSize: theme.fonts.sizes.xs, color: theme.colors.gray[500] }}>UHID: {patient.uhid}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Admitting Doctor</label>
              <select
                name="admittingDoctorId"
                value={formData.admittingDoctorId}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ward & Bed */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Ward & Bed</h2>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Ward</label>
              <select
                name="wardId"
                value={formData.wardId || ''}
                onChange={handleWardChange}
                style={styles.select}
              >
                <option value="">Select Ward (to see available beds)</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name} ({ward.availableBeds} beds available)
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Bed</label>
              <select
                name="bedId"
                value={formData.bedId}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="" disabled={availableBeds.length === 0}>
                  {availableBeds.length === 0 ? 'No beds available' : 'Select Bed'}
                </option>
                {availableBeds.map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    {bed.bedNumber} - {bed.ward?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Details */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Clinical Details</h2>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Diagnosis</label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Expected Discharge Date</label>
              <input
                type="date"
                name="expectedDischarge"
                value={formData.expectedDischarge}
                onChange={handleChange}
                style={styles.input}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button type="submit" style={styles.submitButton}>
              {loading ? 'Saving...' : isEditMode ? 'Update Admission' : 'Create Admission'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default AdmissionFormPage
