-- jira_issue_key doluyken tekil olmali (MANUAL kayitlarda null olabilir, birden fazla null'a izin verilir)
drop index if exists idx_work_items_jira_issue_key on work_items;
create unique index uq_work_items_jira_issue_key on work_items(jira_issue_key) where jira_issue_key is not null;
