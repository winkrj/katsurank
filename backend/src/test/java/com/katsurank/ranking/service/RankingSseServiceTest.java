package com.katsurank.ranking.service;

import com.katsurank.ranking.dto.RankingItem;
import com.katsurank.ranking.dto.RankingSnapshotEvent;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class RankingSseServiceTest {

    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private RankingSseService service;

    @AfterEach
    void tearDown() {
        if (service != null) {
            service.shutdown();
        } else {
            executor.shutdownNow();
        }
    }

    @Test
    void connectionReceivesLatestSnapshotImmediately() throws InterruptedException {
        CapturingEmitter emitter = new CapturingEmitter();
        service = new RankingSseService(new SimpleMeterRegistry(), executor, () -> emitter);
        service.broadcast(snapshot(1, 10));

        service.connect();

        assertThat(emitter.snapshotSent.await(1, TimeUnit.SECONDS)).isTrue();
        assertThat(emitter.snapshotCount.get()).isEqualTo(1);
        assertThat(service.activeConnectionCount()).isEqualTo(1);
    }

    @Test
    void slowClientDoesNotBlockAnotherClient() throws InterruptedException {
        CountDownLatch releaseSlowClient = new CountDownLatch(1);
        CapturingEmitter slow = new CapturingEmitter(releaseSlowClient);
        CapturingEmitter fast = new CapturingEmitter();
        Queue<CapturingEmitter> emitters = new ConcurrentLinkedQueue<>(List.of(slow, fast));
        service = new RankingSseService(new SimpleMeterRegistry(), executor, emitters::remove);
        service.connect();
        service.connect();

        service.broadcast(snapshot(1, 10));

        assertThat(fast.snapshotSent.await(1, TimeUnit.SECONDS)).isTrue();
        assertThat(slow.snapshotSent.getCount()).isEqualTo(1);
        releaseSlowClient.countDown();
        assertThat(slow.snapshotSent.await(1, TimeUnit.SECONDS)).isTrue();
    }

    @Test
    void sendFailureRemovesConnection() throws InterruptedException {
        CapturingEmitter broken = new CapturingEmitter();
        broken.fail = true;
        service = new RankingSseService(new SimpleMeterRegistry(), executor, () -> broken);
        service.connect();

        service.broadcast(snapshot(1, 10));

        assertThat(broken.sendAttempted.await(1, TimeUnit.SECONDS)).isTrue();
        awaitNoConnections();
        assertThat(service.activeConnectionCount()).isZero();
    }

    private void awaitNoConnections() throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(1);
        while (service.activeConnectionCount() != 0 && System.nanoTime() < deadline) {
            Thread.sleep(10);
        }
    }

    private RankingSnapshotEvent snapshot(long version, int voteCount) {
        Instant now = Instant.parse("2026-08-17T00:00:00Z");
        RankingItem item = new RankingItem(1, 1L, "가게", "서울", null, null, voteCount, null);
        return new RankingSnapshotEvent(version, now, now, List.of(item));
    }

    private static class CapturingEmitter extends SseEmitter {

        private final CountDownLatch blocker;
        private final CountDownLatch sendAttempted = new CountDownLatch(1);
        private final CountDownLatch snapshotSent = new CountDownLatch(1);
        private final AtomicInteger snapshotCount = new AtomicInteger();
        private volatile boolean fail;

        private CapturingEmitter() {
            this(new CountDownLatch(0));
        }

        private CapturingEmitter(CountDownLatch blocker) {
            super(0L);
            this.blocker = blocker;
        }

        @Override
        public void send(SseEventBuilder builder) throws IOException {
            sendAttempted.countDown();
            if (fail) {
                throw new IOException("broken client");
            }
            try {
                blocker.await();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IOException(exception);
            }
            snapshotCount.incrementAndGet();
            snapshotSent.countDown();
        }
    }
}
