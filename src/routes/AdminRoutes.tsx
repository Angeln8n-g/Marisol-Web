import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '../pages/admin'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminLayout } from '../components/admin/layout'

// Lazy loading de páginas admin para mejor rendimiento
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AppointmentsPage = lazy(() => import('../pages/admin/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
const PatientsPage = lazy(() => import('../pages/admin/PatientsPage').then(m => ({ default: m.PatientsPage })))
const MedicalRecordsPage = lazy(() => import('../pages/admin/MedicalRecordsPage').then(m => ({ default: m.MedicalRecordsPage })))
const ProceduresPage = lazy(() => import('../pages/admin/ProceduresPage').then(m => ({ default: m.ProceduresPage })))
const PricingPage = lazy(() => import('../pages/admin/PricingPage').then(m => ({ default: m.PricingPage })))
const ClinicsPage = lazy(() => import('../pages/admin/ClinicsPage').then(m => ({ default: m.ClinicsPage })))
const LocationsPage = lazy(() => import('../pages/admin/LocationsPage').then(m => ({ default: m.LocationsPage })))
const NewLocationPage = lazy(() => import('../pages/admin/NewLocationPage').then(m => ({ default: m.NewLocationPage })))
const EditLocationPage = lazy(() => import('../pages/admin/EditLocationPage').then(m => ({ default: m.EditLocationPage })))
const AccountingPage = lazy(() => import('../pages/admin/AccountingPage').then(m => ({ default: m.AccountingPage })))
const BudgetsPage = lazy(() => import('../pages/admin/BudgetsPage').then(m => ({ default: m.BudgetsPage })))
const InventoryPage = lazy(() => import('../pages/admin/InventoryPage').then(m => ({ default: m.InventoryPage })))
const MarketingPage = lazy(() => import('../pages/admin/MarketingPage').then(m => ({ default: m.MarketingPage })))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-cream flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <svg
        className="animate-spin h-8 w-8 text-gold"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-sm text-gray-600 font-montserrat">Cargando...</span>
    </div>
  </div>
)

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </AdminLayout>
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
    <Route path="locations" element={<ProtectedLayout><LocationsPage /></ProtectedLayout>} />
    <Route path="locations/new" element={<ProtectedLayout><NewLocationPage /></ProtectedLayout>} />
    <Route path="locations/:id/edit" element={<ProtectedLayout><EditLocationPage /></ProtectedLayout>} />
    <Route path="accounting" element={<ProtectedLayout><AccountingPage /></ProtectedLayout>} />
    <Route path="budgets" element={<ProtectedLayout><BudgetsPage /></ProtectedLayout>} />
    <Route path="inventory" element={<ProtectedLayout><InventoryPage /></ProtectedLayout>} />
    <Route path="marketing" element={<ProtectedLayout><MarketingPage /></ProtectedLayout>} />
  </Routes>
)
