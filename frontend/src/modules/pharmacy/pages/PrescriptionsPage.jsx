import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import PrescriptionList from '../components/PrescriptionList'
import pharmacyService from '../pharmacyService'

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: 'all' })
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadPrescriptions()
  }, [filters])

  const loadPrescriptions = async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (params.status === 'all') delete params.status
      const data = await pharmacyService.getPrescriptions(params)
      setPrescriptions(data.prescriptions || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDispense = async (id) => {
    try {
      await pharmacyService.dispensePrescription(id, { pharmacistId: 'current-user-id' })
      loadPrescriptions()
    } catch (error) {
      alert('Failed to dispense: ' + error.message)
    }
  }

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation:')
    if (reason) {
      try {
        await pharmacyService.cancelPrescription(id, reason)
        loadPrescriptions()
      } catch (error) {
        alert('Failed to cancel: ' + error.message)
      }
    }
  }

  const styles = {
    container: {
      maxWidth: '1400px',
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
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
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
    addButton: {
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
      }
    },
    filterBar: {
      display: 'flex',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[6],
      alignItems: 'center'
    },
    filterLabel: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700]
    },
    select: {
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      backgroundColor: 'white',
      minWidth: '150px'
    }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/pharmacy')}
            >
              ← Back
            </button>
            <h1 style={styles.title}>Prescriptions</h1>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => navigate('/pharmacy/prescriptions/new')}
          >
            + New Prescription
          </button>
        </div>

        <div style={styles.filterBar}>
          <span style={styles.filterLabel}>Status:</span>
          <select
            style={styles.select}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="all">All</option>
            <option value="ACTIVE">Active</option>
            <option value="DISPENSED">Dispensed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <PrescriptionList
          prescriptions={prescriptions}
          loading={loading}
          pagination={pagination}
          onDispense={handleDispense}
          onCancel={handleCancel}
          onRefresh={loadPrescriptions}
        />
      </div>
    </AppLayout>
  )
}

export default PrescriptionsPage