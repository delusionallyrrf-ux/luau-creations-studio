import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { loadThreads, newThread, saveThreads } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MapForge — AI Roblox Luau Map Generator" },
      { name: "description", content: "Generate Roblox Luau map scripts and Blender exporters with an AI assistant. Sleek studio for all creators." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const threads = loadThreads();
    if (threads.length > 0) {
      navigate({ to: "/$threadId", params: { threadId: threads[0].id }, replace: true });
    } else {
      const t = newThread();
      saveThreads([t]);
      navigate({ to: "/$threadId", params: { threadId: t.id }, replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-muted-foreground text-sm">Loading MapForge...</div>
    </div>
  );
}
