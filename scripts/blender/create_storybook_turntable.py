"""Original, softly sculpted turntable for Diego's portfolio music player.

Run Blender --background --factory-startup --python this_file.py -- --render.
The editable .blend includes an album-art record for the beauty render only;
the GLB exports the deck's twelve animated mesh groups, never that record.
Coordinates and tonearm travel match the existing site's live music player.
"""
import json
import sys
from math import cos, pi, radians, sin
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.append(str(Path(__file__).resolve().parent))
from common import (Builder, area_light, camera, collection, export_glb,
                    join_groups, material, reset_scene, triangle_count, y_up)

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / 'public/models'
IMAGES = ROOT / 'public/images'
RENDER = '--render' in sys.argv
reset_scene()
scene = bpy.context.scene
deck = collection('Storybook turntable — editable parts')
studio = collection('Studio — lighting and camera')
preview = collection('Render only — album-art record')
B = Builder(deck, default_segments=5)
P = Builder(preview)

# Colors are scene-linear, so the exported enamel stays rich under web lighting.
enamel = material('Oxblood porcelain enamel', (.14, .009, .024), .06, .30)
cream = material('Warm ivory inset', (.82, .75, .61), .05, .34)
caramel = material('Caramel oak trim', (.33, .13, .045), .06, .36)
brass = material('Soft champagne brass', (.61, .38, .16), .74, .25)
buttons = material('Warm brass buttons', (.72, .47, .21), .58, .23)
arm_mat = material('Buttercream tonearm', (.86, .76, .55), .38, .23)
dark = material('Cocoa rubber', (.033, .022, .025), .04, .65)
felt = material('Warm charcoal felt', (.022, .018, .023), .0, .9)
vinyl = material('Render vinyl', (.006, .007, .011), .05, .38)
ink = material('Engraved oxblood', (.10, .012, .023), .18, .48)
chrome = material('Spindle satin gold', (.78, .64, .40), .88, .17)
play_led = material('Play indicator', (.26, .35, .11), .1, .27,
                    emission=(.72, .95, .33), emission_strength=1.7)
cue_led = material('Cue indicator', (.55, .21, .035), .1, .27,
                   emission=(1, .46, .10), emission_strength=.25)
for mat in (enamel, cream):
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Coat Weight'].default_value = .25
    node.inputs['Coat Roughness'].default_value = .24
vinyl.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value = .23

PLATTER = (0, -.10)
PIVOT = (1.72, 1.05)
PIVOT_TOP = .195
REST = (1.259, -1.120)
FRONT = -1.72


def rounded_rectangle(width, height, radius, z, segments=14):
    """Independent plan-radius permits generous corners on a shallow object."""
    points = []
    for cx, cy, start in ((width/2-radius, height/2-radius, 0),
                          (-width/2+radius, height/2-radius, 90),
                          (-width/2+radius, -height/2+radius, 180),
                          (width/2-radius, -height/2+radius, 270)):
        for i in range(segments + 1):
            angle = radians(start + 90 * i / segments)
            points.append((cx + radius*cos(angle), cy + radius*sin(angle), z))
    return points


def sculpted_slab(name, profiles, mat, parent):
    """Loft softly convex sides between rounded-rectangle rings."""
    vertices = []
    for width, height, radius, z in profiles:
        vertices.extend(rounded_rectangle(width, height, radius, z))
    n = len(vertices) // len(profiles)
    faces = [tuple(range(n-1, -1, -1))]
    for ring in range(len(profiles)-1):
        for i in range(n):
            nxt = (i+1) % n
            faces.append((ring*n+i, ring*n+nxt, (ring+1)*n+nxt, (ring+1)*n+i))
    faces.append(tuple((len(profiles)-1)*n+i for i in range(n)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    deck.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    for face in mesh.polygons:
        face.use_smooth = len(face.vertices) == 4
    obj.modifiers.new('Weighted sculpted normals', 'WEIGHTED_NORMAL')
    return obj


plinth = B.empty('Plinth')
# New silhouette: a continuous pillowy shell, not a bevelled thin cuboid.
sculpted_slab('Sculpted oxblood enclosure', [
    (4.35, 3.68, .40, -.50), (4.51, 3.84, .43, -.47),
    (4.61, 3.94, .45, -.40), (4.65, 3.98, .46, -.30),
    (4.64, 3.97, .46, -.16), (4.57, 3.90, .45, -.085),
    (4.46, 3.79, .43, -.050)], enamel, plinth)
sculpted_slab('Floating caramel lower trim', [
    (4.27, 3.60, .39, -.533), (4.39, 3.72, .42, -.518),
    (4.41, 3.74, .42, -.492), (4.38, 3.71, .41, -.476)], caramel, plinth)
sculpted_slab('Champagne top gasket', [
    (4.44, 3.77, .41, -.067), (4.47, 3.80, .42, -.045),
    (4.43, 3.76, .40, -.024)], brass, plinth)
sculpted_slab('Inset ivory playing surface', [
    (4.32, 3.65, .38, -.035), (4.37, 3.70, .39, -.018),
    (4.35, 3.68, .39, -.001)], cream, plinth)
B.cylinder('Recessed platter surround', (*PLATTER, -.009), 1.48, .021, dark,
           plinth, vertices=96, bevel=.005)
B.torus('Soft brass platter surround', (*PLATTER, .003), 1.49, .013,
        brass, plinth, major_seg=96, minor_seg=8)

# A recessed front vent is a small, purposeful handmade detail.
B.cube('Front vent recess', (0, -1.978, -.264), (.93, .025, .16), dark,
       bevel=.065, segments=6, parent=plinth)
for i in range(7):
    B.cube('Rounded vent fin %02d' % i, (-.33+i*.11, -1.998, -.264),
           (.040, .027, .095), brass, bevel=.018, parent=plinth)
for x, y in ((-1.81, -1.40), (1.81, -1.40), (-1.81, 1.40), (1.81, 1.40)):
    B.sphere('Caramel isolation foot', (x, y, -.54), (.25, .25, .12),
             caramel, plinth, segments=32, rings=16)
    B.cylinder('Quiet rubber sole', (x, y, -.645), .175, .04, dark,
               plinth, vertices=32, bevel=.009)

hinges = B.empty('Dust cover hinges')
for x in (-1.56, 1.56):
    B.cube('Rounded hinge saddle', (x, 1.70, .038), (.33, .23, .13),
           enamel, bevel=.055, parent=hinges)
    B.cylinder('Brass hinge barrel', (x, 1.75, .098), .072, .23,
               brass, hinges, rot=(0, pi/2, 0), vertices=32, bevel=.015)

platter = B.empty('Platter')
B.cylinder('Champagne platter skirt', (*PLATTER, .043), 1.42, .090,
           brass, platter, vertices=112, bevel=.019)
B.torus('Platter rolled upper edge', (*PLATTER, .083), 1.398, .011,
        buttons, platter, major_seg=96, minor_seg=8)
B.cylinder('Charcoal slip mat', (*PLATTER, .096), 1.38, .008,
           felt, platter, vertices=96, bevel=.002)
# A few large marks read well at portfolio sizes without fussy machining.
for i in range(40):
    a = i*2*pi/40
    B.sphere('Platter timing bead', (1.422*cos(a), -.10+1.422*sin(a), .035),
             (.012, .012, .017), cream, platter, segments=8, rings=6)
B.cylinder('Spindle', (*PLATTER, .148), .036, .110,
           chrome, platter, vertices=24, bevel=.007)
B.sphere('Rounded spindle tip', (*PLATTER, .200), (.035, .035, .023),
         chrome, platter, segments=24, rings=12)

base = B.empty('Tonearm base')
B.cylinder('Soft pivot pedestal', (*PIVOT, .071), .165, .142,
           enamel, base, vertices=40, bevel=.028)
B.torus('Pedestal brass seam', (*PIVOT, .132), .147, .013,
        brass, base, major_seg=40, minor_seg=10)
B.sphere('Pivot gimbal', (*PIVOT, .163), (.126, .126, .073),
         brass, base, segments=32, rings=16)
B.cylinder('Anti-skate dial', (1.85, 1.42, .047), .095, .091,
           caramel, base, vertices=32, bevel=.020)
B.cylinder('Anti-skate dial cap', (1.85, 1.42, .095), .075, .022,
           buttons, base, vertices=32, bevel=.006)
B.cube('Anti-skate notch', (1.85, 1.42, .108), (.01, .071, .004),
       ink, bevel=.003, parent=base)

rest = B.empty('Tonearm rest')
B.cylinder('Rest pedestal', (*REST, .052), .069, .104,
           brass, rest, vertices=28, bevel=.014)
B.cube('Soft arm cradle', (*REST, .147), (.19, .13, .082),
       caramel, bevel=.036, parent=rest)
B.cube('Arm cradle cushion', (*REST, .185), (.125, .12, .022),
       dark, bevel=.01, parent=rest)

arm = B.empty('Tonearm')
def spine_point(u):
    return .52 - 2.679*u, .22*sin(pi*u) - .30*u**2.2
spine = []
for i in range(56):
    u = i/55
    x, y = spine_point(u)
    spine.append((PIVOT[0]+x, PIVOT[1]+y, PIVOT_TOP+.006*sin(pi*u)))
B.tube('Sweeping buttercream arm', spine, .041, arm_mat, arm,
       resolution=4, taper=lambda t: 1.0-.24*t)
B.cylinder('Caramel counterweight', (2.22, 1.056, PIVOT_TOP), .112, .23,
           caramel, arm, rot=(0, pi/2, 0), vertices=40, bevel=.028)
for off in (-.086, .086):
    B.torus('Counterweight soft band', (2.22+off, 1.056, PIVOT_TOP),
            .104, .012, brass, arm, rot=(0, pi/2, 0), major_seg=32, minor_seg=10)
B.cylinder('Pivot arm collar', (1.92, 1.05, PIVOT_TOP), .074, .16,
           brass, arm, rot=(0, pi/2, 0), vertices=28, bevel=.014)
B.cylinder('Balancing dial', (2.03, 1.05, PIVOT_TOP), .091, .042,
           enamel, arm, rot=(0, pi/2, 0), vertices=32, bevel=.010)
hx, hy = spine_point(1)
hx += PIVOT[0]
hy += PIVOT[1]
B.cube('Rounded ivory headshell', (hx, hy, PIVOT_TOP-.009),
       (.25, .15, .076), arm_mat, bevel=.037, parent=arm, rot=(0, 0, radians(-22)))
B.cube('Burgundy cartridge', (hx-.012, hy+.010, PIVOT_TOP-.058),
       (.101, .128, .055), enamel, bevel=.018, parent=arm, rot=(0, 0, radians(-22)))
B.tube('Finger lift loop', [(hx+.01, hy-.054, .212), (hx-.015, hy-.115, .251),
                          (hx-.05, hy-.145, .245), (hx-.082, hy-.148, .225)],
       .015, brass, arm, resolution=4)
B.tube('Stylus cantilever', [(hx-.030, hy-.050, .121), (hx-.040, hy-.076, .101)],
       .006, chrome, arm, resolution=2)
B.cone('Diamond stylus', (hx-.042, hy-.082, .091), .009, .0008, .022,
       chrome, arm, vertices=12, rot=(radians(20), 0, 0))

cue = B.empty('Cue lever')
B.cylinder('Cue pedestal', (1.42, 1.17, .060), .056, .120,
           brass, cue, vertices=28, bevel=.012)
B.cube('Cream cue paddle', (1.42, 1.04, .131), (.088, .30, .062),
       arm_mat, bevel=.03, parent=cue)

# Every control retains its own node for browser interaction.
for name, x, dots in (('Button 33', -.93, 1), ('Button 45', -.61, 2)):
    group = B.empty(name)
    B.cylinder(name+' enamel well', (x, FRONT, .013), .115, .041,
               enamel, group, vertices=32, bevel=.012)
    B.cylinder(name+' pill cap', (x, FRONT, .047), .094, .050,
               buttons, group, vertices=40, bevel=.02)
    for dot in range(dots):
        B.sphere(name+' tactile speed mark', (x+(dot-(dots-1)/2)*.040, FRONT, .074),
                 (.009, .020, .0035), ink, group, segments=10, rings=6)
start = B.empty('Start stop')
B.cylinder('Enamel start button well', (-1.75, -1.51, .018), .205, .049,
           dark, start, vertices=40, bevel=.014)
B.cylinder('Large champagne play button', (-1.75, -1.51, .055), .175, .075,
           buttons, start, vertices=48, bevel=.031)
# Deboss-like geometric play icon, no branding.
B.cone('Play glyph', (-1.745, -1.51, .095), .063, .063, .004,
       ink, start, vertices=3, rot=(0, 0, -pi/2))

for name, x, mat in (('Status led', .91, play_led), ('Cue led', 1.18, cue_led)):
    group = B.empty(name)
    B.cylinder(name+' rounded bezel', (x, FRONT, .016), .069, .035,
               brass, group, vertices=28, bevel=.009)
    B.sphere(name+' glass jewel', (x, FRONT, .044), (.040, .040, .024),
             mat, group, segments=24, rings=12)
# A quiet horizontal inlay at right balances the controls, without a logo.
B.cube('Right cream inlay', (1.70, -1.58, .01), (.35, .13, .020),
       caramel, bevel=.045, parent=plinth)
for i in range(3):
    B.cube('Right inlay line', (1.59+i*.105, -1.58, .022), (.048, .035, .004),
           cream, bevel=.010, parent=plinth)

# Studio and render-only sleeve art. Its collection is never in the GLB export.
P.cylinder('Preview LP', (*PLATTER, .116), 1.40, .028,
           vinyl, vertices=128, bevel=.006)
for radius in [0.69+i*.024 for i in range(28)]:
    P.torus('Preview LP groove', (*PLATTER, .131), radius, .0015,
            dark, major_seg=128, minor_seg=4)
art_path = IMAGES / 'music/about.jpg'
if art_path.exists():
    art = material('Render-only album artwork', (1, 1, 1), .0, .48)
    nodes = art.node_tree.nodes
    texture = nodes.new('ShaderNodeTexImage')
    texture.image = bpy.data.images.load(str(art_path))
    texture.image.pack()
    art.node_tree.links.new(texture.outputs['Color'], nodes.get('Principled BSDF').inputs['Base Color'])
    verts = [(0, -.10, .133)]
    verts += [(0.64*cos(i*2*pi/96), -.10+0.64*sin(i*2*pi/96), .133) for i in range(96)]
    faces = [(0, i+1, (i+1)%96+1) for i in range(96)]
    mesh = bpy.data.meshes.new('Album label mesh')
    mesh.from_pydata(verts, [], faces)
    mesh.uv_layers.new(name='Album artwork UV')
    for poly in mesh.polygons:
        for index in poly.loop_indices:
            co = mesh.vertices[mesh.loops[index].vertex_index].co
            mesh.uv_layers.active.data[index].uv = (co.x/1.28+.5, (co.y+.10)/1.28+.5)
    label = bpy.data.objects.new('Render only — album label', mesh)
    preview.objects.link(label)
    label.data.materials.append(art)
P.cylinder('Preview spindle centre', (*PLATTER, .135), .065, .005,
           dark, vertices=32, bevel=.001)

world = bpy.data.worlds.new('Warm ivory studio world')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.78, .74, .67, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .40
area_light(studio, 'Large soft key', (-3.5, -4.2, 6.5), 800, 5.0, (1, .92, .81), target=(0, 0, -.1))
area_light(studio, 'Long porcelain reflection', (3.8, -.2, 5.0), 700, 3.0,
           (.88, .94, 1), 'RECTANGLE', 5.5, target=(0, 0, 0))
area_light(studio, 'Honey rim', (-1.5, 4.0, 3.5), 650, 3.2, (1, .76, .46), target=(0, 0, -.1))
area_light(studio, 'Front bounce', (1, -4.0, 1.0), 90, 3, (1, .85, .74), target=(0, 0, -.3))
cam = camera(studio, 'Storybook hero camera', (4.8, -6.5, 4.45), (0, -.03, -.12), ortho=6.75, lens=65)
S = Builder(studio)
floor = S.cube('Studio contact shadow catcher', (0, 0, -.690), (200, 200, .05),
               cream, bevel=0)
floor.is_shadow_catcher = True

# Save an editable primitive source with a meaningful playing pose.
for child in list(arm.children):
    child.location -= Vector((*PIVOT, PIVOT_TOP))
arm.location = (*PIVOT, PIVOT_TOP)
arm.rotation_euler = (0, 0, 1.0604)
scene.render.engine = 'CYCLES'
scene.cycles.samples = 80
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.render.resolution_x = 1600
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.render.filepath = str(IMAGES / 'storybook-turntable.png')
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(MODELS / 'storybook-turntable.blend'))
if RENDER:
    bpy.ops.render.render(write_still=True)
    print('STORYBOOK_RENDER_READY ' + scene.render.filepath, flush=True)

# The runtime supplies the playing pose and live record; export their rest basis.
arm.rotation_euler = (0, 0, 0)
bpy.context.view_layer.update()
origins = {
    'Platter': (*PLATTER, .048), 'Tonearm': (*PIVOT, PIVOT_TOP),
    'Cue lever': (1.42, 1.17, .060), 'Button 33': (-.93, FRONT, .013),
    'Button 45': (-.61, FRONT, .013), 'Start stop': (-1.75, -1.51, .018),
    'Status led': (.91, FRONT, .016), 'Cue led': (1.18, FRONT, .016),
}
join_groups(deck, origins)
triangles = triangle_count(deck)
export_glb(deck, MODELS / 'storybook-turntable.glb')
metadata = {
    'generator': 'Blender '+bpy.app.version_string,
    'design': 'Original sculpted animated-film-style turntable: oxblood enamel, warm ivory, champagne brass and caramel oak.',
    'platterCentreYUp': [0, .048, .10], 'platterTopY': .100,
    'discRadius': 1.40, 'tonearmPivotYUp': y_up((*PIVOT, PIVOT_TOP)),
    'bottomY': -.665, 'plinthSizeYUp': [4.65, .532, 3.98],
    'tonearmSwingRadians': {'park': 1.2102, 'leadIn': 1.0604, 'mid': .8797},
    'buttonMaterial': buttons.name, 'indicatorMaterials': [play_led.name, cue_led.name],
    'groups': [obj.name for obj in deck.objects], 'triangles': triangles,
    'cameraPositionYUp': y_up(cam.location), 'orthographicWidth': cam.data.ortho_scale,
    'files': {'editable': '/models/storybook-turntable.blend',
              'web': '/models/storybook-turntable.glb', 'render': '/images/storybook-turntable.png'},
    'renderOnly': 'Album-art record and studio live in separate collections and are excluded from the GLB.',
}
(MODELS / 'storybook-turntable.json').write_text(json.dumps(metadata, indent=2)+'\n')
print('STORYBOOK_METADATA '+json.dumps(metadata), flush=True)
print('STORYBOOK_GLB_BYTES '+str((MODELS/'storybook-turntable.glb').stat().st_size), flush=True)
