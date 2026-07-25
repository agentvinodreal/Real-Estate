import { NavLink } from 'react-router-dom'
import { PropertiesIcon, ServicemenIcon, ShopsIcon, ProfileIcon } from './icons/NavIcons'

const tabs = [
  { to: '/properties/new', Icon: PropertiesIcon, label: 'Properties' },
  // { to: '/projects/new',   icon: '🏗',  label: 'Projects' },
  { to: '/labour/new',     Icon: ServicemenIcon, label: 'Servicemen' },
  { to: '/shops/new',      Icon: ShopsIcon, label: 'Shops' },
  { to: '/profile',        Icon: ProfileIcon, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-item-icon" aria-hidden>
            <tab.Icon />
          </span>
          <span className="nav-item-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
