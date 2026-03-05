import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import AppLayout from '../../../core/components/layout/AppLayout';
import patientsService from '../services/patientsService';
import offlineService from '../../../services/offlineService';
import PrintButton from '../../../components/print/PrintButton';
import PrintStyle from '../../../components/print/PrintStyle';

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  // Online/offline tracking
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch patient individually (full details)
  const fetchPatient = async () => {
    setLoading(true);
    try {
      if (online) {
        try {
          const data = await patientsService.getPatient(id);
          const apiPatient = data.patient;
          setPatient(apiPatient);
          // Update local DB without triggering an event (prevents reload loop)
          if (offlineService.updateLocal) {
            await offlineService.updateLocal('patients', apiPatient);
          } else {
            console.warn('updateLocal not available, data may not persist offline');
          }
        } catch (error) {
          console.warn('API fetch failed, falling back to local DB', error);
          const local = await offlineService.getOne?.('patients', id) ||
            (await offlineService.getAll('patients')).find(p => p.id === id);
          setPatient(local);
        }
      } else {
        const local = await offlineService.getOne?.('patients', id) ||
          (await offlineService.getAll('patients')).find(p => p.id === id);
        setPatient(local);
      }
    } catch (error) {
      console.error('Failed to fetch patient:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id, online]);

  // Listen for updates from other components (edit page, sync)
  useEffect(() => {
    const handleUpdate = () => fetchPatient();
    window.addEventListener('localDataChanged', handleUpdate);
    window.addEventListener('syncCompleted', handleUpdate);
    return () => {
      window.removeEventListener('localDataChanged', handleUpdate);
      window.removeEventListener('syncCompleted', handleUpdate);
    };
  }, [id]);

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      width: '100%',
      padding: theme.spacing[4],
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[8],
      flexWrap: 'wrap',
      gap: theme.spacing[4],
    },
    titleSection: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: theme.fonts.sizes['2xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900],
      margin: 0,
    },
    uhid: {
      fontFamily: theme.fonts.mono,
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.gray[500],
      marginTop: theme.spacing[1],
    },
    actions: {
      display: 'flex',
      gap: theme.spacing[3],
      flexWrap: 'wrap',
    },
    editButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: theme.colors.accent.DEFAULT,
      color: 'white',
      border: 'none',
      borderRadius: theme.radius.md,
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      ':hover': {
        opacity: 0.9,
      },
    },
    backButton: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.gray[300]}`,
      borderRadius: theme.radius.md,
      color: theme.colors.gray[700],
      fontSize: theme.fonts.sizes.sm,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: theme.colors.gray[50],
      },
    },
    card: {
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      padding: theme.spacing[8],
      boxShadow: theme.shadows.md,
      border: `1px solid ${theme.colors.gray[200]}`,
    },
    name: {
      fontSize: theme.fonts.sizes['3xl'],
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[6],
      paddingBottom: theme.spacing[4],
      borderBottom: `2px solid ${theme.colors.primary[200]}`,
    },
    sectionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[6],
    },
    section: {
      backgroundColor: theme.colors.gray[50],
      borderRadius: theme.radius.lg,
      padding: theme.spacing[5],
      border: `1px solid ${theme.colors.gray[200]}`,
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.gray[900],
      marginBottom: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      borderBottom: `1px solid ${theme.colors.gray[300]}`,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: theme.spacing[4],
    },
    infoItem: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      fontSize: theme.fonts.sizes.xs,
      color: theme.colors.gray[500],
      marginBottom: theme.spacing[1],
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
    },
    value: {
      fontSize: theme.fonts.sizes.base,
      color: theme.colors.gray[900],
      fontWeight: theme.fonts.weights.medium,
    },
    badgeContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing[2],
      marginTop: theme.spacing[1],
    },
    badge: {
      display: 'inline-block',
      padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
      backgroundColor: theme.colors.primary[50],
      color: theme.colors.primary.DEFAULT,
      borderRadius: theme.radius.full,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.medium,
    },
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: theme.spacing[8] }}>
            Loading patient details...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: theme.spacing[8] }}>
            Patient not found
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PrintStyle />
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <h1 style={styles.title}>Patient Profile</h1>
            <span style={styles.uhid}>UHID: {patient.uhid}</span>
          </div>
          <div style={styles.actions}>
            <button style={styles.backButton} onClick={() => navigate('/patients')}>
              ← Back
            </button>
            <PrintButton label="🖨️ Print" />
            <button style={styles.editButton} onClick={() => navigate(`/patients/${id}/edit`)}>
              Edit Patient
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.name}>
            {patient.firstName} {patient.lastName}
          </h2>

          <div style={styles.sectionsGrid}>
            {/* Personal Information */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Personal</h3>
              <div style={styles.grid}>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Gender</span>
                  <span style={styles.value}>{patient.gender || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>DOB</span>
                  <span style={styles.value}>
                    {patient.dob ? new Date(patient.dob).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Blood Group</span>
                  <span style={styles.value}>{patient.bloodGroup || '—'}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Contact</h3>
              <div style={styles.grid}>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Phone</span>
                  <span style={styles.value}>{patient.phone || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Email</span>
                  <span style={styles.value}>{patient.email || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Address</span>
                  <span style={styles.value}>{patient.address || '—'}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Emergency</h3>
              <div style={styles.grid}>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Name</span>
                  <span style={styles.value}>{patient.emergencyContactName || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Phone</span>
                  <span style={styles.value}>{patient.emergencyContactPhone || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Relation</span>
                  <span style={styles.value}>{patient.emergencyContactRelation || '—'}</span>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Medical</h3>
              <div style={styles.infoItem}>
                <span style={styles.label}>Allergies</span>
                <div style={styles.badgeContainer}>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, index) => (
                      <span key={index} style={styles.badge}>{allergy}</span>
                    ))
                  ) : (
                    <span style={styles.value}>None recorded</span>
                  )}
                </div>
              </div>
              <div style={{ ...styles.infoItem, marginTop: theme.spacing[3] }}>
                <span style={styles.label}>Chronic Conditions</span>
                <div style={styles.badgeContainer}>
                  {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                    patient.chronicConditions.map((condition, index) => (
                      <span key={index} style={styles.badge}>{condition}</span>
                    ))
                  ) : (
                    <span style={styles.value}>None recorded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Insurance</h3>
              <div style={styles.grid}>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Provider</span>
                  <span style={styles.value}>{patient.insuranceProvider || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>Policy No.</span>
                  <span style={styles.value}>{patient.insurancePolicyNo || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientDetailPage;