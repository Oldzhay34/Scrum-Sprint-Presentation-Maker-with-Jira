package com.aksa.capacityplanner.testsupport;

import com.redis.testcontainers.RedisContainer;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Module/subsystem/system katmanlarinin ortak temeli: gercek Postgres + Redis + RabbitMQ
 * container'lari ile calisir (H2/mock yok). Container'lar JVM boyunca (static) tek sefer
 * ayaga kalkar ve testler arasinda paylasilir - her test sinifi icin yeniden baslatilmaz.
 *
 * disabledWithoutDocker=true: Docker'a ULASILAMIYORSA bu temeli kullanan test siniflari
 * HATA vermek yerine ATLANIR (skipped). Onceki davranista asagidaki static blok
 * ExceptionInInitializerError firlatiyor, JVM sinifi kalici olarak "bozuk" isaretledigi
 * icin sonraki tum siniflar da NoClassDefFound ile dusuyor ve tek bir ortam sorunu
 * (orn. Docker Desktop'in named pipe'ina erisemeyen bir gelistirici makinesi) butun
 * "mvn verify" cikitisini kirmizi yapiyordu. CI ajanlarinda Docker mevcut oldugu icin
 * orada davranis DEGISMEZ - testler eskisi gibi calisir; atlanan testler de
 * failsafe raporunda "skipped" olarak gorunur, sessizce yok sayilmazlar.
 */
@Testcontainers(disabledWithoutDocker = true)
public abstract class AbstractTestcontainersSupport {

    protected static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                    .withDatabaseName("capacity_planner");

    protected static final RedisContainer REDIS =
            new RedisContainer(DockerImageName.parse("redis:7-alpine"));

    protected static final RabbitMQContainer RABBITMQ =
            new RabbitMQContainer(DockerImageName.parse("rabbitmq:3.13-management-alpine"));

    static {
        POSTGRES.start();
        REDIS.start();
        RABBITMQ.start();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);

        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));

        registry.add("spring.rabbitmq.host", RABBITMQ::getHost);
        registry.add("spring.rabbitmq.port", RABBITMQ::getAmqpPort);
        registry.add("spring.rabbitmq.username", RABBITMQ::getAdminUsername);
        registry.add("spring.rabbitmq.password", RABBITMQ::getAdminPassword);
    }
}
