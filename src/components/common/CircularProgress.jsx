import './CircularProgress.css'

export default function CircularProgress({ percentage = 0, size = 64, strokeWidth = 6, color = 'primary', label, sublabel }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const center = size / 2

  return (
    <div className="circular-progress">
      <div className="circular-progress__ring" style={{ width: size, height: size }}>
        <svg className="circular-progress__svg" width={size} height={size}>
          <circle
            className="circular-progress__track"
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--color-surface-container)"
            strokeWidth={strokeWidth}
          />
          <circle
            className={`circular-progress__fill circular-progress__fill--${color}`}
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="circular-progress__percentage">{percentage}%</span>
      </div>
      {(label || sublabel) && (
        <div className="circular-progress__text">
          {label && <p className="circular-progress__label text-label-md">{label}</p>}
          {sublabel && <p className="circular-progress__sublabel text-label-sm">{sublabel}</p>}
        </div>
      )}
    </div>
  )
}
