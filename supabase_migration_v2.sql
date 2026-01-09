-- AFA Espiga - migració v2
-- Objectius:
-- 1) Posts amb tipus (news/alert/menu), arxiu i expiració
-- 2) Avisos: marcat com llegit per família
-- 3) Normalització d'usuaris (MAJÚSCULES, sense accents)
-- 4) Grup global "TOTS"
-- 5) Esdeveniments per avisar l'admin quan una família/alumne es modifica

-- 0) Extensions útils
create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- 1) Posts: afegim camps nous (si no existeixen)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='type') then
    alter table public.posts add column type text not null default 'news' check (type in ('news','alert','menu'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='pinned') then
    alter table public.posts add column pinned boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='archived') then
    alter table public.posts add column archived boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='expires_at') then
    alter table public.posts add column expires_at timestamptz null;
  end if;
end $$;

update public.posts set type='news' where type is null;

-- 2) Marcat de lectura per a AVISOS
create table if not exists public.post_reads (
  post_id uuid not null references public.posts(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (post_id, family_id)
);

-- 3) Esdeveniments per admin (per avisar quan canvien dades)
create table if not exists public.admin_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_table text not null,
  entity_id uuid null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

-- Triggers: quan s'actualitza una família o alumne, guardem event
create or replace function public.notify_admin_on_update() returns trigger as $$
begin
  insert into public.admin_events(event_type, entity_table, entity_id, payload)
  values (
    'UPDATED',
    TG_TABLE_NAME,
    new.id,
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );
  return new;
end;
$$ language plpgsql security definer;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='trg_families_notify_admin') then
    create trigger trg_families_notify_admin after update on public.families
    for each row execute function public.notify_admin_on_update();
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='students') then
    if not exists (select 1 from pg_trigger where tgname='trg_students_notify_admin') then
      create trigger trg_students_notify_admin after update on public.students
      for each row execute function public.notify_admin_on_update();
    end if;
  end if;
end $$;

-- 4) Grup global "TOTS"
insert into public.groups(name) select 'TOTS'
where not exists (select 1 from public.groups where name='TOTS');

-- 5) Normalització de families.username (opcional però recomanat)
-- IMPORTANT: Això canvia el text guardat. Si vols mantenir el format original,
-- crea un camp username_norm i deixa username tal qual.
-- Aquí fem el canvi directe perquè tu ho vols així per la demo.
update public.families
set username = upper(unaccent(username))
where username is not null;

-- Assegurem unicitat (si hi ha col·lisions, caldrà ajustar manualment)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname='families_username_unique'
  ) then
    alter table public.families add constraint families_username_unique unique (username);
  end if;
exception when others then
  -- si ja existeix o hi ha conflictes, ignorem per no parar la migració
end $$;
