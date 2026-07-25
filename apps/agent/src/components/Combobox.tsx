import { useEffect, useMemo, useRef, useState } from 'react'

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  required?: boolean
}

/**
 * Free-text input with a typeahead suggestion list. Suggestions only appear once
 * the user has typed something and are limited to options whose label starts with
 * that text — the full option list is never dumped into view at once. The field
 * stays a plain editable input underneath, so typing anything not in the list is
 * still accepted.
 */
export function Combobox({ value, onChange, options, placeholder, required }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return options.filter((o) => o.toLowerCase().startsWith(q)).slice(0, 8)
  }, [value, options])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  return (
    <div ref={rootRef} className="combobox">
      <input
        type="text"
        className="form-input"
        required={required}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open && matches.length > 0 && (
        <ul className="combobox-dropdown">
          {matches.map((opt) => (
            <li
              key={opt}
              className="combobox-option"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt)
                setOpen(false)
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
