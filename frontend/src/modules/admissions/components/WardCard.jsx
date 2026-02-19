import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import admissionsService from '../services/admissionsService'

const WardCard = ({ ward, onUpdate }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [showBeds, setShowBeds] = useState(false)

  const getOccupancyColor = (occupied, total) => {
    const rate = (occupied / total) * 100
    if (rate >= 90) return theme.colors.danger.DEFAULT
    if (rate >= 70) return theme.colors.warning.DEFAULT
    return theme.colors.success.DEFAULT
  }

  const handleAddBed = async () => {
    const bedNumber = prompt('Enter bed number:')
    if (!bedNumber) return
    try {
      await admissionsService.createBed({
        wardId: ward.id,
        bedNumber,
        dailyRate: 0
      })
      onUpdate()
    } catch (error) {
      alert('Failed to add bed: ' + error.message)
    }
  }

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.gray[200]}`,
      padding: theme.spacing[5],
      marginBottom: theme.spacing[4],
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        boxShadow: theme.shadows.md
      }
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[3]
    },
    name: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900]
    },
    type: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.primary.DEFAULT
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[4]
    },
    statItem: {
      textAlign: 'center'
    },
    statLabel: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500]
    },
    statValue: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.bold
    },
    occupancyBar: {
      height: '8px',
      backgroundColor: theme.colors.gray[200],
      borderRadius: theme.radius.full,
      marginBottom: theme.spacing[3],
      overflow: 'hidden'
    },
    occupancyFill: (occupied, total) => ({
      height: '100%',
      width: `${(occupied / total) * 100}%`,
      backgroundColor: getOccupancyColor(ward.occupiedBeds, ward.totalBeds),
      borderRadius: theme.radius.full,
      transition: 'width 0.3s ease'
    }),
    bedsSection: {
      marginTop: theme.spacing[4],
      borderTop: `1px solid ${theme.colors.gray[200]}`,
      paddingTop: theme.spacing[4]
    },
    bedsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[3]
    },
    bedsTitle: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.semibold
    },
    bedGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: theme.spacing[2]
    },
    bed: (isOccupied) => ({
      padding: theme.spacing[2],
      borderRadius: theme.radius.md,
      backgroundColor: isOccupied ? `${theme.colors.danger.DEFAULT}15` : `${theme.colors.success.DEFAULT}15`,
      color: isOccupied ? theme.colors.danger.DEFAULT : theme.colors.success.DEFAULT,
      border: `1px solid ${isOccupied ? theme.colors.danger.DEFAULT : theme.colors.success.DEFAULT}`,
      textAlign: 'center',
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      ':hover': {
        transform: 'scale(1.05)'
      }
    }),
    button: {
      padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.xs,
      cursor: 'pointer'
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.name}>{ward.name}</h3>
          <span style={styles.type}>{ward.type}</span>
        </div>
        <button style={styles.button} onClick={() => navigate(`/admissions/wards/${ward.id}/edit`)}>
          Edit
        </button>
      </div>

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Total Beds</div>
          <div style={styles.statValue}>{ward.totalBeds}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Occupied</div>
          <div style={styles.statValue}>{ward.occupiedBeds}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Available</div>
          <div style={styles.statValue}>{ward.availableBeds}</div>
        </div>
      </div>

      <div style={styles.occupancyBar}>
        <div style={styles.occupancyFill(ward.occupiedBeds, ward.totalBeds)} />
      </div>

      <button style={styles.button} onClick={() => setShowBeds(!showBeds)}>
        {showBeds ? 'Hide Beds' : 'Show Beds'}
      </button>

      {showBeds && (
        <div style={styles.bedsSection}>
          <div style={styles.bedsHeader}>
            <span style={styles.bedsTitle}>Beds</span>
            <button style={styles.button} onClick={handleAddBed}>+ Add Bed</button>
          </div>
          <div style={styles.bedGrid}>
            {ward.beds?.map(bed => (
              <div
                key={bed.id}
                style={styles.bed(bed.isOccupied)}
                onClick={() => navigate(`/admissions/beds/${bed.id}`)}
              >
                {bed.bedNumber}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WardCard