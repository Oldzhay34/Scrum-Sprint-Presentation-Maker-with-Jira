package com.aksa.capacityplanner.testsupport;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Module/subsystem/system katmanlarinin ortak temeli: gercek Postgres container'i
 * ile calisir (H2/mock yok). Container JVM boyunca (static) tek sefer ayaga kalkar
 * ve testler arasinda paylasilir - her test sinifi icin yeniden baslatilmaz.
 *
 * Redis ve RabbitMQ container'lari KALDIRILDI: uygulama artik cache'i JVM-ici
 * Caffeine ile (bkz. JvmCacheManager), Jira senkronizasyonunu da bir @Async
 * executor ile (bkz. JiraSyncAsyncConfig) yurutuyor - test edilecek harici bir
 * altyapi kalmadi. Testlerin kapsami degismedi, sadece iki container az kalkiyor.
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

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
