import './StatCard.css'

export default function StatCard({ label, value, subtitle, icon, trend, color = 'primary', progress }) {
  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label text-label-md">{label}</span>
        <span className={`material-symbols-outlined stat-card__icon stat-card__icon--${color}`}>
          {icon}
        </span>
      </div>
      <div className="stat-card__value-row">
        <p className="stat-card__value text-headline-md">{value}</p>
        {trend && <span className={`stat-card__trend stat-card__trend--${color}`}>{trend}</span>}
      </div>
      {subtitle && <p className="stat-card__subtitle text-label-sm">{subtitle}</p>}
      {progress !== undefined && (
        <div className="stat-card__progress">
          <div
            className={`stat-card__progress-fill stat-card__progress-fill--${color}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
