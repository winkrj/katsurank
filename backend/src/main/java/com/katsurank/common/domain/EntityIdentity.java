package com.katsurank.common.domain;

import org.hibernate.proxy.HibernateProxy;

/** Hibernate 프록시와 실제 엔티티에 동일한 영속 타입을 돌려준다. */
public final class EntityIdentity {

    private EntityIdentity() {
    }

    public static Class<?> effectiveClass(Object entity) {
        return entity instanceof HibernateProxy proxy
                ? proxy.getHibernateLazyInitializer().getPersistentClass()
                : entity.getClass();
    }
}
