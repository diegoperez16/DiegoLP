"""Optimize and re-export the existing editable scene without re-rendering.

Blender --background public/models/curiosity-studio.blend --python scripts/blender/export_web.py
"""
from pathlib import Path
import bpy

root_path = Path(__file__).resolve().parents[2]
collection = bpy.data.collections['Curiosity Studio — collectibles']
roots = [ob for ob in collection.objects if ob.type == 'EMPTY' and ob.parent is None]
for root in roots:
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

bpy.ops.object.select_all(action='DESELECT')
for ob in collection.objects:
    ob.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(root_path/'public/models/curiosity-studio.glb'),
    export_format='GLB', use_selection=True, export_apply=True,
    export_animations=False, export_cameras=False, export_lights=False, export_yup=True,
)
