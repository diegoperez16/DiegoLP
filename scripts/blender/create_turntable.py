"""Model Diego's original belt-drive turntable for the listening room.

  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/blender/create_turntable.py -- [--render]

Units match the existing Three.js scene one-for-one, so the GLB drops straight
into <Scene/>: plinth 4.5 x 3.5, platter radius 1.42 centred at (0, 0.10) in
glTF space, tonearm pivot at (1.72, -1.05) — real 9" arm proportions (a/d ≈ 1.07). Front of the deck is -Y in Blender
(+Z in glTF). Nothing here is downloaded; every part is a primitive or a curve.
"""

import json
import sys
from math import cos, pi, radians, sin
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

reset_scene()
scene = bpy.context.scene
deck = collection('Turntable — deck')
studio = collection('Turntable — lighting and camera')
B = Builder(deck)

# ── Materials ───────────────────────────────────────────────────────
walnut = material('Dark walnut lacquer', (.055, .030, .018), .08, .24)
walnut_top = material('Walnut top face', (.075, .043, .024), .06, .30)
alu_brushed = material('Brushed aluminium plate', (.52, .53, .55), .92, .30)
alu_machined = material('Machined platter aluminium', (.60, .61, .63), .95, .22)
chrome = material('Polished chrome', (.80, .82, .84), 1.0, .08)
satin = material('Satin arm tube', (.68, .69, .71), .90, .18)
graphite = material('Graphite counterweight', (.20, .21, .23), .85, .26)
felt = material('Charcoal felt slipmat', (.045, .046, .052), 0.0, .96)
rubber = material('Black rubber', (.022, .023, .026), .02, .78)
plastic = material('Black moulded plastic', (.032, .033, .038), .10, .40)
gold = material('Brushed warm gold', (.64, .38, .105), .85, .22)
ivory = material('Ivory strobe dot', (.88, .85, .78), .0, .55)
led_green = material('Play indicator', (.05, .35, .16), .2, .25, emission=(.10, 1.0, .45), emission_strength=3.0)
led_amber = material('Cue indicator', (.36, .22, .04), .2, .25, emission=(1.0, .62, .16), emission_strength=2.0)
cartridge_body = material('Cartridge shell', (.10, .105, .12), .35, .32)
stylus_metal = material('Stylus cantilever', (.86, .87, .89), 1.0, .05)

PLATTER_CENTRE = (0.0, -0.10)
PIVOT = (1.72, 1.05)
REST = (1.259, -1.120)  # under the parked stylus, solved from the arm geometry
FRONT = -1.52          # control row, just inside the front lip
PIVOT_TOP = 0.195

# ── Plinth ──────────────────────────────────────────────────────────
plinth = B.empty('Plinth')
B.cube('Lacquered plinth', (0, 0, -.125), (4.5, 3.5, .25), walnut, bevel=.028, segments=5, parent=plinth)
B.cube('Aluminium top plate', (0, 0, .004), (4.36, 3.30, .012), alu_brushed, bevel=.005, parent=plinth)

# Recessed well the platter sits in, so the platter reads as inset rather than stacked on top.
B.cylinder('Platter well', (*PLATTER_CENTRE, -.02), 1.50, .05, plastic, plinth, vertices=96, bevel=.006)
B.torus('Platter well rim', (*PLATTER_CENTRE, .006), 1.505, .014, alu_brushed, plinth, major_seg=96, minor_seg=8)

# Strobe window on the front-left lip, a detail every belt-drive deck has.
B.cube('Strobe window', (-1.55, FRONT, .010), (.30, .10, .008), plastic, bevel=.004, parent=plinth)
for index in range(9):
    B.cube(f'Strobe rule {index}', (-1.67 + index * .030, FRONT, .015), (.010, .072, .003), ivory, bevel=0, parent=plinth)

# Brushed badge, echoing the gold in the curiosity collection.
B.cube('Nameplate', (1.78, FRONT, .012), (.46, .13, .010), gold, bevel=.004, parent=plinth)

for x, y in ((-2.05, -1.55), (2.05, -1.55), (-2.05, 1.58), (2.05, 1.58)):
    B.cone(f'Isolation foot {x}:{y}', (x, y, -.29), .095, .072, .095, rubber, plinth, vertices=24)

hinges = B.empty('Dust cover hinges')
B.cube('Hinge bar', (0, 1.70, .018), (4.10, .05, .022), alu_brushed, bevel=.006, parent=hinges)
for x in (-1.55, 1.55):
    B.cube(f'Hinge block {x}', (x, 1.68, .046), (.30, .12, .075), plastic, bevel=.012, parent=hinges)

# ── Platter (origin at its own centre so the runtime can just spin it) ──
platter = B.empty('Platter')
B.cylinder('Platter body', (*PLATTER_CENTRE, .048), 1.42, .090, alu_machined, platter, vertices=112, bevel=.012)
# Concentric machining rings catch the light as it turns.
for radius in (.46, .62, .78, .94, 1.10, 1.26, 1.36):
    points = [(PLATTER_CENTRE[0] + radius * cos(a * 2 * pi / 96),
               PLATTER_CENTRE[1] + radius * sin(a * 2 * pi / 96), .0935) for a in range(96)]
    B.tube('Machining ring', points, .0035, alu_brushed, platter, cyclic=True, resolution=2)
B.cylinder('Felt slipmat', (*PLATTER_CENTRE, .097), 1.38, .006, felt, platter, vertices=96, bevel=.002)
for radius in (.50, .84, 1.18):
    points = [(PLATTER_CENTRE[0] + radius * cos(a * 2 * pi / 88),
               PLATTER_CENTRE[1] + radius * sin(a * 2 * pi / 88), .1005) for a in range(88)]
    B.tube('Slipmat debossed ring', points, .004, plastic, platter, cyclic=True, resolution=2)
# Strobe dots around the platter skirt.
for index in range(56):
    angle = 2 * pi * index / 56
    B.cube(f'Platter strobe dot {index}',
           (PLATTER_CENTRE[0] + 1.425 * cos(angle), PLATTER_CENTRE[1] + 1.425 * sin(angle), .022),
           (.016, .016, .020), ivory, bevel=0, parent=platter, rot=(0, 0, angle))
B.cylinder('Spindle', (*PLATTER_CENTRE, .150), .034, .112, chrome, platter, vertices=24, bevel=.004)
B.cone('Spindle tip', (*PLATTER_CENTRE, .212), .034, .016, .028, chrome, platter, vertices=24)

# ── Tonearm base (static) ───────────────────────────────────────────
arm_base = B.empty('Tonearm base')
B.cylinder('Pivot housing', (*PIVOT, .075), .105, .150, alu_brushed, arm_base, vertices=40, bevel=.010)
B.cylinder('Pivot collar', (*PIVOT, .162), .128, .040, chrome, arm_base, vertices=40, bevel=.008)
B.cylinder('Gimbal yoke', (*PIVOT, .196), .092, .052, satin, arm_base, vertices=32, bevel=.008)
B.cylinder('Anti-skate dial', (PIVOT[0] + .012, PIVOT[1] + .295, .088), .062, .120, graphite,
           arm_base, vertices=28, bevel=.008)
B.cylinder('Anti-skate cap', (PIVOT[0] + .012, PIVOT[1] + .295, .152), .050, .016, gold, arm_base, vertices=28, bevel=.004)

# Arm rest and its clip, at the front-right where the arm parks.
rest = B.empty('Tonearm rest')
B.cylinder('Arm rest post', (*REST, .070), .048, .140, alu_brushed, rest, vertices=24, bevel=.006)
B.cube('Arm rest cradle', (*REST, .152), (.14, .10, .048), rubber, bevel=.014, parent=rest)
B.cube('Arm clip', (REST[0], REST[1] - .09, .178), (.12, .05, .062), plastic, bevel=.012, parent=rest)

# ── Tonearm (origin at the pivot; the runtime swings it on Y, cues it on Z) ──
arm = B.empty('Tonearm')


def s_curve(u):
    """Classic S-shaped arm: bows out mid-span, then offsets the headshell in."""
    x = 0.52 - 2.679 * u
    y = 0.22 * sin(pi * u) - 0.30 * u ** 2.2
    return x, y


spine = []
for step in range(48):
    u = step / 47
    x, y = s_curve(u)
    spine.append((PIVOT[0] + x, PIVOT[1] + y, PIVOT_TOP + .006 * sin(pi * u)))
B.tube('Arm tube', spine, .0235, satin, arm, taper=lambda t: 1.0 - .34 * t ** 1.6, resolution=4)

B.cylinder('Counterweight', (PIVOT[0] + .50, PIVOT[1] + .006, PIVOT_TOP), .078, .175, graphite,
           arm, vertices=32, rot=(0, radians(90), 0), bevel=.010)
for offset in (-.052, 0, .052):
    B.torus('Counterweight knurl', (PIVOT[0] + .50 + offset, PIVOT[1] + .006, PIVOT_TOP), .079, .006, chrome,
            arm, rot=(0, radians(90), 0), major_seg=32, minor_seg=8)
B.cylinder('Arm stub', (PIVOT[0] + .20, PIVOT[1], PIVOT_TOP), .050, .150, chrome, arm,
           vertices=28, rot=(0, radians(90), 0), bevel=.008)
B.cylinder('VTF dial', (PIVOT[0] + .30, PIVOT[1], PIVOT_TOP), .062, .034, gold, arm,
           vertices=28, rot=(0, radians(90), 0), bevel=.006)

# Headshell, cartridge and stylus at the far end of the S.
hx, hy = s_curve(1.0)
head_x, head_y = PIVOT[0] + hx, PIVOT[1] + hy
head_rot = (0, 0, radians(-22))
B.cylinder('Headshell collar', (head_x + .10, head_y + .04, PIVOT_TOP), .034, .052, chrome, arm,
           vertices=24, rot=(0, radians(90), 0), bevel=.006)
B.cube('Headshell', (head_x, head_y, PIVOT_TOP - .014), (.20, .105, .052), satin,
       bevel=.014, parent=arm, rot=head_rot)
B.cube('Finger lift', (head_x - .01, head_y - .085, PIVOT_TOP - .002), (.115, .028, .050), alu_brushed,
       bevel=.010, parent=arm, rot=(radians(24), 0, radians(-22)))
B.cube('Cartridge body', (head_x - .012, head_y + .010, PIVOT_TOP - .058), (.078, .118, .050), cartridge_body,
       bevel=.008, parent=arm, rot=head_rot)
B.cube('Cartridge nose', (head_x - .034, head_y - .034, PIVOT_TOP - .058), (.040, .052, .038), gold,
       bevel=.006, parent=arm, rot=head_rot)
B.tube('Cantilever', [(head_x - .030, head_y - .050, PIVOT_TOP - .074),
                      (head_x - .040, head_y - .076, PIVOT_TOP - .094)], .0045, stylus_metal, arm)
B.cone('Stylus', (head_x - .042, head_y - .082, PIVOT_TOP - .104), .0075, .0006, .022, chrome, arm,
       vertices=12, rot=(radians(20), 0, 0))

# ── Controls, each exported separately so the runtime can light them ──
cue = B.empty('Cue lever')
B.cylinder('Cue lever post', (PIVOT[0] - .30, PIVOT[1] + .12, .060), .046, .120, alu_brushed, cue, vertices=24, bevel=.006)
B.cube('Cue lever paddle', (PIVOT[0] - .30, PIVOT[1] - .01, .126), (.055, .30, .046), plastic, bevel=.016, parent=cue)

speed_33 = B.empty('Button 33')
B.cylinder('Button 33 well', (-1.25, FRONT, .006), .070, .026, plastic, speed_33, vertices=28, bevel=.004)
B.cylinder('Button 33 cap', (-1.25, FRONT, .026), .054, .034, alu_brushed, speed_33, vertices=28, bevel=.008)

speed_45 = B.empty('Button 45')
B.cylinder('Button 45 well', (-.97, FRONT, .006), .070, .026, plastic, speed_45, vertices=28, bevel=.004)
B.cylinder('Button 45 cap', (-.97, FRONT, .026), .054, .034, alu_brushed, speed_45, vertices=28, bevel=.008)

start_stop = B.empty('Start stop')
B.cube('Start stop well', (-1.90, FRONT, .008), (.30, .24, .030), plastic, bevel=.008, parent=start_stop)
B.cube('Start stop cap', (-1.90, FRONT, .030), (.24, .18, .028), alu_brushed, bevel=.010, parent=start_stop)

power_led = B.empty('Status led')
B.cylinder('Led bezel', (.80, FRONT, .010), .040, .020, plastic, power_led, vertices=20, bevel=.004)
B.sphere('Led dome', (.80, FRONT, .026), (.024, .024, .016), led_green, power_led, segments=20, rings=12)

cue_led = B.empty('Cue led')
B.cylinder('Cue led bezel', (1.02, FRONT, .010), .040, .020, plastic, cue_led, vertices=20, bevel=.004)
B.sphere('Cue led dome', (1.02, FRONT, .026), (.024, .024, .016), led_amber, cue_led, segments=20, rings=12)

# ── Collapse to web groups, keeping the origins the runtime animates ──
metadata_groups = ['Plinth', 'Platter', 'Tonearm base', 'Tonearm', 'Tonearm rest', 'Cue lever',
                   'Button 33', 'Button 45', 'Start stop', 'Status led', 'Cue led', 'Dust cover hinges']
origins = {
    'Platter': (*PLATTER_CENTRE, .048),
    'Tonearm': (*PIVOT, PIVOT_TOP),
    'Cue lever': (PIVOT[0] - .30, PIVOT[1] + .12, .060),
    'Button 33': (-1.25, FRONT, .006),
    'Button 45': (-.97, FRONT, .006),
    'Start stop': (-1.90, FRONT, .008),
    'Status led': (.80, FRONT, .010),
    'Cue led': (1.02, FRONT, .010),
}

# Lighting and camera live outside the exported collection.
world = bpy.data.worlds.new('Listening room ambient')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.10, .09, .16, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .55
area_light(studio, 'Key silk', (-3.2, -4.0, 5.2), 900, 4.5, (1, .93, .84), target=(0, 0, .1))
area_light(studio, 'Chrome streak', (3.6, 1.2, 4.4), 1100, 3.0, (.86, .91, 1), 'RECTANGLE', 6, target=(.6, .4, .1))
area_light(studio, 'Warm rim', (-2.4, 3.4, 3.0), 520, 3.0, (1, .74, .46), target=(0, .3, .1))
cam = camera(studio, 'Deck camera', (3.9, -5.3, 3.5), (0, -.05, .12), ortho=6.4, lens=70)

bpy.context.view_layer.update()
triangles = triangle_count(deck)

metadata = {
    'generator': 'Blender ' + bpy.app.version_string,
    'design': 'Original belt-drive turntable modelled procedurally for Diego Perez',
    'units': 'Matches the Three.js listening-room scene one-for-one',
    'platterCentreYUp': y_up((*PLATTER_CENTRE, .048)),
    'tonearmPivotYUp': y_up((*PIVOT, PIVOT_TOP)),
    'armRestYUp': y_up((*REST, .152)),
    'plinthSize': [4.5, .25, 3.5],
    'platterTopY': .100,
    'tonearmSwingRadians': {'park': 1.2102, 'leadIn': 1.0604, 'mid': .8797, 'runOut': .7006},
    'cameraPositionYUp': y_up(cam.location),
    'orthographicWidth': cam.data.ortho_scale,
    'groups': metadata_groups,
    'animation': {
        'Platter': 'rotate on Y while playing',
        'Tonearm': 'rotate on Y to swing across the record; rotate on Z (negative) to cue the stylus up',
        'Cue lever': 'rotate on X to throw the lever',
    },
    'triangles': triangles,
    'files': {'editable': '/models/turntable.blend', 'web': '/models/turntable.glb'},
}
(MODELS / 'turntable.json').write_text(json.dumps(metadata, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(MODELS / 'turntable.blend'))

join_groups(deck, origins)
export_glb(deck, MODELS / 'turntable.glb')
print('TURNTABLE_TRIANGLES ' + str(triangles))
print('TURNTABLE_BYTES ' + str((MODELS / 'turntable.glb').stat().st_size))
print('TURNTABLE_METADATA ' + json.dumps(metadata))

if RENDER:
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1000
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.render.filepath = str(IMAGES / 'turntable-hero.png')
    bpy.ops.render.render(write_still=True)
    print('TURNTABLE_RENDER_READY ' + scene.render.filepath)
