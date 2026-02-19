import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import pharmacyService from '../pharmacyService'
import patientsService from '../../patients/services/patientsService'
import doctorsService from '../../doctors/services/doctorsService'

const PrescriptionFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [inventory, setInventory] = useState([])
  const [searchPatient, setSearchPatient] = useState('')
  const [searchMedicine, setSearchMedicine] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    notes: '',
    items: [],
    validUntil: ''
  })

  const [currentItem, setCurrentItem] = useState({
    pharmacyItemId: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    instructions: ''
  })

  const isEditMode = !!id

  useEffect(() => {
    loadPatients()
    loadDoctors()
    loadInventory()
    if (isEditMode) {
      loadPrescription()
    }
  }, [id])

  const loadPatients = async () => {
    try {
      const data = await patientsService.getPatients({ limit: 100 })
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Failed to load patients:', error)
    }
  }

  const loadDoctors = async () => {
    try {
      const data = await doctorsService.getDoctors({ limit: 100 })
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Failed to load doctors:', error)
    }
  }

  const loadInventory = async () => {
    try {
      const data = await pharmacyService.getInventory({ limit: 100 })
      setInventory(data.items || [])
    } catch (error) {
      console.error('Failed to load inventory:', error)
    }
  }

  const loadPrescription = async () => {
    setLoading(true)
    try {
      const data = await pharmacyService.getPrescription(id)
      const rx = data.prescription
      setFormData({
        patientId: rx.patientId || '',
        doctorId: rx.doctorId || '',
        diagnosis: rx.diagnosis || '',
        notes: rx.notes || '',
        items: rx.items?.map(item => ({
          pharmacyItemId: item.pharmacyItemId,
          medication: item.medication,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions || ''
        })) || [],
        validUntil: rx.validUntil ? rx.validUntil.split('T')[0] : ''
      })
    } catch (error) {
      console.error('Failed to load prescription:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.uhid?.toLowerCase().includes(searchPatient.toLowerCase())
  )

  const filteredMedicine = inventory.filter(i => 
    i.genericName.toLowerCase().includes(searchMedicine.toLowerCase()) ||
    i.brandName?.toLowerCase().includes(searchMedicine.toLowerCase())
  )

  const handleAddItem = () => {
    if (!currentItem.pharmacyItemId && !currentItem.medication) {
      alert('Please select a medication')
      return
    }
    if (!currentItem.dosage || !currentItem.frequency || !currentItem.quantity) {
      alert('Please fill dosage, frequency, and quantity')
      return
    }

    const selectedMedicine = inventory.find(i => i.id === currentItem.pharmacyItemId)
    
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...currentItem,
          medication: currentItem.medication || selectedMedicine?.genericName,
          pharmacyItemId: currentItem.pharmacyItemId || null
        }
      ]
    })
    
    setCurrentItem({
      pharmacyItemId: '',
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: ''
    })
    setSearchMedicine('')
  }

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.patientId) {
      alert('Please select a patient')
      return
    }
    if (!formData.doctorId) {
      alert('Please select a doctor')
      return
    }
    if (formData.items.length === 0) {
      alert('Please add at least one medication')
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        items: formData.items.map(item => ({
          pharmacyItemId: item.pharmacyItemId,
          medication: item.medication,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: parseInt(item.quantity),
          instructions: item.instructions
        }))
      }

      if (isEditMode) {
        await pharmacyService.updatePrescription(id, submitData)
      } else {
        await pharmacyService.createPrescription(submitData)
      }
      navigate('/pharmacy/prescriptions')
    } catch (error) {
      alert('Error saving prescription: ' + error.message)
    } finally {
      setLoading(false)
    }
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
    select: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      backgroundColor: 'white',
      outline: 'none'
    },
    textarea: {
      width: '100%',
      padding: theme.spacing[3],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.base,
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical'
    },
    searchWrapper: {
      position: 'relative'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: `1px solid ${theme.colors.gray[200]}`,
      borderRadius: theme.radius.md,
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: theme.shadows.md
    },
    dropdownItem: {
      padding: theme.spacing[2],
      cursor: 'pointer',
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':hover': {
        backgroundColor: theme.colors.gray[50]
      },
      ':last-child': {
        borderBottom: 'none'
      }
    },
    itemList: {
      marginTop: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4]
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':last-child': {
        borderBottom: 'none'
      }
    },
    itemDetails: {
      flex: 1
    },
    itemName: {
      fontWeight: theme.fonts.weights.medium
    },
    itemMeta: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[600]
    },
    removeButton: {
      color: theme.colors.danger.DEFAULT,
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      padding: theme.spacing[1]
    },
    addButton: {
      marginTop: theme.spacing[2],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      cursor: 'pointer',
      width: '100%',
      fontWeight: theme.fonts.weights.medium
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
        <div style={styles.container}>Loading prescription...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {isEditMode ? 'Edit Prescription' : 'New Prescription'}
          </h1>
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/pharmacy/prescriptions')}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Patient Selection */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Patient</h2>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Search Patient</label>
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
                  placeholder="Type name or UHID..."
                />
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div style={styles.dropdown}>
                    {filteredPatients.slice(0, 5).map(patient => (
                      <div
                        key={patient.id}
                        style={styles.dropdownItem}
                        onClick={() => {
                          setFormData({ ...formData, patientId: patient.id })
                          setSearchPatient(`${patient.firstName} ${patient.lastName}`)
                          setShowPatientDropdown(false)
                        }}
                      >
                        <div>{patient.firstName} {patient.lastName}</div>
                        <div style={{ fontSize: theme.fonts.sizes.xs, color: theme.colors.gray[500] }}>
                          UHID: {patient.uhid}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Doctor Selection */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Prescribing Doctor</h2>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Doctor</label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
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
          </div>

          {/* Diagnosis & Validity */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Prescription Details</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., Acute bronchitis"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Medications */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Medications</h2>
            
            {/* Add Item Form */}
            <div style={{ backgroundColor: theme.colors.gray[50], padding: theme.spacing[4], borderRadius: theme.radius.lg, marginBottom: theme.spacing[4] }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Search Medicine</label>
                <div style={styles.searchWrapper}>
                  <input
                    type="text"
                    value={searchMedicine}
                    onChange={(e) => {
                      setSearchMedicine(e.target.value)
                      setShowMedicineDropdown(true)
                    }}
                    onFocus={() => setShowMedicineDropdown(true)}
                    style={styles.input}
                    placeholder="Type medicine name..."
                  />
                  {showMedicineDropdown && filteredMedicine.length > 0 && (
                    <div style={styles.dropdown}>
                      {filteredMedicine.slice(0, 5).map(med => (
                        <div
                          key={med.id}
                          style={styles.dropdownItem}
                          onClick={() => {
                            setCurrentItem({
                              ...currentItem,
                              pharmacyItemId: med.id,
                              medication: med.genericName
                            })
                            setSearchMedicine(med.genericName)
                            setShowMedicineDropdown(false)
                          }}
                        >
                          <div>{med.generanericName} {med.strength}{med.unit}</div>
                          <div style={{ fontSize: theme.fonts.sizes.xs, color: theme.colors.gray[500] }}>
                            {med.brandName} • Stock: {med.quantityInStock}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.grid}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Dosage</label>
                  <input
                    type="text"
                    value={currentItem.dosage}
                    onChange={(e) => setCurrentItem({ ...currentItem, dosage: e.target.value })}
                    style={styles.input}
                    placeholder="e.g., 1 tablet"
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Frequency</label>
                  <input
                    type="text"
                    value={currentItem.frequency}
                    onChange={(e) => setCurrentItem({ ...currentItem, frequency: e.target.value })}
                    style={styles.input}
                    placeholder="e.g., twice daily"
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Duration</label>
                  <input
                    type="text"
                    value={currentItem.duration}
                    onChange={(e) => setCurrentItem({ ...currentItem, duration: e.target.value })}
                    style={styles.input}
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Quantity</label>
                  <input
                    type="number"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                    style={styles.input}
                    placeholder="e.g., 14"
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Instructions</label>
                <input
                  type="text"
                  value={currentItem.instructions}
                  onChange={(e) => setCurrentItem({ ...currentItem, instructions: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., Take with food"
                />
              </div>

              <button type="button" onClick={handleAddItem} style={styles.addButton}>
                + Add Medication
              </button>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div style={styles.itemList}>
                <h3 style={{ marginBottom: theme.spacing[2] }}>Added Medications</h3>
                {formData.items.map((item, index) => (
                  <div key={index} style={styles.itemRow}>
                    <div style={styles.itemDetails}>
                      <div style={styles.itemName}>{item.medication}</div>
                      <div style={styles.itemMeta}>
                        {item.dosage} • {item.frequency} • {item.duration} • x{item.quantity}
                      </div>
                      {item.instructions && (
                        <div style={styles.itemMeta}>Note: {item.instructions}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      style={styles.removeButton}
                      onClick={() => handleRemoveItem(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Additional Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={styles.textarea}
              placeholder="Any additional instructions or notes..."
            />
          </div>

          {/* Submit */}
          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Prescription' : 'Create Prescription')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default PrescriptionFormPage