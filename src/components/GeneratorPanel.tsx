import { useEffect, useState } from "react";
import { AI_MODELS, loadAiSettings, saveAiSettings } from "@/lib/ai-settings";

function AiSection() {
  const [model, setModel] = useState("gemini-flash-latest");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const s = loadAiSettings();
    setModel(s.model);
    setApiKey(s.apiKey);
  }, []);
  function save() {
    saveAiSettings({ model, apiKey: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }
  return (
    <div className="panel p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI model & key</div>
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="w-full h-9 rounded-md bg-surface-2 border border-border px-2 text-sm"
      >
        {AI_MODELS.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Gemini API key (blank = use saved key)"
        className="w-full h-9 rounded-md bg-surface-2 border border-border px-2 text-sm"
      />
      <button
        onClick={save}
        className="w-full h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
      >
        {saved ? "Saved" : "Save AI settings"}
      </button>
      <div className="text-[11px] text-muted-foreground">
        Key stays in this browser. Get a free one at aistudio.google.com.
      </div>
    </div>
  );
}
import { Download, Copy, Check, ChevronDown, X, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
import { VIBES, GENERATORS, ITEM_PACKS, DETAIL_LEVELS, type Thread } from "@/lib/threads";
import { TEMPLATES } from "@/lib/luau-templates";

interface Props {
  thread: Thread;
  onChange: (patch: Partial<Thread>) => void;
  open: boolean;
  onClose: () => void;
  onChangeSettings: () => void;
  onClearAllChats: () => void;
}

export function GeneratorPanel({ thread, onChange, open, onClose, onChangeSettings, onClearAllChats }: Props) {
  const [tipsOpen, setTipsOpen] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [clearConfirming, setClearConfirming] = useState(false);
  const templates = TEMPLATES[thread.generator] ?? [];

  const vibe = VIBES.find((v) => v.id === thread.vibe);
  const generator = GENERATORS.find((g) => g.id === thread.generator);
  const detail = DETAIL_LEVELS.find((d) => d.id === thread.detail);
  const items = (thread.items ?? []).map((id) => ITEM_PACKS.find((i) => i.id === id)?.label).filter(Boolean);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-screen w-full sm:w-[400px] border-l border-border bg-surface flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Design settings"
      >
        <div className="p-4 border-b border-border flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Locked settings
            </div>
            <h2 className="text-display text-lg font-semibold">This chat's build</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <SummaryRow label="Vibe" value={vibe?.label ?? thread.vibe} hint={vibe?.hint} />
          <SummaryRow label="Focus" value={generator?.label ?? thread.generator} hint={generator?.desc} />
          <SummaryRow label="Detail" value={detail?.label ?? thread.detail} hint={detail?.hint} />
          <SummaryRow
            label="Items"
            value={items.length > 0 ? items.join(", ") : "None"}
            hint={items.length > 0 ? `${items.length} pack${items.length > 1 ? "s" : ""} enabled` : "No item systems selected"}
          />

          <div className="panel p-3 space-y-2">
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-border hover:border-primary/60 hover:bg-surface-2 text-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Change settings
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    This will reset the visible build progress so the AI starts fresh under new
                    settings. The conversation history is kept — the AI will still remember what
                    you discussed.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 h-9 rounded-md border border-border hover:bg-surface-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setConfirming(false);
                      onChangeSettings();
                    }}
                    className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
                  >
                    Yes, change
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="panel p-3 space-y-2 border-destructive/30">
            {!clearConfirming ? (
              <button
                onClick={() => setClearConfirming(true)}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 text-sm transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear all chats
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <span>This deletes every saved chat in this browser and starts a fresh one.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClearConfirming(false)}
                    className="flex-1 h-9 rounded-md border border-border hover:bg-surface-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setClearConfirming(false);
                      onClearAllChats();
                    }}
                    className="flex-1 h-9 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90"
                  >
                    Delete all
                  </button>
                </div>
              </div>
            )}
          </div>

          <AiSection />

          <Section title="Starter snippets">
            <div className="space-y-2">
              {templates.length === 0 && (
                <div className="text-xs text-muted-foreground">No starters for this focus yet — ask the AI directly.</div>
              )}
              {templates.map((t) => (
                <SnippetCard key={t.name} name={t.name} lang={t.lang} code={t.code} />
              ))}
            </div>
          </Section>

          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronDown className={`w-3 h-3 transition ${tipsOpen ? "" : "-rotate-90"}`} /> Tips
          </button>
          {tipsOpen && (
            <div className="text-xs text-muted-foreground space-y-2 panel p-3">
              <p>
                <span className="text-foreground">Roblox Studio:</span> paste Luau scripts into{" "}
                <code className="text-primary">ServerScriptService</code> and press F5.
              </p>
              <p>
                <span className="text-foreground">Blender:</span> 1 meter ≈ 3.571 studs. The
                exporter script handles scaling automatically.
              </p>
            </div>
          )}
          {/* Hidden onChange usage to keep API stable for future inline tweaks */}
          <button className="hidden" onClick={() => onChange({})} />
        </div>
      </aside>
    </>
  );
}

function SummaryRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
        {title}
      </div>
      {children}
    </div>
  );
}

function SnippetCard({ name, lang, code }: { name: string; lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const ext = lang === "lua" ? "lua" : lang === "python" ? "py" : "txt";

  function download() {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2/50 border-b border-border">
        <div className="text-xs font-medium truncate">{name}</div>
        <div className="flex items-center gap-1">
          <button onClick={copy} className="text-muted-foreground hover:text-foreground p-1 rounded">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
          <button onClick={download} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
      <pre className="text-[11px] font-mono p-3 max-h-40 overflow-auto bg-[oklch(0.14_0.01_260)] text-foreground/90"><code>{code}</code></pre>
    </div>
  );
}
