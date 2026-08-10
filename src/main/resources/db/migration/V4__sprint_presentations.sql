create table sprint_presentations (
    id bigint generated always as identity primary key,
    team_id bigint not null references teams(id) on delete cascade,
    sprint_no varchar(50) not null,
    date_range varchar(200),
    content jsonb not null default '{}',
    current_version int not null default 1,
    updated_by varchar(50),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_sprint_presentations_team_sprint unique (team_id, sprint_no)
);
create index idx_sprint_presentations_team_id on sprint_presentations(team_id);

-- Audit log: her upsert'te buraya yeni bir satir eklenir (insert-only, hic
-- update/delete edilmez). Version gecmisi ve rollback bu tablo uzerinden calisir.
create table sprint_presentation_versions (
    id bigint generated always as identity primary key,
    presentation_id bigint not null references sprint_presentations(id) on delete cascade,
    version int not null,
    content jsonb not null,
    updated_by varchar(50) not null,
    updated_at timestamptz not null default now(),
    constraint uq_presentation_versions_presentation_version unique (presentation_id, version)
);
create index idx_presentation_versions_presentation_id on sprint_presentation_versions(presentation_id);
