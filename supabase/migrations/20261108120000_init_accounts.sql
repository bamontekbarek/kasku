-- M0/M1 · Fondasi akun: profiles, categories, notification_settings, trigger user baru.
-- Tabel transaksi, anggaran, struk, dan notifikasi menyusul di migrasi M2–M4.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Helper: updated_at otomatis
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (ACC-01, ACC-02)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  locale text not null default 'id' check (locale in ('id', 'en')),
  timezone text not null default 'Asia/Jayapura',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: baca milik sendiri" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profiles: ubah milik sendiri" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- insert hanya lewat trigger handle_new_user; delete lewat cascade auth.users.

-- ---------------------------------------------------------------------------
-- categories (CAT-01 – CAT-04)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 24),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index categories_user_sort_idx on public.categories (user_id, sort_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy "categories: baca milik sendiri" on public.categories
  for select to authenticated using (user_id = (select auth.uid()));

create policy "categories: tambah milik sendiri" on public.categories
  for insert to authenticated
  with check (user_id = (select auth.uid()) and is_system = false);

create policy "categories: ubah milik sendiri" on public.categories
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Kategori sistem ("Lainnya") tidak bisa dihapus (CAT-03).
create policy "categories: hapus milik sendiri" on public.categories
  for delete to authenticated
  using (user_id = (select auth.uid()) and is_system = false);

-- is_system tidak boleh diubah dari client.
create or replace function public.categories_protect_system()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_system is distinct from old.is_system then
    raise exception 'is_system tidak bisa diubah';
  end if;
  return new;
end;
$$;

create trigger categories_protect_system
  before update on public.categories
  for each row execute function public.categories_protect_system();

-- ---------------------------------------------------------------------------
-- notification_settings (NOT-04)
-- ---------------------------------------------------------------------------
create table public.notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  budget_near boolean not null default true,
  budget_threshold smallint not null default 80 check (budget_threshold in (70, 80, 90)),
  budget_over boolean not null default true,
  daily_reminder boolean not null default true,
  reminder_time time not null default '20:00',
  weekly_summary boolean not null default true,
  monthly_report boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger notification_settings_set_updated_at
  before update on public.notification_settings
  for each row execute function public.set_updated_at();

alter table public.notification_settings enable row level security;

create policy "notification_settings: baca milik sendiri" on public.notification_settings
  for select to authenticated using (user_id = (select auth.uid()));

create policy "notification_settings: ubah milik sendiri" on public.notification_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Trigger user baru: profil + 7 kategori bawaan + pengaturan notifikasi.
-- Satu transaksi dengan insert auth.users: jika gagal, register ikut gagal.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'id');
begin
  if v_locale not in ('id', 'en') then
    v_locale := 'id';
  end if;

  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80),
    v_locale
  );

  insert into public.categories (user_id, name, color, is_system, sort_order)
  values
    (new.id, 'Makanan & Minuman', '#FCD535', false, 1),
    (new.id, 'Belanja Harian',    '#F5913E', false, 2),
    (new.id, 'Transportasi',      '#4C8DF6', false, 3),
    (new.id, 'Tagihan',           '#A88BFA', false, 4),
    (new.id, 'Kesehatan',         '#2EBD85', false, 5),
    (new.id, 'Hiburan',           '#F06BA8', false, 6),
    (new.id, 'Lainnya',           '#5E6673', true,  99);

  insert into public.notification_settings (user_id) values (new.id);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
