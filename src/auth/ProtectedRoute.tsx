import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function ProtectedRoute({ vendorOnly = false }: { vendorOnly?: boolean }) {
  const { user, checkingSession } = useAuth()
  const location = useLocation()
  if (checkingSession) return <main className="shop-state" role="status">Checking your session...</main>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (vendorOnly && user.role !== 'vendor') return <Navigate to="/shop" replace />
  return <div key={user.id}><Outlet /></div>
}
