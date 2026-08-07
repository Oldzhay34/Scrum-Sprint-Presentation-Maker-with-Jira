create table document (
    id bigint identity(1,1) primary key,
    name nvarchar(255) not null,
    created_by nvarchar(150) not null,
    created_at datetimeoffset(7) not null default sysutcdatetime()
);

create table document_version (
    id bigint identity(1,1) primary key,
    document_id bigint not null references document(id) on delete cascade,
    version_number int not null,
    object_key nvarchar(500) not null,
    original_filename nvarchar(255) not null,
    file_size bigint not null,
    created_by nvarchar(150) not null,
    created_at datetimeoffset(7) not null default sysutcdatetime(),
    constraint uq_document_version_number unique (document_id, version_number)
);
create index idx_document_version_document_id on document_version(document_id);
