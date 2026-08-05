create table teams (
    id bigint identity(1,1) primary key,
    name nvarchar(200) not null,
    description nvarchar(max),
    maintenance_allocation_percent numeric(5,4),
    default_target_work_days numeric(6,2),
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    updated_at datetimeoffset(7) not null default sysutcdatetime()
);

create table team_members (
    id bigint identity(1,1) primary key,
    team_id bigint not null references teams(id) on delete cascade,
    full_name nvarchar(200) not null,
    role nvarchar(100),
    email nvarchar(200),
    start_date date,
    status_code nvarchar(50),
    target_work_days numeric(6,2),
    target_work_days_overridden bit not null default 0,
    custom_field_values nvarchar(max) not null default '{}',
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    updated_at datetimeoffset(7) not null default sysutcdatetime()
);
create index idx_team_members_team_id on team_members(team_id);

create table status_options (
    id bigint identity(1,1) primary key,
    team_id bigint references teams(id) on delete cascade,
    code nvarchar(50) not null,
    label nvarchar(100) not null,
    counts_as_completed bit not null default 0,
    color_hex nvarchar(20),
    sort_order int not null default 0,
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    updated_at datetimeoffset(7) not null default sysutcdatetime(),
    constraint uq_status_options_team_code unique (team_id, code)
);

create table team_custom_field_definitions (
    id bigint identity(1,1) primary key,
    team_id bigint not null references teams(id) on delete cascade,
    field_key nvarchar(100) not null,
    label nvarchar(200) not null,
    type nvarchar(20) not null,
    required bit not null default 0,
    sort_order int not null default 0,
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    updated_at datetimeoffset(7) not null default sysutcdatetime(),
    constraint uq_team_custom_field_key unique (team_id, field_key)
);

create table leave_periods (
    id bigint identity(1,1) primary key,
    name nvarchar(200) not null,
    type nvarchar(20) not null,
    scope nvarchar(20) not null,
    team_member_id bigint references team_members(id) on delete cascade,
    start_date date not null,
    end_date date not null,
    day_fraction numeric(3,2) not null,
    description nvarchar(max),
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    updated_at datetimeoffset(7) not null default sysutcdatetime(),
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
    id bigint identity(1,1) primary key,
    team_id bigint not null references teams(id) on delete cascade,
    -- NOT: bu FK "on delete set null" DEGIL, "on delete no action" - team_members'in
    -- kendisi de teams'ten cascade sildigi icin, SQL Server "teams -> work_items"
    -- arasinda BIRDEN FAZLA cascade yolu (dogrudan + team_members uzerinden) oldugunu
    -- tespit edip "may cause cycles or multiple cascade paths" hatasiyla tabloyu
    -- olusturmayi reddediyordu (Postgres'te bu kisitlama yoktu). Pratikte: bir TAKIMI
    -- silmek zaten work_items'i (team_id uzerinden) doğrudan cascade siliyor; SADECE
    -- tek bir kisiyi (team_member) - takimin tamamini degil - silmeye calisirken o
    -- kisiye atanmis is kalemleri varsa, artik FK ihlaliyle engellenir (once is
    -- kalemleri baska birine atanmali/silinmeli) - onceden sessizce NULL'a dusuyordu.
    team_member_id bigint references team_members(id) on delete no action,
    title nvarchar(500) not null,
    jira_issue_key nvarchar(50),
    planned_effort_days numeric(8,2) not null default 0,
    status_code nvarchar(50),
    source nvarchar(20) not null,
    added_date date,
    closed_date date,
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    updated_at datetimeoffset(7) not null default sysutcdatetime(),
    constraint chk_work_items_closed_after_added check (closed_date is null or added_date is null or closed_date >= added_date)
);
create index idx_work_items_team_id on work_items(team_id);
create index idx_work_items_team_member_id on work_items(team_member_id);
create index idx_work_items_jira_issue_key on work_items(jira_issue_key);
