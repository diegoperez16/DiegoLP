import { Environment, Sky } from '@react-three/drei'

export function SunriseLoftBackground() {
  return (
    <>
      <color attach="background" args={['#160d13']} />
      <fog attach="fog" args={['#28171c', 12, 30]} />
      <Environment preset="dawn" environmentIntensity={0.18} />
      <Sky
        distance={450000}
        sunPosition={[6, 1.5, -8]}
        turbidity={5}
        rayleigh={0.65}
        mieCoefficient={0.006}
        mieDirectionalG={0.88}
      />
    </>
  )
}
