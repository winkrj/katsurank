import fs from 'node:fs';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const baseUrl = new URL(process.env.BASE_URL || 'http://localhost:8080');
const outputDir = process.env.OUTPUT_DIR || 'loadtest/results/exp05/run-1';
const appPid = Number(process.env.APP_PID || '0');
const sessionCookie = process.env.SESSION_COOKIE || '';
const restaurantA = Number(process.env.RESTAURANT_A || '0');
const restaurantB = Number(process.env.RESTAURANT_B || '0');
const baselineSeconds = Number(process.env.BASELINE_SECONDS || '30');
const holdSeconds = Number(process.env.HOLD_SECONDS || '120');
const cleanupSeconds = Number(process.env.CLEANUP_SECONDS || '30');
const measurementVotes = Number(process.env.MEASUREMENT_VOTES || '20');
const voteSettleMillis = Number(process.env.VOTE_SETTLE_MILLIS || '1200');
const eventTimeoutMillis = Number(process.env.EVENT_TIMEOUT_MILLIS || '5000');

for (const [name, value] of Object.entries({ appPid, restaurantA, restaurantB })) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
}
if (!sessionCookie) throw new Error('SESSION_COOKIE is required');

fs.mkdirSync(outputDir, { recursive: true });
const phaseStream = fs.createWriteStream(`${outputDir}/phases.csv`);
const eventStream = fs.createWriteStream(`${outputDir}/events.csv`);
const voteStream = fs.createWriteStream(`${outputDir}/votes.csv`);
phaseStream.write('timestamp_ms,action,phase,target_connections,body_bytes,connect_attempts,reconnects\n');
eventStream.write('client_id,version,changed_at_ms,generated_at_ms,received_at_ms,body_bytes\n');
voteStream.write('role,target_restaurant_id,response_received_at_ms,version,broadcast_delta,rank_a,rank_b\n');

const agent = new http.Agent({ keepAlive: true, maxSockets: Infinity, maxFreeSockets: 0 });
const clients = [];
const versionReceipts = new Map();
let stopping = false;
let currentPhase = 'startup';
let bodyBytes = 0;
let connectAttempts = 0;
let reconnects = 0;
let maxVersion = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function csvPhase(action, phase, target) {
  phaseStream.write(`${Date.now()},${action},${phase},${target},${bodyBytes},${connectAttempts},${reconnects}\n`);
}

function parseSnapshot(client, block, blockBytes) {
  if (block.startsWith(':')) return;
  let eventName = '';
  const data = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (eventName !== 'ranking-snapshot' || data.length === 0) return;
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
  eventStream.write(`${client.id},${snapshot.version},${Date.parse(snapshot.changedAt)},${Date.parse(snapshot.generatedAt)},${receivedAt},${blockBytes}\n`);
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
      const bytes = Buffer.byteLength(chunk);
      bodyBytes += bytes;
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

async function addConnections(target) {
  const opens = [];
  while (clients.length < target) {
    const id = clients.length + 1;
    let resolveOpen;
    let rejectOpen;
    const opened = new Promise((resolve, reject) => {
      resolveOpen = resolve;
      rejectOpen = reject;
    });
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

async function waitFor(predicate, timeoutMillis, description) {
  const deadline = Date.now() + timeoutMillis;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${description}`);
}

async function forceGc() {
  await execFileAsync('jcmd', [String(appPid), 'GC.run']);
}

async function hold(phase, target, seconds) {
  currentPhase = phase;
  csvPhase('start', phase, target);
  const gcDelay = Math.max(0, seconds * 1000 - 10_000);
  await sleep(gcDelay);
  await forceGc();
  await sleep(seconds * 1000 - gcDelay);
  csvPhase('end', phase, target);
}

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
    if (body !== null) request.write(JSON.stringify(body));
    request.end();
  });
}

async function csrfCredentials() {
  const response = await requestJson('GET', '/api/v1/auth/csrf', { Cookie: `SESSION=${sessionCookie}` });
  if (response.status !== 200) throw new Error(`CSRF request failed: ${response.status}`);
  const setCookies = response.headers['set-cookie'] || [];
  const xsrfCookie = setCookies.map((cookie) => cookie.split(';', 1)[0]).find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  if (!xsrfCookie) throw new Error('XSRF-TOKEN cookie missing');
  return { token: response.body.data.token, cookie: `SESSION=${sessionCookie}; ${xsrfCookie}` };
}

function ranks(snapshot) {
  const a = snapshot.items.find((item) => item.id === restaurantA);
  const b = snapshot.items.find((item) => item.id === restaurantB);
  if (!a || !b) throw new Error('candidate restaurants are not both in TOP 20');
  return { rankA: a.rank, rankB: b.rank, voteA: a.voteCount, voteB: b.voteCount,
    indexA: snapshot.items.indexOf(a), indexB: snapshot.items.indexOf(b) };
}

async function metricValue(name) {
  const response = await requestJson('GET', '/actuator/prometheus');
  if (response.status !== 200 || typeof response.body !== 'string') throw new Error('Prometheus scrape failed');
  let total = 0;
  for (const line of response.body.split('\n')) {
    if (!line.startsWith(`${name}{`) && !line.startsWith(`${name} `)) continue;
    total += Number(line.trim().split(/\s+/).at(-1));
  }
  return total;
}

async function performVote(role, targetRestaurant, expectedOrder, credentials) {
  const beforeVersion = maxVersion;
  const beforeBroadcasts = await metricValue('ranking_sse_broadcasts_total');
  const response = await requestJson('POST', '/api/v1/votes', {
    Cookie: credentials.cookie,
    'X-XSRF-TOKEN': credentials.token,
    'Content-Type': 'application/json',
  }, { restaurantId: targetRestaurant });
  const responseReceivedAt = Date.now();
  if (response.status !== 200) throw new Error(`vote failed: ${response.status} ${JSON.stringify(response.body)}`);
  await waitFor(() => maxVersion > beforeVersion, eventTimeoutMillis, `event after vote to ${targetRestaurant}`);
  const eventVersion = maxVersion;
  await waitFor(() => (versionReceipts.get(eventVersion)?.clients.size || 0) === clients.length,
    eventTimeoutMillis, `all clients to receive version ${eventVersion}`);
  await sleep(voteSettleMillis);
  const afterBroadcasts = await metricValue('ranking_sse_broadcasts_total');
  const broadcastDelta = afterBroadcasts - beforeBroadcasts;
  const snapshot = versionReceipts.get(eventVersion).snapshot;
  const { rankA, rankB, indexA, indexB } = ranks(snapshot);
  const order = indexA < indexB ? 'A' : 'B';
  voteStream.write(`${role},${targetRestaurant},${responseReceivedAt},${eventVersion},${broadcastDelta},${rankA},${rankB}\n`);
  if (broadcastDelta !== 1) throw new Error(`expected one broadcast, got ${broadcastDelta}`);
  if (order !== expectedOrder) throw new Error(`expected ${expectedOrder} ahead, got ${order}`);
  return eventVersion;
}

async function prepareAndMeasureVotes() {
  const credentials = await csrfCredentials();
  const current = versionReceipts.get(maxVersion)?.snapshot;
  if (!current) throw new Error('latest snapshot is unavailable before vote preflight');
  let currentRanks = ranks(current);
  if (currentRanks.voteA !== currentRanks.voteB + 1) {
    await performVote('prepare', restaurantA, 'A', credentials);
    currentRanks = ranks(versionReceipts.get(maxVersion).snapshot);
  }
  if (currentRanks.voteA !== currentRanks.voteB + 1) {
    throw new Error(`preflight requires A=B+1, got A=${currentRanks.voteA}, B=${currentRanks.voteB}`);
  }
  await performVote('validation', restaurantB, 'B', credentials);
  await performVote('validation', restaurantA, 'A', credentials);

  currentPhase = 'propagation';
  csvPhase('start', currentPhase, clients.length);
  for (let index = 0; index < measurementVotes; index += 1) {
    const target = index % 2 === 0 ? restaurantB : restaurantA;
    const expectedOrder = index % 2 === 0 ? 'B' : 'A';
    await performVote('measurement', target, expectedOrder, credentials);
  }
  csvPhase('end', currentPhase, clients.length);
}

async function closeAll() {
  stopping = true;
  for (const client of clients) {
    client.closed = true;
    client.request?.destroy();
  }
  agent.destroy();
}

async function main() {
  csvPhase('start', 'baseline_0', 0);
  await sleep(Math.max(0, baselineSeconds * 1000 - 10_000));
  await forceGc();
  await sleep(Math.min(10_000, baselineSeconds * 1000));
  csvPhase('end', 'baseline_0', 0);

  await addConnections(250);
  await hold('hold_250', 250, holdSeconds);
  await addConnections(500);
  await hold('hold_500', 500, holdSeconds);
  await addConnections(1000);
  await hold('hold_1000', 1000, holdSeconds);
  await prepareAndMeasureVotes();

  await closeAll();
  csvPhase('start', 'cleanup_0', 0);
  await sleep(Math.max(0, cleanupSeconds * 1000 - 10_000));
  await forceGc();
  await sleep(Math.min(10_000, cleanupSeconds * 1000));
  csvPhase('end', 'cleanup_0', 0);

  const summary = {
    completedAt: new Date().toISOString(), baselineSeconds, holdSeconds, cleanupSeconds,
    measurementVotes, connectAttempts, reconnects, bodyBytes, maxVersion,
    pollingComparisonSeconds: holdSeconds,
    pollingRequests: 500 * holdSeconds,
    sseStreamRequests: connectAttempts,
    requestReduction: (500 * holdSeconds) / connectAttempts,
  };
  fs.writeFileSync(`${outputDir}/client-summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
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
