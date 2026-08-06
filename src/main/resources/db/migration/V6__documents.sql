create table document (
    id bigserial primary key,
    name varchar(255) not null,
    created_by varchar(150) not null,
    created_at timestamp not null default now()
);

create table document_version (
    id bigserial primary key,
    document_id bigint not null references document(id) on delete cascade,
    version_number int not null,
    object_key varchar(500) not null,
    original_filename varchar(255) not null,
    file_size bigint not null,
    created_by varchar(150) not null,
    created_at timestamp not null default now(),
    constraint uq_document_version_number unique (document_id, version_number)
);
create index idx_document_version_document_id on document_version(document_id);
