-- scraped_documents and trade_queries had row-level security OFF, so anyone
-- holding the public anon key could insert, update or delete rows. They are a
-- read cache for the TradeTerminal backend, which writes with the service role
-- (bypasses RLS), so: RLS on, public read-only.
alter table public.scraped_documents enable row level security;
alter table public.trade_queries     enable row level security;

drop policy if exists "public read scraped_documents" on public.scraped_documents;
create policy "public read scraped_documents" on public.scraped_documents for select to anon, authenticated using (true);

drop policy if exists "public read trade_queries" on public.trade_queries;
create policy "public read trade_queries" on public.trade_queries for select to anon, authenticated using (true);
