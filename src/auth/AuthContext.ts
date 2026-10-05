import { createContext } from 'react'
import type { LoginInput, RegisterInput, User } from '../api'

export interface AuthState {
  user: User | null
  checkingSession: boolean
  busy: boolean
  message: string
  clearMessage: () => void
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
