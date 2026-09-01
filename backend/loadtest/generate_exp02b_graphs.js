#!/usr/bin/env node
// Produces light-background, blog-ready PNG charts from persisted EXP-02(B) CSVs.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, 'results/exp02b');
const output = '/Users/hongseungjun/memo/04_Projects/Katsurank/부하테스트/30_결과/그래프';
fs.mkdirSync(output, { recursive: true });

function csv(file) {
  const [head, ...lines] = fs.readFileSync(file, 'utf8').trim().split('\n');
  const keys = head.split(',');
  return lines.map(line => Object.fromEntries(keys.map((key, i) => [key, line.split(',')[i]])));
}
function line(points, x, y) { return points.map((p, i) => `${i ? 'L' : 'M'}${x(p).toFixed(1)},${y(p).toFixed(1)}`).join(' '); }
function escape(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function svgToPng(svg, filename) {
  const svgFile = path.join('/tmp', `${filename}.svg`);
  const pngFile = path.join(output, `${filename}.png`);
  fs.writeFileSync(svgFile, svg);
  execFileSync('/usr/bin/sips', ['-s', 'format', 'png', svgFile, '--out', pngFile]);
  return pngFile;
}
function panel(points, top, color, label, unit, width = 1120, height = 160) {
  const left = 92, right = 38, plotW = width - left - right, bottom = top + height - 38;
  const maxX = Math.max(...points.map(p => p.x), 1), maxY = Math.max(...points.map(p => p.y), 1) * 1.08;
  const x = p => left + p.x / maxX * plotW, y = p => bottom - p.y / maxY * (height - 58);
  let grid = '';
  for (let i = 0; i <= 4; i++) { const v = maxY * i / 4; const yy = y({ y: v }); grid += `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" class="grid"/><text x="${left-8}" y="${yy+4}" text-anchor="end" class="tick">${v.toFixed(v < 10 ? 1 : 0)}</text>`; }
  return `<g><rect x="${left}" y="${top+12}" width="${plotW}" height="${height-50}" class="frame"/>${grid}<path d="${line(points,x,y)}" fill="none" stroke="${color}" stroke-width="2.5"/><text x="${left}" y="${top}" class="label">${escape(label)} (${escape(unit)})</text><text x="${width-right}" y="${bottom+30}" text-anchor="end" class="tick">경과 시간 (초)</text></g>`;
}

const started = Date.parse(fs.readFileSync(path.join(root, 'run-3-started-kst.txt'), 'utf8').trim()) / 1000;
const arrivalRows = csv(path.join(root, 'run-3-arrival.csv'));
const request = [];
for (let i = 1; i < arrivalRows.length; i++) {
  const now = +arrivalRows[i].timestamp_epoch, old = +arrivalRows[i - 1].timestamp_epoch;
  if (now > old) request.push({ x: now - started, y: (+arrivalRows[i].http_ranking_requests_count - +arrivalRows[i-1].http_ranking_requests_count) / (now - old) });
}
const metrics = csv(path.join(root, 'run-3-metrics.csv')).map(r => ({x: +r.timestamp_epoch-started, pending:+r.hikari_pending, cpu:+r.host_system_cpu_pct_of_machine}));
const buckets = csv(path.join(root, 'run-3-buckets.csv')).filter(r => r.metric === 'http_server_requests_seconds_bucket');
const grouped = new Map();
for (const r of buckets) { const t = +r.timestamp_epoch; if (!grouped.has(t)) grouped.set(t, {}); grouped.get(t)[r.le] = +r.cumulative_count; }
const p95 = []; let prev;
for (const [time, values] of [...grouped.entries()].sort((a,b)=>a[0]-b[0])) {
  if (prev) { const delta = {}; for (const key of Object.keys(values)) delta[key] = values[key] - (prev[1][key] || 0); const total = delta['+Inf']; if (total > 0) { const le = Object.keys(delta).filter(k=>k!=='+Inf').map(Number).sort((a,b)=>a-b).find(k=>delta[String(k)] >= total*.95); if (le) p95.push({x:time-started,y:le*1000}); } }
  prev=[time,values];
}
const timeSeriesSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="720" viewBox="0 0 1120 720"><style>text{font-family:'Hiragino Sans','Apple SD Gothic Neo',sans-serif;fill:#202124}.title{font-size:24px;font-weight:700}.label{font-size:15px;font-weight:700}.tick{font-size:12px}.grid{stroke:#e5e7eb;stroke-width:1}.frame{fill:#fff;stroke:#9ca3af;stroke-width:1}</style><rect x="0" y="0" width="1120" height="720" fill="#ffffff"/><text x="40" y="34" class="title">EXP-02B 3회차 — 지터 후에도 포화가 재발한 시계열</text>${panel(request,60,'#2563eb','요청률','RPS')}${panel(metrics.map(p=>({x:p.x,y:p.pending})),220,'#dc2626','Hikari pending','개')}${panel(p95,380,'#9333ea','HTTP p95 (구간 histogram)','ms')}${panel(metrics.map(p=>({x:p.x,y:p.cpu})),540,'#059669','시스템 CPU','%')}</svg>`;

const bars = [
  {title:'초당 요청 수 최대 (RPS)', base:796, jitter:683},
  {title:'초당 요청 수 표준편차 (RPS)', base:140.7, jitter:100.9},
  {title:'HTTP p95 (ms)', base:2560.1, jitter:155.2},
  {title:'Hikari pending 최대 (개)', base:951, jitter:426},
];
let facets = '';
bars.forEach((bar, i) => { const col=i%2,row=Math.floor(i/2), x=70+col*535,y=125+row*290,w=450,h=190,max=Math.max(bar.base,bar.jitter)*1.16; const by=v=>y+h-v/max*h; facets+=`<g><text x="${x}" y="${y-22}" class="label">${bar.title}</text><line x1="${x}" y1="${y+h}" x2="${x+w}" y2="${y+h}" class="frame"/><rect x="${x+100}" y="${by(bar.base)}" width="105" height="${y+h-by(bar.base)}" fill="#94a3b8"/><rect x="${x+275}" y="${by(bar.jitter)}" width="105" height="${y+h-by(bar.jitter)}" fill="#2563eb"/><text x="${x+152}" y="${by(bar.base)-8}" text-anchor="middle" class="tick">${bar.base}</text><text x="${x+327}" y="${by(bar.jitter)-8}" text-anchor="middle" class="tick">${bar.jitter}</text><text x="${x+152}" y="${y+h+22}" text-anchor="middle" class="tick">EXP-02<br/>지터 없음</text><text x="${x+327}" y="${y+h+22}" text-anchor="middle" class="tick">EXP-02B<br/>지터 중앙값</text></g>`; });
const compareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="700" viewBox="0 0 1120 700"><style>text{font-family:'Hiragino Sans','Apple SD Gothic Neo',sans-serif;fill:#202124}.title{font-size:24px;font-weight:700}.label{font-size:16px;font-weight:700}.tick{font-size:13px}.frame{stroke:#6b7280;stroke-width:1}</style><rect x="0" y="0" width="1120" height="700" fill="#ffffff"/><text x="70" y="35" class="title">EXP-02 2초 폴링: 지터 없음 vs 초기 지터 (3회 중앙값)</text><rect x="70" y="62" width="14" height="14" fill="#94a3b8"/><text x="91" y="74" class="tick">EXP-02 지터 없음</text><rect x="245" y="62" width="14" height="14" fill="#2563eb"/><text x="266" y="74" class="tick">EXP-02B 초기 지터, 중앙값</text>${facets}</svg>`;
console.log(svgToPng(timeSeriesSvg, 'EXP-02B_지터_3회차_시계열'));
console.log(svgToPng(compareSvg, 'EXP-02B_지터전후_비교'));
