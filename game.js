/* ============================================================
   THE PUNCH GUY — GAME ENGINE (entry point)
   
   Struktur assets:
   ├── assets/
   │   ├── characters/
   │   │   ├── player.js   ← karakter player (The Punch Guy)
   │   │   └── boss.js     ← boss definitions + class Boss
   │   ├── map/
   │   │   ├── tilemap.js  ← TileMap, Camera, drawTiles, drawBackground
   │   │   └── levels.js   ← definisi semua level (1–10)
   │   ├── obstacles/
   │   │   └── obstacles.js ← Spike, FallingSpike, Saw
   │   ├── objects/
   │   │   └── objects.js  ← Coin, MovingPlatform, Checkpoint, BossGate, Portal
   │   └── ui/
   │       ├── hud.js      ← HP bar, boss bar, damage flash, checkpoint popup
   │       └── screens.js  ← screen management, stage select, progress
   ============================================================ */

'use strict';

// ─── CANVAS SETUP ───────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ─── CONSTANTS ──────────────────────────────────────────────
const TILE     = 32;
const GRAVITY  = 0.55;
const CAM_LERP = 0.08;

// Ukuran canvas — selalu mengikuti viewport
let GAME_W = window.innerWidth;
let GAME_H = window.innerHeight;

const wrapper = document.getElementById('game-wrapper');

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = wrapper.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(240, Math.floor(rect.height));

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  GAME_W = width;
  GAME_H = height;
}

resizeCanvas();

// ─── AUDIO SYSTEM ───────────────────────────────────────────
const Audio = {
  titleMusic: document.getElementById('music-title'),
  gameMusic: document.getElementById('music-game'),
  toggle: document.getElementById('music-toggle'),
  muted: localStorage.getItem('game-music-muted') === 'true',
  
  init() {
    if (!this.toggle) return; // Graceful fallback jika audio tidak ada
    this.setMuted(this.muted);
    this.toggle.addEventListener('click', () => this.toggleMute());
    if (this.titleMusic) this.titleMusic.volume = 0.4;
    if (this.gameMusic) this.gameMusic.volume = 0.4;
    this.playTitle();
  },
  
  playTitle() {
    if (!this.titleMusic || !this.gameMusic) return;
    this.gameMusic.pause();
    this.gameMusic.currentTime = 0;
    if (!this.muted) {
      this.titleMusic.play().catch(() => {});
    }
  },
  
  playGame() {
    if (!this.titleMusic || !this.gameMusic) return;
    this.titleMusic.pause();
    this.titleMusic.currentTime = 0;
    if (!this.muted) {
      this.gameMusic.play().catch(() => {});
    }
  },
  
  stop() {
    if (this.titleMusic) {
      this.titleMusic.pause();
      this.titleMusic.currentTime = 0;
    }
    if (this.gameMusic) {
      this.gameMusic.pause();
      this.gameMusic.currentTime = 0;
    }
  },
  
  setMuted(muted) {
    if (!this.toggle) return;
    this.muted = muted;
    localStorage.setItem('game-music-muted', muted);
    
    if (muted) {
      if (this.titleMusic) this.titleMusic.muted = true;
      if (this.gameMusic) this.gameMusic.muted = true;
      this.toggle.classList.add('muted');
      this.toggle.textContent = '🔇';
    } else {
      if (this.titleMusic) this.titleMusic.muted = false;
      if (this.gameMusic) this.gameMusic.muted = false;
      this.toggle.classList.remove('muted');
      this.toggle.textContent = '🔊';
      
      // Resume playback jika ada audio yang sudah di-pause
      if (document.querySelector('.screen.active') === document.getElementById('screen-title')) {
        this.playTitle();
      } else if (document.querySelector('.screen.active') === document.getElementById('screen-game')) {
        this.playGame();
      }
    }
  },
  
  toggleMute() {
    this.setMuted(!this.muted);
  }
};

// ─── PALETTE ────────────────────────────────────────────────
const PAL = {
  sky1: '#1a1a3e', sky2: '#0a0a1e',
  ground: '#2d4a1e', groundTop: '#4a7c3f', groundDark: '#1a2d12',
  stone: '#4a4a6a', stoneDark: '#2d2d4a', stoneLight: '#6a6a8a',
  lava: '#e84040', lavaGlow: '#ff8c00',
  water: '#1a4a8a', waterLight: '#4a8aff',
  spike: '#c8c8d8', spikeBase: '#6a6a8a',
  gold: '#f5c842', goldDark: '#8a6e00',
  checkpoint: '#f5c842',
  playerBody: '#5a9ae8', playerDark: '#2d5a9a', playerFace: '#f5d0a0',
  punch: '#f5d0a0', punchGlow: '#ffcc66',
  boss1: '#c83232', boss1Dark: '#7a1a1a', boss1Eye: '#ff4444',
  boss2: '#8a3296', boss2Dark: '#4a1a5a', boss2Eye: '#ff44ff',
  boss3: '#32c896', boss3Dark: '#1a6a4a', boss3Eye: '#44ffcc',
  coinC: '#f5c842', coinH: '#ff9900',
  portal: '#9b5de5', portalGlow: '#c84aff',
  bg1: '#12122a', bg2: '#1a1a38', bg3: '#0e0e20',
  platform: '#3a2a1a', platformTop: '#6a4a2a',
  chain: '#888',
  saw: '#bbb', sawEdge: '#fff',
  cloud: '#2a2a4a',
  star: '#ffffff',
  torch: '#ff6600', torchFlame: '#ffaa00',
  pit: '#050510',
  bridge: '#6a4a2a', bridgeDark: '#3a2a12',
  purple: '#9b5de5',
};

// ─── GAME STATE ─────────────────────────────────────────────
let G = {
  currentLevel: 0,
  lives: 3,
  score: 0,
  coins: 0,
  paused: false,
  running: false,
  keys: {},
  justPressed: {},
  mouseClicked: false,
  tick: 0,
};

// ─── PARTICLE SYSTEM ────────────────────────────────────────
const Particles = {
  pool: [],
  emit(x, y, count, color, vx = 0, vy = 0, spread = 3, life = 30) {
    for (let i = 0; i < count; i++) {
      this.pool.push({
        x, y, life, maxLife: life,
        vx: vx + (Math.random() - 0.5) * spread * 2,
        vy: vy + (Math.random() - 0.5) * spread * 2,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  },
  update() {
    this.pool = this.pool.filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      return p.life > 0;
    });
  },
  draw() {
    this.pool.forEach(p => {
      const sc = Camera.toScreen(p.x, p.y);
      const a  = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(sc.x - p.size / 2, sc.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
};

// ─── HELPER ─────────────────────────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ─── CURRENT LEVEL STATE ─────────────────────────────────────
let currentLevel = {};
let player;

// ─── LEVEL INIT ─────────────────────────────────────────────
function initLevel(levelIdx) {
  G.currentLevel = levelIdx;
  const def = LEVELS[levelIdx];
  const map = new TileMap(def);

  resizeCanvas();
  Camera.init(map.pixelWidth(), map.pixelHeight());

  const ps = def.playerStart;
  player = new Player(ps.x * TILE, ps.y * TILE - 32);

  const coins       = [];
  const spikes      = [];
  const hspikes     = [];
  const fspikes     = [];
  const saws        = [];
  const mplatforms  = [];
  const checkpoints = [];
  const minions     = [];
  let   bossgate    = null;
  let   portal      = null;
  const boss        = new Boss(BOSS_DEFS[def.boss.id], levelIdx);

  def.objects.forEach(o => {
    switch (o.type) {
      case 'coin':         coins.push(new Coin(o.x, o.y)); break;
      case 'spike':        spikes.push(new Spike(o.x, o.y, false)); break;
      case 'hspike':       hspikes.push(new Spike(o.x, o.y, true)); break;
      case 'fallingspike': fspikes.push(new FallingSpike(o.x, o.y, o.period)); break;
      case 'saw':          saws.push(new Saw(o.x, o.y, o.range, o.speed, o.axis)); break;
      case 'mplatform':    mplatforms.push(new MovingPlatform(o.x, o.y, o.range, o.speed)); break;
      case 'checkpoint':   checkpoints.push(new Checkpoint(o.x, o.y)); break;
      case 'minion':       minions.push(new Minion(o.x, o.y, o.speed, o.hp)); break;
      case 'bossgate':     bossgate = new BossGate(o.x, o.y); break;
      case 'portal':       portal   = new Portal(o.x, o.y); break;
    }
  });

  currentLevel = {
    def, map,
    coins, spikes, hspikes, fspikes, saws,
    mplatforms, checkpoints, minions, bossgate, portal, boss,
    bossDefeated: false,
    elapsedMs: 0,
    coinTotal: coins.length,
    startLives: G.lives,
    bgStars:  generateStars(100),
    bgClouds: generateClouds(12, map.pixelWidth()),
  };

  document.getElementById('hud-level-num').textContent = levelIdx + 1;
  hideBossBar();
  updateHUD();
}

// ─── GAME LOOP ───────────────────────────────────────────────
let lastTime = 0;
let animId;

function gameLoop(ts) {
  if (!G.running) return;
  animId = requestAnimationFrame(gameLoop);

  const dt      = Math.min((ts - lastTime) / 16.67, 3);
  const frameMs = ts - lastTime;
  lastTime = ts;

  if (G.paused) {
    drawPaused();
    G.justPressed = {};
    return;
  }

  if (currentLevel) currentLevel.elapsedMs += frameMs;
  G.tick++;

  updateGame(dt);
  updateHUD();

  drawBackground();
  // Terapkan zoom — semua objek world digambar dalam koordinat world-space
  ctx.save();
  ctx.scale(Camera.zoom, Camera.zoom);
  drawTiles(currentLevel.map);
  drawObjects();
  Particles.draw();
  player.draw();
  currentLevel.boss.draw();
  ctx.restore();
  // HUD digambar di atas zoom (koordinat layar)
  drawHUDCanvas(player);

  G.justPressed = {};
}

function updateGame(dt) {
  const cl = currentLevel;

  cl.mplatforms.forEach(mp => mp.update(player));
  player.update(cl.map, cl, dt);
  Camera.follow(player.x + player.w / 2, player.y + player.h / 2);

  cl.coins.forEach(c => c.update(player));

  if (!player.dead) {
    cl.spikes.forEach(s  => s.update(player));
    cl.hspikes.forEach(s => s.update(player));
    cl.fspikes.forEach(s => s.update(player, cl.map));
    cl.saws.forEach(s    => s.update(player));
  }

  cl.checkpoints.forEach(cp => cp.update(player));
  if (cl.bossgate) cl.bossgate.update(player, cl.boss);
  if (!player.dead) cl.boss.update(cl.map, player);
  // Minion update (stage 6–10)
  if (!player.dead && cl.minions) {
    cl.minions.forEach(m => m.update(cl.map, player));
    cl.minions = cl.minions.filter(m => m.alive || m.deathAnim > 0);
  }

  if (cl.portal && !player.dead) {
    const finished = cl.portal.update(player, cl.bossDefeated);
    if (finished) nextLevel();
  }
}

function drawObjects() {
  const cl = currentLevel;
  cl.mplatforms.forEach(mp => mp.draw());
  cl.coins.forEach(c => c.draw());
  cl.spikes.forEach(s => s.draw());
  cl.hspikes.forEach(s => s.draw());
  cl.fspikes.forEach(s => s.draw());
  cl.saws.forEach(s => s.draw());
  cl.checkpoints.forEach(cp => cp.draw());
  if (cl.bossgate) cl.bossgate.draw();
  if (cl.portal)   cl.portal.draw(cl.bossDefeated);
  // Minion draw (stage 6–10)
  if (cl.minions) cl.minions.forEach(m => m.draw());
}

function drawPaused() {
  // Overlay ditangani CSS, tidak perlu draw tambahan
}

// ─── LEVEL TRANSITIONS ───────────────────────────────────────
function nextLevel() {
  const stars  = computeLevelStars();
  const p      = loadProgress();
  p.bestStars[G.currentLevel] = Math.max(p.bestStars[G.currentLevel] || 0, stars.total);
  saveProgress(p);

  const nextIdx    = G.currentLevel + 1;
  const canUnlockNext = (stars.total >= UNLOCK_STARS_REQUIRED);
  const canGoNext  = nextIdx < LEVELS.length && canUnlockNext;
  const btnNext    = document.getElementById('btn-nextlevel');
  const lockNote   = document.getElementById('lc-lock-note');

  if (btnNext) {
    btnNext.disabled = !canGoNext;
    btnNext.classList.toggle('danger', !canGoNext);
    btnNext.textContent = canGoNext ? 'NEXT LEVEL ▶' : 'STAGE TERKUNCI';
  }
  if (lockNote) lockNote.classList.toggle('hidden', canGoNext || nextIdx >= LEVELS.length);

  if (G.currentLevel + 1 >= LEVELS.length) {
    G.running = false;
    cancelAnimationFrame(animId);
    document.getElementById('vic-score').textContent = G.score;
    showScreen('victory');
  } else {
    document.getElementById('lc-score').textContent = G.score;
    document.getElementById('lc-coins').textContent = G.coins;
    renderLevelClearStars();
    showScreen('levelclear');
    G.running = false;
    cancelAnimationFrame(animId);
  }
}

function startLevel(idx) {
  cancelAnimationFrame(animId);
  G.running = false;
  G.paused  = false;
  document.getElementById('pause-overlay').classList.add('hidden');
  Particles.pool = [];
  initLevel(idx);
  showScreen('game');
  G.running = true;
  lastTime  = performance.now();
  animId    = requestAnimationFrame(gameLoop);
}

function startGame() {
  G.lives = 3;
  G.score = 0;
  G.coins = 0;
  startLevel(0);
}

// ─── INPUT ───────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (!G.keys[e.code]) G.justPressed[e.code] = true;
  G.keys[e.code] = true;
  if (e.code === 'Escape' && G.running) {
    G.paused = !G.paused;
    document.getElementById('pause-overlay').classList.toggle('hidden', !G.paused);
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  G.keys[e.code] = false;
});

document.addEventListener('click', () => {
  if (G.running && !G.paused) G.mouseClicked = true;
});

window.addEventListener('resize', () => {
  resizeCanvas();
  if (currentLevel.map) Camera.init(currentLevel.map.pixelWidth(), currentLevel.map.pixelHeight());
});

// ─── UI BINDINGS & BOOT ──────────────────────────────────────
// Dijalankan setelah semua script assets selesai di-load
// (dipanggil dari assets/ui/screens.js via window.onload)
function _bindUIAndBoot() {
  document.getElementById('btn-start').addEventListener('click', () => showScreen('stages'));
  document.getElementById('btn-how').addEventListener('click', () => showScreen('howto'));
  document.getElementById('btn-back').addEventListener('click', () => showScreen('title'));

  document.getElementById('btn-stages-back').addEventListener('click', () => showScreen('title'));
  document.getElementById('btn-stages-reset').addEventListener('click', () => {
    resetProgress();
    renderStageSelect();
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    G.paused = false;
    document.getElementById('pause-overlay').classList.add('hidden');
  });
  document.getElementById('btn-menu').addEventListener('click', () => {
    G.running = false;
    cancelAnimationFrame(animId);
    showScreen('title');
  });

  // Tombol pause di HUD
  document.getElementById('btn-pause-hud').addEventListener('click', () => {
    if (!G.running) return;
    G.paused = !G.paused;
    document.getElementById('pause-overlay').classList.toggle('hidden', !G.paused);
  });

  // Tombol Stage Select di pause menu
  document.getElementById('btn-pause-stages').addEventListener('click', () => {
    G.running = false;
    G.paused  = false;
    cancelAnimationFrame(animId);
    document.getElementById('pause-overlay').classList.add('hidden');
    showScreen('stages');
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    G.lives = 3;
    G.score = 0;
    G.coins = 0;
    startLevel(G.currentLevel);
  });
  document.getElementById('btn-go-menu').addEventListener('click', () => {
    G.running = false;
    cancelAnimationFrame(animId);
    showScreen('title');
  });

  document.getElementById('btn-nextlevel').addEventListener('click', () => {
    const stars = computeLevelStars();
    if (stars.total < UNLOCK_STARS_REQUIRED) return;
    startLevel(G.currentLevel + 1);
  });

  document.getElementById('btn-stage-select').addEventListener('click', () => showScreen('stages'));
  document.getElementById('btn-vic-stages').addEventListener('click', () => showScreen('stages'));
  document.getElementById('btn-vic-menu').addEventListener('click', () => showScreen('title'));

  document.getElementById('go-score').textContent = 0;

  spawnTitleParticles();
  showScreen('title');
  Audio.init();
}
