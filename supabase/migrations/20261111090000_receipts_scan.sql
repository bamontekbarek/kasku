-- M3 · Scan struk AI: receipts, bucket Storage `receipts`, kuota scan (PRD 7, 7.1, 7.2).
-- Penulisan receipts dan kuota hanya lewat server (service role), supaya user tidak bisa
-- mengubah status scan atau mengembalikan kuotanya sendiri. User hanya bisa membaca miliknya.

create type public.receipt_status as enum ('uploaded', 'processing', 'done', 'failed');

-- ---------------------------------------------------------------------------
-- receipts
-- ---------------------------------------------------------------------------
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  status public.receipt_status not null default 'uploaded',
  ai_model text,
  ai_result jsonb,
  error text,
  prompt_tokens integer,
  completion_tokens integer,
  cached_tokens integer,
  image_bytes integer not null,
  image_width integer,
  image_height integer,
  image_hash text not null,
  scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index receipts_user_hash_idx on public.receipts (user_id, image_hash, created_at desc);
create index receipts_scanned_at_idx on public.receipts (scanned_at) where scanned_at is not null;

create trigger receipts_set_updated_at
  before update on public.receipts
  for each row execute function public.set_updated_at();

alter table public.receipts enable row level security;

create policy "receipts: baca milik sendiri" on public.receipts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "receipts: hapus milik sendiri" on public.receipts
  for delete to authenticated using (user_id = (select auth.uid()));

-- Satu struk = satu transaksi. Menghapus receipt hanya melepas tautannya.
alter table public.expenses
  add constraint expenses_receipt_fkey foreign key (receipt_id, user_id)
  references public.receipts (id, user_id) on delete set null (receipt_id);
create unique index expenses_receipt_unique on public.expenses (receipt_id) where receipt_id is not null;

-- ---------------------------------------------------------------------------
-- save_expense: tambah p_receipt_id (transaksi dari scan). Fungsi lama dihapus agar
-- tidak ada overload; pemanggil lama tetap jalan karena parameter baru punya default.
-- ---------------------------------------------------------------------------
drop function public.save_expense(uuid, bigint, text, timestamptz, uuid, public.payment_method, text, public.expense_source, jsonb);

create function public.save_expense(
  p_id uuid,
  p_amount bigint,
  p_merchant text,
  p_spent_at timestamptz,
  p_category_id uuid,
  p_payment_method public.payment_method,
  p_note text,
  p_source public.expense_source default 'manual',
  p_items jsonb default null,
  p_receipt_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into public.expenses (amount, merchant, spent_at, category_id, payment_method, note, source, receipt_id)
    values (p_amount, btrim(coalesce(p_merchant, '')), p_spent_at, p_category_id, p_payment_method,
            btrim(coalesce(p_note, '')), coalesce(p_source, 'manual'), p_receipt_id)
    returning id into v_id;
  else
    update public.expenses
       set amount = p_amount,
           merchant = btrim(coalesce(p_merchant, '')),
           spent_at = p_spent_at,
           category_id = p_category_id,
           payment_method = p_payment_method,
           note = btrim(coalesce(p_note, ''))
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'expense not found' using errcode = 'P0002';
    end if;
  end if;

  if p_items is not null then
    delete from public.expense_items where expense_id = v_id;
    insert into public.expense_items (expense_id, name, price, position)
    select v_id, btrim(it ->> 'name'), coalesce((it ->> 'price')::bigint, 0), (ord - 1)::smallint
      from jsonb_array_elements(p_items) with ordinality as t(it, ord);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.save_expense(uuid, bigint, text, timestamptz, uuid, public.payment_method, text, public.expense_source, jsonb, uuid) from public, anon;
grant execute on function public.save_expense(uuid, bigint, text, timestamptz, uuid, public.payment_method, text, public.expense_source, jsonb, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privat `receipts`, path {user_id}/{receipt_id}.jpg.
-- Upload hanya dari server (service role). User boleh membaca (signed URL) dan
-- menghapus file di foldernya sendiri.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "receipts: baca foto sendiri" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts: hapus foto sendiri" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Kuota scan (7.2)
-- ---------------------------------------------------------------------------
create table public.scan_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0,
  last_scan_at timestamptz,
  in_progress boolean not null default false,
  minute_started_at timestamptz,
  minute_count integer not null default 0,
  primary key (user_id, day)
);

alter table public.scan_usage enable row level security;

create policy "scan_usage: baca milik sendiri" on public.scan_usage
  for select to authenticated using (user_id = (select auth.uid()));

create table public.scan_ip_usage (
  ip text not null,
  hour timestamptz not null,
  count integer not null default 0,
  primary key (ip, hour)
);

alter table public.scan_ip_usage enable row level security;
-- Tanpa policy: hanya service role.

-- Hari kuota user (reset 00.00 di zona waktu user, default WIT).
create or replace function public.scan_day(p_user uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone coalesce((select timezone from public.profiles where id = p_user), 'Asia/Jayapura'))::date;
$$;

-- Cek semua batas lalu catat satu scan, dalam satu transaksi dengan row lock.
-- Hasil: {ok, reason: busy|quota|too_fast|ip, remaining, retry_after (detik)}.
create or replace function public.consume_scan_quota(
  p_user uuid,
  p_ip text,
  p_daily integer,
  p_per_minute integer,
  p_ip_hourly integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := public.scan_day(p_user);
  v_hour timestamptz := date_trunc('hour', now());
  r public.scan_usage%rowtype;
  v_ip_count integer;
  v_window_open boolean;
begin
  insert into public.scan_usage (user_id, day) values (p_user, v_day) on conflict do nothing;
  select * into r from public.scan_usage where user_id = p_user and day = v_day for update;

  if r.in_progress and r.last_scan_at > now() - interval '90 seconds' then
    return jsonb_build_object('ok', false, 'reason', 'busy', 'remaining', greatest(p_daily - r.count, 0), 'retry_after', 10);
  end if;

  if r.count >= p_daily then
    return jsonb_build_object('ok', false, 'reason', 'quota', 'remaining', 0, 'retry_after', null);
  end if;

  v_window_open := r.minute_started_at is not null and r.minute_started_at > now() - interval '60 seconds';
  if v_window_open and r.minute_count >= p_per_minute then
    return jsonb_build_object('ok', false, 'reason', 'too_fast', 'remaining', p_daily - r.count,
      'retry_after', greatest(1, ceil(60 - extract(epoch from now() - r.minute_started_at))::integer));
  end if;

  if p_ip is not null and p_ip <> '' then
    insert into public.scan_ip_usage (ip, hour) values (p_ip, v_hour) on conflict do nothing;
    select count into v_ip_count from public.scan_ip_usage where ip = p_ip and hour = v_hour for update;
    if v_ip_count >= p_ip_hourly then
      return jsonb_build_object('ok', false, 'reason', 'ip', 'remaining', p_daily - r.count,
        'retry_after', greatest(1, ceil(extract(epoch from v_hour + interval '1 hour' - now()))::integer));
    end if;
    update public.scan_ip_usage set count = count + 1 where ip = p_ip and hour = v_hour;
    delete from public.scan_ip_usage where hour < now() - interval '1 day';
  end if;

  update public.scan_usage
     set count = count + 1,
         last_scan_at = now(),
         in_progress = true,
         minute_started_at = case when v_window_open then minute_started_at else now() end,
         minute_count = case when v_window_open then minute_count + 1 else 1 end
   where user_id = p_user and day = v_day;

  return jsonb_build_object('ok', true, 'reason', null, 'remaining', p_daily - r.count - 1, 'retry_after', null);
end;
$$;

-- Selesai scan. p_refund = true untuk kegagalan server/AI (kuota dikembalikan).
create or replace function public.finish_scan(p_user uuid, p_refund boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.scan_usage
     set in_progress = false,
         count = case when p_refund then greatest(count - 1, 0) else count end,
         minute_count = case when p_refund then greatest(minute_count - 1, 0) else minute_count end
   where user_id = p_user and day = public.scan_day(p_user);
end;
$$;

-- Total token AI semua user sejak p_since (batas biaya harian).
create or replace function public.ai_usage_since(p_since timestamptz)
returns table (prompt_tokens bigint, cached_tokens bigint, completion_tokens bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(r.prompt_tokens), 0)::bigint,
         coalesce(sum(r.cached_tokens), 0)::bigint,
         coalesce(sum(r.completion_tokens), 0)::bigint
    from public.receipts r
   where r.scanned_at >= p_since;
$$;

revoke execute on function public.scan_day(uuid) from public, anon, authenticated;
revoke execute on function public.consume_scan_quota(uuid, text, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.finish_scan(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.ai_usage_since(timestamptz) from public, anon, authenticated;
grant execute on function public.scan_day(uuid) to service_role;
grant execute on function public.consume_scan_quota(uuid, text, integer, integer, integer) to service_role;
grant execute on function public.finish_scan(uuid, boolean) to service_role;
grant execute on function public.ai_usage_since(timestamptz) to service_role;
