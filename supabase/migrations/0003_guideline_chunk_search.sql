-- Full-text search over the curated guideline corpus. This is the retrieval
-- step for the medical assistant (POST /api/assistant/chat). We use Postgres
-- full-text search rather than vector similarity because no embedding
-- provider key is configured in this environment — the retrieval is real,
-- just keyword-based rather than semantic. Swapping in pgvector similarity
-- later only requires populating guideline_chunks.embedding and replacing
-- this function's body; the API route's call site does not need to change.

create or replace function public.search_guideline_chunks(search_query text, match_count int default 4)
returns table (
  id uuid,
  source text,
  title text,
  content text,
  citation_url text,
  rank real
)
language sql
stable
security definer set search_path = public
as $$
  select
    id, source, title, content, citation_url,
    ts_rank(to_tsvector('english', title || ' ' || content), websearch_to_tsquery('english', search_query)) as rank
  from public.guideline_chunks
  where to_tsvector('english', title || ' ' || content) @@ websearch_to_tsquery('english', search_query)
  order by rank desc
  limit match_count;
$$;

revoke execute on function public.search_guideline_chunks(text, int) from public;
grant execute on function public.search_guideline_chunks(text, int) to anon, authenticated;
