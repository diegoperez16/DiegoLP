"""Build Diego's original curiosity-studio objects with Blender 5.2.

Run from the repository root:
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/blender/create_studio.py

No external textures or add-ons. Curves and primitives remain editable in .blend.
The web GLB contains only the collectible objects; camera/lights/floor stay in .blend.
"""

from pathlib import Path
from math import sin, cos, pi, radians
import json
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / 'public' / 'models'
IMAGES = ROOT / 'public' / 'images'
MODELS.mkdir(parents=True, exist_ok=True)
IMAGES.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

scene = bpy.context.scene
objects = bpy.data.collections.new('Curiosity Studio — collectibles')
scene.collection.children.link(objects)
studio = bpy.data.collections.new('Studio — lighting and camera')
scene.collection.children.link(studio)


def move_to(obj, coll=objects):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)
    return obj


def material(name, rgb, metal=0, rough=.4):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return mat


silver = material('Satin polished aluminium', (.61, .63, .65), .94, .2)
chrome = material('Mirror edge silver', (.8, .82, .84), 1, .12)
leather = material('Aubergine padded leather', (.045, .014, .025), .05, .48)
cloth = material('Deep ink acoustic cloth', (.01, .011, .015), .0, .88)
oxblood = material('Oxblood cloth binding', (.061, .003, .009), .0, .66)
red = material('Translucent-look burgundy vinyl', (.078, .004, .011), .38, .29)
paper = material('Ivory deckled pages', (.88, .82, .68), 0, .7)
gold = material('Brushed warm gold', (.64, .38, .105), .85, .2)
black = material('Fountain pen black lacquer', (.011, .012, .016), .15, .16)
cream = material('Warm ivory stage', (.905, .877, .829), 0, .77)


def finish(obj, name, mat=None, parent=None):
    obj.name = name
    move_to(obj)
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    if obj.type == 'MESH':
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def group(name, location=(0,0,0), rotation=(0,0,0)):
    obj = bpy.data.objects.new(name, None)
    objects.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def cube(name, loc, dims, mat, bevel=.05, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = finish(bpy.context.object, name, mat, parent)
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Soft machined edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 5
        mod = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return obj


def sphere(name, loc, scale, mat, parent=None, segments=40):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=24, radius=1, location=loc)
    obj = finish(bpy.context.object, name, mat, parent)
    obj.scale = scale
    return obj


def tube(name, coords, radius, mat, parent=None, cyclic=False):
    c = bpy.data.curves.new(name, 'CURVE')
    c.dimensions = '3D'
    c.resolution_u = 2
    c.bevel_depth = radius
    c.bevel_resolution = 3
    s = c.splines.new('POLY')
    s.points.add(len(coords)-1)
    for point, coord in zip(s.points, coords):
        point.co = (*coord, 1)
    s.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, c)
    objects.objects.link(obj)
    c.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj


def cylinder(name, loc, radius, depth, mat, parent=None, rot=(0,0,0), vertices=80):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = finish(bpy.context.object, name, mat, parent)
    mod = obj.modifiers.new('Rounded rim', 'BEVEL')
    mod.width = min(.014, depth / 4)
    mod.segments = 3
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj


def band(name, radius_x, radius_z, origin_z, width, thickness, mat, parent):
    # An elliptical ribbon with rounded oval cross-section.
    verts, faces = [], []
    steps, cross = 72, 10
    for i in range(steps+1):
        t = -0.02*pi + 1.04*pi*i/steps
        x, z = radius_x*cos(t), origin_z+radius_z*sin(t)
        n = Vector((cos(t)/radius_x, 0, sin(t)/radius_z)).normalized()
        for j in range(cross):
            a = 2*pi*j/cross
            verts.append((x+n.x*thickness*cos(a), width*sin(a), z+n.z*thickness*cos(a)))
    for i in range(steps):
        for j in range(cross):
            nj = (j+1)%cross
            faces.append((i*cross+j, i*cross+nj, (i+1)*cross+nj, (i+1)*cross+j))
    faces += [tuple(range(cross-1,-1,-1)), tuple(steps*cross+j for j in range(cross))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    objects.objects.link(obj)
    obj.parent = parent
    mesh.materials.append(mat)
    for p in mesh.polygons:
        p.use_smooth = True
    return obj


# The hero object. Slight yaw reveals the sculpted ear cup and the inner padding.
headphones = group('Headphones', (.52, .4, .48), (0, radians(-11), radians(-12)))
band('Continuous aluminium headband', .99, 1.17, 1.12, .18, .036, silver, headphones)
band('Plush headband underside', .982, 1.108, 1.11, .16, .042, leather, headphones)
for side in (-1, 1):
    x = side*.99
    cube(f'{side} telescoping stem', (x, 0, 1.04), (.062,.082,.48), chrome, .024, headphones)
    # Ear cushions form a soft rectangular halo around the acoustic mesh.
    cube(f'{side} cushion', (side*.83, 0, .7), (.22,.67,.89), leather, .12, headphones)
    cube(f'{side} inner acoustic mesh', (side*.7, 0, .7), (.018,.43,.62), cloth, .09, headphones)
    cube(f'{side} aluminium ear shell', (side*1.015, 0, .7), (.235,.73,.94), silver, .13, headphones)
    cube(f'{side} machined shell face', (side*1.143, 0, .7), (.025,.51,.72), chrome, .011, headphones)
    cylinder(f'{side} pivot', (side*1.004, 0, 1.245), .065,.14, chrome, headphones, rot=(radians(90),0,0), vertices=32)
    # Discreet vent slots in the aluminium cup.
    for i in range(4):
        cube(f'{side} speaker vent {i}', (side*1.16, -.10+i*.065, .43), (.011,.029,.018), cloth, .007, headphones)
    cylinder(f'{side} crown control', (side*1.18,.1,1.01), .047,.045, gold, headphones, rot=(0,pi/2,0), vertices=32)


# Two clothbound books, with generous cover overhang and understated gold tooling.
def book(name, location, dims, angle):
    root = group(name, location, (0,0,radians(angle)))
    w,d,h = dims
    cube('Ivory page block', (0,0,h/2), (w-.09,d-.07,h-.07), paper, .025, root)
    for z in (.024,h-.024):
        cube('Clothbound cover', (0,0,z), (w,d,.047), oxblood, .02, root)
    cube('Rounded book spine', (-w/2+.025,0,h/2), (.085,d,h), oxblood, .035, root)
    for yy in (-d*.34,d*.34):
        cube('Gold spine rule', (-w/2-.019,yy,h/2), (.004,.018,h*.68), gold, .002, root)
    # A few fine page edges read naturally without bloating the web mesh.
    for i in range(6):
        z=.065 + (h-.12)*i/5
        cube('Fine page edge', (.031,-d/2+.031,z), (w-.17,.0015,.002), cream, 0, root)
    return root

book('Book — stories', (-.87,-.45,.025), (1.52,1.02,.31), -13)
book('Book — observations', (-.92,-.45,.345), (1.37,.92,.24), 6)


# A red vinyl record: the grooves are actual fine geometry.
record = group('Record', (1.12,-.44,.09), (radians(4),radians(-7),radians(-13)))
cylinder('Burgundy vinyl', (0,0,0), .72,.042, red, record, vertices=112)
for radius in (.30,.36,.425,.49,.555,.62,.66,.69):
    points=[(radius*cos(a*2*pi/112),radius*sin(a*2*pi/112),.024) for a in range(112)]
    tube('Concentric record groove', points, .0018, leather, record, cyclic=True)
cylinder('Ivory center label', (0,0,.024), .228,.0025, paper, record, vertices=64)
cylinder('Gold center ring', (0,0,.027), .073,.0025, gold, record, vertices=48)
cylinder('Spindle hole', (0,0,.03), .025,.003, cloth, record, vertices=32)


# Original winged kinetic orb: abstract calligraphic gold feathers.
orb = group('Golden flight', (-1.25,.28,1.56), (radians(-8),radians(-12),radians(-13)))
sphere('Golden orb', (0,0,0), (.225,.225,.225), gold, orb, segments=48)
for offset in (-.11,.0,.11):
    rr=(.225**2-offset**2)**.5
    tube('Orb engraved latitude', [(rr*cos(t*2*pi/80),rr*sin(t*2*pi/80),offset) for t in range(80)], .003, chrome, orb, cyclic=True)
for side in (-1,1):
    # One sweep and separate shaped feather loops on each side, unlike any film prop.
    spine=[]
    for i in range(36):
        t=i/35
        spine.append((side*(.19+.81*t), .005+.1*t, .09+.3*sin(t*pi*.72)))
    tube('Wing leading edge',spine,.014,gold,orb)
    for index in range(7):
        start=.20+index*.052
        reach=.39+index*.10
        height=.13+index*.041
        points=[]
        for i in range(32):
            t=i/31
            x=start+(reach-start)*sin(pi*t/2)
            z=.035+height*sin(pi*t)-.07*t+index*.018
            points.append((side*x,.0+.025*sin(pi*t),z))
        tube('Calligraphic wing feather',points,.0075,gold,orb)


# An elegant fountain pen in front of the books.
pen = group('Fountain pen', (.02,-1.26,.095), (0,radians(87),radians(29)))
cylinder('Black lacquer barrel', (0,0,.0), .049,1.04, black, pen, vertices=48)
cylinder('Gold cap rim', (0,0,.27), .052,.03, gold, pen, vertices=48)
cylinder('Gold end piece', (0,0,-.52), .043,.024, gold, pen, vertices=48)
tube('Gold pocket clip',[(.052,0,.49),(.073,0,.46),(.073,0,.18)],.009,gold,pen)
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=.044,radius2=.005,depth=.19,location=(0,0,.61))
finish(bpy.context.object,'Tapered golden nib',gold,pen)


# Warm photographic stage; shadow catcher keeps the hero compositable over ivory.
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.06))
floor=bpy.context.object
floor.name='Shadow-catching stage'
move_to(floor, studio)
floor.data.materials.append(cream)
floor.is_shadow_catcher=True

world=bpy.data.worlds.new('Warm photographic ambient')
scene.world=world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.83,.86,1,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35

def light(name, location, power, size, color, shape='DISK', size_y=None):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.shape=shape
    data.size=size
    if size_y is not None:
        data.size_y=size_y
    data.color=color
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=location
    obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj

light('Large silk key',(-3.5,-4.5,7),650,5.0,(1,.93,.85))
light('Long chrome reflection',(4,1,5),950,3.5,(.88,.93,1),'RECTANGLE',6)
light('Soft frontal fill',(1,-6,2.5),180,3,(1,.96,.90))
light('Warm rim',(-3,4,4),700,3,(1,.77,.49),'RECTANGLE',5)

camera_data=bpy.data.cameras.new('Editorial orthographic camera')
camera=bpy.data.objects.new('Editorial orthographic camera',camera_data)
studio.objects.link(camera)
camera.location=(5.8,-9.2,5.5)
target=Vector((-.03,-.1,1.35))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO'
camera_data.ortho_scale=4.72
camera_data.lens=65
scene.camera=camera

scene.render.engine='CYCLES'
scene.cycles.samples=72
scene.cycles.use_denoising=True
scene.cycles.max_bounces=8
scene.render.resolution_x=1200
scene.render.resolution_y=1080
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.image_settings.color_depth='8'
scene.render.filepath=str(IMAGES/'studio-hero.png')
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.compression=55

# Camera transform in glTF's Y-up convention for matching the still image on the web.
bpy.context.view_layer.update()
mesh_bounds=[]
depsgraph=bpy.context.evaluated_depsgraph_get()
for ob in objects.objects:
    if ob.type in {'MESH','CURVE'}:
        ev=ob.evaluated_get(depsgraph)
        evaluated_mesh=ev.to_mesh()
        mesh_bounds.extend([ev.matrix_world@v.co for v in evaluated_mesh.vertices])
        ev.to_mesh_clear()
bounds_min=[min(v[i] for v in mesh_bounds) for i in range(3)]
bounds_max=[max(v[i] for v in mesh_bounds) for i in range(3)]
metadata={
  'generator':'Blender '+bpy.app.version_string,
  'design':'Original objects modeled procedurally for Diego Perez',
  'cameraPositionYUp':[camera.location.x,camera.location.z,-camera.location.y],
  'cameraTargetYUp':[target.x,target.z,-target.y],
  'orthographicWidth':camera_data.ortho_scale,
  'boundsBlenderZUp':{'min':bounds_min,'max':bounds_max},
  'groups':['Headphones','Book — stories','Book — observations','Record','Golden flight','Fountain pen'],
  'background':'transparent; composed for #f4f1e9 or another warm ivory',
  'files':{'editable':'/models/curiosity-studio.blend','web':'/models/curiosity-studio.glb','hero':'/images/studio-hero.png'}
}
(MODELS/'curiosity-studio.json').write_text(json.dumps(metadata,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(MODELS/'curiosity-studio.blend'))

# Collapse the web copy to six groups to reduce draw calls. The saved .blend above
# retains every separate curve, primitive, material, modifier, light, and camera.
for root in (headphones, *[ob for ob in objects.objects if ob.parent is None and ob.type == 'EMPTY' and ob != headphones]):
    children = [ob for ob in root.children_recursive if ob.type in {'MESH', 'CURVE'}]
    if not children:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    for ob in children:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = children[0]
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.join()
    bpy.context.object.name = root.name + ' — geometry'

# Export a texture-free GLB, without a decoder dependency or external textures.
bpy.ops.object.select_all(action='DESELECT')
for ob in objects.objects:
    ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(MODELS/'curiosity-studio.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_yup=True)
print('ASSET_METADATA '+json.dumps(metadata))
print('GLB_BYTES '+str((MODELS/'curiosity-studio.glb').stat().st_size))
bpy.ops.render.render(write_still=True)
print('STUDIO_RENDER_READY '+scene.render.filepath)
