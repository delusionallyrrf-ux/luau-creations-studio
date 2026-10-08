// MapForge <-> Roblox Studio bridge: export payload builder + plugin source.

export type StudioScript = {
  name: string;
  className: "Script" | "LocalScript" | "ModuleScript";
  parent: "ServerScriptService" | "StarterPlayerScripts" | "ReplicatedStorage" | "StarterGui";
  source: string;
};

export type StudioPayload = { mapforge: 1; scripts: StudioScript[] };

function guessName(code: string, i: number): string {
  for (const raw of code.split("\n").slice(0, 6)) {
    const m = raw.trim().match(/^--\s*([A-Za-z][\w .-]{2,40})/);
    if (m) return m[1].trim().replace(/[^\w]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  }
  return `MapForge_Script_${i + 1}`;
}

export function classifyScript(code: string, i: number): StudioScript {
  const name = guessName(code, i);
  const tail = code.trim().split("\n").slice(-3).join("\n");
  if (/^\s*return\s+[A-Za-z_]\w*\s*$/m.test(tail)) {
    return { name, className: "ModuleScript", parent: "ReplicatedStorage", source: code };
  }
  if (/LocalPlayer|PlayerGui|UserInputService|ScreenGui|CurrentCamera/.test(code)) {
    return { name, className: "LocalScript", parent: "StarterPlayerScripts", source: code };
  }
  return { name, className: "Script", parent: "ServerScriptService", source: code };
}

export function buildStudioPayload(codes: string[]): string {
  const payload: StudioPayload = { mapforge: 1, scripts: codes.map(classifyScript) };
  return JSON.stringify(payload);
}

export const PLUGIN_SOURCE = String.raw`--[[ MapForge Studio Plugin
  Save with: right-click this Script in ServerStorage > "Save as Local Plugin..."
  Then use Plugins tab > MapForge > Import, paste the code from MapForge, press Import.
  Ctrl+Z undoes a whole import.
]]
local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local toolbar = plugin:CreateToolbar("MapForge")
local button = toolbar:CreateButton("Import", "Import a MapForge build", "rbxassetid://4458901886")
button.ClickableWhenViewportHidden = true

local info = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 340, 420, 280, 300)
local widget = plugin:CreateDockWidgetPluginGui("MapForgeImport", info)
widget.Title = "MapForge Import"

local theme = settings().Studio.Theme
local function c(name) return theme:GetColor(Enum.StudioStyleGuideColor[name]) end

local root = Instance.new("Frame")
root.Size = UDim2.fromScale(1, 1)
root.BackgroundColor3 = c("MainBackground")
root.BorderSizePixel = 0
root.Parent = widget
local pad = Instance.new("UIPadding")
for _, k in ipairs({"PaddingTop","PaddingBottom","PaddingLeft","PaddingRight"}) do pad[k] = UDim.new(0, 10) end
pad.Parent = root

local box = Instance.new("TextBox")
box.Size = UDim2.new(1, 0, 1, -80)
box.MultiLine = true
box.ClearTextOnFocus = false
box.TextWrapped = true
box.TextXAlignment = Enum.TextXAlignment.Left
box.TextYAlignment = Enum.TextYAlignment.Top
box.PlaceholderText = "Paste the Studio code from MapForge here..."
box.Text = ""
box.Font = Enum.Font.Code
box.TextSize = 12
box.TextColor3 = c("MainText")
box.BackgroundColor3 = c("InputFieldBackground")
box.BorderColor3 = c("InputFieldBorder")
box.Parent = root

local status = Instance.new("TextLabel")
status.Size = UDim2.new(1, 0, 0, 30)
status.Position = UDim2.new(0, 0, 1, -76)
status.BackgroundTransparency = 1
status.TextWrapped = true
status.TextXAlignment = Enum.TextXAlignment.Left
status.Font = Enum.Font.SourceSans
status.TextSize = 14
status.TextColor3 = c("DimmedText")
status.Text = "Ready."
status.Parent = root

local go = Instance.new("TextButton")
go.Size = UDim2.new(1, 0, 0, 38)
go.Position = UDim2.new(0, 0, 1, -38)
go.Text = "Import to place"
go.Font = Enum.Font.SourceSansBold
go.TextSize = 16
go.TextColor3 = Color3.new(1, 1, 1)
go.BackgroundColor3 = Color3.fromRGB(46, 204, 160)
go.BorderSizePixel = 0
go.Parent = root
Instance.new("UICorner", go).CornerRadius = UDim.new(0, 6)

local PARENTS = {
  ServerScriptService = function() return game:GetService("ServerScriptService") end,
  ReplicatedStorage = function() return game:GetService("ReplicatedStorage") end,
  StarterGui = function() return game:GetService("StarterGui") end,
  StarterPlayerScripts = function() return game:GetService("StarterPlayer"):FindFirstChildOfClass("StarterPlayerScripts") end,
}
local ALLOWED = { Script = true, LocalScript = true, ModuleScript = true }

local function folderIn(service)
  local f = service:FindFirstChild("MapForge")
  if not f then f = Instance.new("Folder"); f.Name = "MapForge"; f.Parent = service end
  return f
end

go.MouseButton1Click:Connect(function()
  local ok, data = pcall(HttpService.JSONDecode, HttpService, box.Text)
  if not ok or type(data) ~= "table" or data.mapforge ~= 1 or type(data.scripts) ~= "table" then
    status.Text = "That isn't MapForge code. Use 'Send to Studio' on the site."
    return
  end
  local rec = ChangeHistoryService:TryBeginRecording("MapForge Import")
  local count, created = 0, {}
  for _, s in ipairs(data.scripts) do
    local getParent = PARENTS[s.parent]
    if ALLOWED[s.className] and getParent and type(s.source) == "string" then
      local inst = Instance.new(s.className)
      inst.Name = tostring(s.name or "MapForge_Script")
      local okSrc = pcall(function() inst.Source = s.source end)
      if okSrc then
        inst.Parent = folderIn(getParent())
        table.insert(created, inst)
        count += 1
      end
    end
  end
  if rec then ChangeHistoryService:FinishRecording(rec, Enum.FinishRecordingOperation.Commit) end
  game:GetService("Selection"):Set(created)
  status.Text = ("Imported %d script(s) into MapForge folders. Press Play to run!"):format(count)
  box.Text = ""
end)

button.Click:Connect(function() widget.Enabled = not widget.Enabled end)
`;
