import { useLocation, useNavigate } from 'react-router-dom'

// Return to the browsing page after login; the visitor can then repeat the action.
export function useRequireSignIn() {
  const location = useLocation()
  const navigate = useNavigate()
  return { requireSignIn: () => navigate('/login', { state: { from: location.pathname } }) }
}
