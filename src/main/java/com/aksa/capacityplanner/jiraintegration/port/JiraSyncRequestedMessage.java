package com.aksa.capacityplanner.jiraintegration.port;

/**
 * jira.sync.request.queue uzerinden tasinan mesaj govdesi.
 */
public record JiraSyncRequestedMessage(Long teamId, String jiraProjectKey, String jql) {
}
