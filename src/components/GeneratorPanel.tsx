import { useState } from "react";
import { Download, Copy, Check, ChevronDown, X } from "lucide-react";
import { VIBES, GENERATORS, type Thread } from "@/lib/threads";
import { TEMPLATES } from "@/lib/luau-templates";

interface Props {
  thread: Thread;
  onChange: (patch: Partial<Thread>) => void;
  open: boolean;
  onClose: () => void;
}

export function GeneratorPanel({ thread, onChange, open, onClose }: Props) {
  const [tipsOpen, setTipsOpen] = useState(true);
  const templates = TEMPLATES[thread.generator] ?? [];

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
            Design Settings
          </div>
          <h2 className="text-display text-lg font-semibold">Tune your build</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 grid place-items-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Section title="Vibe">
          <div className="grid grid-cols-2 gap-2">
            {VIBES.map((v) => (
              <button
                key={v.id}
                onClick={() => onChange({ vibe: v.id })}
                className={`text-left p-2.5 rounded-md border text-xs transition ${
                  thread.vibe === v.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-surface hover:bg-surface-2 text-muted-foreground"
                }`}
              >
                <div className="font-medium text-foreground text-sm">{v.label}</div>
                <div className="text-[11px] mt-0.5 opacity-80">{v.hint}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Generator">
          <div className="space-y-1.5">
            {GENERATORS.map((g) => (
              <button
                key={g.id}
                onClick={() => onChange({ generator: g.id })}
                className={`w-full text-left p-2.5 rounded-md border text-sm transition ${
                  thread.generator === g.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="font-medium">{g.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Starter snippets">
          <div className="space-y-2">
            {templates.length === 0 && (
              <div className="text-xs text-muted-foreground">No starters for this generator yet.</div>
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
              <span className="text-foreground">Blender:</span> 1 meter ≈ 3.571 studs. The exporter
              snippet handles scaling automatically.
            </p>
            <p>
              <span className="text-foreground">Chat:</span> ask the AI to modify any snippet — "make
              it bigger", "add lava", "change the vibe to horror".
            </p>
          </div>
        )}
      </div>
      </aside>
    </>
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
