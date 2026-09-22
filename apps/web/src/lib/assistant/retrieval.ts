import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface RetrievedChunk {
  id: string;
  source: string;
  title: string;
  content: string;
  citation_url: string | null;
  rank: number;
}

// Full-text search (see supabase/migrations/0003_guideline_chunk_search.sql).
// Deliberately not vector similarity — no embedding provider key is
// configured, so this is real keyword-based retrieval rather than semantic
// search. Swap in embeddings later without touching call sites.
export async function retrieveGuidelineChunks(query: string, matchCount = 4): Promise<RetrievedChunk[]> {
  // websearch_to_tsquery ANDs bare words together by default, which is too
  // strict for short natural-language questions against a small corpus (a
  // user asking "pregnant" won't match a chunk that only says "conceive").
  // Joining words with "or" makes websearch_to_tsquery build an OR query
  // instead — ts_rank still favors chunks that match more terms, so this
  // trades precision for the recall this corpus size actually needs.
  const orQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .join(" or ");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_guideline_chunks", {
    search_query: orQuery,
    match_count: matchCount,
  });
  if (error) {
    console.error("retrieveGuidelineChunks failed", error);
    return [];
  }
  return data ?? [];
}
