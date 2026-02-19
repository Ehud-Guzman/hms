import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import billingService from '../services/billingService'
import patientsService from '../../patients/services/patientsService'

const InvoiceFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [searchPatient, setSearchPatient] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [items, setItems] = useState([])
  const [currentItem, setCurrentItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: '',
    type: 'OTHER'
  })

  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    taxRate: 16,
    discountRate: 0,
    notes: '',
    insuranceProviderId: '',
    insurancePolicyNo: ''
  })

  const isEditMode = !!id

  useEffect(() => {
    loadPatients()
    if (isEditMode) {
      loadInvoice()
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

  const loadInvoice = async () => {
    setLoading(true)
    try {
      const data = await billingService.getInvoice(id)
      const inv = data.bill
      setFormData({
        patientId: inv.patientId,
        appointmentId: inv.appointmentId || '',
        taxRate: 16,
        discountRate: 0,
        notes: inv.notes || '',
        insuranceProviderId: '',
        insurancePolicyNo: ''
      })
      setItems(inv.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice / 100,
        type: item.type
      })))
    } catch (error) {
      console.error('Failed to load invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.uhid?.toLowerCase().includes(searchPatient.toLowerCase())
  )

  const handleAddItem = () => {
    if (!currentItem.description || !currentItem.unitPrice) {
      alert('Please fill description and unit price')
      return
    }
    setItems([...items, { ...currentItem, unitPrice: parseFloat(currentItem.unitPrice) }])
    setCurrentItem({ description: '', quantity: 1, unitPrice: '', type: 'OTHER' })
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const discount = (subtotal * (formData.discountRate || 0)) / 100
    const taxable = subtotal - discount
    const tax = (taxable * (formData.taxRate || 0)) / 100
    const total = taxable + tax
    return { subtotal, discount, tax, total }
  }

  const { subtotal, discount, tax, total } = calculateTotals()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientId) {
      alert('Please select a patient')
      return
    }
    if (items.length === 0) {
      alert('Please add at least one item')
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        items: items.map(item => ({
          ...item,
          unitPrice: item.unitPrice * 100
        }))
      }
      if (isEditMode) {
        await billingService.updateInvoice(id, submitData)
      } else {
        await billingService.createInvoice(submitData)
      }
      navigate('/billing/invoices')
    } catch (error) {
      alert('Error saving invoice: ' + error.message)
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
      }
    },
    itemRow: {
      display: 'grid',
      gridTemplateColumns: '3fr 1fr 1fr 1fr auto',
      gap: theme.spacing[2],
      alignItems: 'center',
      marginBottom: theme.spacing[2]
    },
    addButton: {
      marginTop: theme.spacing[2],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      cursor: 'pointer',
      width: '100%'
    },
    totals: {
      marginTop: theme.spacing[4],
      padding: theme.spacing[4],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: theme.spacing[2],
      fontSize: theme.fonts.sizes.sm
    },
    grandTotal: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.primary.DEFAULT
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
      cursor: 'pointer'
    }
  }

  if (loading && isEditMode) {
    return (
      <AppLayout>
        <div style={styles.container}>Loading invoice...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{isEditMode ? 'Edit Invoice' : 'New Invoice'}</h1>
          <button style={styles.cancelButton} onClick={() => navigate('/billing/invoices')}>
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
                  placeholder="Type name or UHID"
                  required
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

          {/* Invoice Items */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Items</h2>
            <div style={styles.itemRow}>
              <input
                type="text"
                placeholder="Description"
                value={currentItem.description}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Qty"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Unit Price (KES)"
                value={currentItem.unitPrice}
                onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                style={styles.input}
              />
              <select
                value={currentItem.type}
                onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value })}
                style={styles.select}
              >
                <option value="CONSULTATION">Consultation</option>
                <option value="LAB">Lab</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="PROCEDURE">Procedure</option>
                <option value="BED">Bed</option>
                <option value="OTHER">Other</option>
              </select>
              <button type="button" onClick={handleAddItem} style={styles.addButton}>Add</button>
            </div>

            {items.length > 0 && (
              <div style={{ marginTop: theme.spacing[4] }}>
                {items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[2] }}>
                    <span>{item.description} x {item.quantity} @ KES {item.unitPrice}</span>
                    <button type="button" onClick={() => handleRemoveItem(index)} style={{ color: theme.colors.danger.DEFAULT, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tax & Discount */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Tax & Discount</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[4] }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Discount Rate (%)</label>
                <input
                  type="number"
                  value={formData.discountRate}
                  onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div style={styles.totals}>
            <div style={styles.totalRow}><span>Subtotal:</span><span>KES {subtotal.toFixed(2)}</span></div>
            <div style={styles.totalRow}><span>Discount:</span><span>-KES {discount.toFixed(2)}</span></div>
            <div style={styles.totalRow}><span>Tax:</span><span>KES {tax.toFixed(2)}</span></div>
            <div style={{ ...styles.totalRow, ...styles.grandTotal }}><span>Total:</span><span>KES {total.toFixed(2)}</span></div>
          </div>

          {/* Notes */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder="Additional notes..."
            />
          </div>

          <div style={styles.actions}>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default InvoiceFormPage