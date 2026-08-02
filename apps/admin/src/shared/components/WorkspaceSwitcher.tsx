import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { EASE_OUT_EXPO } from '../lib/motion'

/**
 * Toggles between the two halves of the panel. They are genuinely separate
 * systems — different API, database and Cloudinary cloud — and each has its own
 * Properties and Projects pages, so the switcher is what makes it unambiguous
 * which one you are editing.
 */
export const WORKSPACES = [
  { key: 'website', label: 'Website', home: '/' },
  { key: 'fieldops', label: 'Field Ops', home: '/field-ops/properties' },
] as const

export function useWorkspace(): 'website' | 'fieldops' {
  const { pathname } = useLocation()
  return pathname.startsWith('/field-ops') ? 'fieldops' : 'website'
}

export default function WorkspaceSwitcher() {
  const active = useWorkspace()
  const navigate = useNavigate()

  return (
    <div className="flex border border-ink/15 bg-bone p-0.5" role="tablist" aria-label="Workspace">
      {WORKSPACES.map((w) => {
        const isActive = w.key === active
        return (
          <button
            key={w.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => !isActive && navigate(w.home)}
            className={`relative cursor-pointer px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] transition-colors ${
              isActive ? 'text-ink' : 'text-concrete hover:text-ink'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="workspace-active"
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className="absolute inset-0 bg-ochre/20"
              />
            )}
            <span className="relative">{w.label}</span>
          </button>
        )
      })}
    </div>
  )
}
