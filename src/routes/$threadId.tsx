import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { UIMessage } from "ai";
import { ThreadSidebar } from "@/components/ThreadSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { loadThreads, newThread, saveThreads, type Thread } from "@/lib/threads";

export const Route = createFileRoute("/$threadId")({
  head: () => ({
    meta: [
      { title: "Build — MapForge" },
      { name: "description", content: "Design your Roblox map with AI." },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = useParams({ from: "/$threadId" });
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadThreads();
    setThreads(loaded);
    setHydrated(true);
    if (!loaded.find((t) => t.id === threadId)) {
      if (loaded.length > 0) {
        navigate({ to: "/$threadId", params: { threadId: loaded[0].id }, replace: true });
      } else {
        const t = newThread();
        saveThreads([t]);
        setThreads([t]);
        navigate({ to: "/$threadId", params: { threadId: t.id }, replace: true });
      }
    }
  }, [threadId, navigate]);

  const active = useMemo(() => threads.find((t) => t.id === threadId), [threads, threadId]);

  const updateThread = useCallback(
    (patch: Partial<Thread>) => {
      setThreads((prev) => {
        const next = prev.map((t) =>
          t.id === threadId ? { ...t, ...patch, updatedAt: Date.now() } : t
        );
        saveThreads(next);
        return next;
      });
    },
    [threadId]
  );

  const handleMessages = useCallback(
    (messages: UIMessage[]) => {
      setThreads((prev) => {
        const cur = prev.find((t) => t.id === threadId);
        if (!cur) return prev;
        if (cur.messages === messages) return prev;
        const next = prev.map((t) =>
          t.id === threadId ? { ...t, messages, updatedAt: Date.now() } : t
        );
        saveThreads(next);
        return next;
      });
    },
    [threadId]
  );

  const handleTitle = useCallback(
    (title: string) => {
      setThreads((prev) => {
        const cur = prev.find((t) => t.id === threadId);
        if (!cur || cur.title !== "New build") return prev;
        const next = prev.map((t) => (t.id === threadId ? { ...t, title } : t));
        saveThreads(next);
        return next;
      });
    },
    [threadId]
  );

  const handleNew = useCallback(() => {
    const t = newThread();
    const next = [t, ...threads];
    saveThreads(next);
    setThreads(next);
    navigate({ to: "/$threadId", params: { threadId: t.id } });
  }, [threads, navigate]);

  const handleDelete = useCallback(
    (id: string) => {
      const next = threads.filter((t) => t.id !== id);
      saveThreads(next);
      setThreads(next);
      if (id === threadId) {
        if (next.length > 0) {
          navigate({ to: "/$threadId", params: { threadId: next[0].id }, replace: true });
        } else {
          const t = newThread();
          saveThreads([t]);
          setThreads([t]);
          navigate({ to: "/$threadId", params: { threadId: t.id }, replace: true });
        }
      }
    },
    [threads, threadId, navigate]
  );

  if (!hydrated || !active) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <ThreadSidebar
        threads={threads}
        activeId={threadId}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <main className="flex-1 min-w-0 flex flex-col h-screen">
        <ChatPanel
          key={active.id}
          thread={active}
          onMessages={handleMessages}
          onTitle={handleTitle}
        />
      </main>
      <GeneratorPanel thread={active} onChange={updateThread} />
    </div>
  );
}
