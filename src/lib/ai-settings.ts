export const AI_MODELS = [
  { id: "gemini-flash-latest", label: "Gemini Flash (free, fast)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (smarter, lower free limits)" },
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
