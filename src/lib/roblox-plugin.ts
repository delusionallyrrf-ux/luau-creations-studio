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

export const PLUGIN_SOURCE = String.raw`--[[ MapForge Studio Plugin (standalone)
  Chat with the AI right inside Studio. It builds real Parts, Terrain and
  Lighting straight into your place in Edit mode (permanent, editable, Ctrl+Z).
  Also imports bundles copied from the MapForge website ("Send to Studio").
  Needs a free Google AI Studio key (aistudio.google.com/apikey).
  Studio will ask once to allow requests to generativelanguage.googleapis.com - press Allow.
]]
local HttpService = game:GetService("HttpService")
local CHS = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")

local toolbar = plugin:CreateToolbar("MapForge")
local button = toolbar:CreateButton("MapForge", "Open the MapForge AI builder", "rbxassetid://4458901886")
local widget = plugin:CreateDockWidgetPluginGui("MapForgeAI",
  DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 360, 560, 300, 400))
widget.Title = "MapForge AI"
button.Click:Connect(function() widget.Enabled = not widget.Enabled end)

local MODELS = { "gemini-3-flash-preview", "gemini-flash-latest", "gemini-flash-lite-latest" }
local history = {}

local SYSTEM = [[You are MapForge, an expert Roblox map builder running INSIDE a Roblox Studio plugin in EDIT mode.
When the user asks you to build, reply with ONE short sentence, then ONE complete ` + "`" + String.raw`` + "`" + String.raw`` + "`" + String.raw`lua code block that builds it immediately.
Rules for the code:
- It runs once, right now, in Edit mode as plugin code. Create real Instances (Part, MeshPart-free Parts, Model, Terrain:FillBlock/FillBall, Lighting, Atmosphere, Sky, PointLight, ParticleEmitter).
- Put everything in a new Model named after the build, parented to workspace. Anchor all parts. Do NOT use Players, RunService loops, wait() forever, task.wait loops, or game:GetService("Players").
- Make it detailed and cozy: a focal landmark, paths, matching color palette, varied sizes, soft lighting (set Lighting properties directly).
- If the build needs gameplay at runtime, create a Script instance with .Source set to that runtime code and parent it to ServerScriptService.
- The code must end with: return <theModel>
If the user only asks a question, answer briefly with no code.]]

-- UI ------------------------------------------------------------------
local bg = Color3.fromRGB(24, 18, 40)
local panel = Color3.fromRGB(38, 30, 62)
local mint = Color3.fromRGB(80, 230, 180)
local function mk(class, props, parent)
  local o = Instance.new(class)
  for k, v in pairs(props) do o[k] = v end
  if class == "TextButton" or class == "TextBox" or class == "Frame" then
    Instance.new("UICorner", o).CornerRadius = UDim.new(0, 8)
  end
  o.Parent = parent
  return o
end
local root = mk("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = bg, BorderSizePixel = 0 }, widget)
local pad = Instance.new("UIPadding", root)
pad.PaddingTop, pad.PaddingBottom, pad.PaddingLeft, pad.PaddingRight = UDim.new(0,8), UDim.new(0,8), UDim.new(0,8), UDim.new(0,8)

local function box(y, h, placeholder, multi)
  return mk("TextBox", { Position = UDim2.new(0,0,0,y), Size = UDim2.new(1,0,0,h), BackgroundColor3 = panel,
    TextColor3 = Color3.new(1,1,1), PlaceholderText = placeholder, Text = "", ClearTextOnFocus = false,
    MultiLine = multi or false, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left,
    TextYAlignment = Enum.TextYAlignment.Top, Font = Enum.Font.Gotham, TextSize = 13 }, root)
end
local function btn(x, y, w, text, color)
  return mk("TextButton", { Position = UDim2.new(x,0,0,y), Size = UDim2.new(w,-4,0,30), BackgroundColor3 = color or mint,
    Text = text, Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = bg }, root)
end

local keyBox = box(0, 28, "Paste your free Gemini API key")
keyBox.Text = plugin:GetSetting("MapForgeKey") or ""
local modelBtn = btn(0, 34, 1, "Model: " .. (plugin:GetSetting("MapForgeModel") or MODELS[1]), panel)
modelBtn.TextColor3 = Color3.new(1,1,1)
local log = mk("TextLabel", { Position = UDim2.new(0,0,0,70), Size = UDim2.new(1,0,1,-210), BackgroundColor3 = panel,
  TextColor3 = Color3.fromRGB(220,220,240), TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left,
  TextYAlignment = Enum.TextYAlignment.Bottom, Font = Enum.Font.Gotham, TextSize = 13,
  Text = "Describe what to build, e.g. 'a cozy garden village with a windmill and lanterns'." }, root)
Instance.new("UICorner", log).CornerRadius = UDim.new(0, 8)
local prompt = box(0, 80, "What should MapForge build? (or paste a website bundle / Lua code)", true)
prompt.Position = UDim2.new(0,0,1,-134)
local buildBtn = btn(0, 0, 0.5, "Build with AI")
buildBtn.Position = UDim2.new(0,0,1,-48)
local runBtn = btn(0.5, 0, 0.5, "Run pasted code", Color3.fromRGB(255,140,200))
runBtn.Position = UDim2.new(0.5,4,1,-48)
local clearBtn = btn(0, 0, 1, "New chat", panel)
clearBtn.Position = UDim2.new(0,0,1,-14); clearBtn.Size = UDim2.new(1,0,0,14); clearBtn.TextSize = 10
clearBtn.TextColor3 = Color3.new(1,1,1)

local function say(t) log.Text = t end
keyBox.FocusLost:Connect(function() plugin:SetSetting("MapForgeKey", keyBox.Text) end)
modelBtn.MouseButton1Click:Connect(function()
  local cur = plugin:GetSetting("MapForgeModel") or MODELS[1]
  local i = table.find(MODELS, cur) or 1
  local nxt = MODELS[i % #MODELS + 1]
  plugin:SetSetting("MapForgeModel", nxt); modelBtn.Text = "Model: " .. nxt
end)
clearBtn.MouseButton1Click:Connect(function() history = {}; say("New chat started.") end)

-- Running code in Edit mode ------------------------------------------
local function runCode(code, label)
  local id = CHS:TryBeginRecording("MapForge " .. label)
  local mod = Instance.new("ModuleScript")
  mod.Name = "MapForgeRun"
  mod.Source = "return (function()\n" .. code .. "\nend)()"
  mod.Parent = game:GetService("ServerStorage")
  local ok, result = pcall(require, mod)
  mod:Destroy()
  if id then CHS:FinishRecording(id, ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel) end
  if ok and typeof(result) == "Instance" then Selection:Set({ result }) end
  return ok, result
end

local function importBundle(data)
  local id = CHS:TryBeginRecording("MapForge Import")
  local where = { Script = "ServerScriptService", LocalScript = "StarterPlayer", ModuleScript = "ReplicatedStorage" }
  for _, s in ipairs(data.scripts or {}) do
    local svc = game:GetService(where[s.className] or "ServerScriptService")
    if s.className == "LocalScript" then svc = svc:FindFirstChild("StarterPlayerScripts") or svc end
    local folder = svc:FindFirstChild("MapForge") or Instance.new("Folder", svc)
    folder.Name = "MapForge"
    local inst = Instance.new(s.className or "Script")
    inst.Name = s.name or "MapForgeScript"
    inst.Source = s.source or ""
    inst.Parent = folder
  end
  if id then CHS:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end
  return #(data.scripts or {})
end

local function extractLua(text)
  return text:match("` + "`" + String.raw`` + "`" + String.raw`` + "`" + String.raw`[%w]*%s*\n(.-)` + "`" + String.raw`` + "`" + String.raw`` + "`" + String.raw`")
end

runBtn.MouseButton1Click:Connect(function()
  local text = prompt.Text
  local okJson, data = pcall(HttpService.JSONDecode, HttpService, text)
  if okJson and type(data) == "table" and data.mapforge then
    say("Imported " .. importBundle(data) .. " script(s) into MapForge folders. Ctrl+Z to undo.")
    return
  end
  local code = extractLua(text) or text
  local ok, err = runCode(code, "Run")
  say(ok and "Built! It's in your place now - select, move, or Ctrl+Z to undo." or ("Code error: " .. tostring(err)))
end)

-- AI ------------------------------------------------------------------
local busy = false
local function ask(text)
  local key = keyBox.Text:gsub("%s", "")
  if key == "" then return nil, "Paste your Gemini key at the top first." end
  table.insert(history, { role = "user", parts = { { text = text } } })
  while #history > 12 do table.remove(history, 1) end
  local model = plugin:GetSetting("MapForgeModel") or MODELS[1]
  local ok, res = pcall(HttpService.RequestAsync, HttpService, {
    Url = "https://generativelanguage.googleapis.com/v1beta/models/" .. model .. ":generateContent?key=" .. key,
    Method = "POST",
    Headers = { ["Content-Type"] = "application/json" },
    Body = HttpService:JSONEncode({ systemInstruction = { parts = { { text = SYSTEM } } }, contents = history }),
  })
  if not ok then table.remove(history); return nil, "Request failed: " .. tostring(res) end
  if not res.Success then
    table.remove(history)
    if res.StatusCode == 429 or res.StatusCode == 503 then return nil, "AI is busy/rate limited. Tap Model to switch, then try again." end
    return nil, "AI error " .. res.StatusCode .. ": " .. res.Body:sub(1, 200)
  end
  local body = HttpService:JSONDecode(res.Body)
  local out = ""
  local cand = body.candidates and body.candidates[1]
  for _, p in ipairs(cand and cand.content and cand.content.parts or {}) do out ..= (p.text or "") end
  table.insert(history, { role = "model", parts = { { text = out } } })
  return out
end

buildBtn.MouseButton1Click:Connect(function()
  if busy or prompt.Text == "" then return end
  busy = true; buildBtn.Text = "Thinking..."
  say("MapForge is designing your build...")
  local reply, err = ask(prompt.Text)
  busy = false; buildBtn.Text = "Build with AI"
  if not reply then say(err); return end
  local code = extractLua(reply)
  local talk = reply:gsub("` + "`" + String.raw`` + "`" + String.raw`` + "`" + String.raw`.-` + "`" + String.raw`` + "`" + String.raw`` + "`" + String.raw`", ""):gsub("^%s+", ""):sub(1, 400)
  if not code then say(talk); return end
  local ok, result = runCode(code, "Build")
  if ok then
    prompt.Text = ""
    say(talk .. "\n\nBuilt into your place! Move it around, or Ctrl+Z to undo. Ask for changes anytime.")
  else
    say("The AI's code hit an error: " .. tostring(result) .. "\nPress Build again to retry.")
    table.insert(history, { role = "user", parts = { { text = "That code errored: " .. tostring(result) .. ". Fix it." } } })
  end
end)
`;
