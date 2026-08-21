package com.aksa.capacityplanner.jiraintegration.port;

/**
 * Bir Jira senkronizasyon isteginin govdesi - JiraSyncTriggerService'ten
 * arka plandaki JiraSyncProcessor'a tasinir. (Eskiden RabbitMQ'daki
 * jira.sync.request.queue uzerinden JSON olarak geciyordu; kuyruk kalkti,
 * artik dogrudan metot parametresi - bkz. JiraSyncAsyncConfig.)
 */
public record JiraSyncRequestedMessage(Long teamId, String jiraProjectKey, String jql) {
}
