package com.aksa.capacityplanner.monitoring.adapter.out.persistence;

import com.aksa.capacityplanner.monitoring.domain.AuditLogFilter;
import org.springframework.data.jpa.domain.Specification;

/** AuditLogFilter'daki (hepsi opsiyonel) alanlari JPA Specification'a cevirir. */
final class AuditLogSpecifications {

    private AuditLogSpecifications() {
    }

    static Specification<AuditLogJpaEntity> fromFilter(AuditLogFilter filter) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (filter == null) {
                return predicate;
            }
            if (filter.actorSicil() != null && !filter.actorSicil().isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("actorSicil"), filter.actorSicil()));
            }
            if (filter.actionCode() != null && !filter.actionCode().isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("actionCode"), filter.actionCode()));
            }
            if (filter.entityType() != null && !filter.entityType().isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("entityType"), filter.entityType()));
            }
            if (filter.teamId() != null) {
                predicate = cb.and(predicate, cb.equal(root.get("teamId"), filter.teamId()));
            }
            if (filter.success() != null) {
                predicate = cb.and(predicate, cb.equal(root.get("success"), filter.success()));
            }
            if (filter.from() != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), filter.from()));
            }
            if (filter.to() != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), filter.to()));
            }
            return predicate;
        };
    }
}
