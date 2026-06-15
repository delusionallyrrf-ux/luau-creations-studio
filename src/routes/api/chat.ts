import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type Body = { messages?: unknown; vibe?: string; generator?: string };

const SYSTEM = `You are MapForge AI — a friendly, sharp assistant that helps people design and build Roblox maps with Luau and Blender.

You help with:
- Generating clean, well-commented Luau scripts for Roblox Studio (terrain, obbies, cities, props, mechanics)
- Blender → Roblox workflows: OBJ/FBX export tips, MeshPart import, scale conversion (Blender meters → Roblox studs, 1m ≈ 3.57 studs)
- Map design feedback, vibes, layout, pacing, lighting, color
- Explaining things to younger creators clearly without being condescending

Style rules:
- Be concise, warm, and visual. Use short paragraphs and bullet points.
- ALWAYS put Luau in fenced code blocks with the \`\`\`lua tag so it can be copied/downloaded.
- Put Blender Python scripts in \`\`\`python blocks.
- When generating a script, start with a one-line summary, then the code, then a short "How to use in Roblox Studio" section (max 4 steps).
- Match the user's selected vibe (Nostalgic = 2010s Roblox classic, Niche = experimental/weird, Popular = trendy modern Roblox styles, Modern = clean minimalist, Retro = pixel/low-poly).
- Never invent Roblox APIs. If unsure, say so.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, vibe, generator } = (await request.json()) as Body;
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctxBits: string[] = [];
        if (vibe) ctxBits.push(`Current vibe preset: ${vibe}.`);
        if (generator) ctxBits.push(`User is focused on generator: ${generator}.`);
        const system = ctxBits.length ? `${SYSTEM}\n\nContext: ${ctxBits.join(" ")}` : SYSTEM;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({ originalMessages: messages as UIMessage[] });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "AI error";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
