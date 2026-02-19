import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import AppointmentList from '../components/AppointmentList'
import appointmentsService from '../appointmentsService'

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])  // ✅ Fixed: was setPatients
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const data = await appointmentsService.getAppointments()
      // Your backend returns { appointments: [...] }
      setAppointments(data.appointments || [])  // ✅ Fixed: was setPatients
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (appointment) => {
    navigate(`/appointments/${appointment.id}`)
  }

  const handleCheckIn = async (appointment) => {
    try {
      await appointmentsService.checkIn(appointment.id)
      loadAppointments()
    } catch (error) {
      alert('Failed to check in: ' + error.message)
    }
  }

  const handleStart = async (appointment) => {
    try {
      await appointmentsService.startAppointment(appointment.id)
      loadAppointments()
    } catch (error) {
      alert('Failed to start: ' + error.message)
    }
  }

  const handleCancel = async (appointment) => {
    const reason = prompt('Please enter cancellation reason:')
    if (reason) {
      try {
        await appointmentsService.cancelAppointment(appointment.id, reason)
        loadAppointments()
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
    actions: {
      display: 'flex',
      gap: theme.spacing[3]
    },
    navButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
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
          <h1 style={styles.title}>Appointments</h1>
          <div style={styles.actions}>
            <button 
              style={styles.navButton}
              onClick={() => navigate('/appointments/calendar')}
            >
              📅 Calendar
            </button>
            <button 
              style={styles.navButton}
              onClick={() => navigate('/appointments/waiting')}
            >
              👥 Waiting List
            </button>
            <button 
              style={styles.addButton}
              onClick={() => navigate('/appointments/new')}
            >
              + New Appointment
            </button>
          </div>
        </div>

        <AppointmentList
          appointments={appointments}
          loading={loading}
          onView={handleView}
          onCheckIn={handleCheckIn}
          onStart={handleStart}
          onCancel={handleCancel}
        />
      </div>
    </AppLayout>
  )
}

export default AppointmentsPage