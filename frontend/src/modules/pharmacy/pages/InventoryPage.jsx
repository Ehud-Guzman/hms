import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import InventoryList from '../components/InventoryList'
import InventoryFilters from '../components/InventoryFilters'
import pharmacyService from '../pharmacyService'

const InventoryPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadInventory()
  }, [filters])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const data = await pharmacyService.getInventory(filters)
      setItems(data.items || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await pharmacyService.deleteInventoryItem(id)
        loadInventory()
      } catch (error) {
        alert('Failed to delete item: ' + error.message)
      }
    }
  }

  const handleAdjustStock = async (id, data) => {
    try {
      await pharmacyService.adjustStock(id, data)
      loadInventory()
    } catch (error) {
      alert('Failed to adjust stock: ' + error.message)
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
            <h1 style={styles.title}>Inventory</h1>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => navigate('/pharmacy/inventory/new')}
          >
            + Add Medicine
          </button>
        </div>

        <InventoryFilters filters={filters} setFilters={setFilters} />

        <InventoryList
          items={items}
          loading={loading}
          pagination={pagination}
          onDelete={handleDelete}
          onAdjustStock={handleAdjustStock}
          onRefresh={loadInventory}
        />
      </div>
    </AppLayout>
  )
}

export default InventoryPage