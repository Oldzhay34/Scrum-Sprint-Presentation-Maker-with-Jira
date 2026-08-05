package com.aksa.capacityplanner.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Cookie tabanli auth CSRF'e aciktir (tarayici cookie'yi otomatik ekler).
 * Double-submit deseni: login sirasinda httpOnly OLMAYAN XSRF-TOKEN cookie'si
 * verilir; frontend bunu okuyup her state-changing istekte X-CSRF-Token
 * header'ina koymak zorundadir. Farkli site (CSRF saldirisi) bu cookie'yi
 * okuyamayacagi icin header'i dogru dolduramaz -> istek reddedilir.
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private static final Set<String> EXEMPT_PATHS = Set.of("/api/auth/login");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (SAFE_METHODS.contains(request.getMethod()) || EXEMPT_PATHS.contains(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String cookieValue = findCookie(request, CookieNames.XSRF_TOKEN);
        String headerValue = request.getHeader(CookieNames.XSRF_HEADER);
        if (cookieValue == null || headerValue == null || !cookieValue.equals(headerValue)) {
            // response.sendError() KULLANILMIYOR: bu, container'in /error'a forward
            // etmesine, security filter chain'in ikinci kez (bu sefer JwtCookieAuthFilter
            // ERROR dispatch'te atlandigi icin auth'suz) calisip sonucu 401'e cevirmesine
            // yol aciyordu. Yaniti burada dogrudan yazip commit ediyoruz.
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"timestamp\":\"" + Instant.now() + "\",\"status\":403,\"error\":\"Forbidden\","
                            + "\"message\":\"CSRF doğrulaması başarısız.\",\"path\":\"" + request.getRequestURI() + "\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String findCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        return List.of(request.getCookies()).stream()
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
