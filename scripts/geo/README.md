# Globe geography data

`src/components/WorldGlobe.jsx` (the "Who am I" section) renders NASA's Blue Marble texture
(public domain, self-hosted in `public/images/earth/`, taken from the three-globe examples) and traces
Puerto Rico's shoreline from `src/data/puertoRicoCoast.json`: lat,lon pairs in thousandths of a
degree from Natural Earth's 10m land polygons (public domain).

`dots.mjs` is the generator. It also produces dot-grid tiers (used by an earlier, dotted version of the
globe); only the `coast` array is needed now:

```sh
curl -sL -o /tmp/land110.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
curl -sL -o /tmp/land10.geojson  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson
node scripts/geo/dots.mjs /tmp/land110.geojson /tmp/land10.geojson /tmp/world.json 1.35 0.18 0.035
node -e "const d=require('/tmp/world.json');require('fs').writeFileSync('src/data/puertoRicoCoast.json',JSON.stringify({coast:d.coast}))"
```
