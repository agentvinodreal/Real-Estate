import { NavLink } from 'react-router-dom'
import { PropertiesIcon, ServicemenIcon, ShopsIcon, AgentsIcon } from './icons/NavIcons'

const navItems = [
  { to: '/properties', Icon: PropertiesIcon, label: 'Properties' },
  // { to: '/projects',   icon: '🏗',  label: 'Projects' },
  { to: '/labour',     Icon: ServicemenIcon, label: 'Servicemen' },
  { to: '/shops',      Icon: ShopsIcon, label: 'Shops' },
  { to: '/agents',     Icon: AgentsIcon, label: 'Agents' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <span className="sidebar-title-mobile">Carry Admin</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            &times;
          </button>
        </div>
        <div className="sidebar-section-label">Inbox</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-icon" aria-hidden>
              <item.Icon />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </aside>
    </>
  )
}
