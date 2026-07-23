import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { EASE_OUT_EXPO, fadeUpItem } from '../lib/motion'

/* ── Buttons ─────────────────────────────────────────────────────── */

const buttonVariants = {
  primary: 'bg-ink text-bone hover:bg-ochre-dark',
  accent: 'bg-teal text-bone hover:bg-teal-dark',
  outline: 'border border-ink/20 bg-bone text-ink hover:border-ochre hover:text-ochre-dark',
  ghost: 'text-ink-soft hover:text-ink',
  danger: 'border border-ink/20 bg-bone text-ink hover:border-red-400 hover:text-red-600',
}

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: keyof typeof buttonVariants
  busy?: boolean
  icon?: ReactNode
  children?: ReactNode
}

export function Button({ variant = 'primary', busy, icon, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
      disabled={disabled || busy}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors disabled:cursor-wait disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...rest}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} /> : icon}
      {children}
    </motion.button>
  )
}

export function IconButton({
  className = '',
  danger,
  ...rest
}: Omit<HTMLMotionProps<'button'>, 'children'> & { danger?: boolean; children?: ReactNode }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
      type="button"
      className={`flex h-7 w-7 cursor-pointer items-center justify-center border border-ink/10 text-concrete transition-colors disabled:cursor-wait disabled:opacity-40 ${
        danger ? 'hover:border-red-400 hover:text-red-600' : 'hover:border-ink hover:text-ink'
      } ${className}`}
      {...rest}
    />
  )
}

/* ── Card ────────────────────────────────────────────────────────── */

export function Card({ className = '', children, ...rest }: Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode }) {
  return (
    <motion.div
      variants={fadeUpItem}
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      className={`flex flex-col justify-between border border-ink/10 bg-bone p-5 transition-colors hover:border-ink/25 ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Wrap a grid of <Card>s in this to get an entrance stagger. */
export function CardGrid({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } } }}
      className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {children}
    </motion.div>
  )
}

/* ── Badge / status pill ─────────────────────────────────────────── */

const badgeTones = {
  ochre: 'border-ochre/30 bg-ochre/5 text-ochre-dark',
  teal: 'border-teal/30 bg-teal/5 text-teal',
  ink: 'border-ink/15 bg-ink/5 text-ink-soft',
  concrete: 'border-concrete/25 bg-concrete/5 text-concrete',
  steel: 'border-steel/30 bg-steel/5 text-steel',
}

export function Badge({ tone = 'ink', className = '', children }: { tone?: keyof typeof badgeTones; className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider ${badgeTones[tone]} ${className}`}>
      {children}
    </span>
  )
}

/** Clickable status toggle (available/approved vs. not) styled with brand tones instead of generic red/green. */
export function StatusToggle({ active, onClick, activeLabel, inactiveLabel }: { active: boolean; onClick: () => void; activeLabel: string; inactiveLabel: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider transition-colors ${
        active ? 'border-teal/30 bg-teal/5 text-teal hover:bg-teal/10' : 'border-ink/15 bg-ink/5 text-concrete hover:text-ink'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-teal' : 'bg-concrete'}`} />
      {active ? activeLabel : inactiveLabel}
    </motion.button>
  )
}

/* ── Page chrome ─────────────────────────────────────────────────── */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
    >
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-concrete">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </motion.div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border border-dashed border-ink/20 bg-bone-dim/30 p-10 text-center text-ink-soft"
    >
      {children}
    </motion.p>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3">
      <div className="h-24 w-56 max-w-full overflow-hidden border border-ink/10 bg-bone-dim/40">
        <div className="shimmer h-full w-full" />
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-concrete">{label}</p>
    </div>
  )
}

/* ── Form primitives ─────────────────────────────────────────────── */

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`mb-1 block font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete ${props.className ?? ''}`} />
}

const fieldClass = 'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink transition-colors focus:border-ochre focus:outline-none'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function FormPanel({ children, className = '', ...rest }: Omit<HTMLMotionProps<'form'>, 'children'> & { children?: ReactNode }) {
  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      className={`overflow-hidden border border-ink/10 bg-bone-dim/40 ${className}`}
      {...rest}
    >
      <div className="p-6">{children}</div>
    </motion.form>
  )
}

/* ── Detail modal (read-only "View" overlay) ─────────────────────── */

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <Label className="mb-0.5">{label}</Label>
      <span className="text-sm text-ink">{value}</span>
    </div>
  )
}

/** Read-only overlay used by "View" buttons to preview a record without leaving the admin panel. */
export function DetailModal({
  title,
  imageUrl,
  imageAlt,
  badge,
  onClose,
  children,
}: {
  title: string
  imageUrl?: string | null
  imageAlt: string
  badge?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-ink/15 bg-bone shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} className="h-56 w-full border-b border-ink/10 object-cover" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center border-b border-ink/10 bg-bone-dim">
            <span className="font-mono text-xs uppercase tracking-wider text-concrete">No Image Provided</span>
          </div>
        )}
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
            {badge}
          </div>
          <div className="grid grid-cols-2 gap-4">{children}</div>
          <Button variant="outline" onClick={onClose} className="mt-6 w-full">
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
