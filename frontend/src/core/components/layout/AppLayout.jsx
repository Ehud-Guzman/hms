// src/layouts/AppLayout/AppLayout.jsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import SettingsService from '../../../modules/settings/services/settingsService'

const AppLayout = ({ children }) => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, initialized, loading: authLoading, hasAnyRole } = useAuth()

  const hideSidebar = location.pathname === '/login'

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !user && !hideSidebar) {
      navigate('/login')
    }
  }, [initialized, user, hideSidebar, navigate])

  // Hospital state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hospitals, setHospitals] = useState([])
  const [selectedHospital, setSelectedHospital] = useState(
    user?.hospitalId || localStorage.getItem('hospitalId') || ''
  )
  const [loadingHospitals, setLoadingHospitals] = useState(false)

  // Determine if the user is an admin (can switch hospitals)
  const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'HOSPITAL_ADMIN'

  // Fetch hospitals only for admin users
  useEffect(() => {
    if (!initialized || !user) return

    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true)
        const data = await SettingsService.getHospitals()
        setHospitals(data.hospitals || [])
      } catch (err) {
        console.error('Failed to load hospitals:', err)
      } finally {
        setLoadingHospitals(false)
      }
    }

    if (isAdmin) {
      fetchHospitals()
    } else {
      setLoadingHospitals(false)
      setHospitals([])
      if (user?.hospitalId && !selectedHospital) {
        setSelectedHospital(user.hospitalId)
        localStorage.setItem('hospitalId', user.hospitalId)
      }
    }
  }, [initialized, user, isAdmin, selectedHospital])

  const handleHospitalChange = (e) => {
    const id = e.target.value
    setSelectedHospital(id)
    localStorage.setItem('hospitalId', id)
    window.dispatchEvent(new CustomEvent('hospitalChanged', { detail: id }))
  }

  // Menu items with allowed roles
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { path: '/patients', label: 'Patients', icon: '👤', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { path: '/doctors', label: 'Doctors', icon: '👨‍⚕️', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'] },
    { path: '/appointments', label: 'Appointments', icon: '📅', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
    { path: '/pharmacy', label: 'Pharmacy', icon: '💊', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'] },
    { path: '/laboratory', label: 'Laboratory', icon: '🧪', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'] },
    { path: '/vitals', label: 'Vitals', icon: '💓', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'] },
    { path: '/billing', label: 'Billing', icon: '💰', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'] },
    { path: '/admissions', label: 'Admissions', icon: '🏥', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'] },
    { path: '/medical-records', label: 'Records', icon: '📋', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'] },
    { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'] }
  ]

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  )

  const getPageTitle = () => {
    const currentItem = menuItems.find(i => i.path === location.pathname)
    return currentItem?.label || 'Dashboard'
  }

  // Show loading while auth is initializing
  if (!initialized || authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    )
  }

  if (hideSidebar) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        {children || <Outlet />}
      </main>
    )
  }

  const styles = {
    container: { display: 'flex', height: '100vh', backgroundColor: theme.colors.gray[50], width: '100vw' },
    sidebar: {
      width: sidebarOpen ? '280px' : '80px',
      backgroundColor: 'white',
      borderRight: `1px solid ${theme.colors.gray[200]}`,
      transition: `width ${theme.animation.duration.DEFAULT} ${theme.animation.easing.DEFAULT}`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    sidebarHeader: { padding: theme.spacing[4], borderBottom: `1px solid ${theme.colors.gray[200]}`, display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center' },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      padding: theme.spacing[6]
    },
    header: { backgroundColor: 'white', borderBottom: `1px solid ${theme.colors.gray[200]}`, padding: `${theme.spacing[4]} ${theme.spacing[6]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    content: { width: '100%', maxWidth: '1600px', margin: '0 auto' },
    hospitalSelector: { marginLeft: theme.spacing[4], padding: `${theme.spacing[1]} ${theme.spacing[2]}`, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.gray[300]}`, backgroundColor: 'white', color: theme.colors.gray[900], fontSize: theme.fonts.sizes.sm, cursor: 'pointer' },
    loadingText: { marginLeft: theme.spacing[4], fontSize: theme.fonts.sizes.sm, color: theme.colors.gray[600] }
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && <span style={{ fontSize: theme.fonts.sizes.xl, fontWeight: theme.fonts.weights.bold, color: theme.colors.primary.DEFAULT }}>🏥 HMS</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: theme.fonts.sizes.lg }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav style={{ flex: 1, padding: theme.spacing[4], overflowY: 'auto' }}>
          {visibleMenuItems.map(item => (
            <a key={item.path} href={item.path} style={{
              display: 'flex', alignItems: 'center', padding: `${theme.spacing[3]} ${theme.spacing[4]}`, marginBottom: theme.spacing[2],
              borderRadius: theme.radius.lg, textDecoration: 'none',
              color: location.pathname === item.path ? theme.colors.primary.DEFAULT : theme.colors.gray[700],
              backgroundColor: location.pathname === item.path ? `${theme.colors.primary.DEFAULT}15` : 'transparent'
            }}>
              <span style={{ fontSize: theme.fonts.sizes.lg, marginRight: sidebarOpen ? theme.spacing[3] : 0, textAlign: 'center' }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 style={{ fontSize: theme.fonts.sizes.xl, fontWeight: theme.fonts.weights.semibold }}>{getPageTitle()}</h2>

            {/* Hospital dropdown – visible only for admins */}
            {sidebarOpen && isAdmin && (
              <>
                {loadingHospitals ? (
                  <span style={styles.loadingText}>Loading hospitals...</span>
                ) : (
                  <select value={selectedHospital} onChange={handleHospitalChange} style={styles.hospitalSelector}>
                    <option value="">Select Hospital</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                )}
              </>
            )}
          </div>

          <div>
            <span style={{ marginRight: theme.spacing[3] }}>{user?.email || 'Loading...'}</span>
            <button onClick={logout}>Logout</button>
          </div>
        </header>

        <div style={styles.content}>{children || <Outlet />}</div>
      </main>
    </div>
  )
}

export default AppLayout