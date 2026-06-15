-- One row per user storing the full team configuration.
-- user_id is the primary key so upsert naturally replaces the single record.

create table team_state (
  user_id        uuid references auth.users(id) on delete cascade primary key,
  members        jsonb        not null default '[]',
  rotation_track text         not null default 'concurrent',
  rotation_start_a text       not null default '2026-01-04',
  rotation_start_b text       not null default '2026-01-04',
  overrides      jsonb        not null default '{}',
  updated_at     timestamptz  default now()
);
