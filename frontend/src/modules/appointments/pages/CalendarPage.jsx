import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import AppointmentCalendar from '../components/AppointmentCalendar'
import appointmentsService from '../appointmentsService'
import doctorsService from '../../doctors/services/doctorsService'

const CalendarPage = () => {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadData()
  }, [selectedDoctor])

  const loadData = async () => {
    setLoading(true)
    try {
      const [appointmentsData, doctorsData] = await Promise.all([
        appointmentsService.getAppointments(),
        doctorsService.getDoctors()
      ])
      setAppointments(appointmentsData.appointments || [])
      setDoctors(doctorsData.doctors || [])
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (day) => {
    const date = new Date()
    date.setFullYear(date.getFullYear())
    date.setMonth(date.getMonth())
    date.setDate(day)
    const dateStr = date.toISOString().split('T')[0]
    navigate(`/appointments?date=${dateStr}`)
  }

  const filteredAppointments = selectedDoctor === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.doctorId === selectedDoctor)

  const styles = {
    container: {
      maxWidth: '1200px',
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
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer'
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
      minWidth: '200px'
    }
  }

  return (
    <AppLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Appointment Calendar</h1>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/appointments')}
          >
            ← Back to List
          </button>
        </div>

        <div style={styles.filterBar}>
          <span style={styles.filterLabel}>Filter by Doctor:</span>
          <select
            style={styles.select}
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="all">All Doctors</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.firstName} {doctor.lastName}
              </option>
            ))}
          </select>
        </div>

        <AppointmentCalendar
          appointments={filteredAppointments}
          onDateSelect={handleDateSelect}
        />
      </div>
    </AppLayout>
  )
}

export default CalendarPage