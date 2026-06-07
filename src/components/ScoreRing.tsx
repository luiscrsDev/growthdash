interface ScoreRingProps {
  score: number
  label: string
  size?: 'sm' | 'md'
}

export default function ScoreRing({ score, label, size = 'md' }: ScoreRingProps) {
  const dimensions = size === 'sm' ? 80 : 120
  const strokeWidth = size === 'sm' ? 6 : 8
  const radius = (dimensions - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 90
      ? '#4ade80'  // green
      : score >= 50
        ? '#fbbf24' // amber
        : '#ef4444' // red

  const bgRing =
    score >= 90
      ? 'rgba(74, 222, 128, 0.1)'
      : score >= 50
        ? 'rgba(251, 191, 36, 0.1)'
        : 'rgba(239, 68, 68, 0.1)'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dimensions, height: dimensions }}>
        <svg
          width={dimensions}
          height={dimensions}
          viewBox={`0 0 ${dimensions} ${dimensions}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke={bgRing}
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out',
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-mono font-bold ${size === 'sm' ? 'text-lg' : 'text-2xl'}`}
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>

      <span className={`font-mono text-gray-500 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
        {label}
      </span>
    </div>
  )
}
