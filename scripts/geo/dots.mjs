// Rasterise Natural Earth land polygons (public domain) into dot grids for the globe:
//   node scripts/geo/dots.mjs <110m land.geojson> <10m land.geojson> <out.json> [coarseStep] [fineStep]
// The coarse grid covers the world; the fine grid covers the Caribbean so Puerto Rico reads when zoomed in.
import { readFileSync, writeFileSync } from 'node:fs'

function loadRings(path) {
  const geo = JSON.parse(readFileSync(path, 'utf8'))
  const rings = []
  for (const f of geo.features) {
    const g = f.geometry
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
    for (const poly of polys) {
      const box = [Infinity, Infinity, -Infinity, -Infinity]
      for (const [x, y] of poly[0]) { if (x < box[0]) box[0] = x; if (y < box[1]) box[1] = y; if (x > box[2]) box[2] = x; if (y > box[3]) box[3] = y }
      rings.push({ poly, box })
    }
  }
  return rings
}
function inRing(ring, x, y) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function onLand(rings, lon, lat) {
  for (const { poly, box } of rings) {
    if (lon < box[0] || lon > box[2] || lat < box[1] || lat > box[3]) continue
    if (!inRing(poly[0], lon, lat)) continue
    let hole = false
    for (let k = 1; k < poly.length; k++) if (inRing(poly[k], lon, lat)) { hole = true; break }
    if (!hole) return true
  }
  return false
}
function grid(rings, step, bounds, exclude) {
  const out = []
  for (let lat = bounds.lat0; lat <= bounds.lat1; lat += step) {
    const cols = Math.max(1, Math.round(360 / step * Math.cos(lat * Math.PI / 180)))
    for (let c = 0; c < cols; c++) {
      const lon = -180 + (c + 0.5) * 360 / cols
      if (lon < bounds.lon0 || lon > bounds.lon1) continue
      if (exclude && lon >= exclude.lon0 && lon <= exclude.lon1 && lat >= exclude.lat0 && lat <= exclude.lat1) continue
      if (onLand(rings, lon, lat)) out.push(Math.round(lat * 10), Math.round(lon * 10))
    }
  }
  return out
}

const [coarsePath, finePath, outPath, coarseStepArg, fineStepArg, islandStepArg] = process.argv.slice(2)
const coarseStep = Number(coarseStepArg || 1.35)
const fineStep = Number(fineStepArg || 0.18)
const islandStep = Number(islandStepArg || 0.035)
const REGION = { lat0: -3, lat1: 33, lon0: -100, lon1: -54 }   // Caribbean and its shores, wide enough that the coarse grid stays out of the close-up
const ISLAND = { lat0: 17.85, lat1: 18.55, lon0: -67.35, lon1: -65.2 }   // Puerto Rico with Mona, Vieques and Culebra
const rings10 = loadRings(finePath)
const coarse = grid(loadRings(coarsePath), coarseStep, { lat0: -88, lat1: 88, lon0: -180, lon1: 180 }, REGION)
const fine = grid(rings10, fineStep, REGION, ISLAND)
const island = grid(rings10, islandStep, ISLAND)
// Puerto Rico's coastline as a polyline (the 10m ring containing Mayagüez), thinned to keep the file small.
const home = rings10.find(({ poly }) => inRing(poly[0], -67.14, 18.2))
const ring = home.poly[0]
const keepEvery = Math.max(1, Math.floor(ring.length / 420))
const coast = []
for (let i = 0; i < ring.length; i += keepEvery) coast.push(Math.round(ring[i][1] * 1000), Math.round(ring[i][0] * 1000))
coast.push(coast[0], coast[1])
writeFileSync(outPath, JSON.stringify({
  note: 'Natural Earth land (public domain) rasterised to dot grids; `dots` (world, coarse), `fine` (Caribbean) and `island` (Puerto Rico) are lat,lon in tenths of a degree, interleaved; `coast` is Puerto Rico\'s shoreline as lat,lon in thousandths of a degree.',
  coarseStep, fineStep, islandStep, region: REGION, island: ISLAND, dots: coarse, fine, islandDots: island, coast,
}))
console.log('coarse', coarse.length / 2, 'fine', fine.length / 2, 'island', island.length / 2, 'coast points', coast.length / 2)
