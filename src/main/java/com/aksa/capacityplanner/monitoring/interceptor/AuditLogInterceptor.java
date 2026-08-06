package com.aksa.capacityplanner.monitoring.interceptor;

import com.aksa.capacityplanner.auth.security.CookieNames;
import com.aksa.capacityplanner.auth.security.JwtTokenProvider;
import com.aksa.capacityplanner.monitoring.domain.AuditLog;
import com.aksa.capacityplanner.monitoring.port.out.AuditLogRepositoryPort;
import com.aksa.capacityplanner.monitoring.support.AuditActionResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Sistemdeki HER mutasyon isteğini (POST/PUT/PATCH/DELETE) otomatik loglar -
 * hiçbir controller/service dosyasına dokunmadan (bkz. MonitoringWebConfig,
 * bu interceptor'ı merkezi olarak tüm /api/** için kaydeder). Yeni bir
 * endpoint eklemek isteyen başka bir geliştirici bu dosyaya HİÇ dokunmaz -
 * sadece AuditActionResolver'a bir route satırı eklemesi yeterlidir, o da
 * eklemezse istek zaten sessizce loglanmadan geçer (resolve() null döner).
 *
 * Aktör (kim yaptı) önce SecurityContext'ten (JwtCookieAuthFilter zaten
 * request başında access_token cookie'sini çözüp yazmış oluyor), orada yoksa
 * (örn. login isteğinin kendisinde - istek başında henüz cookie yok) yanıtla
 * birlikte YENİ set edilen access_token cookie'sinden çözülür.
 */
@Component
public class AuditLogInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuditLogInterceptor.class);
    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final AuditLogRepositoryPort auditLogRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public AuditLogInterceptor(AuditLogRepositoryPort auditLogRepository, JwtTokenProvider jwtTokenProvider) {
        this.auditLogRepository = auditLogRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            record(request, response);
        } catch (Exception e) {
            // Loglama asla asil istegi etkilememeli - en kotu ihtimalle bir aktivite kaydi kaybolur.
            log.warn("Aktivite kaydi yazilamadi: {} {}", request.getMethod(), request.getRequestURI(), e);
        }
    }

    private void record(HttpServletRequest request, HttpServletResponse response) {
        if (!MUTATING_METHODS.contains(request.getMethod())) {
            return;
        }
        String pattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (pattern == null) {
            return;
        }
        AuditActionResolver.ActionInfo info = AuditActionResolver.resolve(request.getMethod(), pattern);
        if (info == null) {
            return;
        }

        JwtTokenProvider.AccessTokenClaims actor = resolveActor(response);
        if (actor == null) {
            return;
        }

        @SuppressWarnings("unchecked")
        Map<String, String> uriVars = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (uriVars == null) {
            uriVars = Map.of();
        }

        AuditLog entry = new AuditLog();
        entry.setActorSicil(actor.sicil());
        entry.setActorName(actor.fullName());
        entry.setActorRole(actor.role() != null ? actor.role().name() : null);
        entry.setHttpMethod(request.getMethod());
        entry.setActionCode(info.code());
        entry.setActionLabel(info.label());
        entry.setEntityType(info.entityType());
        entry.setEntityId(resolveEntityId(uriVars));
        entry.setTeamId(resolveTeamId(uriVars, actor));
        entry.setStatusCode(response.getStatus());
        entry.setSuccess(response.getStatus() < 400);
        auditLogRepository.save(entry);
    }

    private JwtTokenProvider.AccessTokenClaims resolveActor(HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getDetails() instanceof JwtTokenProvider.AccessTokenClaims claims) {
            return claims;
        }
        // login gibi, istek basinda henuz oturum yokken cagrilan endpoint'ler icin:
        // yanitla birlikte yeni set edilen access_token cookie'sini coz.
        return response.getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(header -> header.startsWith(CookieNames.ACCESS_TOKEN + "="))
                .findFirst()
                .flatMap(this::extractTokenValue)
                .flatMap(jwtTokenProvider::parse)
                .orElse(null);
    }

    private Optional<String> extractTokenValue(String setCookieHeader) {
        String withoutName = setCookieHeader.substring((CookieNames.ACCESS_TOKEN + "=").length());
        String value = withoutName.split(";", 2)[0];
        return value.isBlank() ? Optional.empty() : Optional.of(value);
    }

    private String resolveEntityId(Map<String, String> uriVars) {
        for (String key : new String[]{"id", "memberId", "fieldId", "version"}) {
            if (uriVars.containsKey(key)) {
                return uriVars.get(key);
            }
        }
        return uriVars.get("teamId");
    }

    private Long resolveTeamId(Map<String, String> uriVars, JwtTokenProvider.AccessTokenClaims actor) {
        String teamIdVar = uriVars.get("teamId");
        if (teamIdVar != null) {
            try {
                return Long.valueOf(teamIdVar);
            } catch (NumberFormatException ignored) {
                // yol degiskeni beklenmedik formatta - takim id'si bilinmiyor kabul edilir
            }
        }
        return actor.teamId();
    }
}
