package com.aksa.capacityplanner.unit.jiraintegration;

import com.aksa.capacityplanner.jiraintegration.adapter.JiraSyncRateLimiter;
import com.aksa.capacityplanner.jiraintegration.config.JiraProperties;
import com.aksa.capacityplanner.jiraintegration.domain.JiraSyncRateLimitedException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Rate limiter Redis'ten (SETNX + TTL) JVM-ici bir sayaca tasindi - bu testler
 * eski Redis davranisinin aynen korundugunu dogrular: takim basina tek pencere,
 * pencere icindeki isteklerin kalan sure ile reddi, sure dolunca yeniden izin
 * ve es zamanli isteklerde tek kazanan.
 */
class JiraSyncRateLimiterTest {

    private static JiraSyncRateLimiter limiterWithCooldown(int cooldownSeconds) {
        JiraProperties properties = new JiraProperties();
        properties.setSyncCooldownSeconds(cooldownSeconds);
        return new JiraSyncRateLimiter(properties);
    }

    @Test
    void ilkIstekGecer_ayniTakimIcinIkinciIstekReddedilir() {
        JiraSyncRateLimiter limiter = limiterWithCooldown(60);

        assertThatCode(() -> limiter.checkAndRecord(1L)).doesNotThrowAnyException();

        assertThatThrownBy(() -> limiter.checkAndRecord(1L))
                .isInstanceOf(JiraSyncRateLimitedException.class)
                .hasMessageContaining("saniye sonra tekrar deneyin");
    }

    @Test
    void kalanSureSifirDegilPozitifRaporlanir() {
        JiraSyncRateLimiter limiter = limiterWithCooldown(60);
        limiter.checkAndRecord(1L);

        JiraSyncRateLimitedException ex = org.junit.jupiter.api.Assertions.assertThrows(
                JiraSyncRateLimitedException.class, () -> limiter.checkAndRecord(1L));

        assertThat(ex.getRetryAfterSeconds()).isBetween(1L, 60L);
    }

    @Test
    void farkliTakimlarBirbiriniEngellemez() {
        JiraSyncRateLimiter limiter = limiterWithCooldown(60);

        assertThatCode(() -> limiter.checkAndRecord(1L)).doesNotThrowAnyException();
        assertThatCode(() -> limiter.checkAndRecord(2L)).doesNotThrowAnyException();
    }

    @Test
    void pencereDoldugundaYeniIstekTekrarGecer() throws Exception {
        // cooldown=0: pencere aninda dolar - "sure gectikten sonra tekrar izin
        // verilir" kuralini beklemeden dogrular.
        JiraSyncRateLimiter limiter = limiterWithCooldown(0);

        assertThatCode(() -> limiter.checkAndRecord(1L)).doesNotThrowAnyException();
        assertThatCode(() -> limiter.checkAndRecord(1L)).doesNotThrowAnyException();
    }

    @Test
    void esZamanliIsteklerdenSadeceBiriGecer() throws Exception {
        JiraSyncRateLimiter limiter = limiterWithCooldown(60);
        int threads = 16;
        AtomicInteger passed = new AtomicInteger();

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        try {
            List<Callable<Void>> tasks = java.util.Collections.nCopies(threads, () -> {
                try {
                    limiter.checkAndRecord(42L);
                    passed.incrementAndGet();
                } catch (JiraSyncRateLimitedException expected) {
                    // beklenen - pencereyi kacirdi
                }
                return null;
            });
            for (Future<Void> f : pool.invokeAll(tasks)) {
                f.get();
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(passed.get()).isEqualTo(1);
    }
}
