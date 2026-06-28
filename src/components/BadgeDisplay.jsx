import { getBadgeInfo } from '../lib/badges'

export default function BadgeDisplay({ badgeIds = [], size = 'md' }) {
  if (!badgeIds || badgeIds.length === 0) return null

  const sizeClass = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'

  return (
    <div className="flex flex-wrap gap-2">
      {badgeIds.map(badgeId => {
        const badge = getBadgeInfo(badgeId)
        if (!badge) return null

        return (
          <div
            key={badgeId}
            className="group relative cursor-help"
            title={badge.description}
          >
            <span className={sizeClass}>{badge.emoji}</span>

            {/* Tooltip on hover */}
            <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
              <div className="font-bold">{badge.name}</div>
              <div className="text-gray-300">{badge.description}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
