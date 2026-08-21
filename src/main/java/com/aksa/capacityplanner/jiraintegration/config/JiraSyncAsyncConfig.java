package com.aksa.capacityplanner.jiraintegration.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Arrays;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Jira senkronizasyonunun arka plan calistiricisi.
 *
 * Akis (yeni): API -> JiraSyncTriggerService -> @Async JiraSyncProcessor
 *              -> JiraGatewayPort.fetchIssues() -> WorkItem upsert.
 * Akis (eski): API -> RabbitMQ jira.sync.exchange -> jira.sync.request.queue
 *              -> JiraSyncProcessor -> ayni isleme.
 *
 * RabbitMQ KALDIRILDI (kullanici bildirimi, 2026-08-21: sirkette bu altyapiyi
 * isletecek kimse yok). Kuyrugun asil isi zaten "Jira'dan cok fazla issue
 * donebilir, HTTP istek-yanit dongusunu bloklamayalim"di - bunu tek is
 * parcacikli bir executor da ayni sekilde saglar: controller yine hemen
 * 202 Accepted doner, isleme arka planda surer.
 *
 * KAYBEDILEN ve NEDEN KABUL EDILEBILIR:
 * - DLQ/yeniden deneme yok: basarisiz sync zaten audit_log'a yaziliyor (bkz.
 *   JiraSyncProcessor.recordAudit) ve kullanici "Jira'dan Çek"e tekrar basiyor.
 * - Yeniden baslatmada ucustaki is kaybolur: upsert idempotent, tekrar
 *   tetiklemek yeterli.
 * Dayaniklilik ileride gercekten gerekirse Postgres tabanli bir is tablosu
 * (SELECT ... FOR UPDATE SKIP LOCKED + @Scheduled) yeni bir altyapi bilesenine
 * gerek kalmadan ayni garantiyi verir.
 */
@Configuration
@EnableAsync
public class JiraSyncAsyncConfig implements AsyncConfigurer {

    public static final String EXECUTOR_BEAN = "jiraSyncExecutor";

    private static final Logger log = LoggerFactory.getLogger(JiraSyncAsyncConfig.class);

    /**
     * TEK is parcacikli: takimlar RabbitMQ'daki tek tuketici gibi sirayla
     * islenir - hem Jira'ya paralel yuk binmez hem de ayni takim icin es
     * zamanli iki upsert calismaz. queueCapacity, rate limiter zaten ayni
     * takimi engelledigi icin (6 takim x birkac istek) bol bol yeterli;
     * dolarsa CallerRunsPolicy ile istek sessizce DUSMEZ, cagiran is
     * parcaciginda calisir.
     */
    @Bean(name = EXECUTOR_BEAN)
    public Executor jiraSyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("jira-sync-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // Kapanirken ucustaki sync'in yarim kalmamasi icin makul bir sure beklenir.
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * @Async void metotta firlatilan istisna cagirana ULASMAZ - RabbitMQ
     * doneminde bu istisna kuyrugun DLQ'suna dusuyordu, artik tek gorunur
     * yer log. JiraSyncProcessor basarisizligi ayrica audit_log'a yaziyor.
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
                log.error("Arka plan Jira sync isi basarisiz oldu: {} params={}", method.getName(), Arrays.toString(params), ex);
    }
}
