// Pixel-style SVG icons for the four damage types.
// Each draws on a 16x16 viewBox using `currentColor` so the parent can tint them.
function DamageIcon({ type, size = 14, color, title }) {
  const meta = ICONS[type]
  if (!meta) return null
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      style={{ color, display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      shapeRendering="crispEdges"
    >
      {title && <title>{title}</title>}
      {meta}
    </svg>
  )
}

const ICONS = {
  // KINETIC: bullet — small filled circle in a faded ring
  KINETIC: (
    <>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <rect x="6" y="6" width="4" height="4" fill="currentColor" />
    </>
  ),
  // PIERCING: arrow / dart pointing right
  PIERCING: (
    <>
      <rect x="2" y="7" width="9" height="2" fill="currentColor" />
      <polygon points="9,4 14,8 9,12" fill="currentColor" />
    </>
  ),
  // ENERGY: lightning bolt
  ENERGY: (
    <polygon
      points="9,1 4,8 7,8 5,15 12,7 8,7 11,1"
      fill="currentColor"
    />
  ),
  // EXPLOSIVE: starburst (4 spikes + center)
  EXPLOSIVE: (
    <>
      <polygon
        points="8,1 9,6 14,5 10,8 14,11 9,10 8,15 7,10 2,11 6,8 2,5 7,6"
        fill="currentColor"
      />
      <rect x="7" y="7" width="2" height="2" fill="#000" />
    </>
  )
}

export default DamageIcon
