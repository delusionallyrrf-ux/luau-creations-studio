import type { UIMessage } from "ai";

const KEY = "mapforge.threads.v1";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
  vibe: string;
  generator: string;
  items: string[];
  detail: "rich" | "epic" | "insane";
  locked: boolean;
};

export const VIBES = [
  { id: "nostalgic", label: "Nostalgic", hint: "Classic 2010s Roblox feel" },
  { id: "niche", label: "Niche", hint: "Experimental / weird-cozy" },
  { id: "popular", label: "Popular", hint: "Grow-a-Garden / Snatch-a-Seed energy" },
  { id: "modern", label: "Modern", hint: "Clean minimal architecture" },
  { id: "retro", label: "Retro", hint: "Low-poly / pixel vibes" },
  { id: "horror", label: "Horror", hint: "Dim, eerie, atmospheric" },
  { id: "fantasy", label: "Fantasy", hint: "Mystical glow, magic, runes" },
  { id: "anime", label: "Anime", hint: "Studio Ghibli pastel skies" },
];

export const GENERATORS = [
  { id: "terrain", label: "Terrain / Landscape", desc: "Procedural hills, water, biomes" },
  { id: "obby", label: "Obby / Parkour", desc: "Stages, kill bricks, checkpoints" },
  { id: "city", label: "City / Buildings", desc: "Roads, houses, props" },
  { id: "blender", label: "Blender → Roblox", desc: "Mesh import & exporter helper" },
  { id: "weather", label: "Weather / Sky", desc: "Rain, fog, day-night, particles" },
  { id: "gui", label: "GUI / UI", desc: "ScreenGuis, HUDs, menus, shops" },
  { id: "items", label: "Items / Tools", desc: "Tools, pets, seeds, collectibles" },
];

export const ITEM_PACKS = [
  { id: "seeds", label: "Seeds & Plants", hint: "Plantable, growable, harvestable" },
  { id: "pets", label: "Pets & Companions", hint: "Followers with stats & abilities" },
  { id: "tools", label: "Tools & Weapons", hint: "Swords, watering cans, gadgets" },
  { id: "currency", label: "Currency & Shop", hint: "Coins, gems, shop UI" },
  { id: "food", label: "Food & Consumables", hint: "Boosts, potions, snacks" },
  { id: "decor", label: "Decor & Furniture", hint: "Placeable cozy props" },
  { id: "vehicles", label: "Vehicles & Mounts", hint: "Cars, boats, gliders" },
  { id: "magic", label: "Magic & Spells", hint: "Particle FX skills" },
];

export const DETAIL_LEVELS = [
  { id: "rich", label: "Rich", hint: "Detailed, ~150 lines, multiple systems" },
  { id: "epic", label: "Epic", hint: "Cinematic, ~400 lines, polished" },
  { id: "insane", label: "Insane", hint: "Studio-grade, 600+ lines, every detail" },
] as const;

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t) => ({
      ...t,
      items: t.items ?? [],
      detail: t.detail ?? ("epic" as const),
      locked: t.locked ?? true,
    }));

  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(threads));
}

export function newThread(): Thread {
  return {
    id: crypto.randomUUID(),
    title: "New build",
    updatedAt: Date.now(),
    messages: [],
    vibe: "popular",
    generator: "terrain",
    items: [],
    detail: "epic",
    locked: false,
  };
}

export function ensureCodeBlocks(text: string): string {
  if (!text.trim() || text.includes("```")) return text;

  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const next = nextNonEmpty(lines, i + 1);
    if (!isCodeStartLine(lines[i], next)) {
      out.push(lines[i]);
      i += 1;
      continue;
    }

    const start = i;
    i += 1;
    let blankRun = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        blankRun += 1;
        i += 1;
        continue;
      }

      if (isCodeBoundaryLine(trimmed)) break;
      if (blankRun > 0 && isLikelyProseLine(trimmed) && !isCodeLine(trimmed)) break;

      blankRun = 0;
      i += 1;
    }

    const code = lines.slice(start, i).join("\n").replace(/\s+$/, "");
    if (looksLikeCodeBlock(code)) {
      out.push(`\`\`\`${detectCodeLang(code)}\n${code}\n\`\`\``);
    } else {
      out.push(code);
    }
  }

  return out.join("\n");
}

export function extractCodeBlocks(text: string): { lang: string; code: string }[] {
  const out: { lang: string; code: string }[] = [];
  const normalized = ensureCodeBlocks(text);
  const re = /```([a-zA-Z0-9_+-]*)\s*\r?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    out.push({ lang: (m[1] || "txt").toLowerCase(), code: m[2].replace(/\s+$/, "") });
  }
  return out;
}

function nextNonEmpty(lines: string[], start: number): string | undefined {
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i].trim()) return lines[i];
  }
  return undefined;
}

function isCodeStartLine(line: string, next?: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(--|#|\/\/)\s+/.test(trimmed) && next && isCodeLine(next.trim())) return true;
  return isCodeLine(trimmed);
}

function isCodeLine(line: string): boolean {
  return [
    /\bgame:GetService\s*\(/,
    /\bInstance\.new\s*\(/,
    /\b(Color3|Vector3|CFrame|UDim2|Enum|TweenInfo)\./,
    /^(local\s+)?function\s+[\w.:]+\s*\(/,
    /^local\s+[\w,\s]+\s*=/,
    /^(if|for|while)\s+.+\s+(then|do)\b/,
    /^(elseif|else|end|return|repeat|until)\b/,
    /^(task|table|math|string|workspace|script|game|bpy)\./,
    /^[\w.:\[\]"']+\s*=\s*.+,?$/,
    /^[\w.:]+\s*:\s*[\w_]+\s*\(/,
    /^(def|class)\s+[\w_]+/,
    /^(import|from)\s+[\w_.]+/,
    /^[{}()[\],]+,?$/,
  ].some((pattern) => pattern.test(line));
}

function looksLikeCodeBlock(code: string): boolean {
  const meaningful = code.split("\n").filter((line) => line.trim());
  if (meaningful.length < 2) return false;
  const hits = meaningful.filter((line) => isCodeLine(line.trim()) || /^(--|#|\/\/)\s+/.test(line.trim())).length;
  return hits >= 2 || /\b(game:GetService|Instance\.new|bpy\.|def\s+|local\s+)\b/.test(code);
}

function detectCodeLang(code: string): string {
  if (/\b(bpy\.|def\s+|class\s+|import\s+|from\s+[\w_.]+\s+import)\b/.test(code)) return "python";
  if (/\b(game:GetService|Instance\.new|Color3|UDim2|local\s+|end\b)\b/.test(code)) return "lua";
  return "txt";
}

function isCodeBoundaryLine(line: string): boolean {
  const normalized = line.replace(/[*_`]/g, "").toLowerCase();
  return /^(how to use|usage|steps|notes?|summary|what it does|where to put|setup|install|customize)\s*:/.test(normalized);
}

function isLikelyProseLine(line: string): boolean {
  if (/^[-*]\s+[a-zA-Z]/.test(line) && !/[=(){}[\];]/.test(line)) return true;
  if (/^[A-Z][^=(){}[\];]{20,}[.!?]$/.test(line)) return true;
  return /^(copy|paste|put|open|click|run|insert|place)\b/i.test(line) && !/[=(){}[\];]/.test(line);
}


export function messageText(msg: UIMessage): string {
  return msg.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}
