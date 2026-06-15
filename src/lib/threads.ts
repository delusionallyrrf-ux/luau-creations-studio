import type { UIMessage } from "ai";

const KEY = "mapforge.threads.v1";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
  vibe: string;
  generator: string;
};

export const VIBES = [
  { id: "nostalgic", label: "Nostalgic", hint: "Classic 2010s Roblox feel" },
  { id: "niche", label: "Niche", hint: "Experimental / weird" },
  { id: "popular", label: "Popular", hint: "Trendy modern Roblox styles" },
  { id: "modern", label: "Modern", hint: "Clean minimal architecture" },
  { id: "retro", label: "Retro", hint: "Low-poly / pixel vibes" },
  { id: "horror", label: "Horror", hint: "Dim, eerie, atmospheric" },
];

export const GENERATORS = [
  { id: "terrain", label: "Terrain / Landscape", desc: "Procedural hills, water, biomes" },
  { id: "obby", label: "Obby / Parkour", desc: "Stages, kill bricks, checkpoints" },
  { id: "city", label: "City / Buildings", desc: "Roads, houses, props" },
  { id: "blender", label: "Blender → Roblox", desc: "Mesh import & exporter helper" },
];

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    return Array.isArray(parsed) ? parsed : [];
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
    vibe: "modern",
    generator: "terrain",
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
