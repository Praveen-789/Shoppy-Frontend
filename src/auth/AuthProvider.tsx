import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from '../api'
import type { LoginInput, RegisterInput, User } from '../api'
import { useCartStore } from '../stores/cartStore'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.getCurrentUser(controller.signal)
      .then(currentUser => { if (!controller.signal.aborted) { useCartStore.getState().setSession(currentUser?.id || null); setUser(currentUser) } })
      .catch(() => {
        if (!controller.signal.aborted) setMessage('Could not check your session. Check that the backend is running.')
      })
      .finally(() => { if (!controller.signal.aborted) setCheckingSession(false) })
    return () => controller.abort()
  }, [])

  async function login(input: LoginInput) {
    setBusy(true)
    setMessage('')
    try {
      const result = await api.login(input)
      useCartStore.getState().setSession(result.user.id)
      setUser(result.user)
      setMessage(result.message)
      return result.user
    } finally {
      setBusy(false)
    }
  }

  async function register(input: RegisterInput) {
    setBusy(true)
    setMessage('')
    try {
      const result = await api.register(input)
      useCartStore.getState().setSession(result.user.id)
      setUser(result.user)
      setMessage(result.message)
      return result.user
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    setMessage('')
    try {
      await api.logout()
      useCartStore.getState().setSession(null)
      setUser(null)
      setMessage('You have signed out.')
    } catch (error) {
      // Keep the signed-in state when clearing the server cookie fails.
      setMessage(error instanceof Error ? error.message : 'Could not sign out. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <AuthContext.Provider value={{ user, checkingSession, busy, message,
    clearMessage: () => setMessage(''), login, register, logout }}>
    {children}
  </AuthContext.Provider>
}


