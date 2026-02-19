import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import AppLayout from '../../../core/components/layout/AppLayout'
import DoctorList from '../components/DoctorList'
import doctorsService from '../services/doctorsService'

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const data = await doctorsService.getDoctors()
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Failed to load doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (doctor) => {
    navigate(`/doctors/${doctor.id}`)
  }

  const handleEdit = (doctor) => {
    navigate(`/doctors/${doctor.id}/edit`)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorsService.deleteDoctor(id)
        await loadDoctors()
      } catch (error) {
        console.error('Failed to delete doctor:', error)
        alert('Failed to delete doctor: ' + error.message)
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
          <h1 style={styles.title}>Doctors</h1>
          <button 
            style={styles.addButton}
            onClick={() => navigate('/doctors/new')}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.primary.dark}
            onMouseLeave={(e) => e.target.style.backgroundColor = theme.colors.primary.DEFAULT}
          >
            + Add Doctor
          </button>
        </div>

        <DoctorList
          doctors={doctors}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  )
}

export default DoctorsPage