import { createFileRoute } from "@tanstack/react-router";

// Tiny relay so the MapForge website can push build bundles to the Studio
// plugin. The website POSTs { channel, payload }; the plugin polls GET with
// its channel code and applies anything newer than the last seq it saw.
//
// Note: the store lives in server memory, so messages survive a few minutes
// and are delivered when the site and Studio reach the same server instance.
// If a push does not arrive, push again — pushing is idempotent for the user.

type Item = { seq: number; payload: string; at: number };
type Channel = { seq: number; items: Item[]; touched: number };

const channels = new Map<string, Channel>();
const MAX_CHANNELS = 100;
const MAX_ITEMS = 20;
const MAX_PAYLOAD = 200_000;
const TTL_MS = 10 * 60 * 1000;
const CHANNEL_RE = /^[a-z0-9-]{4,32}$/;

function sweep() {
  const now = Date.now();
  for (const [key, ch] of channels) {
    if (now - ch.touched > TTL_MS) channels.delete(key);
  }
}

export const Route = createFileRoute("/api/public/studio-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        sweep();
        let body: { channel?: unknown; payload?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }
        const channel = typeof body.channel === "string" ? body.channel : "";
        const payload = typeof body.payload === "string" ? body.payload : "";
        if (!CHANNEL_RE.test(channel)) {
          return Response.json({ error: "channel must be 4-32 chars of a-z 0-9 -" }, { status: 400 });
        }
        if (!payload || payload.length > MAX_PAYLOAD) {
          return Response.json({ error: "payload missing or too large" }, { status: 400 });
        }
        if (!channels.has(channel) && channels.size >= MAX_CHANNELS) {
          return Response.json({ error: "relay busy, try again later" }, { status: 503 });
        }
        const ch = channels.get(channel) ?? { seq: 0, items: [], touched: 0 };
        ch.seq += 1;
        ch.items.push({ seq: ch.seq, payload, at: Date.now() });
        if (ch.items.length > MAX_ITEMS) ch.items.shift();
        ch.touched = Date.now();
        channels.set(channel, ch);
        return Response.json({ ok: true, seq: ch.seq });
      },
      GET: async ({ request }) => {
        sweep();
        const url = new URL(request.url);
        const channel = url.searchParams.get("channel") ?? "";
        const after = Number(url.searchParams.get("after") ?? "0") || 0;
        if (!CHANNEL_RE.test(channel)) {
          return Response.json({ error: "bad channel" }, { status: 400 });
        }
        const ch = channels.get(channel);
        if (!ch) return Response.json({ items: [] });
        ch.touched = Date.now();
        return Response.json({ items: ch.items.filter((i) => i.seq > after) });
      },
    },
  },
});
