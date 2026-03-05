import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./core/context/AuthContext";
import ProtectedRoute from "./core/components/common/ProtectedRoute";
import SyncIndicator from "./components/SyncIndicator";

import { PrintProvider } from './components/print/PrintContext';

// ==============================
// AUTH MODULES
// ==============================
import Login from "./modules/auth/pages/Login";
import UnauthorizedPage from "./modules/auth/pages/UnauthorizedPage";

// ==============================
// DASHBOARD MODULE
// ==============================
import Dashboard from "./modules/dashboard/pages/Dashboard";

// ==============================
// PATIENTS MODULE
// ==============================
import PatientsPage from "./modules/patients/pages/PatientsPage";
import PatientFormPage from "./modules/patients/pages/PatientFormPage";
import PatientDetailPage from "./modules/patients/pages/PatientDetailPage";

// ==============================
// DOCTORS MODULE
// ==============================
import DoctorsPage from "./modules/doctors/pages/DoctorsPage";
import DoctorDetailPage from "./modules/doctors/pages/DoctorDetailPage";
import DoctorFormPage from "./modules/doctors/pages/DoctorFormPage";

// ==============================
// APPOINTMENTS MODULE
// ==============================
import AppointmentsPage from "./modules/appointments/pages/AppointmentsPage";
import CalendarPage from "./modules/appointments/pages/CalendarPage";
import WaitingListPage from "./modules/appointments/pages/WaitingListPage";
import AppointmentDetailPage from "./modules/appointments/pages/AppointmentDetailPage";
import AppointmentFormPage from "./modules/appointments/pages/AppointmentFormPage";

// ==============================
// PHARMACY MODULE
// ==============================
import PharmacyPage from "./modules/pharmacy/pages/PharmacyPage";
import InventoryPage from "./modules/pharmacy/pages/InventoryPage";
import InventoryFormPage from "./modules/pharmacy/pages/InventoryFormPage";
import PrescriptionsPage from "./modules/pharmacy/pages/PrescriptionsPage";
import PrescriptionFormPage from "./modules/pharmacy/pages/PrescriptionFormPage";

// ==============================
// LABORATORY MODULE
// ==============================
import LaboratoryPage from "./modules/laboratory/pages/LaboratoryPage";
import TestsPage from "./modules/laboratory/pages/TestsPage";
import TestFormPage from "./modules/laboratory/pages/TestFormPage";
import OrdersPage from "./modules/laboratory/pages/OrdersPage";
import OrderFormPage from "./modules/laboratory/pages/OrderFormPage";
import ResultsPage from "./modules/laboratory/pages/ResultsPage";

// ==============================
// VITALS MODULE
// ==============================
import VitalsPage from "./modules/vitals/pages/VitalsPage";
import PatientVitalsPage from "./modules/vitals/pages/PatientVitalsPage";
import RecordVitalsPage from "./modules/vitals/pages/RecordVitalsPage";
import TriagePage from "./modules/vitals/pages/TriagePage";

// ==============================
// BILLING MODULE
// ==============================
import BillingPage from "./modules/billing/pages/BillingPage";
import InvoicesPage from "./modules/billing/pages/InvoicesPage";
import InvoiceFormPage from "./modules/billing/pages/InvoiceFormPage";
import InvoiceDetailPage from "./modules/billing/pages/InvoiceDetailPage";
import PaymentsPage from "./modules/billing/pages/PaymentsPage";
import PaymentFormPage from "./modules/billing/pages/PaymentFormPage";
import PaymentDetailPage from "./modules/billing/pages/PaymentDetailPage";

// ==============================
// ADMISSIONS MODULE
// ==============================
import AdmissionsPage from "./modules/admissions/pages/AdmissionsPage";
import AdmissionsListPage from "./modules/admissions/pages/AdmissionsListPage";
import AdmissionFormPage from "./modules/admissions/pages/AdmissionFormPage";
import AdmissionDetailPage from "./modules/admissions/pages/AdmissionDetailPage";
import WardsPage from "./modules/admissions/pages/WardsPage";
import WardFormPage from "./modules/admissions/pages/WardFormPage";

// ==============================
// MEDICAL RECORDS MODULE
// ==============================
import MedicalRecordsPage from "./modules/medical-records/pages/MedicalRecordsPage";
import PatientRecordsPage from "./modules/medical-records/pages/PatientRecordsPage";
import RecordFormPage from "./modules/medical-records/pages/RecordFormPage";
import RecordDetailPage from "./modules/medical-records/pages/RecordDetailPage";

// ==============================
// SETTINGS MODULE
// ==============================
import SettingsPage from "./modules/settings/pages/SettingsPage";
import BrandingPage from "./modules/settings/pages/BrandingPage";
import BusinessHoursPage from "./modules/settings/pages/BusinessHoursPage";
import NotificationsPage from "./modules/settings/pages/NotificationsPage";
import FeaturesPage from "./modules/settings/pages/FeaturesPage";
import BackupPage from "./modules/settings/pages/BackupPage";
import SecurityPage from "./modules/settings/pages/SecurityPage";
import IntegrationsPage from "./modules/settings/pages/IntegrationsPage";
import AuditLogsPage from "./modules/settings/pages/AuditLogsPage";
import GeneralPage from "./modules/settings/pages/GeneralPage";

// ==============================
// ROLES DEFINITIONS
// ==============================
const ROLES = {
  ADMIN: ["SYSTEM_ADMIN", "HOSPITAL_ADMIN"],
  DOCTOR: ["DOCTOR"],
  NURSE: ["NURSE"],
  RECEPTION: ["RECEPTIONIST"],
  PHARMACY: ["PHARMACIST"],
  LAB: ["LAB_TECHNICIAN"],
  BILLING: ["ACCOUNTANT"],
};

// ==============================
// ROUTES CONFIGURATION
// ==============================
const ROUTES = [
  // Public Routes
  { path: "/login", element: <Login />, public: true },
  { path: "/unauthorized", element: <UnauthorizedPage />, public: true },

  // Dashboard
  { path: "/", element: <Dashboard />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/dashboard", element: <Dashboard />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },

  // Patients
  { path: "/patients", element: <PatientsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/patients/new", element: <PatientFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },
  { path: "/patients/:id", element: <PatientDetailPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/patients/:id/edit", element: <PatientFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },

  // Doctors
  { path: "/doctors", element: <DoctorsPage />, roles: [...ROLES.ADMIN] },
  { path: "/doctors/new", element: <DoctorFormPage />, roles: [...ROLES.ADMIN] },
  { path: "/doctors/:id", element: <DoctorDetailPage />, roles: [...ROLES.ADMIN] },
  { path: "/doctors/:id/edit", element: <DoctorFormPage />, roles: [...ROLES.ADMIN] },

  // Appointments
  { path: "/appointments", element: <AppointmentsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/appointments/calendar", element: <CalendarPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },
  { path: "/appointments/waiting", element: <WaitingListPage />, roles: [...ROLES.ADMIN, ...ROLES.RECEPTION] },
  { path: "/appointments/new", element: <AppointmentFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },
  { path: "/appointments/:id", element: <AppointmentDetailPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/appointments/:id/edit", element: <AppointmentFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },

  // Pharmacy
  { path: "/pharmacy", element: <PharmacyPage />, roles: [...ROLES.ADMIN, ...ROLES.PHARMACY] },
  { path: "/pharmacy/inventory", element: <InventoryPage />, roles: [...ROLES.ADMIN, ...ROLES.PHARMACY] },
  { path: "/pharmacy/inventory/new", element: <InventoryFormPage />, roles: [...ROLES.ADMIN, ...ROLES.PHARMACY] },
  { path: "/pharmacy/inventory/:id/edit", element: <InventoryFormPage />, roles: [...ROLES.ADMIN, ...ROLES.PHARMACY] },
  { path: "/pharmacy/prescriptions", element: <PrescriptionsPage />, roles: [...ROLES.ADMIN, ...ROLES.PHARMACY] },
  { path: "/pharmacy/prescriptions/new", element: <PrescriptionFormPage />, roles: [...ROLES.ADMIN, ...ROLES.PHARMACY] },

  // Laboratory
  { path: "/laboratory", element: <LaboratoryPage />, roles: [...ROLES.ADMIN, ...ROLES.LAB] },
  { path: "/laboratory/tests", element: <TestsPage />, roles: [...ROLES.ADMIN, ...ROLES.LAB] },
  { path: "/laboratory/tests/new", element: <TestFormPage />, roles: [...ROLES.ADMIN, ...ROLES.LAB] },
  { path: "/laboratory/tests/:id/edit", element: <TestFormPage />, roles: [...ROLES.ADMIN, ...ROLES.LAB] },
  { path: "/laboratory/orders", element: <OrdersPage />, roles: [...ROLES.ADMIN, ...ROLES.LAB] },
  { path: "/laboratory/orders/new", element: <OrderFormPage />, roles: [...ROLES.ADMIN, ...ROLES.LAB] },
  {
  path: "/laboratory/results",
  element: <ResultsPage />,
  roles: [...ROLES.ADMIN, ...ROLES.LAB],
},


  // Vitals
  { path: "/vitals", element: <VitalsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/vitals/triage", element: <TriagePage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/vitals/record", element: <RecordVitalsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/vitals/patient/:patientId", element: <PatientVitalsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },

  // Billing
  { path: "/billing", element: <BillingPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },
  { path: "/billing/invoices", element: <InvoicesPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },
  { path: "/billing/invoices/new", element: <InvoiceFormPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },
  { path: "/billing/invoices/:id", element: <InvoiceDetailPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },
  { path: "/billing/invoices/:id/edit", element: <InvoiceFormPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },
  { path: "/billing/payments", element: <PaymentsPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },
  { path: "/billing/payments/new", element: <PaymentFormPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },
  { path: "/billing/payments/:id", element: <PaymentDetailPage />, roles: [...ROLES.ADMIN, ...ROLES.BILLING] },

  // Admissions
  { path: "/admissions", element: <AdmissionsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE, ...ROLES.RECEPTION] },
  { path: "/admissions/list", element: <AdmissionsListPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE, ...ROLES.RECEPTION] },
  { path: "/admissions/new", element: <AdmissionFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/admissions/:id", element: <AdmissionDetailPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE, ...ROLES.RECEPTION] },
  { path: "/admissions/:id/edit", element: <AdmissionFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/admissions/wards", element: <WardsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE, ...ROLES.RECEPTION] },
  { path: "/admissions/wards/new", element: <WardFormPage />, roles: [...ROLES.ADMIN] },
  { path: "/admissions/wards/:id/edit", element: <WardFormPage />, roles: [...ROLES.ADMIN] },

  // Medical Records
  { path: "/medical-records", element: <MedicalRecordsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },
  { path: "/medical-records/patient/:patientId", element: <PatientRecordsPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/medical-records/patient/:patientId/new", element: <RecordFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },
  { path: "/medical-records/:id", element: <RecordDetailPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR, ...ROLES.NURSE] },
  { path: "/medical-records/:id/edit", element: <RecordFormPage />, roles: [...ROLES.ADMIN, ...ROLES.DOCTOR] },

  // Settings
  { path: "/settings", element: <SettingsPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/general", element: <GeneralPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/branding", element: <BrandingPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/hours", element: <BusinessHoursPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/notifications", element: <NotificationsPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/features", element: <FeaturesPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/backup", element: <BackupPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/security", element: <SecurityPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/integrations", element: <IntegrationsPage />, roles: [...ROLES.ADMIN] },
  { path: "/settings/audit-logs", element: <AuditLogsPage />, roles: [...ROLES.ADMIN] },
];

// ==============================
// APP COMPONENT
// ==============================
export default function App() {
  return (
    <PrintProvider>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {ROUTES.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  route.public ? (
                    route.element
                  ) : (
                    <ProtectedRoute requiredRoles={route.roles}>
                      {route.element}
                    </ProtectedRoute>
                  )
                }
              />
            ))}
          </Routes>
          <SyncIndicator />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </PrintProvider>
  );
}
