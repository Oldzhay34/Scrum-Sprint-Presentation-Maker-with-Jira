package com.aksa.capacityplanner.jiraintegration.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jira senkronizasyon akisi icin RabbitMQ topolojisi.
 *
 * Akis: API -> jira.sync.exchange (routing key: sync.request) -> jira.sync.request.queue
 *       -> JiraSyncRequestConsumer -> JiraGatewayPort.fetchIssues() -> WorkItem upsert.
 *
 * Bu tasarim, Jira'dan tek seferde cok fazla issue donebilme ihtimaline karsi
 * senkron HTTP request-response dongusunden ayirir: istek kuyruga dusurulur,
 * consumer arka planda isler. Jira baglantisi henuz devrede degilken
 * (NoOpJiraGatewayAdapter) consumer calisir ama islenecek veri bulamaz.
 */
@Configuration
public class JiraSyncQueueConfig {

    public static final String EXCHANGE = "jira.sync.exchange";
    public static final String REQUEST_QUEUE = "jira.sync.request.queue";
    public static final String REQUEST_ROUTING_KEY = "sync.request";
    public static final String DEAD_LETTER_QUEUE = "jira.sync.request.dlq";

    @Bean
    public DirectExchange jiraSyncExchange() {
        return new DirectExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue jiraSyncRequestQueue() {
        return QueueBuilder.durable(REQUEST_QUEUE)
                .withArgument("x-dead-letter-exchange", "")
                .withArgument("x-dead-letter-routing-key", DEAD_LETTER_QUEUE)
                .build();
    }

    @Bean
    public Queue jiraSyncDeadLetterQueue() {
        return QueueBuilder.durable(DEAD_LETTER_QUEUE).build();
    }

    @Bean
    public Binding jiraSyncRequestBinding(Queue jiraSyncRequestQueue, DirectExchange jiraSyncExchange) {
        return BindingBuilder.bind(jiraSyncRequestQueue).to(jiraSyncExchange).with(REQUEST_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jiraSyncMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
