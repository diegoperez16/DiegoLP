import { Environment } from '@react-three/drei'

/* Real studio reflections for the Blender materials: Poly Haven's "Studio Small 09" HDRI (CC0), halved to
   512 px for the web. Mount it inside a Suspense so the model shows before the map arrives. */
const HDRI = '/hdr/studio_small_09_512.hdr'

export function StudioEnvironment({ intensity = 0.4 }) {
  return <Environment files={HDRI} environmentIntensity={intensity} />
}
