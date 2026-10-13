import { useTheme } from '../../contexts/ThemeContext.jsx'
import './AuthThemeToggle.css'

export default function AuthThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextThemeLabel = theme === 'dark' ? 'sáng' : 'tối'

  return (
    <button
      type="button"
      className="auth-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Chuyển sang giao diện ${nextThemeLabel}`}
      aria-pressed={theme === 'dark'}
      title={`Chuyển sang giao diện ${nextThemeLabel}`}
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
