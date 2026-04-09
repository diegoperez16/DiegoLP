import { Environment, Stars } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export function MidnightVinylBackground() {
  const { scene } = useThree()

  // Explicitly clear the background so it becomes transparent again, 
  // ensuring CSS backgrounds and shooting stars show through.
  useEffect(() => {
    const prevBg = scene.background
    scene.background = null
    return () => {
      scene.background = prevBg
    }
  }, [scene])

  return (
    <>
      <fog attach="fog" args={['#090913', 10, 26]} />
      <Environment preset="night" environmentIntensity={0.12} />
      <Stars radius={10} depth={50} count={6000} factor={5} saturation={0.3} fade speed={1} />
    </>
  )
}
