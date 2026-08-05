package com.aksa.capacityplanner.testsupport;

import com.redis.testcontainers.RedisContainer;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Module/subsystem/system katmanlarinin ortak temeli: gercek MSSQL + Redis + RabbitMQ
 * container'lari ile calisir (H2/mock yok). Container'lar JVM boyunca (static) tek sefer
 * ayaga kalkar ve testler arasinda paylasilir - her test sinifi icin yeniden baslatilmaz.
 *
 * NOT: MSSQLServerContainer, Postgres'in aksine ozel bir veritabani adi olusturmayi
 * desteklemez (withDatabaseName yok) - container'in varsayilan (master) veritabani
 * kullanilir. Testler zaten tek kullanimlik/gecici bir container'da calistigi icin
 * bunun bir sakincasi yok.
 */
@Testcontainers
public abstract class AbstractTestcontainersSupport {

    protected static final MSSQLServerContainer<?> MSSQL =
            new MSSQLServerContainer<>(DockerImageName.parse("mcr.microsoft.com/mssql/server:2022-latest"))
                    .acceptLicense();

    protected static final RedisContainer REDIS =
            new RedisContainer(DockerImageName.parse("redis:7-alpine"));

    protected static final RabbitMQContainer RABBITMQ =
            new RabbitMQContainer(DockerImageName.parse("rabbitmq:3.13-management-alpine"));

    static {
        MSSQL.start();
        REDIS.start();
        RABBITMQ.start();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MSSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MSSQL::getUsername);
        registry.add("spring.datasource.password", MSSQL::getPassword);

        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));

        registry.add("spring.rabbitmq.host", RABBITMQ::getHost);
        registry.add("spring.rabbitmq.port", RABBITMQ::getAmqpPort);
        registry.add("spring.rabbitmq.username", RABBITMQ::getAdminUsername);
        registry.add("spring.rabbitmq.password", RABBITMQ::getAdminPassword);
    }
}
