-- Fixed-window rate limiter for edge functions.
-- Lives in a schema the public API does not expose; only the service role
-- (used inside edge functions) can call rl_hit().

create schema if not exists private;

create table if not exists private.rate_hits (
  bucket       text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (bucket, window_start)
);

-- Returns true if this hit is allowed, false if the bucket is over its limit.
create or replace function public.rl_hit(p_bucket text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits  integer;
begin
  insert into private.rate_hits as r (bucket, window_start, hits)
  values (p_bucket, v_start, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- Opportunistic cleanup (~1% of calls) so the table never grows unbounded.
  if random() < 0.01 then
    delete from private.rate_hits where window_start < now() - interval '2 days';
  end if;

  return v_hits <= p_max;
end;
$$;

revoke all on function public.rl_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rl_hit(text, integer, integer) to service_role;
