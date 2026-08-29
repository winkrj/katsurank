import fs from 'node:fs';
import http from 'node:http';

const baseUrl = new URL(process.env.BASE_URL || 'http://localhost:8080');
const outputDir = process.env.OUTPUT_DIR || 'loadtest/results/exp06/run-1';
const sessionCookie = process.env.SESSION_COOKIE || '';
const restaurantA = Number(process.env.RESTAURANT_A || '0');
const restaurantB = Number(process.env.RESTAURANT_B || '0');
const targetConnections = Number(process.env.TARGET_CONNECTIONS || '1000');
const periods = (process.env.PERIODS_MS || '1000,500,200,100').split(',').map(Number);
const idleSeconds = Number(process.env.IDLE_SECONDS || '30');
const measurementVotes = Number(process.env.MEASUREMENT_VOTES || '20');
const settleMillis = Number(process.env.SETTLE_MILLIS || '5000');
const voteSettleMillis = Number(process.env.VOTE_SETTLE_MILLIS || '1200');
const eventTimeoutMillis = Number(process.env.EVENT_TIMEOUT_MILLIS || '10000');

for (const [name, value] of Object.entries({ restaurantA, restaurantB, targetConnections })) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
}
if (!sessionCookie) throw new Error('SESSION_COOKIE is required');
if (periods.some((period) => !Number.isInteger(period) || period < 10)) throw new Error('PERIODS_MS must contain integers >= 10');

fs.mkdirSync(outputDir, { recursive: true });
const phaseStream = fs.createWriteStream(`${outputDir}/phases.csv`);
const eventStream = fs.createWriteStream(`${outputDir}/events.csv`);
const voteStream = fs.createWriteStream(`${outputDir}/votes.csv`);
phaseStream.write('timestamp_ms,action,phase,period_ms,target_connections,body_bytes,connect_attempts,reconnects,refresh_count,refresh_sum_seconds,interval_count,interval_sum_seconds,broadcasts,snapshot_deliveries,heartbeat_deliveries,send_failures,refresh_failures,gc_count,gc_sum_seconds\n');
eventStream.write('phase,period_ms,client_id,version,changed_at_ms,generated_at_ms,received_at_ms,body_bytes\n');
voteStream.write('phase,period_ms,role,target_restaurant_id,response_received_at_ms,version,broadcast_delta,snapshot_delivery_delta,rank_a,rank_b\n');

const agent = new http.Agent({ keepAlive: true, maxSockets: Infinity, maxFreeSockets: 0 });
const clients = [];
const versionReceipts = new Map();
let stopping = false;
let currentPhase = 'startup';
let currentPeriod = 0;
let bodyBytes = 0;
let connectAttempts = 0;
let reconnects = 0;
let maxVersion = 0;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function requestJson(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const request = http.request(new URL(path, baseUrl), { method, agent: false, headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = raw; }
        resolve({ status: response.statusCode, headers: response.headers, body: parsed });
      });
    });
    request.on('error', reject);
    request.setTimeout(10_000, () => request.destroy(new Error(`${method} ${path} timed out`)));
    if (body !== null) request.write(JSON.stringify(body));
    request.end();
  });
}

async function prometheusText() {
  const response = await requestJson('GET', '/actuator/prometheus');
  if (response.status !== 200 || typeof response.body !== 'string') throw new Error('Prometheus scrape failed');
  return response.body;
}

function metricValue(text, name, labels = {}) {
  let total = 0;
  for (const line of text.split('\n')) {
    if (!line.startsWith(`${name}{`) && !line.startsWith(`${name} `)) continue;
    if (Object.entries(labels).some(([key, value]) => !line.includes(`${key}="${value}"`))) continue;
    total += Number(line.trim().split(/\s+/).at(-1));
  }
  return total;
}

async function metrics() {
  const text = await prometheusText();
  return {
    refreshCount: metricValue(text, 'ranking_cache_refresh_duration_seconds_count'),
    refreshSum: metricValue(text, 'ranking_cache_refresh_duration_seconds_sum'),
    intervalCount: metricValue(text, 'ranking_cache_refresh_interval_seconds_count'),
    intervalSum: metricValue(text, 'ranking_cache_refresh_interval_seconds_sum'),
    broadcasts: metricValue(text, 'ranking_sse_broadcasts_total'),
    snapshots: metricValue(text, 'ranking_sse_deliveries_total', { type: 'snapshot' }),
    heartbeats: metricValue(text, 'ranking_sse_deliveries_total', { type: 'heartbeat' }),
    sendFailures: metricValue(text, 'ranking_sse_send_failures_total'),
    refreshFailures: metricValue(text, 'ranking_cache_refresh_failures_total'),
    gcCount: metricValue(text, 'jvm_gc_pause_seconds_count'),
    gcSum: metricValue(text, 'jvm_gc_pause_seconds_sum'),
    activeConnections: metricValue(text, 'ranking_sse_connections_active'),
  };
}

async function csvPhase(action, phase, period) {
  const m = await metrics();
  phaseStream.write(`${Date.now()},${action},${phase},${period},${targetConnections},${bodyBytes},${connectAttempts},${reconnects},${m.refreshCount},${m.refreshSum},${m.intervalCount},${m.intervalSum},${m.broadcasts},${m.snapshots},${m.heartbeats},${m.sendFailures},${m.refreshFailures},${m.gcCount},${m.gcSum}\n`);
}

function parseSnapshot(client, block, blockBytes) {
  if (block.startsWith(':')) return;
  let eventName = '';
  const data = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (eventName !== 'vote-changed' || data.length === 0) return;
  const snapshot = JSON.parse(data.join('\n'));
  if (snapshot.version <= client.lastVersion) return;
  client.lastVersion = snapshot.version;
  client.lastSnapshot = snapshot;
  maxVersion = Math.max(maxVersion, snapshot.version);
  const receivedAt = Date.now();
  let receipts = versionReceipts.get(snapshot.version);
  if (!receipts) {
    receipts = { clients: new Set(), snapshot };
    versionReceipts.set(snapshot.version, receipts);
  }
  receipts.clients.add(client.id);
  eventStream.write(`${currentPhase},${currentPeriod},${client.id},${snapshot.version},${Date.parse(snapshot.changedAt)},${Date.parse(snapshot.generatedAt)},${receivedAt},${blockBytes}\n`);
}

function openClient(client) {
  if (stopping || client.closed) return;
  connectAttempts += 1;
  if (client.everConnected) reconnects += 1;
  const request = http.get(new URL('/api/v1/ranking/stream', baseUrl), {
    agent,
    headers: { Accept: 'text/event-stream' },
  });
  client.request = request;
  request.on('response', (response) => {
    if (response.statusCode !== 200) {
      response.resume();
      client.rejectOpen(new Error(`SSE status ${response.statusCode}`));
      return;
    }
    client.connected = true;
    client.everConnected = true;
    client.resolveOpen();
    let buffer = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      bodyBytes += Buffer.byteLength(chunk);
      buffer += chunk.replaceAll('\r\n', '\n');
      let separator;
      while ((separator = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        parseSnapshot(client, block, Buffer.byteLength(block) + 2);
      }
    });
    const disconnected = () => {
      client.connected = false;
      if (!stopping && !client.closed) setTimeout(() => openClient(client), 100);
    };
    response.on('end', disconnected);
    response.on('error', disconnected);
  });
  request.on('error', (error) => {
    client.connected = false;
    if (!client.everConnected) client.rejectOpen(error);
    if (!stopping && !client.closed) setTimeout(() => openClient(client), 100);
  });
}

async function waitFor(predicate, timeoutMillis, description) {
  const deadline = Date.now() + timeoutMillis;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${description}`);
}

async function addConnections(target) {
  const opens = [];
  while (clients.length < target) {
    const id = clients.length + 1;
    let resolveOpen;
    let rejectOpen;
    const opened = new Promise((resolve, reject) => { resolveOpen = resolve; rejectOpen = reject; });
    const client = { id, opened, resolveOpen, rejectOpen, connected: false, everConnected: false,
      closed: false, request: null, lastVersion: 0, lastSnapshot: null };
    clients.push(client);
    opens.push(opened);
    openClient(client);
  }
  await Promise.race([
    Promise.all(opens),
    sleep(30_000).then(() => { throw new Error(`timed out opening ${target} connections`); }),
  ]);
  await waitFor(() => clients.filter((client) => client.connected).length === target, 30_000,
    `${target} active clients`);
}

async function csrfCredentials() {
  const response = await requestJson('GET', '/api/v1/auth/csrf', { Cookie: `SESSION=${sessionCookie}` });
  if (response.status !== 200) throw new Error(`CSRF request failed: ${response.status}`);
  const setCookies = response.headers['set-cookie'] || [];
  const xsrfCookie = setCookies.map((cookie) => cookie.split(';', 1)[0]).find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  if (!xsrfCookie) throw new Error('XSRF-TOKEN cookie missing');
  return { token: response.body.data.token, cookie: `SESSION=${sessionCookie}; ${xsrfCookie}` };
}

async function configurePeriod(period, credentials) {
  const headers = { Cookie: credentials.cookie, 'X-XSRF-TOKEN': credentials.token, 'Content-Type': 'application/json' };
  const response = await requestJson('POST', '/actuator/rankingcache', headers, { refreshDelayMillis: period });
  if (response.status !== 200 || response.body?.refreshDelayMillis !== period) {
    throw new Error(`cache period update failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  const check = await requestJson('GET', '/actuator/rankingcache', { Cookie: credentials.cookie });
  if (check.status !== 200 || check.body?.refreshDelayMillis !== period) {
    throw new Error(`cache period verification failed: ${check.status} ${JSON.stringify(check.body)}`);
  }
}

function ranks(snapshot) {
  const a = snapshot.items.find((item) => item.id === restaurantA);
  const b = snapshot.items.find((item) => item.id === restaurantB);
  if (!a || !b) throw new Error('candidate restaurants are not both in TOP 20');
  return { rankA: a.rank, rankB: b.rank, voteA: a.voteCount, voteB: b.voteCount,
    indexA: snapshot.items.indexOf(a), indexB: snapshot.items.indexOf(b) };
}

async function performVote(phase, period, role, targetRestaurant, expectedOrder, credentials) {
  const beforeVersion = maxVersion;
  const beforeMetrics = await metrics();
  const response = await requestJson('POST', '/api/v1/votes', {
    Cookie: credentials.cookie,
    'X-XSRF-TOKEN': credentials.token,
    'Content-Type': 'application/json',
  }, { restaurantId: targetRestaurant });
  const responseReceivedAt = Date.now();
  if (response.status !== 200) throw new Error(`vote failed: ${response.status} ${JSON.stringify(response.body)}`);
  await waitFor(() => maxVersion > beforeVersion, eventTimeoutMillis, `event after vote to ${targetRestaurant}`);
  if (maxVersion !== beforeVersion + 1) throw new Error(`expected version +1, got ${beforeVersion} -> ${maxVersion}`);
  const eventVersion = maxVersion;
  await waitFor(() => (versionReceipts.get(eventVersion)?.clients.size || 0) === clients.length,
    eventTimeoutMillis, `all clients to receive version ${eventVersion}`);
  await sleep(voteSettleMillis);
  const afterMetrics = await metrics();
  const broadcastDelta = afterMetrics.broadcasts - beforeMetrics.broadcasts;
  const snapshotDeliveryDelta = afterMetrics.snapshots - beforeMetrics.snapshots;
  const snapshot = versionReceipts.get(eventVersion).snapshot;
  const { rankA, rankB, indexA, indexB } = ranks(snapshot);
  const order = indexA < indexB ? 'A' : 'B';
  voteStream.write(`${phase},${period},${role},${targetRestaurant},${responseReceivedAt},${eventVersion},${broadcastDelta},${snapshotDeliveryDelta},${rankA},${rankB}\n`);
  if (broadcastDelta !== 1) throw new Error(`expected one broadcast, got ${broadcastDelta}`);
  if (snapshotDeliveryDelta !== clients.length) throw new Error(`expected ${clients.length} snapshot deliveries, got ${snapshotDeliveryDelta}`);
  if (order !== expectedOrder) throw new Error(`expected ${expectedOrder} ahead, got ${order}`);
}

async function validateAndMeasurePeriod(period, credentials) {
  currentPeriod = period;
  currentPhase = `settle_${period}`;
  await configurePeriod(period, credentials);
  await sleep(Math.max(settleMillis, period * 5));

  const latest = versionReceipts.get(maxVersion)?.snapshot;
  if (!latest) throw new Error('latest snapshot unavailable before period validation');
  const current = ranks(latest);
  if (current.voteA === current.voteB) {
    currentPhase = `prepare_${period}`;
    await performVote(currentPhase, period, 'prepare', restaurantA, 'A', credentials);
  } else if (current.voteA !== current.voteB + 1) {
    throw new Error(`preflight requires A=B or A=B+1, got A=${current.voteA}, B=${current.voteB}`);
  }

  currentPhase = `validation_${period}`;
  const reconnectsBeforeValidation = reconnects;
  await performVote(currentPhase, period, 'validation', restaurantB, 'B', credentials);
  await performVote(currentPhase, period, 'validation', restaurantA, 'A', credentials);
  if (reconnects !== reconnectsBeforeValidation) throw new Error(`reconnect during validation at ${period}ms`);

  currentPhase = `idle_${period}`;
  await csvPhase('start', currentPhase, period);
  await sleep(idleSeconds * 1000);
  await csvPhase('end', currentPhase, period);

  currentPhase = `measurement_${period}`;
  const reconnectsBeforeMeasurement = reconnects;
  await csvPhase('start', currentPhase, period);
  for (let index = 0; index < measurementVotes; index += 1) {
    const target = index % 2 === 0 ? restaurantB : restaurantA;
    await performVote(currentPhase, period, 'measurement', target, index % 2 === 0 ? 'B' : 'A', credentials);
  }
  await csvPhase('end', currentPhase, period);
  if (reconnects !== reconnectsBeforeMeasurement) throw new Error(`reconnect during measurement at ${period}ms`);
}

async function closeAll() {
  stopping = true;
  for (const client of clients) {
    client.closed = true;
    client.request?.destroy();
  }
  agent.destroy();
}

async function waitForNoActiveConnections() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if ((await metrics()).activeConnections === 0) return;
    await sleep(100);
  }
  throw new Error('timed out waiting for server SSE connections to reach zero');
}

async function main() {
  const credentials = await csrfCredentials();
  await waitForNoActiveConnections();
  await addConnections(targetConnections);
  await waitFor(() => versionReceipts.get(maxVersion)?.clients.size === targetConnections, 30_000,
    'initial snapshot on all clients');
  for (const period of periods) await validateAndMeasurePeriod(period, credentials);
  const summary = {
    completedAt: new Date().toISOString(), targetConnections, periods, idleSeconds, measurementVotes,
    connectAttempts, reconnects, bodyBytes, maxVersion,
  };
  fs.writeFileSync(`${outputDir}/client-summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
  await closeAll();
  await waitForNoActiveConnections();
}

main().catch(async (error) => {
  console.error(error.stack || error);
  await closeAll();
  process.exitCode = 1;
}).finally(() => {
  phaseStream.end();
  eventStream.end();
  voteStream.end();
});
