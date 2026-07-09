import { useState, type FormEvent } from 'react'
import { api } from '@carry/shared'

type Props = {
  propertyId?: string
  projectId?: string
  sourcePage?: string
  heading?: string
}

const inputClass =
  'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink placeholder:text-concrete focus:border-ochre focus:outline-none'

export default function InquiryForm({ propertyId, projectId, sourcePage, heading = 'Enquire about this property' }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      await api.createLead({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        message: form.message || undefined,
        propertyId,
        projectId,
        sourcePage,
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="border border-ochre bg-sand p-6">
        <h3 className="font-display text-xl font-semibold text-ink">Thanks, {form.name.split(' ')[0] || 'there'}!</h3>
        <p className="mt-2 text-sm text-ink-soft">
          We’ve got your enquiry and will call you back within one working day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="border border-ink/15 bg-bone-dim p-6">
      <h3 className="font-display text-xl font-semibold text-ink">{heading}</h3>
      <div className="mt-4 space-y-3">
        <input required className={inputClass} placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <input required className={inputClass} placeholder="Phone number" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <input className={inputClass} placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <textarea className={`${inputClass} min-h-[90px]`} placeholder="Message (optional)" value={form.message} onChange={(e) => set('message', e.target.value)} />
      </div>

      {status === 'error' && (
        <p className="mt-3 text-sm text-ochre-dark">Something went wrong. Please try again or call us.</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-4 w-full bg-ink py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-ochre-dark disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Request a callback'}
      </button>
      <p className="mt-3 text-center font-mono text-[0.6rem] uppercase tracking-[0.12em] text-concrete">
        We respect your privacy
      </p>
    </form>
  )
}
