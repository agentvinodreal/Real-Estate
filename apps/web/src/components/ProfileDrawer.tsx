import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, User, ShoppingBag, LogOut, Check } from 'lucide-react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { api } from '@carry/shared'
import { EASE_OUT_EXPO } from '../lib/motion'

type Props = {
  isOpen: boolean
  onClose: () => void
}

type OrderType = {
  id: string
  name: string
  phone: string
  email: string | null
  sourcePage: string | null
  propertyId: string | null
  projectId: string | null
  message: string | null
  status: string
  marketplaceType: string | null
  itemId: string | null
  itemQty: number | null
  createdAt: string
}

const inputClass =
  'w-full border border-ink/20 bg-bone px-3 py-2 text-sm text-ink placeholder:text-concrete focus:border-teal focus:outline-none'

export default function ProfileDrawer({ isOpen, onClose }: Props) {
  const { user, isLoaded: userLoaded } = useUser()
  const { signOut } = useClerk()
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Edit identity profile states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    }
  }, [user])

  // Fetch user orders when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      setLoadingOrders(true)
      api
        .listMyLeads()
        .then((res: any) => {
          setOrders(res.data || [])
        })
        .catch((err: any) => {
          console.error('Failed to load user orders:', err)
        })
        .finally(() => {
          setLoadingOrders(false)
        })
    }
  }, [isOpen, user])

  if (!userLoaded || !user) return null

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaveStatus('saving')
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Failed to update Clerk profile:', err)
      setSaveStatus('error')
    }
  }

  // Format date utility
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Identify order category
  const getOrderBadge = (o: OrderType) => {
    if (o.sourcePage === '/marketplace-cart') return 'Cart Order'
    if (o.marketplaceType) return `${o.marketplaceType} Inquiry`
    if (o.propertyId) return 'Property Enquiry'
    if (o.projectId) return 'Project Enquiry'
    return 'General Enquiry'
  }

  // Retrieve color for order category
  const getBadgeColor = (o: OrderType) => {
    if (o.sourcePage === '/marketplace-cart') return 'bg-teal-100 text-teal-800 border-teal-200'
    if (o.marketplaceType === 'Material') return 'bg-orange-100 text-orange-800 border-orange-200'
    if (o.marketplaceType === 'Equipment') return 'bg-blue-100 text-blue-800 border-blue-200'
    if (o.marketplaceType === 'ServiceProvider') return 'bg-purple-100 text-purple-800 border-purple-200'
    return 'bg-stone-100 text-stone-700 border-stone-200'
  }

  // Status mapping to readable text
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Pending Review'
      case 'contacted':
        return 'Contacted / Processing'
      case 'visit':
        return 'Scheduled / Dispatched'
      case 'closed':
        return 'Completed'
      default:
        return status
    }
  }

  // Status mapping to color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-ochre-dark bg-ochre/10 border-ochre/25'
      case 'contacted':
        return 'text-steel bg-steel/10 border-steel/25'
      case 'visit':
        return 'text-ink bg-ink/10 border-ink/25'
      case 'closed':
        return 'text-green-700 bg-green-50 border-green-200'
      default:
        return 'text-concrete bg-concrete/5 border-concrete/20'
    }
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
            className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full flex-col border-l border-ink/10 bg-bone-dim shadow-2xl sm:max-w-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-ochre" />
                <h3 className="font-display text-lg font-semibold text-ink">My Profile & Orders</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-concrete hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Profile Card & Management */}
              <div className="border border-ink/10 bg-bone p-5 shadow-xs">
                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-ink/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-dark font-display text-lg font-bold text-bone">
                    {firstName.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-ink text-base leading-tight">
                      {firstName} {lastName}
                    </h4>
                    <p className="font-mono text-xs text-concrete mt-0.5">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <h5 className="font-mono text-[0.68rem] uppercase tracking-widest text-concrete font-semibold mb-2">
                    Edit Personal Details
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="p-first" className="block font-mono text-[0.6rem] uppercase tracking-wider text-concrete mb-1">
                        First Name
                      </label>
                      <input
                        id="p-first"
                        type="text"
                        required
                        className={inputClass}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="p-last" className="block font-mono text-[0.6rem] uppercase tracking-wider text-concrete mb-1">
                        Last Name
                      </label>
                      <input
                        id="p-last"
                        type="text"
                        required
                        className={inputClass}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-concrete mb-1">
                      Primary Contact Info (Verified)
                    </span>
                    <div className="text-xs font-mono text-ink-soft bg-bone-dim p-2.5 border border-ink/5 space-y-1">
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="text-ink font-semibold">{user.primaryEmailAddress?.emailAddress}</span>
                      </div>
                      {user.primaryPhoneNumber && (
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span className="text-ink font-semibold">{user.primaryPhoneNumber.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 gap-4">
                    <button
                      type="submit"
                      disabled={saveStatus === 'saving'}
                      className="flex-1 bg-teal hover:bg-teal-dark text-bone py-2 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer flex justify-center items-center gap-1.5"
                    >
                      {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Saved
                        </>
                      ) : 'Save Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="border border-red-200 text-red-700 hover:bg-red-50/50 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                      title="Sign Out"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </div>
                  {saveStatus === 'error' && (
                    <p className="text-xs font-mono text-red-600">Failed to update details. Try again.</p>
                  )}
                </form>
              </div>

              {/* Order History */}
              <div>
                <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-ochre" />
                    <h4 className="font-display font-semibold text-ink text-base">My Order & Inquiry History</h4>
                  </div>
                  <span className="font-mono text-xs text-concrete bg-ink/5 px-2 py-0.5 rounded-full">
                    {orders.length} total
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="py-8 text-center">
                    <p className="font-mono text-xs text-concrete animate-pulse">Loading orders…</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 border border-dashed border-ink/10 text-center bg-bone p-6">
                    <p className="font-sans text-sm text-ink-soft">You haven't placed any orders yet.</p>
                    <p className="font-mono text-[0.65rem] text-concrete mt-1.5 uppercase tracking-wider">
                      Explore our materials & rentals catalog to begin
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="bg-bone border border-ink/10 p-4.5 shadow-xs hover:border-ink/20 transition-all space-y-3"
                      >
                        {/* Order Header: Category & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-block font-mono text-[0.55rem] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-semibold border ${getBadgeColor(o)}`}>
                            {getOrderBadge(o)}
                          </span>
                          <span className="font-mono text-[0.6rem] text-concrete">
                            {formatDate(o.createdAt)}
                          </span>
                        </div>

                        {/* Status bar */}
                        <div className="flex items-center justify-between border-t border-b border-ink/5 py-2 font-mono text-[0.65rem] uppercase tracking-wider">
                          <span className="text-concrete">Status:</span>
                          <span className={`px-2 py-0.5 rounded-sm font-semibold border ${getStatusColor(o.status)}`}>
                            {getStatusLabel(o.status)}
                          </span>
                        </div>

                        {/* Order Description details */}
                        <div className="text-xs text-ink-soft leading-relaxed font-sans">
                          {o.message && o.message.startsWith('[') ? (
                            <pre className="font-mono text-[0.68rem] bg-bone-dim/40 p-2.5 border border-ink/5 rounded-sm overflow-x-auto whitespace-pre-wrap max-h-[140px]">
                              {o.message.split('\n\nDelivery/Project')[0]}
                            </pre>
                          ) : (
                            <p className="italic text-ink-soft">"{o.message || 'No additional details provided'}"</p>
                          )}
                        </div>

                        {/* Subheading details if property/project */}
                        {o.sourcePage && o.sourcePage !== '/marketplace-cart' && (
                          <div className="font-mono text-[0.6rem] text-concrete tracking-wide uppercase flex items-center gap-1">
                            <span>Page:</span>
                            <span className="text-ink-soft">{o.sourcePage.replace('/properties/', '').replace('/construction/', '')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
