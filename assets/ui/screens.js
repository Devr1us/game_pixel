/* ============================================================
   ASSETS — UI: SCREENS
   Manajemen layar (title, howto, stages, game, gameover, dll)
   dan Stage Select (render kartu stage, progress, unlock)
   ============================================================ */

'use strict';

// ─── SCREEN MANAGEMENT ───────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = '';
  });
  const map = {
    title:      'screen-title',
    howto:      'screen-howto',
    stages:     'screen-stages',
    game:       'screen-game',
    gameover:   'screen-gameover',
    levelclear: 'screen-levelclear',
    victory:    'screen-victory',
  };
  const el = document.getElementById(map[name]);
  if (el) { el.classList.add('active'); el.style.display = 'flex'; }
  if (name === 'levelclear') renderLevelClearStars();
  if (name === 'stages')     renderStageSelect();
}

// ─── STAGE UNLOCK / PROGRESS ─────────────────────────────────
const UNLOCK_STARS_REQUIRED = 2;
const PROGRESS_KEY = 'the_punch_guy_progress_v1';

function defaultProgress() {
  return { bestStars: Array(LEVELS.length).fill(0) };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.bestStars)) return defaultProgress();
    if (p.bestStars.length < LEVELS.length) {
      p.bestStars = p.bestStars.concat(Array(LEVELS.length - p.bestStars.length).fill(0));
    } else if (p.bestStars.length > LEVELS.length) {
      p.bestStars = p.bestStars.slice(0, LEVELS.length);
    }
    return p;
  } catch {
    return defaultProgress();
  }
}

function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {}
}

function resetProgress() {
  saveProgress(defaultProgress());
}

function isStageUnlocked(stageIdx0) {
  if (stageIdx0 <= 0) return true;
  const p = loadProgress();
  return (p.bestStars[stageIdx0 - 1] || 0) >= UNLOCK_STARS_REQUIRED;
}

// ─── STAGE SELECT RENDER ─────────────────────────────────────
function renderStageSelect() {
  const grid = document.getElementById('stages-grid');
  if (!grid) return;
  const p = loadProgress();
  grid.innerHTML = '';

  for (let i = 0; i < LEVELS.length; i++) {
    const stageNum = i + 1;
    const best     = p.bestStars[i] || 0;
    const unlocked = isStageUnlocked(i);

    const card = document.createElement('div');
    card.className = 'stage-card' + (unlocked ? '' : ' locked');
    card.setAttribute('data-stage', String(i));

    const num = document.createElement('div');
    num.className = 'stage-num';
    num.textContent = `STAGE ${stageNum}`;

    const name = document.createElement('div');
    name.className = 'stage-name';
    name.textContent = LEVELS[i].name || `Stage ${stageNum}`;

    const stars = document.createElement('div');
    stars.className = 'stage-stars';
    stars.textContent = '★'.repeat(best) + '☆'.repeat(3 - best);

    const lock = document.createElement('div');
    lock.className = 'stage-lock';
    lock.textContent = unlocked ? '' : `🔒 butuh ${UNLOCK_STARS_REQUIRED}★`;

    card.appendChild(num);
    card.appendChild(name);
    card.appendChild(stars);
    if (!unlocked) card.appendChild(lock);

    card.addEventListener('click', () => {
      if (!unlocked) return;
      startLevel(i);
    });

    grid.appendChild(card);
  }
}

// ─── LEVEL CLEAR STARS ───────────────────────────────────────
function computeLevelStars() {
  if (!currentLevel || !player) return { timeStar: false, coinsStar: false, perfectStar: false, total: 0 };
  const timeStar    = currentLevel.elapsedMs <= 90000;
  const coinsStar   = currentLevel.coinTotal === 0 || currentLevel.coins.every(c => c.collected);
  const perfectStar = G.lives === 3;
  return {
    timeStar, coinsStar, perfectStar,
    total: [timeStar, coinsStar, perfectStar].filter(Boolean).length,
  };
}

function renderLevelClearStars() {
  const stars        = computeLevelStars();
  const starRow      = document.getElementById('lc-stars');
  const statusTime   = document.getElementById('lc-cond-time');
  const statusCoins  = document.getElementById('lc-cond-coins');
  const statusPerfect = document.getElementById('lc-cond-perfect');
  const starCount    = document.getElementById('lc-star-count');

  if (starRow) {
    starRow.innerHTML = [stars.timeStar, stars.coinsStar, stars.perfectStar]
      .map(ok => ok ? '★' : '☆').join('');
  }
  if (starCount)     starCount.textContent    = `${stars.total}/3`;
  if (statusTime)    statusTime.textContent   = `⏱ Waktu di bawah 1:30: ${stars.timeStar    ? 'TERCAPAI' : 'GAGAL'}`;
  if (statusCoins)   statusCoins.textContent  = `🪙 Kumpulkan semua koin: ${stars.coinsStar  ? 'TERCAPAI' : 'GAGAL'}`;
  if (statusPerfect) statusPerfect.textContent = `❤ Nyawa penuh tanpa mati: ${stars.perfectStar ? 'TERCAPAI' : 'GAGAL'}`;
}

// ─── TITLE PARTICLES ─────────────────────────────────────────
function spawnTitleParticles() {
  const container = document.getElementById('title-particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left             = Math.random() * 100 + 'vw';
    p.style.bottom           = '-10px';
    p.style.animationDuration = (4 + Math.random() * 6) + 's';
    p.style.animationDelay   = (Math.random() * 8) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    p.style.background = Math.random() > 0.5 ? PAL.gold : PAL.purple;
    container.appendChild(p);
  }
}

// ─── BOOT (dipanggil setelah semua assets selesai di-load) ───
// screens.js adalah file terakhir yang di-load, jadi boot di sini
window.addEventListener('load', _bindUIAndBoot);
