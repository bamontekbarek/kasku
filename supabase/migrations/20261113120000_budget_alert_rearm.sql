-- NOT-03 / BUD-04 fix: peringatan anggaran bisa terkirim lagi.
-- Sebelumnya dedupe_key `budget_near:YYYY-MM:{kategori}:{ambang}` membatasi 1 notifikasi per
-- kategori per bulan selamanya. Kalau pemakaian turun di bawah ambang (transaksi dihapus/
-- dipindah, batas dinaikkan) lalu naik lagi, user tidak diberi tahu.
-- Sekarang tiap baris anggaran menyimpan level terakhir yang sudah diberitahukan:
-- notifikasi dikirim saat level naik, dan level ikut turun saat pemakaian turun (siap lagi).
-- save_budget menulis ulang baris, jadi menyimpan anggaran juga mereset level.

-- 0 = aman, 1 = hampir habis, 2 = lewat batas.
alter table public.budgets
  add column alert_level smallint not null default 0 check (alert_level between 0 and 2);

-- Isi dari notifikasi yang sudah ada bulan ini, supaya tidak ada kiriman ganda setelah rilis.
update public.budgets b
   set alert_level = case
         when exists (select 1 from public.notifications n
                       where n.user_id = b.user_id
                         and n.dedupe_key = 'budget_over:' || to_char(b.month, 'YYYY-MM') || ':' || coalesce(b.category_id::text, 'total'))
           then 2
         when exists (select 1 from public.notifications n
                       where n.user_id = b.user_id
                         and n.dedupe_key like 'budget_near:' || to_char(b.month, 'YYYY-MM') || ':' || coalesce(b.category_id::text, 'total') || ':%')
           then 1
         else 0
       end;

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
  v_stamp text := to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS');
  s public.notification_settings%rowtype;
  r record;
  v_pct int;
  v_level smallint;
  v_key text;
begin
  select * into s from public.notification_settings where user_id = p_user;
  if not found then
    return;
  end if;

  perform public.copy_budget_forward(p_user, v_month);

  for r in
    select b.id, b.category_id, b.alert_level, c.name, b.amount as lim,
           coalesce((select sum(e.amount) from public.expenses e
                      where e.user_id = p_user and e.spent_at >= v_from and e.spent_at < v_to
                        and (b.category_id is null or e.category_id = b.category_id)), 0)::bigint as used
      from public.budgets b
      left join public.categories c on c.id = b.category_id
     where b.user_id = p_user and b.month = v_month
  loop
    v_pct := floor(r.used * 100.0 / r.lim)::int;
    v_level := case when r.used > r.lim then 2 when v_pct >= s.budget_threshold then 1 else 0 end;
    continue when v_level = r.alert_level;

    -- Bersyarat pada level lama: dua transaksi bersamaan tidak mengirim dua kali.
    update public.budgets set alert_level = v_level where id = r.id and alert_level = r.alert_level;
    continue when not found or v_level < r.alert_level;

    v_key := to_char(v_month, 'YYYY-MM') || ':' || coalesce(r.category_id::text, 'total') || ':' || v_stamp;
    if v_level = 2 and s.budget_over then
      perform public.add_notification(p_user, 'budget_over', 'budget_over:' || v_key,
        jsonb_build_object('name', r.name, 'used', r.used, 'limit', r.lim, 'pct', v_pct, 'days_left', v_days_left),
        '/budget');
    elsif v_level = 1 and s.budget_near then
      perform public.add_notification(p_user, 'budget_near', 'budget_near:' || v_key,
        jsonb_build_object('name', r.name, 'used', r.used, 'limit', r.lim, 'pct', v_pct, 'days_left', v_days_left,
                           'threshold', s.budget_threshold),
        '/budget');
    end if;
  end loop;
end;
$$;

revoke execute on function public.check_budget_alerts(uuid) from public, anon, authenticated;

-- Hapus transaksi juga menurunkan level, supaya kenaikan berikutnya terkirim.
create or replace function public.expenses_budget_alerts_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  -- Lewati user yang sedang dihapus (cascade dari auth.users).
  for v_user in select distinct o.user_id from old_rows o
                 where exists (select 1 from auth.users u where u.id = o.user_id) loop
    perform public.check_budget_alerts(v_user);
  end loop;
  return null;
end;
$$;

revoke execute on function public.expenses_budget_alerts_deleted() from public, anon, authenticated;

create trigger expenses_budget_alerts_delete
  after delete on public.expenses
  referencing old table as old_rows
  for each statement execute function public.expenses_budget_alerts_deleted();
