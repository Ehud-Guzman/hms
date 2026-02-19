import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'

const AppointmentCalendar = ({ appointments, onDateSelect, onSlotSelect }) => {
  const theme = useTheme()
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getAppointmentsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments?.filter(apt => apt.date?.startsWith(dateStr)) || []
  }

  const getAppointmentCountColor = (count) => {
    if (count === 0) return theme.colors.gray[400]
    if (count <= 2) return theme.colors.success.DEFAULT
    if (count <= 4) return theme.colors.warning.DEFAULT
    return theme.colors.danger.DEFAULT
  }

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[4]
    },
    monthTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900]
    },
    navButton: {
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
    dayNames: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[2]
    },
    dayName: {
      textAlign: 'center',
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[600],
      padding: theme.spacing[2]
    },
    daysGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: theme.spacing[2]
    },
    dayCell: {
      aspectRatio: '1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
      cursor: 'pointer',
      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.DEFAULT}`,
      border: `1px solid ${theme.colors.gray[200]}`,
      backgroundColor: 'white',
      ':hover': {
        borderColor: theme.colors.primary.DEFAULT,
        backgroundColor: `${theme.colors.primary.DEFAULT}5`
      }
    },
    emptyCell: {
      aspectRatio: '1',
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.gray[200]}`
    },
    dayNumber: {
      fontSize: theme.fonts.sizes.base,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.gray[900]
    },
    todayNumber: {
      color: theme.colors.primary.DEFAULT,
      fontWeight: theme.fonts.weights.bold
    },
    count: {
      fontSize: theme.fonts.sizes.xs,
      marginTop: theme.spacing[1]
    }
  }

  const today = new Date()
  const isToday = (day) => {
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear()
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.navButton} onClick={prevMonth}>←</button>
        <h3 style={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button style={styles.navButton} onClick={nextMonth}>→</button>
      </div>

      <div style={styles.dayNames}>
        {dayNames.map(day => (
          <div key={day} style={styles.dayName}>{day}</div>
        ))}
      </div>

      <div style={styles.daysGrid}>
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} style={styles.emptyCell} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayAppointments = getAppointmentsForDay(day)
          const count = dayAppointments.length
          const countColor = getAppointmentCountColor(count)

          return (
            <div
              key={day}
              style={styles.dayCell}
              onClick={() => onDateSelect(day)}
            >
              <span style={{ ...styles.dayNumber, ...(isToday(day) ? styles.todayNumber : {}) }}>
                {day}
              </span>
              {count > 0 && (
                <span style={{ ...styles.count, color: countColor }}>
                  {count} apt
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AppointmentCalendar