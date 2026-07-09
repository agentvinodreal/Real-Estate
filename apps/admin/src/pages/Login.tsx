import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@carry/shared'
import { adminApi, adminAuth } from '../lib/adminApi'

export default function Login() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    adminAuth.set(key)
    const ok = await adminApi.verify()
    setBusy(false)
    if (ok) {
      navigate('/')
    } else {
      adminAuth.clear()
      setError('Invalid key. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm border border-ink/15 bg-bone-dim p-8">
        <div className="text-ink">
          <Logo />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-ink-soft">Enter your admin key to manage the site.</p>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="mt-6 w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink focus:border-ochre focus:outline-none"
          autoFocus
        />
        {error && <p className="mt-3 text-sm text-ochre-dark">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full bg-ink py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-ochre-dark disabled:opacity-60"
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>
        <p className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-concrete">
          Dev key: dev-carry-admin-key
        </p>
      </form>
    </div>
  )
}
