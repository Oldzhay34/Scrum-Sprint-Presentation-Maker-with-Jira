package com.aksa.capacityplanner.jiraintegration.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(JiraProperties.class)
public class JiraConfig {
}
