package com.katsurank.ranking.service;

import com.katsurank.ranking.dto.RankingSnapshotEvent;
import com.katsurank.ranking.exception.SseCapacityExceededException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/** 서울 TOP 20 스냅샷의 단일 인스턴스 SSE 연결과 fan-out을 관리한다. */
@Service
public class RankingSseService {

    static final long EMITTER_TIMEOUT_MILLIS = 0L;
    static final long HEARTBEAT_INTERVAL_MILLIS = 15_000L;

    private final ConcurrentHashMap<Long, ClientConnection> connections = new ConcurrentHashMap<>();
    private final AtomicLong connectionSequence = new AtomicLong();
    private final AtomicReference<RankingSnapshotEvent> latestSnapshot = new AtomicReference<>();
    private final Semaphore connectionPermits;
    private final int maxConnections;
    private final ExecutorService senderExecutor;
    private final EmitterFactory emitterFactory;
    private final Counter openedConnections;
    private final Counter closedConnections;
    private final Counter broadcasts;
    private final Counter snapshotDeliveries;
    private final Counter heartbeatDeliveries;
    private final Counter sendFailures;

    @Autowired
    public RankingSseService(
            MeterRegistry meterRegistry,
            @Value("${ranking.sse.max-connections:1000}") int maxConnections) {
        this(meterRegistry,
                Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("ranking-sse-send-", 0).factory()),
                () -> new SseEmitter(EMITTER_TIMEOUT_MILLIS),
                maxConnections);
    }

    RankingSseService(MeterRegistry meterRegistry,
                      ExecutorService senderExecutor,
                      EmitterFactory emitterFactory) {
        this(meterRegistry, senderExecutor, emitterFactory, 1_000);
    }

    RankingSseService(MeterRegistry meterRegistry,
                      ExecutorService senderExecutor,
                      EmitterFactory emitterFactory,
                      int maxConnections) {
        if (maxConnections < 1) {
            throw new IllegalArgumentException("SSE 최대 연결 수는 1 이상이어야 합니다.");
        }
        this.senderExecutor = senderExecutor;
        this.emitterFactory = emitterFactory;
        this.maxConnections = maxConnections;
        this.connectionPermits = new Semaphore(maxConnections);
        this.openedConnections = Counter.builder("ranking.sse.connections.opened").register(meterRegistry);
        this.closedConnections = Counter.builder("ranking.sse.connections.closed").register(meterRegistry);
        this.broadcasts = Counter.builder("ranking.sse.broadcasts").register(meterRegistry);
        this.snapshotDeliveries = Counter.builder("ranking.sse.deliveries")
                .tag("type", "snapshot").register(meterRegistry);
        this.heartbeatDeliveries = Counter.builder("ranking.sse.deliveries")
                .tag("type", "heartbeat").register(meterRegistry);
        this.sendFailures = Counter.builder("ranking.sse.send.failures").register(meterRegistry);
        Gauge.builder("ranking.sse.connections.active", connections, ConcurrentHashMap::size)
                .register(meterRegistry);
    }

    public SseEmitter connect() {
        if (!connectionPermits.tryAcquire()) {
            throw new SseCapacityExceededException(maxConnections);
        }
        long connectionId = connectionSequence.incrementAndGet();
        SseEmitter emitter;
        try {
            emitter = emitterFactory.create();
        } catch (RuntimeException exception) {
            connectionPermits.release();
            throw exception;
        }
        ClientConnection connection = new ClientConnection(connectionId, emitter);
        emitter.onCompletion(() -> disconnect(connection));
        emitter.onTimeout(() -> disconnect(connection));
        emitter.onError(error -> disconnect(connection));

        RankingSnapshotEvent snapshot = latestSnapshot.get();
        if (snapshot != null) {
            connection.sendInitial(snapshot);
        }
        if (!connection.closed.get()) {
            connections.put(connectionId, connection);
            openedConnections.increment();
            RankingSnapshotEvent latest = latestSnapshot.get();
            if (latest != null && latest.version() > connection.lastSentVersion.get()) {
                connection.enqueue(latest);
            }
            connection.activateAfterResponseInitialization();
        }
        return emitter;
    }

    public void broadcast(RankingSnapshotEvent snapshot) {
        latestSnapshot.set(snapshot);
        broadcasts.increment();
        connections.forEach((ignored, connection) -> connection.enqueue(snapshot));
    }

    @Scheduled(fixedRate = HEARTBEAT_INTERVAL_MILLIS)
    void heartbeat() {
        connections.forEach((ignored, connection) -> connection.enqueueHeartbeat());
    }

    int activeConnectionCount() {
        return connections.size();
    }

    @PreDestroy
    void shutdown() {
        connections.forEach((ignored, connection) -> {
            disconnect(connection);
            connection.emitter.complete();
        });
        senderExecutor.shutdownNow();
    }

    private void disconnect(ClientConnection connection) {
        if (!connection.closed.compareAndSet(false, true)) {
            return;
        }
        connections.remove(connection.id, connection);
        connection.pendingSnapshot.set(null);
        connection.heartbeatPending.set(false);
        connectionPermits.release();
        closedConnections.increment();
    }

    @FunctionalInterface
    interface EmitterFactory {
        SseEmitter create();
    }

    private final class ClientConnection {

        private final long id;
        private final SseEmitter emitter;
        private final AtomicReference<RankingSnapshotEvent> pendingSnapshot = new AtomicReference<>();
        private final AtomicBoolean heartbeatPending = new AtomicBoolean();
        private final AtomicBoolean ready = new AtomicBoolean();
        private final AtomicBoolean draining = new AtomicBoolean();
        private final AtomicBoolean closed = new AtomicBoolean();
        private final AtomicLong lastSentVersion = new AtomicLong();

        private ClientConnection(long id, SseEmitter emitter) {
            this.id = id;
            this.emitter = emitter;
        }

        private void sendInitial(RankingSnapshotEvent snapshot) {
            try {
                emitter.send(snapshotEvent(snapshot));
                lastSentVersion.set(snapshot.version());
                snapshotDeliveries.increment();
            } catch (IOException | IllegalStateException exception) {
                sendFailures.increment();
                disconnect(this);
            }
        }

        private void activateAfterResponseInitialization() {
            try {
                senderExecutor.execute(() -> {
                    try {
                        Thread.sleep(100);
                        ready.set(true);
                        if (pendingSnapshot.get() != null || heartbeatPending.get()) {
                            scheduleDrain();
                        }
                    } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();
                        disconnect(this);
                    }
                });
            } catch (RejectedExecutionException exception) {
                disconnect(this);
            }
        }

        private void enqueue(RankingSnapshotEvent snapshot) {
            if (closed.get() || snapshot.version() <= lastSentVersion.get()) {
                return;
            }
            pendingSnapshot.accumulateAndGet(snapshot, (current, candidate) ->
                    current == null || candidate.version() > current.version() ? candidate : current);
            scheduleDrain();
        }

        private void enqueueHeartbeat() {
            if (closed.get()) {
                return;
            }
            heartbeatPending.set(true);
            scheduleDrain();
        }

        private void scheduleDrain() {
            if (!ready.get()) {
                return;
            }
            if (!draining.compareAndSet(false, true)) {
                return;
            }
            try {
                senderExecutor.execute(this::drain);
            } catch (RejectedExecutionException exception) {
                draining.set(false);
                disconnect(this);
            }
        }

        private void drain() {
            try {
                while (!closed.get()) {
                    RankingSnapshotEvent snapshot = pendingSnapshot.getAndSet(null);
                    if (snapshot != null && snapshot.version() > lastSentVersion.get()) {
                        emitter.send(snapshotEvent(snapshot));
                        lastSentVersion.set(snapshot.version());
                        snapshotDeliveries.increment();
                        continue;
                    }
                    if (heartbeatPending.compareAndSet(true, false)) {
                        emitter.send(SseEmitter.event().comment("heartbeat"));
                        heartbeatDeliveries.increment();
                        continue;
                    }
                    return;
                }
            } catch (IOException | IllegalStateException exception) {
                sendFailures.increment();
                disconnect(this);
            } finally {
                draining.set(false);
                if (!closed.get() && (pendingSnapshot.get() != null || heartbeatPending.get())) {
                    scheduleDrain();
                }
            }
        }
    }

    private SseEmitter.SseEventBuilder snapshotEvent(RankingSnapshotEvent snapshot) {
        return SseEmitter.event()
                .id(Long.toString(snapshot.version()))
                .name("vote-changed")
                .data(snapshot);
    }
}
