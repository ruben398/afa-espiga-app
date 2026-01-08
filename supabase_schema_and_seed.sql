-- AFA Espiga (demo) - SQL schema + seed
-- 1) Paste into Supabase SQL Editor and run.
-- Note: Storage bucket 'adjunts' must be created in Supabase Dashboard (Storage) and set to PUBLIC for demo.

create extension if not exists pgcrypto;

-- Families
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  email text,
  address text,
  phone_father text,
  phone_mother text,
  name_father text,
  name_mother text,
  job_father text,
  job_mother text,
  allergies text,
  iban text,
  acollida boolean not null default false,
  last_seen_at timestamptz,
  last_seen_posts_at timestamptz,
  created_at timestamptz not null default now()
);

-- Students
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  course text,
  menjador boolean not null default false,
  bus1 boolean not null default false,
  bus2 boolean not null default false,
  acollida boolean not null default false,
  allergies text,
  created_at timestamptz not null default now()
);

-- Groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  kind text not null default 'custom'
);

create table if not exists student_groups (
  student_id uuid references students(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (student_id, group_id)
);

-- Posts (news)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  is_global boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists post_groups (
  post_id uuid references posts(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (post_id, group_id)
);

create table if not exists post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

-- Surveys
create table if not exists surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_global boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  text text not null,
  options text[] not null
);

create table if not exists survey_groups (
  survey_id uuid references surveys(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (survey_id, group_id)
);

create table if not exists survey_answers (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  question_id uuid not null references survey_questions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  family_id uuid not null references families(id) on delete cascade,
  answer text not null,
  created_at timestamptz not null default now(),
  unique (survey_id, question_id, student_id)
);

-- Signup requests (pending)
create table if not exists signup_requests (
  id uuid primary key default gen_random_uuid(),
  cognoms text not null,
  correu text,
  tel_pare text,
  tel_mare text,
  payload jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Clean demo data (optional)
-- truncate table survey_answers, survey_groups, survey_questions, surveys, post_attachments, post_groups, posts, student_groups, groups, students, families, signup_requests restart identity;

-- Seed groups
insert into groups (name, kind) values
  ('Menjador','service'),
  ('Bus 1','service'),
  ('Bus 2','service'),
  ('Acollida','service'),
  ('I4A','course'),
  ('2nA','course'),
  ('3rB','course')
on conflict (name) do nothing;

-- Seed families (demo password: AFAESPIGA)
insert into families (username, password_hash, email, address, phone_father, phone_mother, name_father, name_mother, job_father, job_mother, acollida)
values
  ('Pérez Vicens', 'AFAESPIGA', 'familia1@example.com', 'C/ Exemple 1, Lleida', '600111222', '600333444', 'Ruben', 'Evelyn', 'Autònom', 'Administrativa', false),
  ('García López', 'AFAESPIGA', 'familia2@example.com', 'C/ Exemple 2, Lleida', '600555666', '600777888', 'Jordi', 'Marta', 'Operari', 'Infermera', true),
  ('Martínez Ruiz', 'AFAESPIGA', 'familia3@example.com', 'C/ Exemple 3, Lleida', '610111222', '610333444', 'Pau', 'Laura', 'Professor', 'Comercial', false),
  ('Fernández Soler', 'AFAESPIGA', 'familia4@example.com', 'C/ Exemple 4, Lleida', '620111222', '620333444', 'Sergi', 'Núria', 'Transportista', 'Autònoma', false),
  ('Costa Puig', 'AFAESPIGA', 'familia5@example.com', 'C/ Exemple 5, Lleida', '630111222', '630333444', 'Oriol', 'Clàudia', 'Tècnic', 'Arquitecta', true)
on conflict (username) do nothing;

-- Seed students
with f as (select id, username from families)
insert into students (family_id, first_name, last_name, course, menjador, bus1, bus2, acollida, allergies)
select
  f.id,
  s.first_name,
  f.username,
  s.course,
  s.menjador,
  s.bus1,
  s.bus2,
  s.acollida,
  s.allergies
from f
join (values
  ('Pérez Vicens','Mia','I4A', true, false, false, false, 'Ou'),
  ('Pérez Vicens','Biel','2nA', false, true, false, false, null),
  ('García López','Anna','I4A', true, false, true, true, null),
  ('Martínez Ruiz','Pol','3rB', false, false, false, false, 'Làctics'),
  ('Costa Puig','Júlia','2nA', true, false, false, true, null),
  ('Costa Puig','Marc','I4A', false, true, false, false, null)
) as s(username, first_name, course, menjador, bus1, bus2, acollida, allergies)
on f.username = s.username;

-- Link students to groups (course + services)
with g as (select id, name from groups),
     st as (select id, course, menjador, bus1, bus2, acollida from students)
insert into student_groups (student_id, group_id)
select st.id, g.id
from st join g on (
  (g.name = st.course)
  or (g.name='Menjador' and st.menjador)
  or (g.name='Bus 1' and st.bus1)
  or (g.name='Bus 2' and st.bus2)
  or (g.name='Acollida' and st.acollida)
);

-- Seed posts
insert into posts (title, body, is_global)
values
  ('Benvinguts a l’app de proves', 'Aquesta és una versió de prova per a AFA Espiga. Proveu notícies, enquestes i dades.', true),
  ('Menú del menjador (exemple)', 'Aquí penjarem el PDF o imatge del menú mensual. (Adjuntable des del panell admin)', false);

-- Target second post to Menjador
insert into post_groups (post_id, group_id)
select p.id, g.id
from posts p, groups g
where p.title='Menú del menjador (exemple)' and g.name='Menjador'
on conflict do nothing;

-- Seed survey for Menjador
insert into surveys (title, is_global) values ('Enquesta menjador: assistència', false);
insert into survey_questions (survey_id, text, options)
select s.id, 'El teu fill/a farà ús del menjador el mes vinent?', array['Sí','No']
from surveys s where s.title='Enquesta menjador: assistència';

insert into survey_groups (survey_id, group_id)
select s.id, g.id
from surveys s, groups g
where s.title='Enquesta menjador: assistència' and g.name='Menjador'
on conflict do nothing;
