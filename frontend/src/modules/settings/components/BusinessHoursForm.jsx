import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const days = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

const BusinessHoursForm = ({ initialValues = {}, onSubmit, saving }) => {
  const theme = useTheme()
  const [hours, setHours] = useState(
    days.reduce((acc, day) => {
      acc[day.key] = initialValues[day.key] || { isWorking: day.key !== 'sunday' && day.key !== 'saturday', start: '09:00', end: '17:00' }
      return acc
    }, {})
  )
  const [holidays, setHolidays] = useState(initialValues.holidays || [])
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' })

  const handleDayChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const addHoliday = () => {
    if (newHoliday.date && newHoliday.name) {
      setHolidays([...holidays, newHoliday])
      setNewHoliday({ date: '', name: '' })
    }
  }

  const removeHoliday = (index) => {
    setHolidays(holidays.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...hours, holidays })
  }

  const styles = {
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
    dayRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[4],
      padding: theme.spacing[3],
      borderBottom: `1px solid ${theme.colors.gray[200]}`,
      ':last-child': {
        borderBottom: 'none'
      }
    },
    dayLabel: {
      width: '100px',
      fontWeight: theme.fonts.weights.medium
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer'
    },
    timeInput: {
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      width: '100px'
    },
    holidayRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[2],
      padding: theme.spacing[2],
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md
    },
    holidayDate: {
      width: '120px',
      fontWeight: theme.fonts.weights.medium
    },
    holidayName: {
      flex: 1
    },
    removeButton: {
      background: 'none',
      border: 'none',
      color: theme.colors.danger.DEFAULT,
      cursor: 'pointer',
      fontSize: '18px'
    },
    addHolidayRow: {
      display: 'flex',
      gap: theme.spacing[3],
      marginTop: theme.spacing[4]
    },
    input: {
      padding: theme.spacing[2],
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      flex: 1
    },
    addButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      cursor: 'pointer'
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

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Weekly Hours</h3>
        {days.map(day => (
          <div key={day.key} style={styles.dayRow}>
            <span style={styles.dayLabel}>{day.label}</span>
            <input
              type="checkbox"
              checked={hours[day.key].isWorking}
              onChange={(e) => handleDayChange(day.key, 'isWorking', e.target.checked)}
              style={styles.checkbox}
            />
            {hours[day.key].isWorking && (
              <>
                <input
                  type="time"
                  value={hours[day.key].start}
                  onChange={(e) => handleDayChange(day.key, 'start', e.target.value)}
                  style={styles.timeInput}
                />
                <span>to</span>
                <input
                  type="time"
                  value={hours[day.key].end}
                  onChange={(e) => handleDayChange(day.key, 'end', e.target.value)}
                  style={styles.timeInput}
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Holidays</h3>
        {holidays.map((holiday, index) => (
          <div key={index} style={styles.holidayRow}>
            <span style={styles.holidayDate}>{holiday.date}</span>
            <span style={styles.holidayName}>{holiday.name}</span>
            <button type="button" style={styles.removeButton} onClick={() => removeHoliday(index)}>✕</button>
          </div>
        ))}

        <div style={styles.addHolidayRow}>
          <input
            type="date"
            value={newHoliday.date}
            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Holiday name"
            value={newHoliday.name}
            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            style={styles.input}
          />
          <button type="button" style={styles.addButton} onClick={addHoliday}>Add</button>
        </div>
      </div>

      <div style={styles.actions}>
        <button type="submit" disabled={saving} style={styles.submitButton}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default BusinessHoursForm