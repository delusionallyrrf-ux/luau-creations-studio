// Starter Luau templates seeded into the generator panel.
// The AI can expand/customize them based on the chat conversation.

export const TEMPLATES: Record<string, { name: string; lang: "lua" | "python"; code: string }[]> = {
  terrain: [
    {
      name: "Procedural Hills",
      lang: "lua",
      code: `-- Procedural hilly terrain. Paste into ServerScriptService.
local Terrain = workspace.Terrain
local SIZE = Vector3.new(512, 64, 512)
local CENTER = Vector3.new(0, 0, 0)
local RES = 4

for x = -SIZE.X/2, SIZE.X/2, RES do
\tfor z = -SIZE.Z/2, SIZE.Z/2, RES do
\t\tlocal h = math.noise(x/120, z/120) * 40
\t\tlocal region = Region3.new(
\t\t\tVector3.new(x, -32, z),
\t\t\tVector3.new(x + RES, h, z + RES)
\t\t):ExpandToGrid(4)
\t\tTerrain:FillRegion(region, 4, Enum.Material.Grass)
\tend
end
print("Hills generated")
`,
    },
  ],
  obby: [
    {
      name: "5-Stage Obby",
      lang: "lua",
      code: `-- Generates a 5-stage obby with checkpoints. Paste into ServerScriptService.
local STAGES = 5
local GAP = Vector3.new(0, 0, 12)
local start = Vector3.new(0, 5, 0)

local folder = Instance.new("Folder", workspace)
folder.Name = "Obby"

for i = 1, STAGES do
\tlocal pos = start + GAP * (i - 1)
\tlocal plat = Instance.new("Part", folder)
\tplat.Anchored = true
\tplat.Size = Vector3.new(8, 1, 8)
\tplat.Position = pos
\tplat.BrickColor = BrickColor.new(i % 2 == 0 and "Bright blue" or "Institutional white")

\tlocal cp = Instance.new("Part", folder)
\tcp.Anchored = true
\tcp.Size = Vector3.new(2, 4, 0.2)
\tcp.Position = pos + Vector3.new(0, 2.5, 0)
\tcp.BrickColor = BrickColor.new("Lime green")
\tcp.Name = "Checkpoint" .. i
end
`,
    },
  ],
  city: [
    {
      name: "Grid City Block",
      lang: "lua",
      code: `-- Spawns a simple grid of buildings. Paste into ServerScriptService.
local ROWS, COLS = 6, 6
local LOT = 24
for r = 0, ROWS-1 do
\tfor c = 0, COLS-1 do
\t\tlocal h = math.random(12, 48)
\t\tlocal p = Instance.new("Part", workspace)
\t\tp.Anchored = true
\t\tp.Size = Vector3.new(16, h, 16)
\t\tp.Position = Vector3.new(r*LOT, h/2, c*LOT)
\t\tp.Material = Enum.Material.Concrete
\t\tp.Color = Color3.fromHSV(math.random(), 0.1, 0.9)
\tend
end
`,
    },
  ],
  blender: [
    {
      name: "Blender → Roblox OBJ Export",
      lang: "python",
      code: `# Run inside Blender's scripting tab. Exports selection as OBJ
# scaled for Roblox (1m -> 3.571 studs).
import bpy, os
OUT = bpy.path.abspath("//roblox_export.obj")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.export_scene.obj(
\tfilepath=OUT,
\tuse_selection=True,
\tglobal_scale=3.571,
\tuse_materials=True,
\taxis_forward='-Z', axis_up='Y',
)
print("Exported:", OUT)
`,
    },
    {
      name: "MeshPart Loader (Luau)",
      lang: "lua",
      code: `-- Drop a MeshPart in ReplicatedStorage.Meshes and this clones them in.
local Meshes = game.ReplicatedStorage:WaitForChild("Meshes")
for _, m in ipairs(Meshes:GetChildren()) do
\tlocal clone = m:Clone()
\tclone.Anchored = true
\tclone.Parent = workspace
\tclone.Position = Vector3.new(math.random(-50,50), 10, math.random(-50,50))
end
`,
    },
  ],
};
