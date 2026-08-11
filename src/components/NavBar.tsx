import ThemeSwitcher from './ThemeSwitcher'
import type { ThemeMode, ResolvedTheme } from '../hooks/useTheme'

interface NavBarProps {
  activeTab: 'order' | 'eat' | 'drink'
  onTabChange: (tab: 'order' | 'eat' | 'drink') => void
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  onThemeChange: (mode: ThemeMode) => void
}

function NavBar({ activeTab, onTabChange, themeMode, resolvedTheme, onThemeChange }: NavBarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-tabs">
          <button
            className={`navbar-tab${activeTab === 'order' ? ' active' : ''}`}
            onClick={() => onTabChange('order')}
          >
            点餐
          </button>
          <button
            className={`navbar-tab${activeTab === 'eat' ? ' active' : ''}`}
            onClick={() => onTabChange('eat')}
          >
            吃什么
          </button>
          <button
            className={`navbar-tab${activeTab === 'drink' ? ' active' : ''}`}
            onClick={() => onTabChange('drink')}
          >
            喝什么
          </button>
        </div>
        <div className="navbar-actions">
          <ThemeSwitcher mode={themeMode} resolvedTheme={resolvedTheme} onChange={onThemeChange} />
        </div>
      </div>
    </nav>
  )
}

export default NavBar
