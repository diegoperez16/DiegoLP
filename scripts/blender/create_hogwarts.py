"""Model an original castle-on-the-cliff scene with a scarlet express crossing a viaduct.

  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/blender/create_hogwarts.py -- [--render]

Everything is generated from primitives, curves and a procedurally displaced
low-poly terrain: no downloaded meshes, textures, HDRIs or film assets. The
silhouette is Diego's own stylised take on a highland castle and a steam train,
not a reproduction of any existing design.

The gorge runs along X, the viaduct spans it, and the train drives along X so
the web runtime only has to move one node.
"""

import json
import sys
from math import atan2, ceil, cos, floor, pi, radians, sin
from pathlib import Path

import bpy

sys.path.append(str(Path(__file__).resolve().parent))
from common import (Builder, area_light, camera, collection, export_glb, join_groups,  # noqa: E402
                    material, reset_scene, triangle_count, y_up)

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / 'public' / 'models'
IMAGES = ROOT / 'public' / 'images'
MODELS.mkdir(parents=True, exist_ok=True)
IMAGES.mkdir(parents=True, exist_ok=True)
RENDER = '--render' in sys.argv
PREVIEW = '--preview' in sys.argv   # quick Eevee still from the web camera, no export

reset_scene()
scene = bpy.context.scene
world_coll = collection('Highland crossing')
studio = collection('Highland crossing — lighting and camera')
# Two bevel segments is plenty at this silhouette scale and roughly halves the mesh.
B = Builder(world_coll, default_segments=2)

# ── Palette: moonlit blue stone, warm lit windows, scarlet locomotive ──
stone = material('Cold castle stone', (.118, .124, .152), .0, .78)
stone_dark = material('Shadowed stone', (.074, .080, .104), .0, .82)
slate = material('Slate roof', (.052, .058, .082), .05, .62)
rock = material('Cliff rock', (.062, .068, .086), .0, .88)
grass = material('Moorland turf', (.048, .072, .062), .0, .90)
water = material('Loch water', (.026, .048, .078), .30, .10)
pine = material('Black pine', (.030, .052, .046), .0, .86)
window_glow = material('Lit castle window', (.42, .30, .12), .0, .40,
                       emission=(1.0, .70, .32), emission_strength=7.0)
lamp_glow = material('Carriage lamp', (.44, .33, .16), .0, .40,
                     emission=(1.0, .76, .40), emission_strength=6.0)
scarlet = material('Scarlet livery', (.286, .036, .034), .10, .34)
loco_black = material('Locomotive black', (.028, .028, .034), .35, .30)
brass = material('Polished brass', (.62, .42, .13), .90, .22)
iron = material('Wrought iron', (.098, .100, .112), .70, .40)
gold_trim = material('Gold lining', (.66, .46, .14), .85, .26)
moonstone = material('Moon', (.86, .88, .96), .0, .55,
                     emission=(.92, .94, 1.0), emission_strength=5.0)
glass_lit = material('Carriage glass', (.36, .27, .13), .0, .28,
                     emission=(1.0, .74, .38), emission_strength=4.0)

DECK_TOP = 7.42
SPRING = 5.30
PIER_SPACING = 3.6
PIERS = [-9.0, -5.4, -1.8, 1.8, 5.4, 9.0]
VIADUCT_Y = 0.0


# ── Terrain: a faceted gorge with cliffs either side and hills behind ──
def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


CASTLE_X, CASTLE_Y, CASTLE_Z = 16.5, 5.0, 11.5   # crag summit the castle's mound rests on
CRAG_FACE_X = 6.9                                 # where the sheer west face of the crag rises
PORTAL_X = 7.4                                    # tunnel mouth in that face
TUNNEL_END = 29.5                                 # the bore runs from the portal to here
PORTAL_SPRING = 9.3
PORTAL_R = 2.15


def terrain_height(x, y):
    """A gorge along X=0 with the loch at the bottom. West: wooded flanks and hills.
    East: one sheer crag climbing straight out of the water with the castle on top,
    lower moorland rolling away behind it."""
    detail = (sin(x * .62) * cos(y * .55) * .95
              + sin(x * 1.7 + y * .8) * .42
              + cos(x * .31 - y * 1.1) * .70)
    # West bank.
    flank = smoothstep((-x - 8.0) / 5.5)
    back = 7.0 * smoothstep((y - 3.0) / 11.0) * smoothstep((-x + 2.0) / 8.0)
    shelf = 1.9 * smoothstep((-x - 12.5) / 4.0)
    # The west bank falls away to the loch toward the viewer, so the near hill never hides the train.
    near = smoothstep((y + 13.0) / 7.0)
    west = (10.4 * flank + back + shelf + detail * (.28 + .92 * flank)) * near - 1.6
    # The castle crag: a sheer faceted face toward the gorge, an oval summit, steep all round.
    east = smoothstep((x - CRAG_FACE_X) / 1.7)
    r = (((x - CASTLE_X) / 1.0) ** 2 + ((y - CASTLE_Y) / 1.15) ** 2) ** .5
    # The crag stretches further east than west, so the tunnel stays buried as far as the train goes (x ≈ 29).
    r_east = (((x - CASTLE_X) / (1.0 if x < CASTLE_X else 1.9)) ** 2 + ((y - CASTLE_Y) / 1.15) ** 2) ** .5
    summit = 1.0 - smoothstep((r_east - 10.5) / 7.5)
    jag = (sin(y * 1.3 + x * .7) * .9 + cos(y * 2.7 - x * .4) * .5) * east * (1 - east ** 4)
    steep = east * summit
    ridge = (sin(x * 2.3 + y * 1.1) * .8 + cos(x * .9 - y * 2.6) * .7 + sin((x + y) * 3.1) * .35) * 4.0 * steep * (1 - steep)
    crag = -1.6 + (CASTLE_Z + 1.6) * steep + detail * 1.1 * steep + jag + ridge
    # Moorland behind and beyond the crag, so the horizon is not empty.
    moor = -1.6 + 7.4 * smoothstep((y - 9.0) / 9.0) * smoothstep((x - 4.0) / 6.0) \
        + 5.0 * smoothstep((x - 26.0) / 7.0) + detail * .8 * smoothstep((x - 6.0) / 4.0)
    height = max(west, crag, moor, -1.6)
    # Dead flat under the castle's own rocky mound.
    flat = 1.0 - smoothstep((r - 8.0) / 3.0)
    height = height * (1 - flat) + CASTLE_Z * flat
    # A low rock ridge along the tunnel bore (crown at z ≈ 11.45) so it never breaks the surface.
    corridor = smoothstep((3.8 - abs(y)) / 1.4) * smoothstep((x - 8.0) / 1.5) * (1 - smoothstep((x - TUNNEL_END - 1.5) / 2.0))
    return height + 2.4 * corridor * smoothstep((height - 5.0) / 2.0)


COLS, ROWS = 98, 68
X0, X1 = -26.0, 38.0
Y0, Y1 = -16.0, 30.0
verts, faces = [], []
for row in range(ROWS + 1):
    for col in range(COLS + 1):
        x = X0 + (X1 - X0) * col / COLS
        y = Y0 + (Y1 - Y0) * row / ROWS
        verts.append((x, y, terrain_height(x, y)))
for row in range(ROWS):
    for col in range(COLS):
        a = row * (COLS + 1) + col
        faces.append((a, a + 1, a + COLS + 2, a + COLS + 1))
SKIRT_Z = -6.0
boundary = []
for col in range(COLS):
    boundary.append((col, col + 1))                                              # south edge
    boundary.append((ROWS * (COLS + 1) + col + 1, ROWS * (COLS + 1) + col))      # north edge
for row in range(ROWS):
    boundary.append(((row + 1) * (COLS + 1), row * (COLS + 1)))                  # west edge
    boundary.append((row * (COLS + 1) + COLS, (row + 1) * (COLS + 1) + COLS))    # east edge
for a, b in boundary:
    base_index = len(verts)
    verts.append((verts[a][0], verts[a][1], SKIRT_Z))
    verts.append((verts[b][0], verts[b][1], SKIRT_Z))
    faces.append((a, b, base_index + 1, base_index))
terrain_mesh = bpy.data.meshes.new('Gorge terrain')
terrain_mesh.from_pydata(verts, [], faces)
terrain_mesh.update()
terrain_mesh.materials.append(rock)
terrain_mesh.materials.append(grass)
for polygon in terrain_mesh.polygons:
    polygon.use_smooth = False  # Faceted low-poly reads better than a smoothed blob.
    centre = sum((terrain_mesh.vertices[i].co for i in polygon.vertices), start=terrain_mesh.vertices[0].co * 0)
    centre = centre / len(polygon.vertices)
    polygon.material_index = 1 if polygon.normal.z > .86 and centre.z > 6.0 and centre.x < 4.0 else 0
terrain_group = B.empty('Terrain')
terrain_obj = bpy.data.objects.new('Gorge terrain', terrain_mesh)
world_coll.objects.link(terrain_obj)
terrain_obj.parent = terrain_group

lake = B.empty('Lake')
B.cube('Loch surface', (2.0, 3.0, -0.55), (64.0, 44.0, .22), water, bevel=0, parent=lake, smooth=False)


# ── Viaduct: tapered piers, voussoir arches, spandrels and a stone deck ──
viaduct = B.empty('Viaduct')
B.cube('Viaduct deck', (0, VIADUCT_Y, DECK_TOP - .21), (23.4, 3.05, .42), stone, bevel=.05, parent=viaduct)
B.cube('Deck parapet north', (0, VIADUCT_Y + 1.42, DECK_TOP + .22), (23.4, .22, .46), stone_dark, bevel=.04, parent=viaduct)
B.cube('Deck parapet south', (0, VIADUCT_Y - 1.42, DECK_TOP + .22), (23.4, .22, .46), stone_dark, bevel=.04, parent=viaduct)
B.cube('Deck cornice', (0, VIADUCT_Y, DECK_TOP - .46), (23.9, 3.4, .18), stone_dark, bevel=.04, parent=viaduct)

for index, px in enumerate(PIERS):
    foot = terrain_height(px, VIADUCT_Y)
    bottom = min(foot - .6, -1.2)
    height = SPRING - bottom
    B.cube(f'Pier {index}', (px, VIADUCT_Y, bottom + height / 2), (1.18, 2.75, height), stone,
           bevel=.06, parent=viaduct)
    B.cube(f'Pier cap {index}', (px, VIADUCT_Y, SPRING + .10), (1.42, 2.95, .22), stone_dark,
           bevel=.04, parent=viaduct)
    B.cube(f'Pier plinth {index}', (px, VIADUCT_Y, bottom + .35), (1.52, 3.05, .70), stone_dark,
           bevel=.06, parent=viaduct)

ARCH_RADIUS = (PIER_SPACING - 1.18) / 2
for index in range(len(PIERS) - 1):
    centre_x = (PIERS[index] + PIERS[index + 1]) / 2
    # Voussoirs: individual wedge blocks swept around the semicircle read as masonry.
    blocks = 11
    for step in range(blocks + 1):
        angle = pi * step / blocks
        bx = centre_x + ARCH_RADIUS * cos(angle)
        bz = SPRING + ARCH_RADIUS * sin(angle)
        B.cube(f'Voussoir {index}:{step}', (bx, VIADUCT_Y, bz), (.30, 3.16, .46), stone_dark,
               bevel=.03, parent=viaduct, rot=(0, -angle, 0))
    # Spandrel filling the shoulder between the arch crown and the deck.
    crown = SPRING + ARCH_RADIUS
    if DECK_TOP - .42 > crown:
        B.cube(f'Spandrel {index}', (centre_x, VIADUCT_Y, (crown + DECK_TOP - .42) / 2 + .06),
               (PIER_SPACING - 1.6, 2.9, DECK_TOP - .42 - crown + .12), stone, bevel=.04, parent=viaduct)
    for side in (-1, 1):
        B.cube(f'Haunch {index}:{side}', (centre_x + side * (ARCH_RADIUS - .18), VIADUCT_Y,
                                          SPRING + ARCH_RADIUS * .34),
               (.72, 2.9, ARCH_RADIUS * .78), stone, bevel=.05, parent=viaduct)

# Rails and sleepers on the deck, so the train is clearly running on something.
track = B.empty('Track')
for offset in (-.72, .72):
    B.cube(f'Rail {offset}', (0, VIADUCT_Y + offset, DECK_TOP + .09), (23.0, .10, .14), iron, bevel=.02, parent=track)
for offset in (-.72, .72):
    B.cube(f'Tunnel rail {offset}', ((11.4 + TUNNEL_END) / 2, VIADUCT_Y + offset, DECK_TOP + .09), (TUNNEL_END - 11.4, .10, .14), iron, bevel=.02, parent=track)
B.cube('Tunnel floor', ((11.6 + TUNNEL_END) / 2, VIADUCT_Y, DECK_TOP - .25), (TUNNEL_END - 11.6, 5.2, .5), stone_dark, bevel=0, parent=track, smooth=False)
for index in range(58 + 24):
    sx = -22.4 + index * .79
    B.cube(f'Sleeper {index}', (sx, VIADUCT_Y, DECK_TOP + .03), (.20, 1.90, .09), stone_dark, bevel=.015, parent=track)


# ── The castle: an imported low-poly fortress, re-lit for the night ─
# Source: "castle 1234" by Felix Stief (scripts/blender/assets). Its flat display
# slab is cut away; the rocky mound it sits on becomes the promontory.
import bmesh
from mathutils import Vector
CASTLE_SRC = Path(__file__).resolve().parent / 'assets' / 'castle-1234-felix-stief.glb'
CASTLE_SCALE = 11.0
CASTLE_YAW = radians(-28)   # turn the tall tower cluster toward the camera
castle = B.empty('Castle')
roof = material('Castle roof', (.16, .07, .06), .0, .7)

before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(CASTLE_SRC))
imported = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
for extra in [o for o in bpy.data.objects if o not in before and o.type != 'MESH']:
    bpy.data.objects.remove(extra, do_unlink=True)
# Drop the asset's scenery that sits off the mound or under the slab (a stray piece
# at x ≈ -1.5 and anything wholly below the slab top) — only the castle itself stays.
biggest = max(imported, key=lambda o: len(o.data.polygons))
stray = []
for obj in imported:
    if obj is biggest:
        continue
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    if max(c.z for c in corners) < -0.31 or min(c.x for c in corners) < -1.05:
        stray.append(obj)
for obj in stray:
    imported.remove(obj)
    bpy.data.objects.remove(obj, do_unlink=True)

# The largest object is the mound plus the slab. Delete every face lying wholly
# below the slab's top surface (z ≈ -0.33 in source units) — the mound survives.
base = max(imported, key=lambda o: len(o.data.polygons))
bm = bmesh.new()
bm.from_mesh(base.data)
matrix = base.matrix_world
doomed = [f for f in bm.faces if max((matrix @ v.co).z for v in f.verts) < -0.31]
bmesh.ops.delete(bm, geom=doomed, context='FACES')
bm.to_mesh(base.data)
bm.free()

remap = {'mat17': rock, 'mat22': stone, 'mat20': roof, 'mat16': slate}
for obj in imported:
    for index, mat in enumerate(obj.data.materials):
        obj.data.materials[index] = remap.get(mat.name if mat else '', stone)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    B.adopt(obj)
    obj.parent = castle

# Lit windows: sample small, vertical wall faces and pin a warm pane just outside each.
candidates = []
for obj in imported:
    if obj is base:
        continue
    rotation = obj.matrix_world.to_3x3()
    scale = obj.matrix_world.to_scale()
    for face in obj.data.polygons:
        normal = (rotation @ face.normal).normalized()
        centre = obj.matrix_world @ face.center
        area = face.area * scale.x * scale.y
        if abs(normal.z) < .25 and .00015 < area < .012 and centre.z > -.12:
            candidates.append((obj.name, face.index, centre, normal))
candidates.sort(key=lambda item: (item[0], item[1]))
step = max(1, len(candidates) // 220)
panes = 0
for k, (_, _, centre, normal) in enumerate(candidates[::step]):
    if k % 4 == 0:
        continue
    B.cube(f'Pane {k}', centre + normal * .004, (.004, .013, .022), window_glow, bevel=0, parent=castle,
           rot=(0, 0, atan2(normal.y, normal.x)), smooth=False)
    panes += 1
print('CASTLE_PANES', panes, 'of', len(candidates))

castle.scale = (CASTLE_SCALE,) * 3
castle.rotation_euler = (0, 0, CASTLE_YAW)
castle.location = (CASTLE_X, CASTLE_Y, CASTLE_Z + .33 * CASTLE_SCALE)   # slab-top level lands on the plateau

# The tunnel portal where the line enters the crag. The train's cab roof and funnel
# cap reach z ≈ 10.4, so the arch springs at 9.3 with a 2.15 radius: crown ≈ 11.45.
cliff = B.empty('Cliff')
for step_index in range(14):
    angle = pi * step_index / 13
    B.cube(f'Portal voussoir {step_index}', (PORTAL_X, PORTAL_R * cos(angle), PORTAL_SPRING + PORTAL_R * sin(angle)),
           (.6, .38, .52), stone_dark, bevel=.03, parent=cliff, rot=(angle, 0, 0))
for side in (-1, 1):
    B.cube(f'Portal jamb {side}', (PORTAL_X, side * (PORTAL_R + .22), (DECK_TOP - .3 + PORTAL_SPRING) / 2),
           (.8, .9, PORTAL_SPRING - DECK_TOP + .3), stone_dark, bevel=.04, parent=cliff)
    B.cube(f'Portal buttress {side}', (PORTAL_X + .1, side * (PORTAL_R + .95), (DECK_TOP - .5 + PORTAL_SPRING + .6) / 2),
           (1.0, .7, PORTAL_SPRING - DECK_TOP + 1.1), stone, bevel=.05, parent=cliff)
B.cube('Portal keystone', (PORTAL_X - .05, 0, PORTAL_SPRING + PORTAL_R + .1), (.7, .5, .7), stone, bevel=.04, parent=cliff)
B.cube('Portal parapet', (PORTAL_X + .3, 0, PORTAL_SPRING + PORTAL_R + .75), (1.0, 7.2, .5), stone_dark, bevel=.04, parent=cliff)
B.cube('Portal lamp', (PORTAL_X - .38, 0, PORTAL_SPRING + PORTAL_R + .28), (.1, .3, .22), lamp_glow, bevel=0,
       parent=cliff, smooth=False)
# Rock headwall: the crag face rises from ~2 at the portal to the summit by x ≈ 8.6, so
# faceted lumps wrap the portal and swallow the train the moment it is through the arch.
def rock_lump(name, loc, dims, seed, parent, rot=(0, 0, 0)):
    """A low-poly boulder: an icosphere pushed about by deterministic sine noise, flat-shaded."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.5, location=loc, rotation=rot)
    obj = B.finish(bpy.context.object, name, rock, parent, smooth=False)
    for vertex in obj.data.vertices:
        v = vertex.co
        bump = (sin(v.x * 7.1 + seed) * cos(v.y * 5.3 - seed) * .55
                + sin(v.z * 6.7 + v.x * 3.1 + seed * .7) * .35
                + cos((v.x + v.y + v.z) * 9.0 + seed * 1.9) * .22)
        vertex.co = v * (1.0 + .26 * bump)
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


rock_lump('Headwall core', (9.4, 0.0, 9.2), (4.4, 12.0, 10.0), 1.0, cliff, rot=(0, radians(6), radians(-8)))
rock_lump('Headwall shoulder', (9.4, 1.8, 11.4), (4.4, 9.0, 4.6), 2.0, cliff, rot=(radians(9), radians(-12), radians(15)))
rock_lump('Headwall arch mass', (8.4, 0.0, 12.3), (2.6, 7.4, 2.9), 3.0, cliff, rot=(0, radians(14), 0))
for side, seed in ((-1, 4.0), (1, 5.0)):
    rock_lump(f'Headwall buttress {side}', (7.9, side * 4.6, 8.6), (2.8, 3.4, 5.6), seed, cliff,
              rot=(radians(14 * side), radians(9), radians(20 * side)))
    rock_lump(f'Headwall foot {side}', (7.3, side * 3.5, 5.6), (2.4, 2.8, 3.4), seed + 2.5, cliff,
              rot=(radians(-9 * side), radians(-6), radians(-14 * side)))
    rock_lump(f'Headwall crown {side}', (8.9, side * 3.2, 12.2), (2.4, 2.6, 2.2), seed + 4.0, cliff,
              rot=(radians(22 * side), radians(11), radians(-25 * side)))


# ── The bore: carve the tunnel out of the rock, then line it ────────
tunnel_lining = material('Tunnel lining', (.012, .013, .018), .0, 1.0)
BORE_MARGIN = .45


def in_bore(p, margin=0.0):
    """World point inside the tunnel profile (semicircle on vertical walls), widened by margin."""
    if p.x < PORTAL_X - 1.0 or p.x > TUNNEL_END + margin:
        return False
    r = PORTAL_R + margin
    if abs(p.y) > r or p.z < DECK_TOP - .6 - margin:
        return False
    if p.z <= PORTAL_SPRING:
        return True
    return (p.y ** 2 + (p.z - PORTAL_SPRING) ** 2) ** .5 <= r


def carve(obj, margin, any_vertex=True):
    bpy.context.view_layer.update()
    matrix = obj.matrix_world
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    if any_vertex:
        doomed = [f for f in bm.faces if any(in_bore(matrix @ v.co, margin) for v in f.verts)]
    else:
        doomed = [f for f in bm.faces if in_bore(matrix @ f.calc_center_median(), margin)]
    bmesh.ops.delete(bm, geom=doomed, context='FACES')
    bm.to_mesh(obj.data)
    bm.free()
    return len(doomed)


# Open meshes (terrain, the castle mound) just lose the faces that cross the bore: the lining hides
# the gaps. The headwall lumps are closed solids and export double-sided, so a hole in one shows its
# inside — they are cut with a real boolean against a tunnel-shaped cutter and stay watertight.
carved = carve(terrain_obj, .1, any_vertex=False) + carve(base, .3)
print('TUNNEL_CARVED_FACES', carved)

cutter_profile = [(-PORTAL_R - .12, DECK_TOP - 1.0)]
for step_index in range(17):
    angle = pi - pi * step_index / 16
    cutter_profile.append(((PORTAL_R + .12) * cos(angle), PORTAL_SPRING + (PORTAL_R + .12) * sin(angle)))
cutter_profile.append((PORTAL_R + .12, DECK_TOP - 1.0))
cutter_verts, cutter_faces = [], []
for x in (PORTAL_X - 1.5, TUNNEL_END + .5):
    for py, pz in cutter_profile:
        cutter_verts.append((x, py, pz))
n = len(cutter_profile)
for i in range(n):
    j = (i + 1) % n
    cutter_faces.append((i, j, n + j, n + i))
cutter_faces.append(tuple(range(n)))
cutter_faces.append(tuple(range(2 * n - 1, n - 1, -1)))
cutter_mesh = bpy.data.meshes.new('Tunnel cutter')
cutter_mesh.from_pydata(cutter_verts, [], cutter_faces)
cutter_mesh.update()
cutter = bpy.data.objects.new('Tunnel cutter', cutter_mesh)
world_coll.objects.link(cutter)
bm = bmesh.new()
bm.from_mesh(cutter_mesh)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(cutter_mesh)
bm.free()
for obj in list(cliff.children):
    if not obj.name.startswith('Headwall'):
        continue
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    cut = obj.modifiers.new('Tunnel bore', 'BOOLEAN')
    cut.operation = 'DIFFERENCE'
    cut.solver = 'EXACT'
    cut.object = cutter
    bpy.ops.object.modifier_apply(modifier=cut.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
bpy.data.objects.remove(cutter, do_unlink=True)

# Lining: arch profile swept along X, normals pointing into the bore, closed at the far end.
profile = []
for step_index in range(13):
    angle = pi - pi * step_index / 12                     # from the north springing over the crown to the south
    profile.append((PORTAL_R * cos(angle), PORTAL_SPRING + PORTAL_R * sin(angle)))
profile = [(-PORTAL_R, DECK_TOP - .5)] + profile + [(PORTAL_R, DECK_TOP - .5)]
lining_verts, lining_faces = [], []
for xi, x in enumerate((PORTAL_X - .6, TUNNEL_END)):
    for py, pz in profile:
        lining_verts.append((x, py, pz))
n = len(profile)
for i in range(n - 1):
    a_, b_, c_, d_ = i, i + 1, n + i + 1, n + i
    lining_faces.append((a_, b_, c_, d_))
lining_faces.append(tuple(range(n, 2 * n)))            # far end cap
lining_faces.append((0, n, 2 * n - 1, n - 1))          # floor between the wall feet
lining_mesh = bpy.data.meshes.new('Tunnel lining')
lining_mesh.from_pydata(lining_verts, [], lining_faces)
lining_mesh.update()
lining_mesh.materials.append(tunnel_lining)
lining_obj = bpy.data.objects.new('Tunnel lining', lining_mesh)
world_coll.objects.link(lining_obj)
lining_obj.parent = cliff
bm = bmesh.new()
bm.from_mesh(lining_mesh)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
crown = max(bm.faces, key=lambda f: f.calc_center_median().z)
if crown.normal.z > 0:                                      # make every face look into the bore
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
bm.to_mesh(lining_mesh)
bm.free()
for polygon in lining_mesh.polygons:
    polygon.use_smooth = False
# Faint lamps down the north wall so the bore reads as a tunnel rather than a hole.
for lamp_index in range(4):
    lx = PORTAL_X + 4.5 + lamp_index * 5.5
    B.cube(f'Tunnel lamp {lamp_index}', (lx, PORTAL_R - .12, PORTAL_SPRING + .9), (.26, .1, .18), lamp_glow, bevel=0,
           parent=cliff, smooth=False)


# ── Pines scattered on the flanks ───────────────────────────────────
pines = B.empty('Pines')
placements = []
for index in range(64):
    # Deterministic scatter: no randomness, so every rebuild is identical.
    t = index / 46
    x = -23.0 + 52.0 * ((index * 7919) % 64) / 64
    y = -6.0 + 30.0 * ((index * 5417) % 64) / 64
    if abs(x) < 9.0 or (x > 4.0 and (((x - CASTLE_X) ** 2 + (y - CASTLE_Y) ** 2) ** .5 < 17.5 or y < 12.0)):
        continue
    z = terrain_height(x, y)
    if z < 1.5:
        continue
    scale = .8 + .55 * ((index * 3313) % 10) / 10
    placements.append((x, y, z, scale))
    B.cylinder(f'Pine trunk {index}', (x, y, z + .32 * scale), .07 * scale, .70 * scale, pine, pines,
               vertices=6, bevel=0)
    for tier in range(3):
        tz = z + (.62 + tier * .52) * scale
        B.cone(f'Pine tier {index}:{tier}', (x, y, tz), (.62 - tier * .17) * scale, .0,
               (.95 - tier * .12) * scale, pine, pines, vertices=7)

MOON_AT = (26.0, 30.0, 27.5)
moon = B.empty('Moon')
B.sphere('Moon disc', MOON_AT, (2.1, 2.1, 2.1), moonstone, moon, segments=28, rings=16)


# ── The scarlet express ─────────────────────────────────────────────
train = B.empty('Train')
RAIL_Z = DECK_TOP + .16
AXLE_Z = RAIL_Z + .38


def wheel(name, x, z, radius, spoke=True):
    for side in (-.72, .72):
        B.cylinder(f'{name} tyre {side}', (x, VIADUCT_Y + side, z), radius, .13, loco_black, train,
                   vertices=20, rot=(radians(90), 0, 0), bevel=.02)
        B.cylinder(f'{name} rim {side}', (x, VIADUCT_Y + side, z), radius * .80, .16, iron, train,
                   vertices=20, rot=(radians(90), 0, 0), bevel=.02)
        B.cylinder(f'{name} hub {side}', (x, VIADUCT_Y + side, z), radius * .22, .19, brass, train,
                   vertices=14, rot=(radians(90), 0, 0), bevel=.02)
        if spoke:
            for index in range(5):
                angle = pi * index / 5
                B.cube(f'{name} spoke {side}:{index}', (x, VIADUCT_Y + side, z),
                       (radius * 1.5, .05, .07), iron, bevel=.01, parent=train, rot=(0, angle, 0))


# Locomotive: smokebox, boiler, firebox, cab, and a tall funnel.
LOCO_X = 5.0
B.cube('Loco running plate', (LOCO_X, VIADUCT_Y, RAIL_Z + .50), (5.1, 1.86, .16), loco_black, bevel=.03, parent=train)
B.cylinder('Boiler', (LOCO_X - .05, VIADUCT_Y, RAIL_Z + 1.28), .70, 3.20, scarlet, train,
           vertices=26, rot=(0, radians(90), 0), bevel=.04)
for band_x in (LOCO_X - 1.25, LOCO_X - .10, LOCO_X + 1.05):
    B.cylinder(f'Boiler band {band_x}', (band_x, VIADUCT_Y, RAIL_Z + 1.28), .715, .10, gold_trim, train,
               vertices=26, rot=(0, radians(90), 0), bevel=.02)
B.cylinder('Smokebox', (LOCO_X + 1.72, VIADUCT_Y, RAIL_Z + 1.28), .74, .62, loco_black, train,
           vertices=26, rot=(0, radians(90), 0), bevel=.04)
B.cylinder('Smokebox door', (LOCO_X + 2.04, VIADUCT_Y, RAIL_Z + 1.28), .68, .10, loco_black, train,
           vertices=26, rot=(0, radians(90), 0), bevel=.03)
B.cylinder('Smokebox hinge strap', (LOCO_X + 2.10, VIADUCT_Y, RAIL_Z + 1.28), .12, .06, brass, train,
           vertices=14, rot=(0, radians(90), 0), bevel=.01)
B.cone('Funnel', (LOCO_X + 1.62, VIADUCT_Y, RAIL_Z + 2.28), .34, .27, .78, loco_black, train, vertices=22)
B.cylinder('Funnel cap', (LOCO_X + 1.62, VIADUCT_Y, RAIL_Z + 2.70), .40, .16, brass, train, vertices=22, bevel=.02)
B.sphere('Steam dome', (LOCO_X + .18, VIADUCT_Y, RAIL_Z + 1.92), (.36, .36, .34), brass, train, segments=20, rings=12)
B.cylinder('Safety valve', (LOCO_X - .78, VIADUCT_Y, RAIL_Z + 1.98), .19, .34, brass, train, vertices=16, bevel=.02)
B.cube('Cab', (LOCO_X - 2.20, VIADUCT_Y, RAIL_Z + 1.62), (1.55, 1.86, 1.96), scarlet, bevel=.05, parent=train)
B.cube('Cab roof', (LOCO_X - 2.20, VIADUCT_Y, RAIL_Z + 2.66), (1.80, 2.02, .14), loco_black, bevel=.04, parent=train)
B.cube('Cab window', (LOCO_X - 1.98, VIADUCT_Y - .94, RAIL_Z + 2.06), (.62, .07, .60), glass_lit, bevel=.02, parent=train)
B.cube('Cab window far', (LOCO_X - 1.98, VIADUCT_Y + .94, RAIL_Z + 2.06), (.62, .07, .60), glass_lit, bevel=.02, parent=train)
B.cube('Buffer beam', (LOCO_X + 2.34, VIADUCT_Y, RAIL_Z + .46), (.20, 1.94, .52), scarlet, bevel=.03, parent=train)
for side in (-.62, .62):
    B.cylinder(f'Buffer {side}', (LOCO_X + 2.46, VIADUCT_Y + side, RAIL_Z + .52), .13, .26, iron, train,
               vertices=14, rot=(0, radians(90), 0), bevel=.02)
B.cylinder('Head lamp', (LOCO_X + 2.40, VIADUCT_Y, RAIL_Z + 1.62), .19, .24, lamp_glow, train,
           vertices=16, rot=(0, radians(90), 0), bevel=.02)
for side in (-.86, .86):
    B.cube(f'Cylinder block {side}', (LOCO_X + 1.42, VIADUCT_Y + side, RAIL_Z + .34), (1.02, .42, .52), loco_black,
           bevel=.04, parent=train)

wheel('Bogie front', LOCO_X + 1.72, RAIL_Z + .30, .30, spoke=False)
wheel('Bogie rear', LOCO_X + 1.00, RAIL_Z + .30, .30, spoke=False)
for index, dx in enumerate((-.30, .78, -1.38)):
    wheel(f'Driver {index}', LOCO_X + dx, AXLE_Z + .18, .62)
for side in (-.80, .80):
    B.cube(f'Coupling rod {side}', (LOCO_X - .30, VIADUCT_Y + side, AXLE_Z + .60), (2.30, .07, .13), iron,
           bevel=.02, parent=train)

# Tender.
TENDER_X = LOCO_X - 4.10
B.cube('Tender body', (TENDER_X, VIADUCT_Y, RAIL_Z + 1.14), (2.60, 1.86, 1.40), scarlet, bevel=.05, parent=train)
B.cube('Tender frame', (TENDER_X, VIADUCT_Y, RAIL_Z + .42), (2.72, 1.94, .22), loco_black, bevel=.03, parent=train)
B.cube('Tender lining', (TENDER_X, VIADUCT_Y - .94, RAIL_Z + 1.14), (2.20, .05, .90), gold_trim, bevel=.02, parent=train)
B.cube('Coal load', (TENDER_X - .20, VIADUCT_Y, RAIL_Z + 1.92), (2.10, 1.56, .30), loco_black, bevel=.06, parent=train)
wheel('Tender front', TENDER_X + .82, RAIL_Z + .32, .32, spoke=False)
wheel('Tender rear', TENDER_X - .82, RAIL_Z + .32, .32, spoke=False)

# Passenger carriages.
for index in range(3):
    cx = TENDER_X - 3.30 - index * 3.34
    B.cube(f'Carriage {index} body', (cx, VIADUCT_Y, RAIL_Z + 1.36), (3.06, 1.90, 1.88), scarlet,
           bevel=.06, parent=train)
    B.cube(f'Carriage {index} roof', (cx, VIADUCT_Y, RAIL_Z + 2.36), (3.14, 2.02, .20), loco_black,
           bevel=.06, parent=train)
    B.cube(f'Carriage {index} frame', (cx, VIADUCT_Y, RAIL_Z + .40), (3.14, 1.96, .22), loco_black,
           bevel=.03, parent=train)
    B.cube(f'Carriage {index} waist line', (cx, VIADUCT_Y - .96, RAIL_Z + .78), (2.94, .05, .10), gold_trim,
           bevel=.01, parent=train)
    for pane in range(4):
        wx = cx - 1.14 + pane * .76
        for side in (-.96, .96):
            B.cube(f'Carriage {index} pane {pane}:{side}', (wx, VIADUCT_Y + side, RAIL_Z + 1.62),
                   (.56, .05, .68), glass_lit, bevel=.02, parent=train)
    B.cube(f'Carriage {index} door {0}', (cx + 1.36, VIADUCT_Y - .96, RAIL_Z + 1.24), (.40, .06, 1.50), stone_dark,
           bevel=.02, parent=train)
    wheel(f'Carriage {index} front', cx + 1.06, RAIL_Z + .32, .32, spoke=False)
    wheel(f'Carriage {index} rear', cx - 1.06, RAIL_Z + .32, .32, spoke=False)
    B.cylinder(f'Carriage {index} coupling', (cx + 1.70, VIADUCT_Y, RAIL_Z + .48), .07, .50, iron, train,
               vertices=10, rot=(0, radians(90), 0), bevel=.01)


# ── Lighting and camera (excluded from the GLB) ─────────────────────
world = bpy.data.worlds.new('Moonlit highland night')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.030, .046, .092, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .60
area_light(studio, 'Moon key', (MOON_AT[0] - 4, MOON_AT[1] - 6, MOON_AT[2]), 14000, 10.0, (.68, .78, 1.0), target=(8, 4, 8))
area_light(studio, 'Castle bounce', (10, -12, 18), 3600, 8.0, (1.0, .74, .42), target=(CASTLE_X, CASTLE_Y, CASTLE_Z + 7))
area_light(studio, 'Gorge fill', (-4, -16, 6), 1600, 10.0, (.44, .58, .92), target=(0, 0, 4))
# Same framing as HighlandCrossing.jsx SHOT.wide (web Y-up → Blender Z-up: (x, y, z) → (x, -z, y)).
WEB_CAMERA = {'position': (-17.0, 8.0, 37.0), 'target': (7.5, 5.5, -5.0), 'fov': 44}
cam = camera(studio, 'Crossing camera',
             (WEB_CAMERA['position'][0], -WEB_CAMERA['position'][2], WEB_CAMERA['position'][1]),
             (WEB_CAMERA['target'][0], -WEB_CAMERA['target'][2], WEB_CAMERA['target'][1]), lens=50)
cam.data.sensor_fit = 'VERTICAL'
cam.data.sensor_height = 24.0
cam.data.lens = 12.0 / __import__('math').tan(radians(WEB_CAMERA['fov'] / 2))

bpy.context.view_layer.update()
triangles = triangle_count(world_coll)

origins = {
    'Train': (0.0, VIADUCT_Y, RAIL_Z),
    'Castle': (CASTLE_X, CASTLE_Y, CASTLE_Z),
    'Cliff': (PORTAL_X, 0.0, CASTLE_Z),
    'Moon': MOON_AT,
}
metadata = {
    'generator': 'Blender ' + bpy.app.version_string,
    'design': 'Original stylised castle, viaduct and steam train modelled procedurally for Diego Perez',
    'note': 'Not a reproduction of any existing film design; geometry is generated from primitives and curves.',
    'groups': ['Terrain', 'Lake', 'Viaduct', 'Track', 'Castle', 'Cliff', 'Pines', 'Moon', 'Train'],
    'castle': 'castle 1234 by Felix Stief, scaled %.1f, placed at %s; slab removed, windows added' % (CASTLE_SCALE, [CASTLE_X, CASTLE_Y, CASTLE_Z]),
    'trainOriginYUp': y_up((0.0, VIADUCT_Y, RAIL_Z)),
    'trainTravelAxis': 'x',
    'trainLengthUnits': 17.4,
    'viaductSpanYUp': [PIERS[0] - 1.0, PIERS[-1] + 1.0],
    'deckTopYUp': DECK_TOP,
    'funnelMouthYUp': y_up((5.0 + 1.62, VIADUCT_Y, RAIL_Z + 3.10)),
    'cameraPositionYUp': list(WEB_CAMERA['position']),
    'cameraTargetYUp': list(WEB_CAMERA['target']),
    'castleTopYUp': y_up((CASTLE_X, CASTLE_Y, CASTLE_Z + (.745 + .33) * CASTLE_SCALE)),
    'portalCrownYUp': y_up((PORTAL_X, 0.0, PORTAL_SPRING + PORTAL_R)),
    'moonYUp': y_up(MOON_AT),
    'litMaterials': ['Lit castle window', 'Carriage glass', 'Carriage lamp', 'Moon', 'Clock face'],
    'triangles': triangles,
    'files': {'editable': '/models/highland-crossing.blend', 'web': '/models/highland-crossing.glb'},
}
(MODELS / 'highland-crossing.json').write_text(json.dumps(metadata, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(MODELS / 'highland-crossing.blend'))

if PREVIEW and '--tunnel' in sys.argv:
    cam.location = (-8.0, -3.5, 10.5)
    cam.rotation_euler = (Vector((PORTAL_X + 6, 0, 9)) - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 12.0 / __import__('math').tan(radians(24))
if PREVIEW:
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    scene.render.resolution_x, scene.render.resolution_y = 1280, 800
    scene.eevee.taa_render_samples = 16
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.view_transform = 'AgX'
    scene.render.filepath = [a for a in sys.argv if a.endswith('.png')][0]
    bpy.ops.render.render(write_still=True)
    print('HOGWARTS_PREVIEW ' + scene.render.filepath)
    sys.exit(0)

join_groups(world_coll, origins)
export_glb(world_coll, MODELS / 'highland-crossing.glb', draco=True)
print('HOGWARTS_TRIANGLES ' + str(triangles))
print('HOGWARTS_BYTES ' + str((MODELS / 'highland-crossing.glb').stat().st_size))
print('HOGWARTS_METADATA ' + json.dumps(metadata))

if RENDER:
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.render.filepath = str(IMAGES / 'highland-crossing.png')
    bpy.ops.render.render(write_still=True)
    print('HOGWARTS_RENDER_READY ' + scene.render.filepath)
