import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const TimeSlotPicker = ({ slots, selectedSlot, onSelectSlot, loading }) => {
  const theme = useTheme()
  const [selectedTime, setSelectedTime] = useState(selectedSlot)

  const handleSelect = (slot) => {
    setSelectedTime(slot.time)
    onSelectSlot(slot.time)
  }

  const styles = {
    container: {
      marginTop: theme.spacing[4]
    },
    label: {
      display: 'block',
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[700],
      marginBottom: theme.spacing[2]
    },
    slotGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: theme.spacing[2],
      maxHeight: '300px',
      overflowY: 'auto',
      padding: theme.spacing[2],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg
    },
    slot: {
      padding: theme.spacing[2],
      textAlign: 'center',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      border: 'none'
    },
    availableSlot: {
      backgroundColor: 'white',
      border: `1px solid ${theme.colors.gray[200]}`,
      color: theme.colors.gray[900],
      ':hover': {
        borderColor: theme.colors.primary.DEFAULT,
        backgroundColor: `${theme.colors.primary.DEFAULT}5`
      }
    },
    selectedSlot: {
      backgroundColor: theme.colors.primary.DEFAULT,
      color: 'white',
      border: `1px solid ${theme.colors.primary.DEFAULT}`
    },
    bookedSlot: {
      backgroundColor: theme.colors.gray[100],
      color: theme.colors.gray[400],
      cursor: 'not-allowed',
      border: `1px solid ${theme.colors.gray[200]}`
    },
    noSlots: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500],
      fontSize: theme.fonts.sizes.sm
    },
    loadingContainer: {
      textAlign: 'center',
      padding: theme.spacing[8],
      color: theme.colors.gray[500]
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading available slots...</div>
      </div>
    )
  }

  if (!slots || slots.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noSlots}>No available slots for this date</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <label style={styles.label}>Select Time</label>
      <div style={styles.slotGrid}>
        {slots.map((slot, index) => {
          let slotStyle = { ...styles.slot }
          
          if (!slot.available) {
            slotStyle = { ...slotStyle, ...styles.bookedSlot }
          } else if (selectedTime === slot.time) {
            slotStyle = { ...slotStyle, ...styles.selectedSlot }
          } else {
            slotStyle = { ...slotStyle, ...styles.availableSlot }
          }

          return (
            <button
              key={index}
              style={slotStyle}
              onClick={() => slot.available && handleSelect(slot)}
              disabled={!slot.available}
              onMouseEnter={(e) => {
                if (slot.available && selectedTime !== slot.time) {
                  e.target.style.backgroundColor = `${theme.colors.primary.DEFAULT}10`
                  e.target.style.borderColor = theme.colors.primary.DEFAULT
                }
              }}
              onMouseLeave={(e) => {
                if (slot.available && selectedTime !== slot.time) {
                  e.target.style.backgroundColor = 'white'
                  e.target.style.borderColor = theme.colors.gray[200]
                }
              }}
            >
              {slot.time}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TimeSlotPicker