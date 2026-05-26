import { Routes, Route } from 'react-router-dom'
import { LoginPage, DashboardPage, AppointmentsPage, PatientsPage, MedicalRecordsPage, ProceduresPage, PricingPage, ClinicsPage } from '../pages/admin'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminLayout } from '../components/admin/layout'

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
)

export const AdminRoutes = () => (
  <Routes>
    <Route path="login" element={<LoginPage />} />
    <Route path="dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
    <Route path="appointments" element={<ProtectedLayout><AppointmentsPage /></ProtectedLayout>} />
    <Route path="patients" element={<ProtectedLayout><PatientsPage /></ProtectedLayout>} />
    <Route path="medical-records" element={<ProtectedLayout><MedicalRecordsPage /></ProtectedLayout>} />
    <Route path="procedures" element={<ProtectedLayout><ProceduresPage /></ProtectedLayout>} />
    <Route path="pricing" element={<ProtectedLayout><PricingPage /></ProtectedLayout>} />
    <Route path="clinics" element={<ProtectedLayout><ClinicsPage /></ProtectedLayout>} />
  </Routes>
)
