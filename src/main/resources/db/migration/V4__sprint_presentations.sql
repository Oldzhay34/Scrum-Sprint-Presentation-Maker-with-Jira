create table sprint_presentations (
    id bigint identity(1,1) primary key,
    team_id bigint not null references teams(id) on delete cascade,
    sprint_no nvarchar(50) not null,
    date_range nvarchar(200),
    content nvarchar(max) not null default '{}',
    current_version int not null default 1,
    updated_by nvarchar(50),
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    updated_at datetimeoffset(7) not null default sysutcdatetime(),
    constraint uq_sprint_presentations_team_sprint unique (team_id, sprint_no)
);
create index idx_sprint_presentations_team_id on sprint_presentations(team_id);

-- Audit log: her upsert'te buraya yeni bir satir eklenir (insert-only, hic
-- update/delete edilmez). Version gecmisi ve rollback bu tablo uzerinden calisir.
create table sprint_presentation_versions (
    id bigint identity(1,1) primary key,
    presentation_id bigint not null references sprint_presentations(id) on delete cascade,
    version int not null,
    content nvarchar(max) not null,
    updated_by nvarchar(50) not null,
    updated_at datetimeoffset(7) not null default sysutcdatetime(),
    constraint uq_presentation_versions_presentation_version unique (presentation_id, version)
);
create index idx_presentation_versions_presentation_id on sprint_presentation_versions(presentation_id);
