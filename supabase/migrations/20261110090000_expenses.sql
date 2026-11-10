-- M2 · Pencatatan inti: expenses, expense_items, hapus kategori, ringkasan dashboard.
-- Tabel receipts (M3) dan budgets (M4) menyusul. receipt_id belum punya FK; ditambah di M3.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
create type public.payment_method as enum ('cash', 'debit', 'qris', 'credit_card', 'ewallet');
create type public.expense_source as enum ('manual', 'scan');

-- Dipakai FK komposit (category_id, user_id): transaksi hanya boleh memakai kategori milik sendiri.
alter table public.categories add constraint categories_id_user_key unique (id, user_id);

-- ---------------------------------------------------------------------------
-- expenses (EXP-01 – EXP-05)
-- ---------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount bigint not null check (amount > 0 and amount <= 999999999999),
  merchant text not null default '' check (char_length(merchant) <= 80),
  spent_at timestamptz not null,
  category_id uuid not null,
  payment_method public.payment_method not null default 'cash',
  note text not null default '' check (char_length(note) <= 500),
  source public.expense_source not null default 'manual',
  receipt_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

create index expenses_user_spent_idx on public.expenses (user_id, spent_at desc);
create index expenses_category_idx on public.expenses (category_id);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

create policy "expenses: baca milik sendiri" on public.expenses
  for select to authenticated using (user_id = (select auth.uid()));
create policy "expenses: tambah milik sendiri" on public.expenses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "expenses: ubah milik sendiri" on public.expenses
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "expenses: hapus milik sendiri" on public.expenses
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- expense_items (rincian struk, HIS-02)
-- ---------------------------------------------------------------------------
create table public.expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  price bigint not null default 0 check (price >= 0 and price <= 999999999999),
  position smallint not null default 0,
  foreign key (expense_id, user_id) references public.expenses (id, user_id) on delete cascade
);

create index expense_items_expense_idx on public.expense_items (expense_id, position);
create index expense_items_name_trgm_idx on public.expense_items using gin (name extensions.gin_trgm_ops);

alter table public.expense_items enable row level security;

create policy "expense_items: baca milik sendiri" on public.expense_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "expense_items: tambah milik sendiri" on public.expense_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "expense_items: ubah milik sendiri" on public.expense_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "expense_items: hapus milik sendiri" on public.expense_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- save_expense: tambah atau ubah transaksi + rincian item dalam satu transaksi DB.
-- p_id null = baru. p_items null = rincian tidak diubah; array = ganti semua rincian.
-- security invoker: RLS tetap berlaku.
-- ---------------------------------------------------------------------------
create or replace function public.save_expense(
  p_id uuid,
  p_amount bigint,
  p_merchant text,
  p_spent_at timestamptz,
  p_category_id uuid,
  p_payment_method public.payment_method,
  p_note text,
  p_source public.expense_source default 'manual',
  p_items jsonb default null
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
    insert into public.expenses (amount, merchant, spent_at, category_id, payment_method, note, source)
    values (p_amount, btrim(coalesce(p_merchant, '')), p_spent_at, p_category_id, p_payment_method,
            btrim(coalesce(p_note, '')), coalesce(p_source, 'manual'))
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

-- ---------------------------------------------------------------------------
-- delete_category (CAT-03): pindahkan transaksi ke "Lainnya", lalu hapus kategorinya.
-- Anggaran (M4) ikut dipindah setelah tabel budgets ada.
-- ---------------------------------------------------------------------------
create or replace function public.delete_category(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_other uuid;
  v_system boolean;
begin
  select is_system into v_system from public.categories where id = p_id;
  if not found then
    raise exception 'category not found' using errcode = 'P0002';
  end if;
  if v_system then
    raise exception 'system category cannot be deleted' using errcode = '42501';
  end if;

  select id into v_other from public.categories
   where user_id = (select auth.uid()) and is_system
   limit 1;

  update public.expenses set category_id = v_other where category_id = p_id;
  delete from public.categories where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_period_summary (DASH-01 – DASH-05): total periode berjalan, jumlah, terbesar,
-- dan deret beberapa periode terakhir. Batas periode di zona waktu user (profiles.timezone).
-- p_period: day (7 hari), week (6 minggu, mulai Senin), month (6 bulan), year (5 tahun).
-- ---------------------------------------------------------------------------
create or replace function public.get_period_summary(p_period text, p_anchor date default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_tz text;
  v_step interval;
  v_n int;
  v_cur timestamp;
  v_first timestamp;
  v_result jsonb;
begin
  select timezone into v_tz from public.profiles where id = (select auth.uid());
  v_tz := coalesce(v_tz, 'Asia/Jayapura');

  case p_period
    when 'day' then v_step := interval '1 day'; v_n := 7;
    when 'week' then v_step := interval '1 week'; v_n := 6;
    when 'month' then v_step := interval '1 month'; v_n := 6;
    when 'year' then v_step := interval '1 year'; v_n := 5;
    else raise exception 'invalid period %', p_period using errcode = '22023';
  end case;

  v_cur := date_trunc(p_period, coalesce(p_anchor, (now() at time zone v_tz)::date)::timestamp);
  v_first := v_cur - v_step * (v_n - 1);

  with buckets as (
    select b, row_number() over (order by b) as i
      from generate_series(v_first, v_cur, v_step) as b
  ),
  tx as (
    select date_trunc(p_period, e.spent_at at time zone v_tz) as b, e.amount
      from public.expenses e
     where e.user_id = (select auth.uid())
       and e.spent_at >= (v_first at time zone v_tz)
       and e.spent_at < ((v_cur + v_step) at time zone v_tz)
  ),
  totals as (
    select bk.b, bk.i, coalesce(sum(r.amount), 0)::bigint as total,
           count(r.amount) as n, coalesce(max(r.amount), 0)::bigint as biggest
      from buckets bk
      left join tx r on r.b = bk.b
     group by bk.b, bk.i
  )
  select jsonb_build_object(
           'period', p_period,
           'start', (select b::date from totals where i = v_n),
           'total', (select total from totals where i = v_n),
           'count', (select n from totals where i = v_n),
           'max', (select biggest from totals where i = v_n),
           'prev_total', (select total from totals where i = v_n - 1),
           'series', (select jsonb_agg(jsonb_build_object('start', b::date, 'total', total) order by i) from totals)
         )
    into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_category_totals (DASH-08, Kelola kategori): total dan jumlah transaksi per kategori
-- dalam satu bulan (zona waktu user). Semua kategori ikut, termasuk yang nol.
-- ---------------------------------------------------------------------------
create or replace function public.get_category_totals(p_month date default null)
returns table (category_id uuid, name text, color text, is_system boolean, total bigint, tx_count bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_tz text;
  v_from timestamp;
begin
  select timezone into v_tz from public.profiles where id = (select auth.uid());
  v_tz := coalesce(v_tz, 'Asia/Jayapura');
  v_from := date_trunc('month', coalesce(p_month, (now() at time zone v_tz)::date)::timestamp);

  return query
    select c.id, c.name, c.color, c.is_system,
           coalesce(sum(e.amount), 0)::bigint, count(e.id)
      from public.categories c
      left join public.expenses e
        on e.category_id = c.id
       and e.spent_at >= (v_from at time zone v_tz)
       and e.spent_at < ((v_from + interval '1 month') at time zone v_tz)
     where c.user_id = (select auth.uid())
     group by c.id
     order by c.sort_order, c.name;
end;
$$;

revoke execute on function public.save_expense(uuid, bigint, text, timestamptz, uuid, public.payment_method, text, public.expense_source, jsonb) from public, anon;
revoke execute on function public.delete_category(uuid) from public, anon;
revoke execute on function public.get_period_summary(text, date) from public, anon;
revoke execute on function public.get_category_totals(date) from public, anon;
grant execute on function public.save_expense(uuid, bigint, text, timestamptz, uuid, public.payment_method, text, public.expense_source, jsonb) to authenticated;
grant execute on function public.delete_category(uuid) to authenticated;
grant execute on function public.get_period_summary(text, date) to authenticated;
grant execute on function public.get_category_totals(date) to authenticated;
