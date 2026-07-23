import { useState, type FormEvent, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Trash2,
  ShoppingBag,
  Truck,
  User,
  MessageSquare,
  Check,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { api } from '@carry/shared'
import { CONTACT } from '../lib/data'
import { EASE_OUT_EXPO } from '../lib/motion'

const inputClass =
  'w-full rounded-lg border border-ink/15 bg-bone py-3 pl-11 pr-3.5 text-sm text-ink placeholder:text-concrete/60 transition-all duration-200 hover:border-ink/25 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10'

const fieldContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const fieldItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
}

function Field({
  id,
  label,
  icon: Icon,
  optional,
  multiline,
  children,
}: {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  optional?: boolean
  multiline?: boolean
  children: ReactNode
}) {
  return (
    <motion.div variants={fieldItemVariants}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 font-mono text-[0.68rem] uppercase tracking-widest text-concrete">
        {label}
        {optional && <span className="lowercase tracking-normal text-concrete/60">(optional)</span>}
      </label>
      <div className="group relative">
        <Icon
          className={`pointer-events-none absolute left-3.5 h-4 w-4 text-concrete transition-colors duration-200 group-focus-within:text-teal ${
            multiline ? 'top-3.5' : 'top-1/2 -translate-y-1/2'
          }`}
        />
        {children}
      </div>
    </motion.div>
  )
}

export default function CartDrawer() {
  const {
    items,
    isOpen,
    setIsOpen,
    removeFromCart,
    updateQuantity,
    updateDuration,
    cartSubtotal,
    clearCart,
  } = useCart()

  const [isCheckout, setIsCheckout] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', startDate: '', message: '' })
  const [lastOrderDetails, setLastOrderDetails] = useState<string>('')

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Pre-fill WhatsApp message based on checkout details and cart items
  const generateWhatsAppLink = (customerName: string, address: string, date: string, orderText: string) => {
    const text = `Hi Carry Construction, I'd like to place an order:

${orderText}

Customer Details:
Name: ${customerName}
Delivery/Project Address: ${address}
Tentative Start Date: ${date}

Please confirm availability and final quote.`
    return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')

    // Formulate a beautiful summary of the cart items for the lead database record and WhatsApp
    const buyList: string[] = []
    const rentList: string[] = []
    const hireList: string[] = []

    items.forEach((item) => {
      const lineTotal = item.price * item.qty * (item.duration ?? 1)
      const formattedTotal = `₹${lineTotal.toLocaleString('en-IN')}`

      if (item.type === 'Material') {
        buyList.push(`- ${item.name} (${item.qty} ${item.unit}) [Est: ${formattedTotal}]`)
      } else if (item.type === 'Equipment') {
        rentList.push(`- ${item.name} [Qty: ${item.qty}] for ${item.duration} day(s) [Est: ${formattedTotal}]`)
      } else if (item.type === 'ServiceProvider') {
        hireList.push(`- ${item.name} (${item.qty} servicemen) for ${item.duration} day(s) [Est: ${formattedTotal}]`)
      }
    })

    let orderBreakdown = ''
    if (buyList.length > 0) orderBreakdown += `[BUY RAW MATERIALS]\n${buyList.join('\n')}\n\n`
    if (rentList.length > 0) orderBreakdown += `[RENT EQUIPMENT]\n${rentList.join('\n')}\n\n`
    if (hireList.length > 0) orderBreakdown += `[HIRE SERVICEMEN]\n${hireList.join('\n')}\n\n`
    orderBreakdown += `Estimated Subtotal: ₹${cartSubtotal.toLocaleString('en-IN')}`

    try {
      // 1. Save lead to Neon PostgreSQL DB
      await api.createLead({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        message: `${orderBreakdown}\n\nDelivery/Project Address: ${form.address}\nStart Date: ${form.startDate}\nNotes: ${form.message}`,
        sourcePage: '/marketplace-cart',
      })

      // Store order summary for final screen
      setLastOrderDetails(orderBreakdown)
      setStatus('done')
      clearCart() // empty cart after successful db save
    } catch {
      setStatus('error')
    }
  }

  function handleClose() {
    setIsOpen(false)
    // reset checkout state if closed
    setTimeout(() => {
      setIsCheckout(false)
      setStatus('idle')
    }, 300)
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
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-teal-dark/45 backdrop-blur-sm"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full flex-col border-l border-ink/10 bg-bone-dim shadow-2xl sm:max-w-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h3 className="font-display text-lg font-semibold text-ink">
                {status === 'done' ? 'Order Successful' : isCheckout ? 'Checkout Details' : `Your Shopping Cart (${items.length})`}
              </h3>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-concrete hover:bg-ink/5 hover:text-ink transition-colors"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Stepper */}
            {(items.length > 0 || status === 'done') && (
              <div className="flex items-center gap-2 border-b border-ink/10 bg-bone px-6 py-4">
                {[
                  { label: 'Cart', icon: ShoppingBag },
                  { label: 'Details', icon: ClipboardList },
                  { label: 'Confirm', icon: CheckCircle2 },
                ].map((s, i) => {
                  const step = status === 'done' ? 2 : isCheckout ? 1 : 0
                  const active = i <= step
                  return (
                    <div key={s.label} className="flex flex-1 items-center gap-2 last:flex-none">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{
                            backgroundColor: active ? 'var(--color-teal)' : 'transparent',
                            borderColor: active ? 'var(--color-teal)' : 'var(--color-ink)',
                            color: active ? 'var(--color-bone)' : 'var(--color-concrete)',
                          }}
                          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                          style={{ borderColor: active ? 'var(--color-teal)' : 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
                        >
                          {i < step ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                        </motion.div>
                        <span
                          className={`hidden font-mono text-[0.62rem] uppercase tracking-widest sm:inline ${
                            active ? 'text-ink' : 'text-concrete/60'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className="relative h-px flex-1 overflow-hidden bg-ink/10">
                          <motion.div
                            initial={false}
                            animate={{ width: i < step ? '100%' : '0%' }}
                            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                            className="absolute inset-y-0 left-0 bg-teal"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {status === 'done' ? (
                /* Success checkout view */
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={fieldContainerVariants}
                  className="space-y-6 py-8 text-center"
                >
                  <motion.div
                    variants={fieldItemVariants}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal"
                  >
                    <Check className="h-8 w-8" />
                  </motion.div>
                  <motion.div variants={fieldItemVariants}>
                    <h4 className="font-display text-2xl font-bold text-ink">Order Placed</h4>
                    <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                      Your order request has been logged successfully. Click below to instantly send this receipt directly to our WhatsApp helpdesk for dispatch.
                    </p>
                  </motion.div>

                  <motion.div variants={fieldItemVariants} className="border-t border-ink/10 pt-6">
                    <motion.a
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      href={generateWhatsAppLink(form.name, form.address, form.startDate, lastOrderDetails)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-4 font-mono text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#20ba59] cursor-pointer"
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      Complete on WhatsApp
                    </motion.a>
                  </motion.div>
                </motion.div>
              ) : isCheckout ? (
                /* Checkout details form */
                <motion.form
                  onSubmit={onSubmit}
                  variants={fieldContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-5"
                >
                  <Field id="chk-name" label="Full Name" icon={User}>
                    <input
                      id="chk-name"
                      required
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Rajesh Kumar"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                    />
                  </Field>

                  <Field id="chk-phone" label="Phone Number" icon={Phone}>
                    <input
                      id="chk-phone"
                      required
                      type="tel"
                      className={inputClass}
                      placeholder="e.g. 98765 43210"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                    />
                  </Field>

                  <Field id="chk-email" label="Email Address" icon={Mail} optional>
                    <input
                      id="chk-email"
                      type="email"
                      className={inputClass}
                      placeholder="e.g. rajesh@example.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                    />
                  </Field>

                  <Field id="chk-address" label="Delivery / Project Site Address" icon={MapPin} multiline>
                    <textarea
                      id="chk-address"
                      required
                      className={`${inputClass} min-h-[76px] resize-none`}
                      placeholder="Enter the full location address where materials are to be shipped or services deployed..."
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                    />
                  </Field>

                  <Field id="chk-date" label="Tentative Start Date" icon={CalendarDays}>
                    <input
                      id="chk-date"
                      required
                      type="date"
                      className={inputClass}
                      value={form.startDate}
                      onChange={(e) => set('startDate', e.target.value)}
                    />
                  </Field>

                  <Field id="chk-msg" label="Special Notes / Message" icon={MessageSquare} optional multiline>
                    <textarea
                      id="chk-msg"
                      className={`${inputClass} min-h-[76px] resize-none`}
                      placeholder="Specify material grades, worker experience needs, site timing limits, etc."
                      value={form.message}
                      onChange={(e) => set('message', e.target.value)}
                    />
                  </Field>

                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg bg-ochre-dark/10 px-3 py-2 text-xs font-mono text-ochre-dark"
                      >
                        An error occurred while confirming order. Please try again.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.div variants={fieldItemVariants} className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCheckout(false)}
                      className="flex-1 rounded-lg border border-ink/20 py-3.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-ink/5 cursor-pointer"
                    >
                      Back to Cart
                    </button>
                    <motion.button
                      type="submit"
                      disabled={status === 'sending'}
                      whileHover={{ scale: status === 'sending' ? 1 : 1.015 }}
                      whileTap={{ scale: status === 'sending' ? 1 : 0.98 }}
                      className="group flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal py-3.5 font-mono text-xs uppercase tracking-wider text-bone transition-colors hover:bg-teal-dark disabled:opacity-60 cursor-pointer"
                    >
                      {status === 'sending' ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            className="h-3.5 w-3.5 rounded-full border-2 border-bone/40 border-t-bone"
                          />
                          Processing…
                        </>
                      ) : (
                        <>
                          Place Order
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.form>
              ) : items.length === 0 ? (
                /* Empty state */
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <div className="blueprint aspect-square w-16 flex items-center justify-center border border-ink/10 text-concrete/40">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h4 className="mt-4 font-display text-lg font-bold text-ink">Your cart is empty</h4>
                  <p className="mt-2 text-xs text-ink-soft max-w-[240px]">
                    Go to the Marketplace, choose what you need, and add them here to order.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 border border-ink/20 px-5 py-2 font-mono text-xxs uppercase tracking-wider text-ink hover:bg-ink/5"
                  >
                    Start Browsing
                  </button>
                </div>
              ) : (
                /* Cart item list */
                <div className="space-y-6">
                  {items.map((item) => {
                    const lineTotal = item.price * item.qty * (item.duration ?? 1)

                    return (
                      <div key={item.id} className="flex gap-4 border border-ink/10 bg-bone p-4">
                        {/* Icon Block */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-bone-dim border border-ink/10 text-concrete">
                          {item.type === 'Material' && <ShoppingBag className="h-5 w-5 text-ochre-dark" />}
                          {item.type === 'Equipment' && <Truck className="h-5 w-5 text-ochre-dark" />}
                          {item.type === 'ServiceProvider' && <User className="h-5 w-5 text-ochre-dark" />}
                        </div>

                        {/* Details Block */}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <span className="font-mono text-[0.58rem] uppercase tracking-wider text-concrete">
                                {item.roleOrCategory}
                              </span>
                              <h4 className="font-display text-sm font-bold text-ink mt-0.5">{item.name}</h4>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-concrete hover:text-ochre-dark transition-colors cursor-pointer self-start"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-ink/5 pt-3">
                            <div className="flex items-center gap-2">
                              {/* Quantity inputs based on item types */}
                              {item.type === 'Material' && (
                                <div className="flex items-center border border-ink/20">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.qty - 1)}
                                    className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                  >
                                    -
                                  </button>
                                  <span className="px-2.5 font-mono text-xs text-ink">{item.qty}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                                    className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {item.type === 'Equipment' && (
                                <div className="flex items-center border border-ink/20">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.qty - 1)}
                                    className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                  >
                                    -
                                  </button>
                                  <span className="px-2.5 font-mono text-xs text-ink">{item.qty}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                                    className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {item.type === 'ServiceProvider' && (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center border border-ink/20">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.qty - 1)}
                                      className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                    >
                                      -
                                    </button>
                                    <span className="px-2.5 font-mono text-xs text-ink">{item.qty}</span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.qty + 1)}
                                      className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="font-mono text-[0.62rem] text-concrete">Workers</span>
                                </div>
                              )}

                              {/* Duration controls for Equipment and Servicemen */}
                              {item.duration !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center border border-ink/20">
                                    <button
                                      onClick={() => updateDuration(item.id, item.duration! - 1)}
                                      className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                    >
                                      -
                                    </button>
                                    <span className="px-2.5 font-mono text-xs text-ink">{item.duration}</span>
                                    <button
                                      onClick={() => updateDuration(item.id, item.duration! + 1)}
                                      className="px-2 py-0.5 font-mono text-xs hover:bg-ink/5"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="font-mono text-[0.62rem] text-concrete">Days</span>
                                </div>
                              )}
                            </div>

                            <span className="font-mono text-xs font-bold text-ink">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && !isCheckout && status !== 'done' && (
              <div className="border-t border-ink/10 bg-bone p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs uppercase tracking-wider text-concrete">Estimated Subtotal</span>
                  <span className="font-display text-xl font-bold text-teal">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="font-mono text-[0.58rem] tracking-wider text-concrete uppercase">
                  * Final pricing including taxes and transportation will be confirmed on call.
                </p>
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCheckout(true)}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-bone transition-colors hover:bg-teal-dark cursor-pointer"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
