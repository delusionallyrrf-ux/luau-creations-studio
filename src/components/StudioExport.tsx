import { useState } from "react";
import { Boxes, Check, Download, Copy, X } from "lucide-react";
import { buildStudioPayload, PLUGIN_SOURCE } from "@/lib/roblox-plugin";

export function StudioExportBar({ codes }: { codes: string[] }) {
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  if (codes.length === 0) return null;

  async function send() {
    await navigator.clipboard.writeText(buildStudioPayload(codes));
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button onClick={send} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
          {sent ? <Check className="w-3.5 h-3.5" /> : <Boxes className="w-3.5 h-3.5" />}
          {sent ? "Copied! Paste it in the plugin" : `Send to Studio (${codes.length})`}
        </button>
        <button onClick={() => setOpen(true)} className="px-2 py-1.5 text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
          Get the Studio plugin
        </button>
      </div>
      {open && <PluginDialog codes={codes} onClose={() => setOpen(false)} />}
    </>
  );
}

function getSyncChannel(): string {
  try {
    const saved = localStorage.getItem("mapforge.sync-channel");
    if (saved && /^[a-z0-9-]{4,32}$/.test(saved)) return saved;
    const fresh = Math.random().toString(36).slice(2, 10);
    localStorage.setItem("mapforge.sync-channel", fresh);
    return fresh;
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

function PluginDialog({ codes, onClose }: { codes: string[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [channel] = useState(getSyncChannel);
  const [pushState, setPushState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function push() {
    setPushState("sending");
    try {
      const res = await fetch("/api/public/studio-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, payload: buildStudioPayload(codes) }),
      });
      setPushState(res.ok ? "sent" : "error");
    } catch {
      setPushState("error");
    }
    setTimeout(() => setPushState("idle"), 3000);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([PLUGIN_SOURCE], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "MapForgePlugin.lua";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function copy() {
    await navigator.clipboard.writeText(PLUGIN_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="panel max-w-md w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-display text-lg font-semibold flex items-center gap-2"><Boxes className="w-5 h-5 text-primary" /> MapForge Studio Plugin</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <ol className="text-sm space-y-2 list-decimal pl-5 text-foreground/90">
          <li>Copy the plugin below.</li>
          <li>In Roblox Studio, add a <b>Script</b> to <b>ServerStorage</b> and paste it in.</li>
          <li>Right-click the Script → <b>Save as Local Plugin…</b> → Save. You can delete the Script after.</li>
          <li>A <b>MapForge</b> button now appears in the <b>Plugins</b> tab.</li>
          <li>Open it, paste your free Gemini key, type what to build and press <b>Build with AI</b> — it builds real parts right in your place. Allow the web request when Studio asks.</li>
          <li>Bundles from <b>Send to Studio</b> here can be pasted in and run with <b>Run pasted code</b>. Ctrl+Z undoes anything.</li>
        </ol>
        <div className="flex gap-2">
          <button onClick={copy} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy plugin"}
          </button>
          <button onClick={download} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-surface-2">
            <Download className="w-4 h-4" /> .lua
          </button>
        </div>
      </div>
    </div>
  );
}
