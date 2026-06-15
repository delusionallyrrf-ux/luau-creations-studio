// Starter Luau / Blender templates seeded into the generator panel.
// The AI can expand/customize them based on the chat conversation.
// Tone goal: peaceful, charming, "grow-a-garden" / cozy-Roblox energy.

export const TEMPLATES: Record<string, { name: string; lang: "lua" | "python"; code: string }[]> = {
  terrain: [
    {
      name: "Rolling Hills + River",
      lang: "lua",
      code: `-- Cozy rolling hills with a winding river. ServerScriptService.
local Terrain = workspace.Terrain
local SIZE = Vector3.new(512, 64, 512)
local RES = 4

for x = -SIZE.X/2, SIZE.X/2, RES do
\tfor z = -SIZE.Z/2, SIZE.Z/2, RES do
\t\tlocal h = math.noise(x/140, z/140) * 32
\t\tlocal river = math.abs(math.noise(x/200, 0.5) * 60 - z)
\t\tlocal mat = Enum.Material.Grass
\t\tif river < 6 then h = -4; mat = Enum.Material.Water end
\t\tlocal r = Region3.new(
\t\t\tVector3.new(x, -32, z),
\t\t\tVector3.new(x + RES, h, z + RES)
\t\t):ExpandToGrid(4)
\t\tTerrain:FillRegion(r, 4, mat)
\tend
end
print("Hills + river generated")
`,
    },
    {
      name: "Floating Sky Islands",
      lang: "lua",
      code: `-- Whimsical floating islands. Peaceful pastel vibe.
local ISLANDS = 8
for i = 1, ISLANDS do
\tlocal pos = Vector3.new(math.random(-300,300), math.random(60,180), math.random(-300,300))
\tlocal base = Instance.new("Part", workspace)
\tbase.Anchored = true
\tbase.Shape = Enum.PartType.Ball
\tbase.Size = Vector3.new(60,40,60)
\tbase.Position = pos
\tbase.Material = Enum.Material.Grass
\tbase.Color = Color3.fromRGB(140, 210, 140)
end
`,
    },
    {
      name: "Cozy Garden Patch",
      lang: "lua",
      code: `-- Grow-a-garden style flower patch. Random pastel blooms.
local COLORS = {
\tColor3.fromRGB(255,182,193), Color3.fromRGB(255,239,150),
\tColor3.fromRGB(186,225,255), Color3.fromRGB(202,231,193),
}
for i = 1, 80 do
\tlocal stem = Instance.new("Part", workspace)
\tstem.Anchored = true
\tstem.Size = Vector3.new(0.3, math.random(2,4), 0.3)
\tstem.Color = Color3.fromRGB(90,160,90)
\tstem.Position = Vector3.new(math.random(-40,40), stem.Size.Y/2, math.random(-40,40))

\tlocal bloom = Instance.new("Part", workspace)
\tbloom.Anchored = true
\tbloom.Shape = Enum.PartType.Ball
\tbloom.Size = Vector3.new(1.2,1.2,1.2)
\tbloom.Color = COLORS[math.random(#COLORS)]
\tbloom.Material = Enum.Material.Neon
\tbloom.Position = stem.Position + Vector3.new(0, stem.Size.Y/2, 0)
end
`,
    },
    {
      name: "Day/Night Lighting Cycle",
      lang: "lua",
      code: `-- Smooth in-game day/night with warm sunset tones.
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
RunService.Heartbeat:Connect(function(dt)
\tLighting.ClockTime = (Lighting.ClockTime + dt * 0.05) % 24
end)
Lighting.Atmosphere = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere", Lighting)
Lighting.Atmosphere.Density = 0.35
Lighting.Atmosphere.Color = Color3.fromRGB(199, 199, 199)
Lighting.Atmosphere.Decay = Color3.fromRGB(106, 112, 125)
Lighting.Atmosphere.Haze = 1.2
`,
    },
  ],
  obby: [
    {
      name: "10-Stage Obby + Checkpoints",
      lang: "lua",
      code: `-- 10 stages, colorful checkpoints, auto-respawn on touch.
local STAGES = 10
local GAP = Vector3.new(0, 0, 14)
local start = Vector3.new(0, 5, 0)
local folder = Instance.new("Folder", workspace); folder.Name = "Obby"

for i = 1, STAGES do
\tlocal pos = start + GAP * (i - 1)
\tlocal plat = Instance.new("Part", folder)
\tplat.Anchored = true; plat.Size = Vector3.new(8,1,8); plat.Position = pos
\tplat.Color = Color3.fromHSV(i/STAGES, 0.6, 0.95)

\tlocal cp = Instance.new("Part", folder)
\tcp.Anchored = true; cp.Size = Vector3.new(2,4,0.4)
\tcp.Position = pos + Vector3.new(0, 2.5, 0)
\tcp.Material = Enum.Material.Neon
\tcp.Color = Color3.fromRGB(120,255,140)
\tcp.Name = "Checkpoint" .. i
end
`,
    },
    {
      name: "Rotating Platform",
      lang: "lua",
      code: `-- Spinning disc obstacle.
local p = Instance.new("Part", workspace)
p.Anchored = true; p.Size = Vector3.new(16,1,16); p.Position = Vector3.new(0,10,30)
p.Material = Enum.Material.SmoothPlastic; p.Color = Color3.fromRGB(255,200,120)
game:GetService("RunService").Heartbeat:Connect(function(dt)
\tp.CFrame = p.CFrame * CFrame.Angles(0, math.rad(45)*dt, 0)
end)
`,
    },
    {
      name: "Kill Brick (Lava)",
      lang: "lua",
      code: `-- Touch = respawn. Drop under risky jumps.
local lava = Instance.new("Part", workspace)
lava.Anchored = true; lava.Size = Vector3.new(40,1,40)
lava.Position = Vector3.new(0,-5,0)
lava.Material = Enum.Material.Neon; lava.Color = Color3.fromRGB(255,80,40)
lava.Touched:Connect(function(hit)
\tlocal h = hit.Parent:FindFirstChildOfClass("Humanoid")
\tif h then h.Health = 0 end
end)
`,
    },
    {
      name: "Disappearing Platforms",
      lang: "lua",
      code: `-- Steps fade in/out on a 2s cycle.
for i = 1, 6 do
\tlocal p = Instance.new("Part", workspace)
\tp.Anchored = true; p.Size = Vector3.new(6,1,6)
\tp.Position = Vector3.new(i*8, 8, 60)
\tp.Color = Color3.fromRGB(180,220,255)
\ttask.spawn(function()
\t\twhile true do
\t\t\tp.Transparency = 0; p.CanCollide = true; task.wait(2)
\t\t\tp.Transparency = 1; p.CanCollide = false; task.wait(2)
\t\tend
\tend)
end
`,
    },
  ],
  city: [
    {
      name: "Grid City Block",
      lang: "lua",
      code: `-- Quick procedural city grid.
local ROWS, COLS, LOT = 6, 6, 24
for r = 0, ROWS-1 do
\tfor c = 0, COLS-1 do
\t\tlocal h = math.random(12, 48)
\t\tlocal p = Instance.new("Part", workspace)
\t\tp.Anchored = true; p.Size = Vector3.new(16, h, 16)
\t\tp.Position = Vector3.new(r*LOT, h/2, c*LOT)
\t\tp.Material = Enum.Material.Concrete
\t\tp.Color = Color3.fromHSV(math.random(), 0.1, 0.9)
\tend
end
`,
    },
    {
      name: "Cozy Village House",
      lang: "lua",
      code: `-- Single charming house with sloped roof and lantern.
local model = Instance.new("Model", workspace); model.Name = "Cottage"
local function part(size, pos, color, mat)
\tlocal p = Instance.new("Part", model); p.Anchored = true
\tp.Size = size; p.Position = pos; p.Color = color
\tp.Material = mat or Enum.Material.WoodPlanks; return p
end
part(Vector3.new(14,8,12), Vector3.new(0,4,0), Color3.fromRGB(220,200,160))
local roof = part(Vector3.new(15,1,13), Vector3.new(0,8.5,0), Color3.fromRGB(140,60,40), Enum.Material.Slate)
roof.Shape = Enum.PartType.Block
local lantern = part(Vector3.new(1,1,1), Vector3.new(7,3,7), Color3.fromRGB(255,220,140), Enum.Material.Neon)
local light = Instance.new("PointLight", lantern); light.Range = 16; light.Brightness = 2
`,
    },
    {
      name: "Lantern-Lit Street",
      lang: "lua",
      code: `-- Soft glowing lanterns lining a path. Peaceful night feel.
for i = -10, 10 do
\tfor side = -1, 1, 2 do
\t\tlocal pole = Instance.new("Part", workspace)
\t\tpole.Anchored = true; pole.Size = Vector3.new(0.4,8,0.4)
\t\tpole.Position = Vector3.new(i*8, 4, side*6)
\t\tpole.Color = Color3.fromRGB(60,40,30)
\t\tlocal bulb = Instance.new("Part", workspace)
\t\tbulb.Anchored = true; bulb.Shape = Enum.PartType.Ball
\t\tbulb.Size = Vector3.new(1.5,1.5,1.5)
\t\tbulb.Material = Enum.Material.Neon
\t\tbulb.Color = Color3.fromRGB(255,210,150)
\t\tbulb.Position = pole.Position + Vector3.new(0,4,0)
\t\tlocal l = Instance.new("PointLight", bulb); l.Range = 14; l.Brightness = 2
\tend
end
`,
    },
    {
      name: "Tree Cluster",
      lang: "lua",
      code: `-- Scatter low-poly trees for ambience.
for i = 1, 30 do
\tlocal x,z = math.random(-120,120), math.random(-120,120)
\tlocal trunk = Instance.new("Part", workspace)
\ttrunk.Anchored = true; trunk.Size = Vector3.new(1.5,6,1.5)
\ttrunk.Position = Vector3.new(x,3,z); trunk.Color = Color3.fromRGB(90,60,40)
\tlocal leaves = Instance.new("Part", workspace)
\tleaves.Anchored = true; leaves.Shape = Enum.PartType.Ball
\tleaves.Size = Vector3.new(7,7,7); leaves.Position = Vector3.new(x,9,z)
\tleaves.Color = Color3.fromRGB(80,160,90)
end
`,
    },
  ],
  blender: [
    {
      name: "Blender → Roblox OBJ Export",
      lang: "python",
      code: `# Blender scripting tab. Exports selection as OBJ scaled for Roblox.
import bpy
OUT = bpy.path.abspath("//roblox_export.obj")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.export_scene.obj(
\tfilepath=OUT,
\tuse_selection=True,
\tglobal_scale=3.571,  # 1m -> studs
\tuse_materials=True,
\taxis_forward='-Z', axis_up='Y',
)
print("Exported:", OUT)
`,
    },
    {
      name: "Blender → Roblox FBX Export",
      lang: "python",
      code: `# Roblox-friendly FBX export with correct scale + axes.
import bpy
OUT = bpy.path.abspath("//roblox_export.fbx")
bpy.ops.export_scene.fbx(
\tfilepath=OUT,
\tuse_selection=True,
\tglobal_scale=3.571,
\taxis_forward='-Z', axis_up='Y',
\tbake_space_transform=True,
\tmesh_smooth_type='FACE',
)
print("Exported:", OUT)
`,
    },
    {
      name: "Auto-Decimate for Roblox",
      lang: "python",
      code: `# Cut triangle count on selected meshes so Roblox imports cleanly.
import bpy
TARGET_RATIO = 0.4  # keep 40% of polys
for obj in bpy.context.selected_objects:
\tif obj.type != 'MESH': continue
\tmod = obj.modifiers.new(name="RbxDecimate", type='DECIMATE')
\tmod.ratio = TARGET_RATIO
\tbpy.context.view_layer.objects.active = obj
\tbpy.ops.object.modifier_apply(modifier=mod.name)
print("Decimated.")
`,
    },
    {
      name: "MeshPart Loader (Luau)",
      lang: "lua",
      code: `-- Place MeshParts in ReplicatedStorage.Meshes — this scatters them.
local Meshes = game.ReplicatedStorage:WaitForChild("Meshes")
for _, m in ipairs(Meshes:GetChildren()) do
\tlocal clone = m:Clone()
\tclone.Anchored = true
\tclone.Parent = workspace
\tclone.Position = Vector3.new(math.random(-50,50), 10, math.random(-50,50))
end
`,
    },
    {
      name: "Bulk MeshPart Importer",
      lang: "lua",
      code: `-- Plugin-style script: import all rbxasset mesh IDs in a list.
local IDS = { "rbxassetid://0000000000", "rbxassetid://0000000000" }
for i, id in ipairs(IDS) do
\tlocal mp = Instance.new("MeshPart")
\tmp.MeshId = id
\tmp.Size = Vector3.new(4,4,4)
\tmp.Anchored = true
\tmp.Position = Vector3.new(i*8, 5, 0)
\tmp.Parent = workspace
end
`,
    },
  ],
};
