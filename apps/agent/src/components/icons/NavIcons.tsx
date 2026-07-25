export function PropertiesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,3 21,10.5 3,10.5" fill="#E8871E" />
      <rect x="5" y="10.5" width="14" height="10" rx="1" fill="#FFF3DC" stroke="#1C1B18" strokeWidth="1" />
      <rect x="9.75" y="14.5" width="4.5" height="6" fill="#7A5230" />
      <rect x="6.5" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#4C6FFF" />
    </svg>
  )
}

export function ServicemenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 17a8 8 0 0 1 16 0z" fill="#FFC531" stroke="#1C1B18" strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="2" y="16.5" width="20" height="2.6" rx="1.3" fill="#E8871E" stroke="#1C1B18" strokeWidth="0.6" />
      <rect x="10.5" y="7.4" width="3" height="2.6" rx="0.8" fill="#2E3A40" />
    </svg>
  )
}

export function ShopsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l1.5-5h15L21 9z" fill="#1F9D82" stroke="#1C1B18" strokeWidth="0.6" strokeLinejoin="round" />
      <path
        d="M3 9h18v1a2 2 0 0 1-3.6 1.2A2 2 0 0 1 14 10a2 2 0 0 1-3.6 1.2A2 2 0 0 1 7 10a2 2 0 0 1-3.6 1.2A2 2 0 0 1 3 10z"
        fill="#FFF3DC"
        stroke="#1C1B18"
        strokeWidth="0.5"
      />
      <rect x="5" y="12.5" width="14" height="8" rx="0.5" fill="#FFFFFF" stroke="#1C1B18" strokeWidth="1" />
      <rect x="10" y="15" width="4" height="5.5" fill="#7A5230" />
    </svg>
  )
}

export function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="agent-profile-clip">
          <circle cx="12" cy="12" r="10" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="10" fill="#6C5CE7" />
      <g clipPath="url(#agent-profile-clip)">
        <circle cx="12" cy="9.5" r="3.2" fill="#FFF3DC" />
        <path d="M4 20c1-4 4-6.5 8-6.5s7 2.5 8 6.5" fill="#FFF3DC" />
      </g>
    </svg>
  )
}
