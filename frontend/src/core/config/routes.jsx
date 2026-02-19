import { DashboardPage } from '../../modules/dashboard'
import { PatientsPage } from '../../modules/patients'

export const routes = [
  {
    path: '/',
    element: <DashboardPage />,
    protected: true
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    protected: true
  },

  {
  path: '/patients',
  element: (
    <ProtectedRoute>
      <PatientsPage />
    </ProtectedRoute>
  )
  }

]