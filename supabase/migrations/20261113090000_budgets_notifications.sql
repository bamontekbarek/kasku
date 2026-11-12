-- M4 · Anggaran (BUD-01 – BUD-05) dan notifikasi dalam aplikasi (NOT-01 – NOT-04).
-- Teks notifikasi dirender di aplikasi dari `type` + `params` (messages/id.json, en.json),
-- supaya ikut bahasa user saat ini (ACC-02). Notifikasi hanya dibuat oleh fungsi database.

create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- budgets: satu baris total (category_id null) + satu baris per kategori per bulan.
-- ---------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  category_id uuid,
  amount bigint not null check (amount > 0 and amount <= 999999999999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (user_id, month, category_id),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);

create index budgets_category_idx on public.budgets (category_id) where category_id is not null;

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

alter table public.budgets enable row level security;

create policy "budgets: baca milik sendiri" on public.budgets
  for select to authenticated using (user_id = (select auth.uid()));
create policy "budgets: tambah milik sendiri" on public.budgets
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "budgets: ubah milik sendiri" on public.budgets
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "budgets: hapus milik sendiri" on public.budgets
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create type public.notification_type as enum ('budget_near', 'budget_over', 'daily_reminder', 'weekly_summary', 'monthly_report', 'security');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  params jsonb not null default '{}',
  link text not null default '/dashboard',
  read_at timestamptz,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

-- User hanya membaca. Tandai dibaca lewat mark_notifications_read (hanya read_at yang berubah).
create policy "notifications: baca milik sendiri" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications
     set read_at = now()
   where user_id = (select auth.uid())
     and read_at is null
     and (p_ids is null or id = any (p_ids));
$$;

-- Insert idempoten (dedupe_key unik per user).
create or replace function public.add_notification(p_user uuid, p_type public.notification_type, p_key text, p_params jsonb, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, type, dedupe_key, params, link)
  values (p_user, p_type, p_key, p_params, p_link)
  on conflict (user_id, dedupe_key) do nothing;
$$;

-- ---------------------------------------------------------------------------
-- Helper waktu user
-- ---------------------------------------------------------------------------
create or replace function public.user_tz(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select timezone from public.profiles where id = p_user), 'Asia/Jayapura');
$$;

-- BUD-05: bulan tanpa anggaran menyalin anggaran bulan terakhir sebelumnya.
-- Hanya untuk bulan berjalan; dipanggil saat membaca status dan saat cek notifikasi.
create or replace function public.copy_budget_forward(p_user uuid, p_month date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from date;
begin
  if exists (select 1 from public.budgets where user_id = p_user and month = p_month) then
    return;
  end if;
  select max(month) into v_from from public.budgets where user_id = p_user and month < p_month;
  if v_from is null then
    return;
  end if;
  insert into public.budgets (user_id, month, category_id, amount)
  select user_id, p_month, category_id, amount
    from public.budgets
   where user_id = p_user and month = v_from
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_budget_status (BUD-01, BUD-03, BUD-04): total + semua kategori dengan batas,
-- pemakaian bulan ini, dan pemakaian bulan lalu (acuan di layar Atur Anggaran).
-- security definer karena ikut menyalin anggaran (BUD-05); semua query difilter auth.uid().
-- ---------------------------------------------------------------------------
create or replace function public.get_budget_status(p_month date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_tz text := public.user_tz(v_user);
  v_today date := (now() at time zone v_tz)::date;
  v_month date := date_trunc('month', coalesce(p_month, v_today))::date;
  v_from timestamptz := v_month::timestamp at time zone v_tz;
  v_to timestamptz := (v_month + interval '1 month')::timestamp at time zone v_tz;
  v_prev timestamptz := (v_month - interval '1 month')::timestamp at time zone v_tz;
  v_days_left int;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if v_month = date_trunc('month', v_today)::date then
    perform public.copy_budget_forward(v_user, v_month);
    v_days_left := (v_month + interval '1 month')::date - v_today;
  elsif v_month > v_today then
    v_days_left := (v_month + interval '1 month')::date - v_month;
  else
    v_days_left := 0;
  end if;

  with spent as (
    select e.category_id,
           sum(e.amount) filter (where e.spent_at >= v_from)::bigint as used,
           sum(e.amount) filter (where e.spent_at < v_from)::bigint as last_used
      from public.expenses e
     where e.user_id = v_user and e.spent_at >= v_prev and e.spent_at < v_to
     group by e.category_id
  )
  select jsonb_build_object(
           'month', v_month,
           'days_left', v_days_left,
           'threshold', coalesce((select budget_threshold from public.notification_settings where user_id = v_user), 80),
           'remind', coalesce((select budget_near from public.notification_settings where user_id = v_user), true),
           'total', (select amount from public.budgets where user_id = v_user and month = v_month and category_id is null),
           'used', coalesce((select sum(used) from spent), 0),
           'last_used', coalesce((select sum(last_used) from spent), 0),
           'has_any', exists (select 1 from public.budgets where user_id = v_user),
           'categories', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'id', c.id, 'name', c.name, 'color', c.color, 'is_system', c.is_system,
                      'limit', b.amount, 'used', coalesce(s.used, 0), 'last_used', coalesce(s.last_used, 0))
                    order by c.sort_order, c.name)
               from public.categories c
               left join public.budgets b on b.category_id = c.id and b.month = v_month and b.user_id = v_user
               left join spent s on s.category_id = c.id
              where c.user_id = v_user), '[]'::jsonb)
         )
    into v_result;
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- check_budget_alerts (NOT-03): kirim "hampir habis" / "lewat batas" untuk total dan
-- per kategori bulan berjalan. Satu notifikasi per jenis per kategori per bulan.
-- ---------------------------------------------------------------------------
create or replace function public.check_budget_alerts(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text := public.user_tz(p_user);
  v_today date := (now() at time zone v_tz)::date;
  v_month date := date_trunc('month', v_today)::date;
  v_from timestamptz := v_month::timestamp at time zone v_tz;
  v_to timestamptz := (v_month + interval '1 month')::timestamp at time zone v_tz;
  v_days_left int := (v_month + interval '1 month')::date - v_today;
  s public.notification_settings%rowtype;
  r record;
  v_pct int;
  v_key text;
begin
  select * into s from public.notification_settings where user_id = p_user;
  if not found or not (s.budget_near or s.budget_over) then
    return;
  end if;

  perform public.copy_budget_forward(p_user, v_month);

  for r in
    select b.category_id, c.name, b.amount as lim,
           coalesce((select sum(e.amount) from public.expenses e
                      where e.user_id = p_user and e.spent_at >= v_from and e.spent_at < v_to
                        and (b.category_id is null or e.category_id = b.category_id)), 0)::bigint as used
      from public.budgets b
      left join public.categories c on c.id = b.category_id
     where b.user_id = p_user and b.month = v_month
  loop
    v_key := to_char(v_month, 'YYYY-MM') || ':' || coalesce(r.category_id::text, 'total');
    v_pct := floor(r.used * 100.0 / r.lim)::int;
    if s.budget_over and r.used > r.lim then
      perform public.add_notification(p_user, 'budget_over', 'budget_over:' || v_key,
        jsonb_build_object('name', r.name, 'used', r.used, 'limit', r.lim, 'pct', v_pct, 'days_left', v_days_left),
        '/budget');
    elsif s.budget_near and v_pct >= s.budget_threshold then
      perform public.add_notification(p_user, 'budget_near', 'budget_near:' || v_key || ':' || s.budget_threshold,
        jsonb_build_object('name', r.name, 'used', r.used, 'limit', r.lim, 'pct', v_pct, 'days_left', v_days_left,
                           'threshold', s.budget_threshold),
        '/budget');
    end if;
  end loop;
end;
$$;

-- Dipicu setelah transaksi ditambah/diubah (manual, scan, pindah kategori).
create or replace function public.expenses_budget_alerts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  for v_user in select distinct user_id from new_rows loop
    perform public.check_budget_alerts(v_user);
  end loop;
  return null;
end;
$$;

create trigger expenses_budget_alerts_insert
  after insert on public.expenses
  referencing new table as new_rows
  for each statement execute function public.expenses_budget_alerts();

create trigger expenses_budget_alerts_update
  after update on public.expenses
  referencing new table as new_rows
  for each statement execute function public.expenses_budget_alerts();

-- ---------------------------------------------------------------------------
-- save_budget (BUD-01): ganti semua batas satu bulan sekaligus.
-- p_categories: [{category_id, amount}], amount 0/null = tanpa batas.
-- security definer karena ikut cek notifikasi; FK (category_id, user_id) menolak kategori orang lain.
-- ---------------------------------------------------------------------------
create or replace function public.save_budget(p_month date, p_total bigint, p_categories jsonb, p_remind boolean default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_month date := date_trunc('month', p_month)::date;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_total is null or p_total <= 0 then
    raise exception 'total must be positive' using errcode = '22023';
  end if;

  delete from public.budgets where user_id = v_user and month = v_month;

  insert into public.budgets (user_id, month, category_id, amount)
  values (v_user, v_month, null, p_total);

  insert into public.budgets (user_id, month, category_id, amount)
  select v_user, v_month, (it ->> 'category_id')::uuid, (it ->> 'amount')::bigint
    from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) as t(it)
   where coalesce((it ->> 'amount')::bigint, 0) > 0;

  if p_remind is not null then
    update public.notification_settings set budget_near = p_remind where user_id = v_user;
  end if;

  perform public.check_budget_alerts(v_user);
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_category: anggaran kategori yang dihapus pindah ke "Lainnya" (PRD 6).
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

  -- Gabungkan batas ke "Lainnya" (jumlahkan jika "Lainnya" sudah punya batas).
  insert into public.budgets (user_id, month, category_id, amount)
  select b.user_id, b.month, v_other, b.amount
    from public.budgets b
   where b.category_id = p_id
  on conflict (user_id, month, category_id) do update set amount = least(public.budgets.amount + excluded.amount, 999999999999);
  delete from public.budgets where category_id = p_id;

  update public.expenses set category_id = v_other where category_id = p_id;
  delete from public.categories where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Keamanan akun: kata sandi diganti (lewat Ubah Kata Sandi atau link reset).
-- ---------------------------------------------------------------------------
create or replace function public.handle_password_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password and old.encrypted_password is not null then
    perform public.add_notification(new.id, 'security', 'password:' || extract(epoch from now())::bigint, '{"event": "password"}'::jsonb, '/forgot-password');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.handle_password_changed();

-- ---------------------------------------------------------------------------
-- Notifikasi terjadwal (NOT-03): pengingat harian, ringkasan mingguan (Senin 08.00),
-- laporan bulanan (tanggal 1, 08.00). Dijalankan pg_cron tiap 10 menit; dedupe_key
-- mencegah kiriman ganda, jadi jam pengiriman = run pertama setelah jam yang ditentukan.
-- ---------------------------------------------------------------------------
create or replace function public.run_scheduled_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  u record;
  v_now timestamp;
  v_today date;
  v_week date;
  v_month date;
  v_total bigint;
  v_prev bigint;
  v_count bigint;
  v_top text;
begin
  for u in
    select ns.*, coalesce(p.timezone, 'Asia/Jayapura') as tz
      from public.notification_settings ns
      left join public.profiles p on p.id = ns.user_id
     where ns.daily_reminder or ns.weekly_summary or ns.monthly_report
  loop
    v_now := now() at time zone u.tz;
    v_today := v_now::date;

    -- Pengingat harian: hanya jika belum ada catatan hari ini.
    if u.daily_reminder and v_now::time >= u.reminder_time
       and not exists (select 1 from public.notifications
                        where user_id = u.user_id and dedupe_key = 'daily:' || v_today)
       and not exists (select 1 from public.expenses
                        where user_id = u.user_id
                          and spent_at >= (v_today::timestamp at time zone u.tz)
                          and spent_at < ((v_today + 1)::timestamp at time zone u.tz)) then
      perform public.add_notification(u.user_id, 'daily_reminder', 'daily:' || v_today, '{}'::jsonb, '/add');
    end if;

    -- Ringkasan minggu lalu (Senin–Minggu), dikirim Senin mulai 08.00.
    if u.weekly_summary and extract(isodow from v_today) = 1 and v_now::time >= time '08:00' then
      v_week := v_today - 7;
      if not exists (select 1 from public.notifications where user_id = u.user_id and dedupe_key = 'weekly:' || v_week) then
        select coalesce(sum(amount) filter (where spent_at >= (v_week::timestamp at time zone u.tz)), 0),
               coalesce(sum(amount) filter (where spent_at < (v_week::timestamp at time zone u.tz)), 0),
               count(*) filter (where spent_at >= (v_week::timestamp at time zone u.tz))
          into v_total, v_prev, v_count
          from public.expenses
         where user_id = u.user_id
           and spent_at >= ((v_week - 7)::timestamp at time zone u.tz)
           and spent_at < (v_today::timestamp at time zone u.tz);
        if v_count > 0 then
          perform public.add_notification(u.user_id, 'weekly_summary', 'weekly:' || v_week,
            jsonb_build_object('start', v_week, 'end', v_today - 1, 'total', v_total, 'prev_total', v_prev, 'count', v_count),
            '/dashboard');
        end if;
      end if;
    end if;

    -- Laporan bulan lalu, dikirim tanggal 1 mulai 08.00.
    if u.monthly_report and extract(day from v_today) = 1 and v_now::time >= time '08:00' then
      v_month := (v_today - interval '1 month')::date;
      if not exists (select 1 from public.notifications where user_id = u.user_id and dedupe_key = 'monthly:' || to_char(v_month, 'YYYY-MM')) then
        select coalesce(sum(amount) filter (where spent_at >= (v_month::timestamp at time zone u.tz)), 0),
               coalesce(sum(amount) filter (where spent_at < (v_month::timestamp at time zone u.tz)), 0),
               count(*) filter (where spent_at >= (v_month::timestamp at time zone u.tz))
          into v_total, v_prev, v_count
          from public.expenses
         where user_id = u.user_id
           and spent_at >= ((v_month - interval '1 month')::timestamp at time zone u.tz)
           and spent_at < (v_today::timestamp at time zone u.tz);
        if v_count > 0 then
          select c.name into v_top
            from public.expenses e join public.categories c on c.id = e.category_id
           where e.user_id = u.user_id
             and e.spent_at >= (v_month::timestamp at time zone u.tz)
             and e.spent_at < (v_today::timestamp at time zone u.tz)
           group by c.name
           order by sum(e.amount) desc
           limit 1;
          perform public.add_notification(u.user_id, 'monthly_report', 'monthly:' || to_char(v_month, 'YYYY-MM'),
            jsonb_build_object('month', v_month, 'total', v_total, 'prev_total', v_prev, 'count', v_count, 'top', v_top),
            '/dashboard');
        end if;
      end if;
    end if;
  end loop;

  delete from public.notifications where created_at < now() - interval '120 days';
end;
$$;

-- ---------------------------------------------------------------------------
-- Hak akses
-- ---------------------------------------------------------------------------
revoke execute on function public.add_notification(uuid, public.notification_type, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.user_tz(uuid) from public, anon, authenticated;
revoke execute on function public.copy_budget_forward(uuid, date) from public, anon, authenticated;
revoke execute on function public.check_budget_alerts(uuid) from public, anon, authenticated;
revoke execute on function public.expenses_budget_alerts() from public, anon, authenticated;
revoke execute on function public.handle_password_changed() from public, anon, authenticated;
revoke execute on function public.run_scheduled_notifications() from public, anon, authenticated;

revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
revoke execute on function public.get_budget_status(date) from public, anon;
revoke execute on function public.save_budget(date, bigint, jsonb, boolean) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
grant execute on function public.get_budget_status(date) to authenticated;
grant execute on function public.save_budget(date, bigint, jsonb, boolean) to authenticated;

select cron.schedule('kasku-scheduled-notifications', '*/10 * * * *', 'select public.run_scheduled_notifications()');
