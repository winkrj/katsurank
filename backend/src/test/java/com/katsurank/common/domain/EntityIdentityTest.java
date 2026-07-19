package com.katsurank.common.domain;

import com.katsurank.restaurant.Restaurant;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.proxy.LazyInitializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doReturn;

class EntityIdentityTest {

    @Test
    @DisplayName("Hibernate 프록시는 런타임 클래스가 아니라 영속 엔티티 클래스로 식별한다")
    void resolvesPersistentClassFromProxy() {
        HibernateProxy proxy = mock(HibernateProxy.class);
        LazyInitializer initializer = mock(LazyInitializer.class);
        doReturn(initializer).when(proxy).getHibernateLazyInitializer();
        doReturn(Restaurant.class).when(initializer).getPersistentClass();

        assertThat(EntityIdentity.effectiveClass(proxy)).isEqualTo(Restaurant.class);
    }
}
