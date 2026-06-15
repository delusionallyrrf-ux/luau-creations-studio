import { Link, useRouterState } from "@tanstack/react-router";
import { Plus, Trash2, MessageSquare, Boxes } from "lucide-react";
import type { Thread } from "@/lib/threads";

interface Props {
  threads: Thread[];
  activeId: string | undefined;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ThreadSidebar({ threads, activeId, onNew, onDelete }: Props) {
  return (
    <aside className="w-72 shrink-0 border-r border-border bg-surface/60 backdrop-blur-sm flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 grid place-items-center">
            <Boxes className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-display text-sm font-semibold leading-none">MapForge</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              Roblox Luau Studio
            </div>
          </div>
        </div>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium py-2 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> New build
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 && (
          <div className="text-xs text-muted-foreground p-4 text-center">
            No builds yet. Start one!
          </div>
        )}
        {threads.map((t) => {
          const active = t.id === activeId;
          return (
            <div
              key={t.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition ${
                active ? "bg-accent text-accent-foreground" : "hover:bg-surface-2 text-foreground/80"
              }`}
            >
              <Link
                to="/$threadId"
                params={{ threadId: t.id }}
                className="flex-1 min-w-0 flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{t.title || "Untitled"}</span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(t.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                aria-label="Delete thread"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border text-[11px] text-muted-foreground">
        Threads saved locally in your browser.
      </div>
    </aside>
  );
}

// silence unused import warning if not used elsewhere
export const _ = useRouterState;
