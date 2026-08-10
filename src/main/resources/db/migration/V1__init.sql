create table teams (
    id bigint generated always as identity primary key,
    name varchar(200) not null,
    description text,
    maintenance_allocation_percent numeric(5,4),
    default_target_work_days numeric(6,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table team_members (
    id bigint generated always as identity primary key,
    team_id bigint not null references teams(id) on delete cascade,
    full_name varchar(200) not null,
    role varchar(100),
    email varchar(200),
    start_date date,
    status_code varchar(50),
    target_work_days numeric(6,2),
    target_work_days_overridden boolean not null default false,
    custom_field_values text not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_team_members_team_id on team_members(team_id);

create table status_options (
    id bigint generated always as identity primary key,
    team_id bigint references teams(id) on delete cascade,
    code varchar(50) not null,
    label varchar(100) not null,
    counts_as_completed boolean not null default false,
    color_hex varchar(20),
    sort_order int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_status_options_team_code unique (team_id, code)
);

create table team_custom_field_definitions (
    id bigint generated always as identity primary key,
    team_id bigint not null references teams(id) on delete cascade,
    field_key varchar(100) not null,
    label varchar(200) not null,
    type varchar(20) not null,
    required boolean not null default false,
    sort_order int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_team_custom_field_key unique (team_id, field_key)
);

create table leave_periods (
    id bigint generated always as identity primary key,
    name varchar(200) not null,
    type varchar(20) not null,
    scope varchar(20) not null,
    team_member_id bigint references team_members(id) on delete cascade,
    start_date date not null,
    end_date date not null,
    day_fraction numeric(3,2) not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_leave_periods_date_order check (end_date >= start_date),
    constraint chk_leave_periods_scope_member check (
        (scope = 'TEAM_MEMBER' and team_member_id is not null)
        or (scope = 'COMPANY_WIDE' and team_member_id is null)
    )
);
create index idx_leave_periods_team_member_id on leave_periods(team_member_id);
create index idx_leave_periods_scope on leave_periods(scope);
create index idx_leave_periods_date_range on leave_periods(start_date, end_date);

create table work_items (
    id bigint generated always as identity primary key,
    team_id bigint not null references teams(id) on delete cascade,
    -- NOT: bu FK "on delete set null" DEGIL, "on delete no action" - bir TAKIMI
    -- silmek zaten work_items'i (team_id uzerinden) doğrudan cascade siliyor;
    -- SADECE tek bir kisiyi (team_member) - takimin tamamini degil - silmeye
    -- calisirken o kisiye atanmis is kalemleri varsa, FK ihlaliyle engellenir
    -- (once is kalemleri baska birine atanmali/silinmeli).
    team_member_id bigint references team_members(id) on delete no action,
    title varchar(500) not null,
    jira_issue_key varchar(50),
    planned_effort_days numeric(8,2) not null default 0,
    status_code varchar(50),
    source varchar(20) not null,
    added_date date,
    closed_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_work_items_closed_after_added check (closed_date is null or added_date is null or closed_date >= added_date)
);
create index idx_work_items_team_id on work_items(team_id);
create index idx_work_items_team_member_id on work_items(team_member_id);
create index idx_work_items_jira_issue_key on work_items(jira_issue_key);
