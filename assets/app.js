// 星芒视界官网前端逻辑
// API_BASE 为空时自动降级为内置静态数据（纯静态托管也能正常展示）
const API_BASE = 'https://star-vision-api.app.workbuddy.host';
const API_KEY = 'WRTB62G4C2';

function apiUrl(path) {
  if (!API_BASE) return '';
  const base = API_BASE.replace(/\/$/, '') + path;
  return API_KEY ? base + '?sharecode=' + encodeURIComponent(API_KEY) : base;
}

const FALLBACK = {
  app: { name: '星芒视界', version: '3.2.0', updated: '2026-11-19' },
  announcement: { enabled: false, text: '' },
  downloads: [
    { platform: 'android', label: 'Android 版', badge: '推荐', url: '#', version: '3.2.0', size: '38.6 MB', note: 'APK 直装' },
    { platform: 'ios', label: 'iOS 版', badge: '', url: '#', version: '3.2.0', size: '92.4 MB', note: 'TestFlight' },
    { platform: 'tv', label: 'TV / 盒子版', badge: '', url: '#', version: '3.2.0', size: '26.1 MB', note: 'Android TV' }
  ],
  features: [
    { icon: '🎬', title: '海量片库', desc: '电影、剧集、动漫、纪录片分区整理，快速筛选。' },
    { icon: '⚡', title: '秒开播放', desc: '多线路智能调度，起播更快，拖动即时响应。' },
    { icon: '🎞️', title: '画质随心', desc: '流畅到 4K 自由切换，弱网自动降码。' },
    { icon: '📺', title: '多端同步', desc: '手机、平板、TV 共用收藏与观看记录。' }
  ],
  faq: [],
  stats: { total: 0, counts: {} }
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function fmtNum(n) {
  if (!n) return '0';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + ' 万';
  return String(n);
}

function renderFeatures(list) {
  const box = $('#featureCards');
  if (!box) return;
  box.innerHTML = list.map((f) => `
    <article class="card">
      <div class="ic">${f.icon || '✦'}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </article>`).join('');
}

function renderRelease(data) {
  const box = $('#releaseGrid');
  if (!box) return;
  const downloads = data.downloads || [];
  box.innerHTML = downloads.map((d) => `
    <article class="rel">
      <div class="rel-top">
        <h3>${d.label}</h3>
        ${d.badge ? `<span class="badge">${d.badge}</span>` : ''}
      </div>
      <div class="meta">版本 ${d.version || '-'} · ${d.size || '-'}</div>
      <div class="meta">${d.note || ''}</div>
      <a href="${d.url || '#'}" data-platform="${d.platform}" rel="noopener">前往下载 →</a>
    </article>`).join('');
  bindDownload(box);
}

function renderFaq(list) {
  const box = $('#faqList');
  if (!box || !list || !list.length) return;
  box.innerHTML = list.map((f) => `
    <details class="faq-item">
      <summary>${f.q}</summary>
      <p>${f.a}</p>
    </details>`).join('');
}

function applyMeta(data) {
  const app = data.app || {};
  const pill = $('#versionPill');
  if (pill) pill.textContent = `最新版本 v${app.version || '-'} · ${app.updated || ''}`;

  const fv = $('#factVersion');
  if (fv) fv.textContent = app.version ? 'v' + app.version : '—';

  const total = data.stats && data.stats.total;
  const st = $('#statTotal');
  if (st) st.textContent = fmtNum(total);

  const sub = $('#releaseSub');
  if (sub) {
    const note = data.announcement && data.announcement.enabled ? data.announcement.text : '';
    sub.textContent = note || `当前版本 v${app.version || '-'}，更新于 ${app.updated || '-'}`;
  }

  (data.downloads || []).forEach((d) => {
    const meta = document.getElementById(d.platform + 'Meta');
    if (meta) meta.textContent = d.version ? `v${d.version} · ${d.size || ''}` : (d.note || '');
  });

  // 同步按钮链接
  $$('a.btn[data-platform]').forEach((a) => {
    const d = (data.downloads || []).find((x) => x.platform === a.dataset.platform);
    if (d && d.url && d.url !== '#') a.href = d.url;
  });
}

function track(platform) {
  if (!API_BASE) return;
  fetch(apiUrl('/api/track'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform })
  }).catch(() => {});
}

function bindDownload(root) {
  (root || document).querySelectorAll('[data-platform]').forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    el.addEventListener('click', (e) => {
      const platform = el.dataset.platform;
      const href = el.getAttribute('href') || '#';
      track(platform);
      if (!href || href === '#') {
        e.preventDefault();
        toast('下载地址待配置，请稍后再试');
      }
    });
  });
}

async function boot() {
  let data = FALLBACK;
  if (API_BASE) {
    try {
      const res = await fetch(apiUrl('/api/site'), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) data = json.data;
      }
    } catch (e) {
      /* 静默降级 */
    }
  }
  renderFeatures(data.features || FALLBACK.features);
  renderRelease(data);
  renderFaq(data.faq || []);
  applyMeta(data);
  bindDownload(document);
}

document.addEventListener('DOMContentLoaded', () => {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
  boot();
});
