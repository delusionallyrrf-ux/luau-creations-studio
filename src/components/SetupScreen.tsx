import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { VIBES, GENERATORS, ITEM_PACKS, DETAIL_LEVELS, type Thread } from "@/lib/threads";

interface Props {
  thread: Thread;
  onConfirm: (patch: Partial<Thread>) => void;
}

export function SetupScreen({ thread, onConfirm }: Props) {
  const [vibe, setVibe] = useState(thread.vibe);
  const [generator, setGenerator] = useState(thread.generator);
  const [items, setItems] = useState<string[]>(thread.items ?? []);
  const [detail, setDetail] = useState<Thread["detail"]>(thread.detail ?? "epic");

  function toggleItem(id: string) {
    setItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function start() {
    onConfirm({ vibe, generator, items, detail, locked: true });
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 chip mb-4">
            <Sparkles className="w-3 h-3 text-primary" /> Set the stage
          </div>
          <h1 className="text-display text-3xl font-semibold mb-2">
            Lock in your build settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Pick once — the AI will follow these exactly for the whole chat. You can change them
            later (your current progress will reset, but the AI remembers the conversation).
          </p>
        </div>

        <Section title="Vibe" caption="Sets the entire art direction">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VIBES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVibe(v.id)}
                className={`text-left p-2.5 rounded-md border text-xs transition ${
                  vibe === v.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="font-medium text-sm">{v.label}</div>
                <div className="text-[11px] mt-0.5 text-muted-foreground">{v.hint}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Focus" caption="What this chat will mainly generate">
          <div className="grid sm:grid-cols-2 gap-2">
            {GENERATORS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenerator(g.id)}
                className={`text-left p-2.5 rounded-md border text-sm transition ${
                  generator === g.id
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

        <Section title="Items" caption="Item systems the AI should be ready to build">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ITEM_PACKS.map((it) => (
              <button
                key={it.id}
                onClick={() => toggleItem(it.id)}
                className={`text-left p-2.5 rounded-md border text-xs transition ${
                  items.includes(it.id)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="font-medium text-sm">{it.label}</div>
                <div className="text-[11px] mt-0.5 text-muted-foreground">{it.hint}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Detail level" caption="How much the AI should pour into every script">
          <div className="grid grid-cols-3 gap-2">
            {DETAIL_LEVELS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDetail(d.id)}
                className={`text-left p-3 rounded-md border text-xs transition ${
                  detail === d.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="font-medium text-sm">{d.label}</div>
                <div className="text-[11px] mt-0.5 text-muted-foreground">{d.hint}</div>
              </button>
            ))}
          </div>
        </Section>

        <button
          onClick={start}
          className="w-full mt-4 h-12 rounded-md bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          Start building <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs uppercase tracking-wider font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{caption}</div>
      </div>
      {children}
    </div>
  );
}
