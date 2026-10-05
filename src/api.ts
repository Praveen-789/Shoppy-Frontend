export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'vendor'
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  name: string
  role?: 'user' | 'vendor'
}

interface AuthResponse {
  message: string
  user: User
}

// Share the JSON and cookie settings used by all authentication POST requests.
async function post<T>(path: string, body?: LoginInput | RegisterInput): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'The request failed. Please try again.')
  return data
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return post<AuthResponse>('/login', input)
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return post<AuthResponse>('/register', input)
}

export function logout(): Promise<{ message: string }> {
  return post<{ message: string }>('/logout')
}

export async function getCurrentUser(signal?: AbortSignal): Promise<User | null> {
  const response = await fetch('/api/auth/me', { credentials: 'include', signal })
  // Having no session is normal when someone first opens the login page.
  if (response.status === 401) return null
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Could not check your session.')
  return data.user
}


