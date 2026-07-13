import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Check, Phone, Calendar, ShoppingCart, UserCheck, MessageSquare } from 'lucide-react'
import { api, type Material, type ServiceProvider, type EquipmentRental } from '@carry/shared'
import { CONTACT } from '../lib/data'
import { EASE_OUT_EXPO } from '../lib/motion'

type Props = {
  isOpen: boolean
  onClose: () => void
  item:
    | { type: 'Material'; data: Material }
    | { type: 'ServiceProvider'; data: ServiceProvider }
    | { type: 'Equipment'; data: EquipmentRental }
    | null
}

const inputClass =
  'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink placeholder:text-concrete focus:border-teal focus:outline-none'

export default function MarketplaceInquiryForm({ isOpen, onClose, item }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', phone: '', email: '', qty: 1, startDate: '', message: '' })

  if (!item) return null
  const activeItem = item

  function set(key: keyof typeof form, value: string | number) {
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
        sourcePage: `/marketplace#${activeItem.type.toLowerCase()}`,
        marketplaceType: activeItem.type,
        itemId: activeItem.data.id,
        itemQty: activeItem.type === 'Material' || activeItem.type === 'Equipment' ? Number(form.qty) : undefined,
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  // Pre-fill WhatsApp message based on item and details
  const getWhatsAppLink = () => {
    let text = ''
    if (activeItem.type === 'Material') {
      const mat = activeItem.data as Material
      text = `Hi Carry Construction, I'd like to order ${form.qty} unit(s) of ${mat.name} (${mat.brand}). My name is ${form.name}. Please contact me.`
    } else if (activeItem.type === 'Equipment') {
      const eq = activeItem.data as EquipmentRental
      text = `Hi Carry Construction, I'd like to rent the ${eq.name} for ${form.qty} day(s) starting from ${form.startDate || 'soon'}. My name is ${form.name}.`
    } else if (activeItem.type === 'ServiceProvider') {
      const sp = activeItem.data as ServiceProvider
      text = `Hi Carry Construction, I'm interested in hiring ${sp.name} (${sp.role}) for my construction work. My name is ${form.name}.`
    }
    return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-teal-dark/45 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full flex-col border-l border-ink/10 bg-bone-dim shadow-2xl sm:max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div className="flex items-center gap-2">
                {item.type === 'Material' && <ShoppingCart className="h-5 w-5 text-ochre" />}
                {item.type === 'Equipment' && <Calendar className="h-5 w-5 text-ochre" />}
                {item.type === 'ServiceProvider' && <UserCheck className="h-5 w-5 text-ochre" />}
                <h3 className="font-display text-lg font-semibold text-ink">
                  {item.type === 'Material' && 'Order Raw Materials'}
                  {item.type === 'Equipment' && 'Rent Construction Equipment'}
                  {item.type === 'ServiceProvider' && `Hire Specialist`}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-concrete hover:bg-ink/5 hover:text-ink transition-colors"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Product Spec Box */}
              <div className="mb-6 border border-ink/10 bg-bone p-4">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ochre-dark">
                  {item.type === 'ServiceProvider' ? (item.data as ServiceProvider).role : item.data.category}
                </span>
                <h4 className="font-display text-xl font-bold text-ink mt-0.5">{item.data.name}</h4>
                {item.type === 'Material' && (
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    Brand: {(item.data as Material).brand} · Price:{' '}
                    {(item.data as Material).price
                      ? `₹${(item.data as Material).price} / ${(item.data as Material).unit}`
                      : 'Request Quote'}
                  </p>
                )}
                {item.type === 'Equipment' && (
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    Rent Rate: ₹{(item.data as EquipmentRental).rentPerDay.toLocaleString('en-IN')} / day
                  </p>
                )}
                {item.type === 'ServiceProvider' && (
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    {(item.data as ServiceProvider).minimumRate
                      ? `Rates: ₹${(item.data as ServiceProvider).minimumRate?.toLocaleString('en-IN')} ${(item.data as ServiceProvider).rateUnit}`
                      : 'Rates: Contact for pricing'}
                  </p>
                )}
              </div>

              {status === 'done' ? (
                <div className="space-y-6 text-center py-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <Check className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-display text-2xl font-bold text-ink">Inquiry Submitted</h4>
                    <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                      We have logged your marketplace request. A Carry Construction representative will call you back within one working day.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-ink/10">
                    <p className="text-xs text-concrete font-mono uppercase tracking-wider mb-3">
                      Need faster checkout?
                    </p>
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 bg-[#25D366] py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#20ba59]"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="user-name" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      id="user-name"
                      required
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Rajesh Kumar"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-phone" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Phone Number
                    </label>
                    <input
                      id="user-phone"
                      required
                      type="tel"
                      className={inputClass}
                      placeholder="e.g. 98765 43210"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-email" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      id="user-email"
                      type="email"
                      className={inputClass}
                      placeholder="e.g. rajesh@example.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                    />
                  </div>

                  {item.type === 'Material' && (
                    <div>
                      <label htmlFor="mat-qty" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                        Quantity Required
                      </label>
                      <input
                        id="mat-qty"
                        required
                        type="number"
                        min="1"
                        className={inputClass}
                        value={form.qty}
                        onChange={(e) => set('qty', Number(e.target.value))}
                      />
                    </div>
                  )}

                  {item.type === 'Equipment' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="eq-duration" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                          Duration (Days)
                        </label>
                        <input
                          id="eq-duration"
                          required
                          type="number"
                          min="1"
                          className={inputClass}
                          value={form.qty}
                          onChange={(e) => set('qty', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label htmlFor="eq-date" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                          Start Date
                        </label>
                        <input
                          id="eq-date"
                          required
                          type="date"
                          className={inputClass}
                          value={form.startDate}
                          onChange={(e) => set('startDate', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="user-message" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      {item.type === 'ServiceProvider' ? 'Describe your project / scope' : 'Additional Message (Optional)'}
                    </label>
                    <textarea
                      id="user-message"
                      className={`${inputClass} min-h-[90px]`}
                      placeholder={
                        item.type === 'ServiceProvider'
                          ? 'Provide details like plot size, location, blueprint draft, design preference...'
                          : 'Specific delivery instructions, timing, etc.'
                      }
                      value={form.message}
                      onChange={(e) => set('message', e.target.value)}
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-xs font-mono text-ochre-dark">
                      An error occurred while logging your request. Please try again or call us.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-teal py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-teal-dark disabled:opacity-60 cursor-pointer"
                  >
                    {status === 'sending' ? 'Sending request…' : 'Submit Marketplace Lead'}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-concrete">
                    <Phone className="h-3 w-3" /> Call callback guaranteed in 24 hours
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
