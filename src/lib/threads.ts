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

export function extractCodeBlocks(text: string): { lang: string; code: string }[] {
  const out: { lang: string; code: string }[] = [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ lang: (m[1] || "txt").toLowerCase(), code: m[2].trimEnd() });
  }
  return out;
}

export function messageText(msg: UIMessage): string {
  return msg.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}
