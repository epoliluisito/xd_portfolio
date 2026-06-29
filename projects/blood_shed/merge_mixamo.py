import bpy
import os

def reset_blend():
    # Delete all objects in the scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Brute-force purge to ensure a 100% clean slate between characters
    for col in [bpy.data.meshes, bpy.data.armatures, bpy.data.materials, bpy.data.actions, bpy.data.images]:
        for block in col:
            col.remove(block)

def process_character(idle_fbx, walk_fbx, out_glb):
    reset_blend()
    print(f"\n--- Processing: {os.path.basename(out_glb)} ---")
    
    # 1. IMPORT IDLE (Contains Skin + Idle Anim)
    actions_before = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=idle_fbx)
    actions_after = set(bpy.data.actions)
    
    # Grab the idle action and rename it
    idle_action = list(actions_after - actions_before)[0] if (actions_after - actions_before) else None
    if idle_action:
        idle_action.name = "_idle"
    
    # Identify the main armature (the rig)
    main_armature = next((obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE'), None)
    
    # 2. IMPORT WALK (Contains Rig + Walk Anim)
    actions_before = set(bpy.data.actions)
    objects_before = set(bpy.context.scene.objects)
    
    bpy.ops.import_scene.fbx(filepath=walk_fbx)
    
    actions_after = set(bpy.data.actions)
    objects_after = set(bpy.context.scene.objects)
    
    # Grab the walk action and rename it
    walk_action = list(actions_after - actions_before)[0] if (actions_after - actions_before) else None
    if walk_action:
        walk_action.name = "_walk"
        
    new_objects = objects_after - objects_before
    
    # 3. CONSOLIDATE ANIMATIONS INTO MAIN RIG
    if main_armature:
        if not main_armature.animation_data:
            main_armature.animation_data_create()
            
        # Clear existing NLA tracks to avoid duplicates
        for track in main_armature.animation_data.nla_tracks:
            main_armature.animation_data.nla_tracks.remove(track)
            
        # Push Idle Action to an NLA track
        if idle_action:
            track_idle = main_armature.animation_data.nla_tracks.new()
            track_idle.name = "_idle"
            track_idle.strips.new(name="_idle", start=int(idle_action.frame_start), action=idle_action)
            
        # Push Walk Action to an NLA track
        if walk_action:
            track_walk = main_armature.animation_data.nla_tracks.new()
            track_walk.name = "_walk"
            track_walk.strips.new(name="_walk", start=int(walk_action.frame_start), action=walk_action)
        
        # Clear active action to prevent Blender from exporting a duplicate "default" animation
        main_armature.animation_data.action = None

    # 4. CLEANUP (Delete the walk rig, keep only the walk action data)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in new_objects:
        obj.select_set(True)
    bpy.ops.object.delete()
    
    # 5. EXPORT GLB
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        export_animations=True
    )
    print(f"Successfully exported: {out_glb}")

# Paths (Targeting your Mac's Downloads folder)
downloads = os.path.expanduser('~/Downloads')

# Greg
greg_idle = os.path.join(downloads, 'greg_idle.fbx')
greg_walk = os.path.join(downloads, 'greg_walk.fbx')
greg_glb = os.path.join(downloads, 'greg.glb')

# Tim
tim_idle = os.path.join(downloads, 'tim_idle.fbx')
tim_walk = os.path.join(downloads, 'tim_walking.fbx')
tim_glb = os.path.join(downloads, 'tim.glb')

# Run Execution
try:
    process_character(greg_idle, greg_walk, greg_glb)
    process_character(tim_idle, tim_walk, tim_glb)
    print("\n--- All tasks completed successfully! ---")
except Exception as e:
    print(f"\nError encountered: {e}")