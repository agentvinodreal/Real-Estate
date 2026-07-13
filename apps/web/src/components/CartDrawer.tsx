import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Trash2, ShoppingBag, Truck, User, MessageSquare, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { api } from '@carry/shared'
import { CONTACT } from '../lib/data'
import { EASE_OUT_EXPO } from '../lib/motion'

const inputClass =
  'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink placeholder:text-concrete focus:border-teal focus:outline-none'

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

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {status === 'done' ? (
                /* Success checkout view */
                <div className="space-y-6 text-center py-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <Check className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-display text-2xl font-bold text-ink">Order Placed</h4>
                    <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                      Your order request has been logged successfully. Click below to instantly send this receipt directly to our WhatsApp helpdesk for dispatch.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-ink/10">
                    <a
                      href={generateWhatsAppLink(form.name, form.address, form.startDate, lastOrderDetails)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 bg-[#25D366] py-4 font-mono text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#20ba59] cursor-pointer"
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      Complete on WhatsApp
                    </a>
                  </div>
                </div>
              ) : isCheckout ? (
                /* Checkout details form */
                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="chk-name" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="chk-name"
                      required
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Rajesh Kumar"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="chk-phone" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Phone Number
                    </label>
                    <input
                      id="chk-phone"
                      required
                      type="tel"
                      className={inputClass}
                      placeholder="e.g. 98765 43210"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="chk-email" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      id="chk-email"
                      type="email"
                      className={inputClass}
                      placeholder="e.g. rajesh@example.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="chk-address" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Delivery / Project Site Address
                    </label>
                    <textarea
                      id="chk-address"
                      required
                      className={`${inputClass} min-h-[70px]`}
                      placeholder="Enter the full location address where materials are to be shipped or services deployed..."
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="chk-date" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Tentative Start Date
                    </label>
                    <input
                      id="chk-date"
                      required
                      type="date"
                      className={inputClass}
                      value={form.startDate}
                      onChange={(e) => set('startDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="chk-msg" className="block font-mono text-[0.68rem] uppercase tracking-widest text-concrete mb-1.5">
                      Special Notes / Message (Optional)
                    </label>
                    <textarea
                      id="chk-msg"
                      className={`${inputClass} min-h-[70px]`}
                      placeholder="Specify material grades, worker experience needs, site timing limits, etc."
                      value={form.message}
                      onChange={(e) => set('message', e.target.value)}
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-xs font-mono text-ochre-dark">
                      An error occurred while confirming order. Please try again.
                    </p>
                  )}

                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsCheckout(false)}
                      className="flex-1 border border-ink/20 py-3.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-ink/5 cursor-pointer"
                    >
                      Back to Cart
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="flex-1 bg-teal py-3.5 font-mono text-xs uppercase tracking-wider text-bone transition-colors hover:bg-teal-dark disabled:opacity-60 cursor-pointer"
                    >
                      {status === 'sending' ? 'Processing…' : 'Place Order'}
                    </button>
                  </div>
                </form>
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
                <button
                  onClick={() => setIsCheckout(true)}
                  className="w-full bg-teal py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-bone transition-colors hover:bg-teal-dark cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
