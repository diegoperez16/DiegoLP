import { MidnightVinylBackground } from '../components/simulator-backgrounds/MidnightVinylBackground'
import { SunriseLoftBackground } from '../components/simulator-backgrounds/SunriseLoftBackground'
import { BeachVibesBackground } from '../components/simulator-backgrounds/BeachVibesBackground'

export const SIMULATOR_BACKGROUND_STORAGE_KEY = 'portfolio:simulator-background'
export const DEFAULT_SIMULATOR_BACKGROUND_ID = 'midnight-vinyl'

export const SIMULATOR_BACKGROUNDS = [
  {
    id: 'midnight-vinyl',
    label: 'Midnight Vinyl',
    description: 'The original starfield scene with the late-night neon glow.',
    showShootingStars: true,
    shellTheme: {
      appBackground: 'radial-gradient(ellipse at bottom, #161129 0%, #050508 100%)',
      ambientOverlay: [
        'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)',
        'radial-gradient(circle at 10% 90%, rgba(255, 255, 255, 0.015) 0%, transparent 30%)',
        'radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)',
      ].join(', '),
      sceneGlow: '#7c3aed20',
      orbColor: 'rgba(124, 58, 237, 0.18)',
    },
    SceneBackdrop: MidnightVinylBackground,
  },
  {
    id: 'sunrise-loft',
    label: 'Sunrise Loft',
    description: 'A warmer showroom backdrop with an early-morning sky.',
    showShootingStars: false,
    shellTheme: {
      appBackground: 'radial-gradient(circle at top, #5a3543 0%, #1f1821 42%, #0b0a10 100%)',
      ambientOverlay: [
        'radial-gradient(circle at 18% 18%, rgba(255, 184, 108, 0.14) 0%, transparent 30%)',
        'radial-gradient(circle at 82% 24%, rgba(246, 120, 116, 0.12) 0%, transparent 28%)',
        'radial-gradient(circle at 50% 82%, rgba(255, 236, 195, 0.06) 0%, transparent 36%)',
      ].join(', '),
      sceneGlow: '#ff9a5c22',
      orbColor: 'rgba(255, 156, 92, 0.2)',
    },
    SceneBackdrop: SunriseLoftBackground,
  },
  {
    id: 'beach-vibes',
    label: 'Beach Vibes',
    description: 'A sunny beach setting with animated waves and ocean breeze.',
    showShootingStars: false,
    shellTheme: {
      appBackground: [
        'radial-gradient(circle at 52% 18%, rgba(255, 229, 176, 0.28) 0%, rgba(255, 229, 176, 0) 18%)',
        'linear-gradient(180deg, #0f5f7c 0%, #58b6d3 24%, #d4eef4 44%, #f1d8b5 63%, #b9865a 100%)',
      ].join(', '),
      ambientOverlay: [
        'radial-gradient(circle at 20% 22%, rgba(255, 243, 214, 0.12) 0%, transparent 26%)',
        'radial-gradient(circle at 78% 68%, rgba(23, 126, 158, 0.16) 0%, transparent 34%)',
        'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 28%, rgba(0, 69, 102, 0.06) 100%)',
      ].join(', '),
      sceneGlow: '#52bfd933',
      orbColor: 'rgba(255, 195, 128, 0.22)',
    },
    SceneBackdrop: BeachVibesBackground,
  },
]

export function isValidSimulatorBackgroundId(id) {
  return SIMULATOR_BACKGROUNDS.some((background) => background.id === id)
}

export function getSimulatorBackgroundById(id) {
  return SIMULATOR_BACKGROUNDS.find((background) => background.id === id) ?? SIMULATOR_BACKGROUNDS[0]
}
