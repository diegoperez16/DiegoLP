/* The site's icons: one stroke weight, drawn — never a text glyph (iOS turns ↗ ▶ ✳ into emoji). */
const PATHS = {
  'arrow-up-right': 'M7 17 17 7M8 7h9v9',
  'arrow-down': 'M12 5v14M5 12l7 7 7-7',
  'arrow-up': 'M12 19V5M5 12l7-7 7 7',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M6 18 18 6',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
}
const FILLED = {
  play: 'M8 5.5v13l11-6.5Z',
  pause: 'M7 5h4v14H7ZM13 5h4v14h-4Z',
}

export default function Icon({ name, size = 16, className = '', ...props }) {
  const filled = FILLED[name]
  return (
    <svg className={`icon icon--${name} ${className}`.trim()} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={filled || PATHS[name]} />
    </svg>
  )
}
