interface StreakRingProps {
  progress: number // 0-1
  streakDays: number
  size?: number
  status: 'on-track' | 'at-risk' | 'broken'
  onClick?: () => void
  label?: string
}

const STATUS_COLORS = {
  'on-track': 'text-emerald-500',
  'at-risk': 'text-yellow-500',
  'broken': 'text-red-500',
}

const STATUS_TRACK_COLORS = {
  'on-track': 'text-emerald-500/20',
  'at-risk': 'text-yellow-500/20',
  'broken': 'text-red-500/20',
}

export function StreakRing({ progress, streakDays, size = 40, status, onClick, label }: StreakRingProps) {
  const strokeWidth = size > 48 ? 4 : 3
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const dashArray = `${Math.min(progress, 1) * circumference} ${circumference}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ width: size, height: size }}
      disabled={!onClick}
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={STATUS_TRACK_COLORS[status]}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          className={`${STATUS_COLORS[status]} transition-all duration-600 ease-out`}
        />
      </svg>
      <span className="absolute text-[10px] font-bold leading-none">
        {label ?? streakDays}
      </span>
    </button>
  )
}
