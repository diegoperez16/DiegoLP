"""Shared modelling helpers for Diego's original Blender scenes.

Imported by create_studio.py, create_turntable.py and create_hogwarts.py.
Everything is built from editable primitives and curves: no external
textures, HDRIs, add-ons or downloaded meshes.
"""

from math import cos, pi, sin
import bpy
from mathutils import Matrix, Vector


def reset_scene():
    """Start from an empty file even when Blender opened a default scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def collection(name):
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


class Builder:
    """Primitive factory bound to one target collection."""

    def __init__(self, target, default_segments=4):
        self.target = target
        self.default_segments = default_segments

    # ── plumbing ────────────────────────────────────────────────────
    def adopt(self, obj):
        for existing in list(obj.users_collection):
            existing.objects.unlink(obj)
        self.target.objects.link(obj)
        return obj

    def finish(self, obj, name, mat=None, parent=None, smooth=True):
        obj.name = name
        self.adopt(obj)
        if mat:
            obj.data.materials.append(mat)
        if parent:
            obj.parent = parent
        if smooth and obj.type == 'MESH':
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
        return obj

    def empty(self, name, location=(0, 0, 0), rotation=(0, 0, 0), parent=None):
        obj = bpy.data.objects.new(name, None)
        self.target.objects.link(obj)
        obj.location = location
        obj.rotation_euler = rotation
        if parent:
            obj.parent = parent
        return obj

    # ── primitives ──────────────────────────────────────────────────
    def cube(self, name, loc, dims, mat, bevel=.02, parent=None, rot=(0, 0, 0), segments=None, smooth=True):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
        obj = self.finish(bpy.context.object, name, mat, parent, smooth=False)
        obj.dimensions = dims
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            mod = obj.modifiers.new('Machined edge', 'BEVEL')
            mod.width = bevel
            mod.segments = self.default_segments if segments is None else segments
            mod.harden_normals = True
            obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        if smooth:
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
        return obj

    def cylinder(self, name, loc, radius, depth, mat, parent=None, rot=(0, 0, 0), vertices=64, bevel=.008):
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
        obj = self.finish(bpy.context.object, name, mat, parent)
        if bevel:
            mod = obj.modifiers.new('Rounded rim', 'BEVEL')
            mod.width = min(bevel, depth / 4, radius / 4)
            mod.segments = 3
            mod.harden_normals = True
            obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        return obj

    def cone(self, name, loc, radius1, radius2, depth, mat, parent=None, rot=(0, 0, 0), vertices=48):
        bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth,
                                        location=loc, rotation=rot)
        return self.finish(bpy.context.object, name, mat, parent)

    def sphere(self, name, loc, scale, mat, parent=None, segments=32, rings=18):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=loc)
        obj = self.finish(bpy.context.object, name, mat, parent)
        obj.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        return obj

    def torus(self, name, loc, major, minor, mat, parent=None, rot=(0, 0, 0), major_seg=40, minor_seg=12):
        bpy.ops.mesh.primitive_torus_add(location=loc, rotation=rot, major_radius=major, minor_radius=minor,
                                         major_segments=major_seg, minor_segments=minor_seg)
        return self.finish(bpy.context.object, name, mat, parent)

    def tube(self, name, coords, radius, mat, parent=None, cyclic=False, resolution=3, taper=None):
        curve = bpy.data.curves.new(name, 'CURVE')
        curve.dimensions = '3D'
        curve.resolution_u = 3
        curve.bevel_depth = radius
        curve.bevel_resolution = resolution
        spline = curve.splines.new('POLY')
        spline.points.add(len(coords) - 1)
        for point, coord in zip(spline.points, coords):
            point.co = (*coord, 1)
        if taper is not None:
            for index, point in enumerate(spline.points):
                point.radius = taper(index / max(len(coords) - 1, 1))
        spline.use_cyclic_u = cyclic
        obj = bpy.data.objects.new(name, curve)
        self.target.objects.link(obj)
        curve.materials.append(mat)
        if parent:
            obj.parent = parent
        return obj

    def ring_of(self, factory, count, radius, centre=(0, 0), z=0, phase=0.0):
        """Place `count` copies around a circle. factory(index, x, y, z, angle)."""
        made = []
        for index in range(count):
            angle = phase + 2 * pi * index / count
            made.append(factory(index, centre[0] + radius * cos(angle), centre[1] + radius * sin(angle), z, angle))
        return made


def material(name, rgb, metal=0.0, rough=.45, emission=None, emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, alpha)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get('Principled BSDF')
    principled.inputs['Base Color'].default_value = (*rgb, 1)
    principled.inputs['Metallic'].default_value = metal
    principled.inputs['Roughness'].default_value = rough
    if 'Alpha' in principled.inputs:
        principled.inputs['Alpha'].default_value = alpha
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
    if emission is not None:
        for key in ('Emission Color', 'Emission'):
            if key in principled.inputs:
                principled.inputs[key].default_value = (*emission, 1)
                break
        if 'Emission Strength' in principled.inputs:
            principled.inputs['Emission Strength'].default_value = emission_strength
    return mat


def set_origin(obj, point):
    """Move an object's origin to a world-space point, keeping geometry put.

    Done by hand rather than via bpy.ops.object.origin_set, which does not
    reliably honour the 3D cursor in --background runs.
    """
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    target = Vector(point)
    obj.data.transform(Matrix.Translation(-target))
    obj.location = target
    bpy.context.view_layer.update()


def join_groups(coll, origins=None):
    """Collapse each top-level empty's descendants into one mesh named after it.

    `origins` maps a group name to the world point its origin should sit at, so
    the web runtime can rotate or translate the part directly.
    """
    origins = origins or {}
    roots = [ob for ob in coll.objects if ob.type == 'EMPTY' and ob.parent is None]
    joined = []
    for root in roots:
        children = [ob for ob in root.children_recursive if ob.type in {'MESH', 'CURVE'}]
        if not children:
            continue
        # Bake each child's full world transform (including the group's own scale and
        # location) before joining — join reads matrix_world, which is stale until the
        # depsgraph runs, and would otherwise drop a scaled or moved parent.
        bpy.context.view_layer.update()
        for child in children:
            world = child.matrix_world.copy()
            child.parent = None
            child.matrix_world = world
        bpy.context.view_layer.update()
        bpy.ops.object.select_all(action='DESELECT')
        for child in children:
            child.select_set(True)
        bpy.context.view_layer.objects.active = children[0]
        bpy.ops.object.convert(target='MESH')
        bpy.ops.object.join()
        merged = bpy.context.object
        # Free the group name before claiming it, so no ".001" suffix reaches the GLB.
        wanted = root.name
        root.name = wanted + ' — source'
        merged.name = wanted
        merged.parent = None
        if wanted in origins:
            set_origin(merged, origins[wanted])
        joined.append(merged)
    for root in roots:
        bpy.data.objects.remove(root, do_unlink=True)
    return joined


def export_glb(coll, filepath, draco=False):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in coll.objects:
        obj.select_set(True)
    options = dict(
        filepath=str(filepath), export_format='GLB', use_selection=True, export_apply=True,
        export_animations=False, export_cameras=False, export_lights=False, export_yup=True,
    )
    if draco:
        # Heavy scenes ship Draco-compressed; the runtime loads the decoder on demand.
        options.update(export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                       export_draco_position_quantization=14, export_draco_normal_quantization=10)
    bpy.ops.export_scene.gltf(**options)
    return filepath


def triangle_count(coll):
    total = 0
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in coll.objects:
        if obj.type not in {'MESH', 'CURVE'}:
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        total += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
    return total


def area_light(coll, name, location, power, size, color, shape='DISK', size_y=None, target=(0, 0, 0)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.shape = shape
    data.size = size
    if size_y is not None:
        data.size_y = size_y
    data.color = color
    obj = bpy.data.objects.new(name, data)
    coll.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - Vector(location)).to_track_quat('-Z', 'Y').to_euler()
    return obj


def camera(coll, name, location, target, ortho=None, lens=60):
    data = bpy.data.cameras.new(name)
    obj = bpy.data.objects.new(name, data)
    coll.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - Vector(location)).to_track_quat('-Z', 'Y').to_euler()
    if ortho:
        data.type = 'ORTHO'
        data.ortho_scale = ortho
    data.lens = lens
    bpy.context.scene.camera = obj
    return obj


def y_up(point):
    """Blender Z-up world point -> glTF Y-up, matching export_yup=True."""
    return [point[0], point[2], -point[1]]
