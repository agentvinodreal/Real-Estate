import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X, ChevronDown, Filter } from 'lucide-react'

/**
 * Animated search bar and dropdown menu selector shared by marketplace tabs.
 * Allows searching by free-text and/or selecting specific roles/categories
 * directly from a dropdown menu option.
 */
export default function MarketplaceSearch({
  value,
  onChange,
  suggestions,
  placeholder,
  selectedCategory = '',
  onSelectCategory,
  categoryOptions = [],
  selectLabel = 'All Categories',
}: {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder: string
  selectedCategory?: string
  onSelectCategory?: (category: string) => void
  categoryOptions?: string[]
  selectLabel?: string
}) {
  const [focused, setFocused] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return suggestions.filter((o) => o.toLowerCase().startsWith(q) && o.toLowerCase() !== q).slice(0, 6)
  }, [value, suggestions])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const open = focused && matches.length > 0

  return (
    <div ref={rootRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
      {/* Search Input Bar */}
      <div className="relative flex-1">
        <div
          className={`flex items-center gap-3 border bg-bone px-4 py-3 transition-all duration-300 ${
            focused
              ? 'border-teal shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-teal)_12%,transparent)]'
              : 'border-ink/15 hover:border-ink/30'
          }`}
        >
          <motion.span
            animate={{ color: focused ? 'var(--color-teal)' : 'var(--color-concrete)', rotate: focused ? -8 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex shrink-0"
          >
            <Search className="h-4 w-4" strokeWidth={2} />
          </motion.span>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-transparent text-sm text-ink placeholder:text-concrete focus:outline-none"
          />

          <AnimatePresence>
            {value && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                onClick={() => onChange('')}
                className="shrink-0 cursor-pointer text-concrete transition-colors hover:text-ink"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-20 mt-1.5 w-full overflow-hidden border border-ink/15 bg-bone shadow-lg"
            >
              {matches.map((opt, i) => (
                <motion.li
                  key={opt}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.02 }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(opt)
                    setFocused(false)
                  }}
                  className="cursor-pointer px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-teal/10"
                >
                  {opt}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown Menu Select Option */}
      {onSelectCategory && categoryOptions.length > 0 && (
        <div className="relative min-w-[220px] shrink-0">
          <div className="relative flex items-center border border-ink/15 bg-bone hover:border-teal transition-colors">
            <span className="absolute left-3 text-concrete pointer-events-none">
              <Filter className="h-3.5 w-3.5" />
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full appearance-none bg-transparent py-3 pl-9 pr-9 font-mono text-xs uppercase tracking-wider text-ink focus:outline-none cursor-pointer"
            >
              <option value="">{selectLabel}</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat} className="bg-bone text-ink py-1">
                  {cat}
                </option>
              ))}
            </select>
            <span className="absolute right-3 text-concrete pointer-events-none">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

