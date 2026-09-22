import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { retrieveGuidelineChunks } from "@/lib/assistant/retrieval";
import { buildSystemPrompt, OUT_OF_SCOPE_MESSAGE } from "@/lib/assistant/prompt";

const chatRequestSchema = z.object({ message: z.string().min(1).max(1000) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  const { message } = parsed.data;

  const chunks = await retrieveGuidelineChunks(message);

  if (chunks.length === 0) {
    return NextResponse.json({ answer: OUT_OF_SCOPE_MESSAGE, sources: [], mode: "out_of_scope" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let answer: string;
  let mode: "llm" | "stub";

  if (!apiKey) {
    // Stub mode: no LLM key configured. Return the matched excerpts
    // directly rather than fabricating a synthesized answer — see
    // services/ml README-style transparency principle applied here too.
    answer =
      "AI synthesis is disabled (no API key configured) — showing the matched guideline excerpts directly:\n\n" +
      chunks.map((c, i) => `[${i + 1}] ${c.title}: ${c.content}`).join("\n\n");
    mode = "stub";
  } else {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: buildSystemPrompt(chunks),
      messages: [{ role: "user", content: message }],
    });
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    answer = textBlock?.text ?? OUT_OF_SCOPE_MESSAGE;
    mode = "llm";
  }

  const sources = chunks.map((c) => ({ id: c.id, title: c.title, source: c.source, citation_url: c.citation_url }));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("assistant_messages").insert([
      { user_id: user.id, role: "user", content: message, cited_chunk_ids: [] },
      { user_id: user.id, role: "assistant", content: answer, cited_chunk_ids: chunks.map((c) => c.id) },
    ]);
  }

  return NextResponse.json({ answer, sources, mode });
}
