import { useState } from 'react'
import type { SubmitEvent } from 'react'
import './Login.css'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../auth/useAuth'

import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

function BagIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 11h18l2 17H5l2-17Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M11 12V8a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}

function Login() {
  const { user: currentUser, login, register, busy, checkingSession, message: authMessage, clearMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from as string | undefined
  function destination(role: string) {
    if (from === '/shop' || from === '/cart' || (from === '/vendor' && role === 'vendor')) return from
    return role === 'vendor' ? '/vendor' : '/shop'
  }
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  const [registering, setRegistering] = useState(false)
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const fields = new FormData(form)
    setMessage('')
    clearMessage()
    const input = { email: String(fields.get('email') || ''), password: String(fields.get('password') || '') }
    try {
      const user = registering
        ? await register({ ...input, name: String(fields.get('name') || ''), role: fields.get('role') === 'vendor' ? 'vendor' : 'user' })
        : await login(input)
      form.reset()
      navigate(destination(user.role), { replace: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reach the backend.')
    }
  }
  if (!checkingSession && currentUser) return <Navigate to={destination(currentUser.role)} replace />

  return (
    <main className="login-page">
      <section className="story-panel" aria-label="Welcome to Shoppy">
        <Link className="brand" to="/shop" aria-label="Shoppy home"><span className="brand-icon"><BagIcon /></span>shoppy<span className="brand-dot">.</span></Link>
        <div className="story-content">
          <span className="eyebrow">A LITTLE JOY, DELIVERED</span>
          <h1>Good finds.<br />Great everyday.</h1>
          <p>Discover things you’ll love, for the moments that make life yours.</p>
          <div className="shopping-art" aria-hidden="true">
            <span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✦</span>
            <div className="art-circle" />
            <div className="small-bag"><div className="small-handle" /><span>little<br />joys.</span></div>
            <div className="large-bag"><div className="large-handle" /><BagIcon /><span>shoppy.</span></div>
            <div className="find-tag"><span>★</span> Your next happy find</div>
          </div>
          <div className="story-perks"><span>✓ Thoughtful picks</span><span>✓ Simple shopping</span></div>
        </div>
        <span className="story-footer">Something good is just around the corner.</span>
      </section>

      <section className="form-panel" aria-labelledby="login-heading">
        <div className="top-note"><span>New around here? <button type="button" className="text-button" onClick={() => { setRegistering(!registering); setMessage(''); clearMessage() }}>{registering ? 'Sign in instead' : 'Create an account'} <span aria-hidden="true">→</span></button></span><ThemeToggle /></div>
        <div className="login-content">
          <span className="welcome-icon"><BagIcon /></span>
          <span className="form-eyebrow">YOUR EVERYDAY FINDS AWAIT</span>
          <h2 id="login-heading">{registering ? 'Create your account.' : 'Welcome back.'}</h2>
          <p className="form-intro">Sign in and pick up where you left off.</p>
                    {checkingSession ? <p role="status">Checking your session...</p> : <form onSubmit={handleSubmit}>
            {registering && <><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" maxLength={80} required /></>}
            {registering && <div className="account-type"><label htmlFor="role">I want to</label><select id="role" name="role" defaultValue="user"><option value="user">Shop — user account</option><option value="vendor">Sell on Shoppy — vendor account</option></select><p>Vendors can publish products and shop too.</p></div>}
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            <div className="password-label"><label htmlFor="password">Password</label><button className="text-button forgot-button" type="button" onClick={() => setMessage('Password recovery is not implemented yet.')}>Forgot password?</button></div>
            <div className="password-field">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 8 : undefined} required />
              <button className="visibility-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>{showPassword && <path d="m4 3 16 18" stroke="currentColor" strokeWidth="1.6"/>}</svg>
              </button>
            </div>
            <button className="sign-in-button" type="submit" disabled={busy}>{busy ? "Please wait..." : registering ? "Create account" : "Sign in"} <span aria-hidden="true">→</span></button>
            <p className="form-message" role="status">{message || authMessage}</p>
          </form>}
          <div className="security-note"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5"/></svg>A little peace of mind, with every sign-in.</div>
        </div>
        <footer className="form-footer"><span>© {new Date().getFullYear()} Shoppy</span><span>Made for your everyday.</span></footer>
      </section>
    </main>
  )
}

export default Login







