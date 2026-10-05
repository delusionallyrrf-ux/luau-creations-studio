export const AI_MODELS = [
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (free, smart)" },
  { id: "gemini-flash-latest", label: "Gemini Flash (free, fast)" },
  { id: "gemini-flash-lite-latest", label: "Gemini Flash Lite (free, rarely limited)" },
  { id: "lovable", label: "Built-in AI (uses Lovable credits)" },
] as const;

export type AiSettings = { model: string; apiKey: string };
const KEY = "mapforge.ai-settings";

export function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") return { model: "gemini-flash-latest", apiKey: "" };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { model: s.model || "gemini-flash-latest", apiKey: s.apiKey || "" };
  } catch {
    return { model: "gemini-flash-latest", apiKey: "" };
  }
}

export function saveAiSettings(s: AiSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
