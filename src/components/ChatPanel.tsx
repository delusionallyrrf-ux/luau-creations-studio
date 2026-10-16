import { memo, useEffect, useMemo, useRef, useState } from "react";
import { rollIdea } from "@/lib/idea-roulette";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Send, Download, Copy, Check, Sparkles, User, ImagePlus, X } from "lucide-react";
import { messageText, ensureCodeBlocks, type Thread } from "@/lib/threads";
import { loadAiSettings } from "@/lib/ai-settings";
import { StudioExportBar } from "@/components/StudioExport";

interface Props {
  thread: Thread;
  onMessages: (messages: UIMessage[]) => void;
  onTitle: (title: string) => void;
}

export function ChatPanel({ thread, onMessages, onTitle }: Props) {
  const [input, setInput] = useState("");
  const [images, setImages] = useState<FileUIPart[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Capture the initial messages once — feeding the live array back into
  // useChat every render causes an infinite update loop (React error #185).
  const initialMessagesRef = useRef(thread.messages);
  const lastPersistedRef = useRef<UIMessage[]>(thread.messages);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { vibe: thread.vibe, generator: thread.generator, items: thread.items, detail: thread.detail },
        prepareSendMessagesRequest: ({ body, messages }) => {
          const ai = loadAiSettings();
          return {
            body: { ...body, aiModel: ai.model, aiKey: ai.apiKey, messages: compactMessagesForRequest(messages) },
          };
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thread.id],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: thread.id,
    messages: initialMessagesRef.current,
    transport,
    // Batch streaming updates — re-rendering on every single token of a long
    // answer overwhelms React ("Maximum update depth exceeded").
    experimental_throttle: 120,
  });

  const loading = status === "submitted" || status === "streaming";

  // Keep latest values in refs so we can save on unmount without re-subscribing.
  const latestMessagesRef = useRef(messages);
  latestMessagesRef.current = messages;
  const onMessagesRef = useRef(onMessages);
  onMessagesRef.current = onMessages;

  // Persist to the parent only when the AI is NOT streaming. Saving on every
  // streamed chunk re-rendered the whole page per token and crashed the chat.
  useEffect(() => {
    if (loading) return;
    if (lastPersistedRef.current === messages) return;
    lastPersistedRef.current = messages;
    onMessages(messages);
    if (messages.length > 0 && thread.title === "New build") {
      const first = messages.find((m) => m.role === "user");
      if (first) {
        const t = messageText(first).slice(0, 40).trim();
        if (t) onTitle(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading]);

  // Save whatever we have if the user switches chats mid-reply.
  useEffect(() => {
    return () => {
      const latest = latestMessagesRef.current;
      if (lastPersistedRef.current !== latest) {
        lastPersistedRef.current = latest;
        onMessagesRef.current(latest);
      }
    };
  }, []);

  useEffect(() => {
    // Instant scroll while streaming — stacking smooth scroll animations per chunk janks the page.
    bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [thread.id]);


  async function addImages(files: File[]) {
    const room = 3 - images.length;
    for (const f of files.filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room))) {
      try {
        const part = await fileToImagePart(f);
        setImages((prev) => (prev.length >= 3 ? prev : [...prev, part]));
      } catch {
        // unreadable image — skip it
      }
    }
  }

  function submit() {
    const text = input.trim();
    if ((!text && images.length === 0) || loading) return;
    setInput("");
    const files = images;
    setImages([]);
    sendMessage({ text, files });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 && <EmptyState onPick={(p) => { setInput(p); inputRef.current?.focus(); }} vibe={thread.vibe} />}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm pl-10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Thinking...
          </div>
        )}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            {error.message || "Something went wrong. Try again."}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-4 bg-surface/40">
        <div className="max-w-3xl mx-auto">
          {images.length > 0 && (
            <div className="flex gap-2 mb-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.url} alt={img.filename ?? "screenshot"} className="h-16 w-16 object-cover rounded-lg border border-border" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove image"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 grid place-items-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="panel-raised flex items-end gap-2 p-2 focus-within:glow-ring transition">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void addImages(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              title="Attach a screenshot (or paste one into the box)"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 w-9 h-9 grid place-items-center rounded-md border border-border hover:bg-surface transition text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
                if (files.length > 0) {
                  e.preventDefault();
                  void addImages(files);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Describe the map, the vibe, or paste a screenshot..."
              className="flex-1 bg-transparent resize-none outline-none text-sm py-2 px-2 placeholder:text-muted-foreground max-h-40"
              style={{ minHeight: 36 }}
            />
            <button
              type="button"
              title="Idea Roulette — roll a random game idea"
              onClick={() => { setInput(rollIdea()); inputRef.current?.focus(); }}
              className="shrink-0 w-9 h-9 grid place-items-center rounded-md border border-border hover:bg-surface transition text-lg"
            >
              🎲
            </button>
            <button
              onClick={submit}
              disabled={loading || (!input.trim() && images.length === 0)}
              className="shrink-0 w-9 h-9 grid place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 text-center">
            Vibe: <span className="text-foreground/80">{thread.vibe}</span> · Focus:{" "}
            <span className="text-foreground/80">{thread.generator}</span> · Powered by Lovable AI
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick, vibe }: { onPick: (p: string) => void; vibe: string }) {
  const prompts = [
    "Generate a forest terrain script with a river running through it.",
    "Make me a 10-stage obby with rotating platforms in a " + vibe + " style.",
    "How do I export a Blender model to Roblox at the right scale?",
    "Build a small medieval village with houses and lanterns.",
  ];
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="inline-flex items-center gap-2 chip mb-6">
        <Sparkles className="w-3 h-3 text-primary" /> AI map design assistant
      </div>
      <h1 className="text-display text-4xl font-semibold mb-3">
        Build Roblox maps, faster.
      </h1>
      <p className="text-muted-foreground mb-8">
        Chat with MapForge to generate Luau scripts, plan layouts, and bring your Blender models
        into Roblox. Download the code with one click.
      </p>
      <div className="grid sm:grid-cols-2 gap-2 text-left">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="panel p-3 text-sm hover:border-primary/50 hover:bg-surface-2 transition"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ message }: { message: UIMessage }) {
  const rawText = messageText(message);
  const isUser = message.role === "user";
  const text = isUser ? rawText : ensureCodeBlocks(rawText);

  if (isUser) {
    const imgs = message.parts.flatMap((p) =>
      p.type === "file" && p.mediaType.startsWith("image/") ? [p.url] : [],
    );
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm whitespace-pre-wrap">
            {imgs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {imgs.map((url, i) => (
                  <img key={i} src={url} alt="attached screenshot" className="max-h-40 rounded-lg border border-primary-foreground/20" />
                ))}
              </div>
            )}
            {text}
          </div>
          <div className="w-7 h-7 rounded-full bg-surface-2 border border-border grid place-items-center shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // Render assistant: interleave prose segments and code cards in order
  const segments = splitIntoSegments(text);

  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 grid place-items-center shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {segments.map((seg, i) =>
          seg.type === "code" ? (
            <CodeCard key={i} lang={seg.lang} code={seg.code} />
          ) : (
            <div key={i} className="markdown text-sm leading-relaxed text-foreground/90">
              <ReactMarkdown>{seg.text}</ReactMarkdown>
            </div>
          ),
        )}
        <StudioExportBar
          codes={segments
            .filter((s): s is Extract<Segment, { type: "code" }> => s.type === "code" && /^(lua|luau|txt)$/.test(s.lang))
            .map((s) => s.code)}
        />
      </div>
    </div>
  );
});

type Segment =
  | { type: "text"; text: string }
  | { type: "code"; lang: string; code: string };

function splitIntoSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const re = /```([a-zA-Z0-9_+-]*)\s*\r?\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(last, m.index).trim();
    if (before) segments.push({ type: "text", text: before });
    segments.push({
      type: "code",
      lang: (m[1] || "txt").toLowerCase(),
      code: m[2].replace(/\s+$/, ""),
    });
    last = m.index + m[0].length;
  }
  const tail = text.slice(last).trim();
  if (tail) segments.push({ type: "text", text: tail });
  return segments;
}

function compactMessagesForRequest(messages: UIMessage[]): UIMessage[] {
  const sliced = messages.slice(-12);
  // Keep screenshot parts only on the newest user message — vision works,
  // and old images don't bloat every request.
  let lastUser = -1;
  for (let i = sliced.length - 1; i >= 0; i--) {
    if (sliced[i].role === "user") { lastUser = i; break; }
  }
  return sliced.map((message, i) => {
    const limit = message.role === "user" ? 2_000 : 4_000;
    const text = trimForRequest(messageText(message), limit);
    const parts: UIMessage["parts"] = [{ type: "text", text }];
    if (i === lastUser) {
      for (const p of message.parts) {
        if (p.type === "file" && p.mediaType.startsWith("image/")) parts.push(p);
      }
    }
    return { ...message, parts } as UIMessage;
  });
}

function fileToImagePart(file: File): Promise<FileUIPart> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Downscale so screenshots stay cheap to send and small in storage.
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height, 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no canvas")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({
        type: "file",
        mediaType: "image/jpeg",
        url: canvas.toDataURL("image/jpeg", 0.85),
        filename: file.name,
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

function trimForRequest(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const head = Math.floor(maxLength * 0.6);
  const tail = maxLength - head;
  return `${text.slice(0, head)}\n\n[Older long output trimmed so chat keeps working.]\n\n${text.slice(-tail)}`;
}

function CodeCard({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const ext = lang === "lua" || lang === "luau" ? "lua" : lang === "python" ? "py" : "txt";

  function download() {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mapforge-${Date.now()}.${ext}`;
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2/50">
        <span className="chip"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{lang}</span>
        <div className="flex items-center gap-1">
          <button onClick={copy} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={download} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition">
            <Download className="w-3 h-3" /> .{ext}
          </button>
        </div>
      </div>
      <pre className="code-block !rounded-none !border-0 max-h-96"><code>{code}</code></pre>
      {summarizeCode(code) && (
        <div className="px-3 py-1.5 border-t border-border bg-surface-2/30 text-[10px] text-muted-foreground italic leading-snug">
          {summarizeCode(code)}
        </div>
      )}
    </div>
  );
}

function summarizeCode(code: string): string | null {
  for (const raw of code.split("\n").slice(0, 6)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(?:--|#|\/\/)\s*(.+)$/);
    if (m && m[1].length > 3) return m[1].replace(/\.$/, "");
    break;
  }
  return null;
}
