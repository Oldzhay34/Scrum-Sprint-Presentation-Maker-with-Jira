package com.aksa.capacityplanner.monitoring.config;

import com.aksa.capacityplanner.monitoring.interceptor.AuditLogInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** AuditLogInterceptor'i tum /api/** icin merkezi olarak kaydeder - var olan hicbir controller degismez. */
@Configuration
public class MonitoringWebConfig implements WebMvcConfigurer {

    private final AuditLogInterceptor auditLogInterceptor;

    public MonitoringWebConfig(AuditLogInterceptor auditLogInterceptor) {
        this.auditLogInterceptor = auditLogInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditLogInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/monitoring/**", "/api/auth/refresh");
    }
}
