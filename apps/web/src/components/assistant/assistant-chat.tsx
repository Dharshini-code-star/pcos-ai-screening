"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Source {
  id: string;
  title: string;
  source: string;
  citation_url: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  mode?: "llm" | "stub" | "out_of_scope";
}

const SUGGESTIONS = [
  "How is PCOS actually diagnosed?",
  "Does PCOS mean I can't get pregnant?",
  "Is PCOS caused by being overweight?",
  "What's the difference between PCOS in teens vs adults?",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources, mode: data.mode },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong reaching the assistant. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-2xl border border-border/70 bg-card p-3 text-left text-sm text-muted-foreground hover:border-brand-pink-300 hover:bg-brand-blush-50 hover:text-brand-mauve-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-border/70 bg-card px-4 py-2.5 text-sm"
              }
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.mode === "stub" && (
                <p className="mt-2 text-xs opacity-70">
                  (AI synthesis disabled — showing matched excerpts directly.)
                </p>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-current/10 pt-2 text-xs opacity-80">
                  <p className="font-medium">Sources</p>
                  {m.sources.map((s) => (
                    <p key={s.id}>
                      {s.citation_url ? (
                        <a href={s.citation_url} target="_blank" rel="noreferrer" className="underline">
                          {s.title} — {s.source}
                        </a>
                      ) : (
                        `${s.title} — ${s.source}`
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about PCOS symptoms, diagnosis, or management…"
          disabled={loading}
          className="rounded-full"
        />
        <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={loading || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Answers are grounded only in a small set of curated guideline excerpts — not general
        medical knowledge, and never a diagnosis or treatment recommendation.
      </p>
    </div>
  );
}
