/* ============================================================
   ASSETS — MAP: LEVELS
   Definisi semua level (BASE_LEVELS + generated levels 4–10)
   Tile legend:
     0=air, 1=ground, 2=platform, 3=stone,
     4=spike(up), 5=coin, 6=checkpoint,
     7=lava(anim), 8=saw(anim), 9=pit(void)
   ============================================================ */

'use strict';

// ─── HELPERS ────────────────────────────────────────────────
function _row(w, ch = '0') { return ch.repeat(w); }

function _rowWithSegments(w, baseCh, segments) {
  const arr = Array(w).fill(baseCh);
  for (const seg of (segments || [])) {
    const x0  = Math.max(0, Math.min(w - 1, seg.x | 0));
    const len = Math.max(0, seg.len | 0);
    for (let i = x0; i < Math.min(w, x0 + len); i++) arr[i] = seg.ch;
  }
  return arr.join('');
}

function _clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

// ─── PROCEDURAL STAGE GENERATOR ─────────────────────────────
function makeStageData(width, theme, stageNum) {
  const H        = 22;
  const floorRow = 11;

  const pits = [];
  const safeLeft  = 8;
  const safeRight = width - 16;
  const addPit = (x, len) => {
    x   = _clamp(x,   safeLeft, safeRight);
    len = _clamp(len, 2, 6);
    pits.push({ x, len });
  };
  addPit(14 + stageNum * 2, 3);
  addPit(30 + (stageNum % 4) * 3, 4);
  addPit(48 + (stageNum % 3) * 4, 3);

  const groundSegs = pits.map(p => ({ x: p.x, len: p.len, ch: '9' }));

  const p1 = [
    { x: 10 + (stageNum % 5) * 2, len: 5, ch: '2' },
    { x: 26 + (stageNum % 4) * 3, len: 6, ch: '2' }
  ];
  const p2 = [
    { x: 18 + (stageNum % 6) * 2, len: 6, ch: '2' },
    { x: 40 + (stageNum % 5) * 3, len: 5, ch: '2' }
  ];
  const p3 = [
    { x: 34 + (stageNum % 4) * 2, len: 5, ch: '2' },
    { x: 54 + (stageNum % 3) * 2, len: 4, ch: '2' }
  ];

  const rows = [];
  for (let r = 0; r < H; r++) {
    if (r < 4)           rows.push(_row(width, '0'));
    else if (r === 6)    rows.push(_rowWithSegments(width, '0', p1));
    else if (r === 8)    rows.push(_rowWithSegments(width, '0', p2));
    else if (r === 10)   rows.push(_rowWithSegments(width, '0', p3));
    else if (r === floorRow) rows.push(_rowWithSegments(width, '1', groundSegs));
    else if (r === floorRow + 1) {
      rows.push(_row(width, theme === 'abyss' ? '7' : '1'));
    } else if (theme === 'abyss' && r === floorRow + 2) {
      rows.push(_row(width, '7'));
    } else if (r > floorRow + 1) {
      rows.push(_row(width, '3'));
    } else {
      rows.push(_row(width, '0'));
    }
  }
  return rows;
}

function makeStageObjects(width, stageNum) {
  const floorRow = 11;
  const objs = [];

  // ── Difficulty scaling per stage ──────────────────────────
  // Stage 1–3: easy (hand-crafted), 4–6: medium, 7–10: hard/extreme
  const diff = stageNum; // 1..10

  // Coins
  const coinCount = 12 + stageNum * 2;
  for (let i = 0; i < coinCount; i++) {
    const x = 6 + (i * 5 + stageNum) % (width - 18);
    const y = (i % 3 === 0) ? 3 : ((i % 3 === 1) ? 5 : 7);
    objs.push({ type: 'coin', x, y });
  }

  const spikeY = floorRow;

  // ── Floor spikes — makin banyak, rapat, dan berkelompok ──
  // Stage 4: 3 grup x1, Stage 6: 4 grup x2, Stage 8: 6 grup x3, Stage 10: 7 grup x4
  const spikeGroupCount = 2 + Math.floor(diff / 2);          // 4..7 grup
  const spikeGroupSize  = 1 + Math.floor(diff / 3);          // 2..4 per grup
  const spikeStep = Math.max(6, Math.floor((width - 20) / (spikeGroupCount + 1)));
  for (let g = 0; g < spikeGroupCount; g++) {
    const sx = 10 + g * spikeStep + (diff % 3);
    if (sx > 8 && sx + spikeGroupSize < width - 14) {
      for (let k = 0; k < spikeGroupSize; k++)
        objs.push({ type: 'spike', x: sx + k, y: spikeY });
    }
  }

  // ── Hanging spikes — muncul mulai stage 4, makin banyak & lebih rendah ──
  if (diff >= 4) {
    const hCount = Math.floor((diff - 3) * 0.8);             // 1..5
    const hStep  = Math.floor((width - 20) / (hCount + 1));
    for (let i = 0; i < hCount; i++) {
      const hx = 12 + i * hStep + (diff % 4);
      // Makin tinggi stage, spike gantung makin rendah (lebih mengancam)
      const hy = diff >= 8 ? 5 : (diff >= 6 ? 6 : 7);
      if (hx > 10 && hx < width - 14) objs.push({ type: 'hspike', x: hx, y: hy });
    }
  }

  // ── Saw blades — makin banyak, cepat, jangkauan jauh, axis bervariasi ──
  // Stage 4: 2 saw x, Stage 6: 3 saw (1 vertikal), Stage 8: 5 saw (2 vertikal), Stage 10: 6 saw (3 vertikal)
  const sawCount = 1 + Math.floor(diff / 2);                 // 3..6
  const sawSpeed = 1.4 + diff * 0.30;                        // 2.6..4.4
  const sawRange = 3 + Math.floor(diff / 3);                 // 4..6
  for (let i = 0; i < sawCount; i++) {
    const sx = 14 + i * 12 + (diff % 5);
    // Vertical saw mulai stage 5, makin banyak di stage tinggi
    const axis = (diff >= 5 && i % Math.max(1, 4 - Math.floor(diff / 3)) === 1) ? 'y' : 'x';
    if (sx < width - 14)
      objs.push({ type: 'saw', x: sx, y: spikeY, range: sawRange, speed: sawSpeed, axis });
  }

  // ── Falling spikes — muncul mulai stage 4, makin sering & banyak ──
  if (diff >= 4) {
    const fsCount  = Math.floor((diff - 3) / 1.5);           // 1..4
    const fsPeriod = Math.max(28, 120 - diff * 10);          // 80..28
    for (let i = 0; i < fsCount; i++) {
      const fx = 20 + i * 16 + (diff % 7);
      if (fx < width - 14) objs.push({ type: 'fallingspike', x: fx, y: 2, period: fsPeriod });
    }
  }

  // ── Minion spawns — muncul mulai stage 6, makin banyak & kuat ──
  if (diff >= 6) {
    // Jumlah minion: stage 6=2, 7=3, 8=4, 9=5, 10=6
    const minionCount = diff - 4;                            // 2..6
    // Kecepatan: stage 6=1.0, 7=1.3, 8=1.6, 9=1.9, 10=2.2
    const minionSpeed = 0.7 + (diff - 6) * 0.3 + 0.3;
    // HP: stage 6=30, 7=45, 8=60, 9=75, 10=90
    const minionHp    = 30 + (diff - 6) * 15;
    // Stage 8+: ada minion "elite" dengan HP 2x dan kecepatan 1.5x
    for (let i = 0; i < minionCount; i++) {
      const mx = 15 + i * Math.floor((width - 30) / (minionCount + 1));
      if (mx < width - 14) {
        const isElite = diff >= 8 && i % 2 === 0;
        objs.push({
          type: 'minion',
          x: mx,
          y: spikeY - 1,
          speed: isElite ? minionSpeed * 1.5 : minionSpeed,
          hp:    isElite ? minionHp * 2       : minionHp,
        });
      }
    }
  }

  // ── Checkpoints — posisi aman (1/3 dan 2/3 map) ──
  objs.push({ type: 'checkpoint', x: Math.floor(width * 0.28), y: floorRow - 1 });
  objs.push({ type: 'checkpoint', x: Math.floor(width * 0.62), y: floorRow - 1 });

  // ── Moving platforms — makin cepat & jangkauan lebih jauh per stage ──
  const mpSpeed1 = 1.4 + diff * 0.16;
  const mpSpeed2 = 1.6 + diff * 0.18;
  const mpRange1 = 2 + Math.floor(diff / 4);   // range lebih kecil agar tidak terlalu jauh dari pit
  const mpRange2 = 2 + Math.floor(diff / 3);
  objs.push({ type: 'mplatform', x: Math.floor(width * 0.38), y: 9, range: mpRange1, speed: mpSpeed1 });
  objs.push({ type: 'mplatform', x: Math.floor(width * 0.58), y: 7, range: mpRange2, speed: mpSpeed2 });

  // Boss gate + portal
  objs.push({ type: 'chest', x: Math.floor(width * 0.46), y: 8 });
  objs.push({ type: 'bossgate', x: width - 11, y: floorRow - 1 });
  objs.push({ type: 'portal',   x: width - 3,  y: floorRow - 1 });

  return objs;
}

function generateExtraLevels(startStage, endStage) {
  const out       = [];
  const themes    = ['forest', 'citadel', 'abyss'];
  const bossNames = [
    'Shadow Knight', 'Phantom Warlord', 'Inferno Reaper',
    'Void Stalker', 'Iron Colossus', 'Plague Wraith',
    'Storm Titan', 'Chaos Demon', 'Abyssal Overlord', 'Eternal Destroyer'
  ];

  // Boss HP scaling: lebih dramatis per stage
  // Stage 4=180, 5=230, 6=290, 7=360, 8=440, 9=530, 10=640
  const bossHpTable = [0, 0, 0, 0, 180, 230, 290, 360, 440, 530, 640];

  for (let stage = startStage; stage <= endStage; stage++) {
    const theme     = themes[(stage - 1) % themes.length];
    const themeName = theme === 'forest' ? 'Dark Forest' : (theme === 'citadel' ? 'Stone Citadel' : 'Lava Abyss');
    const width     = 68 + stage * 2;
    const bossId    = stage - 1;  // stage 4→id 3, stage 5→id 4, ... stage 10→id 9
    const bossHp    = bossHpTable[stage] || (60 + stage * 22 + bossId * 8);

    out.push({
      name:       `Stage ${stage} — ${themeName}`,
      bossName:   `⚔ ${bossNames[bossId]}`,
      bossMaxHp:  bossHp,
      bgColor:    theme === 'forest'
        ? ['#12122a', '#1a1a38']
        : (theme === 'citadel'
          ? ['#0e0e20', '#1a0a2e']
          : ['#1a0808', '#0e0404']),
      width,
      height:  22,
      music:   theme,
      data:    makeStageData(width, theme, stage),
      objects: makeStageObjects(width, stage),
      playerStart: { x: 3, y: 3 },
      boss: { x: width - 4, y: 9, hp: bossHp, phase: 0, id: bossId },
    });
  }
  return out;
}

// ─── BASE LEVELS (1–3, hand-crafted) ────────────────────────
const BASE_LEVELS = [
  /* ─── LEVEL 1: THE DARK FOREST ─────────────────────────── */
  {
    name: 'The Dark Forest',
    bossName: '⚔ Shadow Knight',
    bossMaxHp: 60,
    bgColor: ['#12122a', '#1a1a38'],
    width:  64,
    height: 20,
    music: 'forest',
    data: [
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '000000011000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000011000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '1111111111111111999111111122221111111111112222199111111111111111',
      '1111111111111111999111111111111111111111111111199111111111111111',
      '1111111111111111999111111111111111111111111111199111111111111111',
      '3333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333',
    ],
    objects: [
      { type: 'coin', x: 6,  y: 3 }, { type: 'coin', x: 7,  y: 3 },
      { type: 'coin', x: 10, y: 5 }, { type: 'coin', x: 11, y: 5 }, { type: 'coin', x: 12, y: 5 },
      { type: 'coin', x: 16, y: 5 }, { type: 'coin', x: 17, y: 5 },
      { type: 'coin', x: 20, y: 6 }, { type: 'coin', x: 21, y: 6 }, { type: 'coin', x: 22, y: 6 },
      { type: 'coin', x: 28, y: 6 }, { type: 'coin', x: 29, y: 6 },
      { type: 'coin', x: 34, y: 8 }, { type: 'coin', x: 35, y: 8 }, { type: 'coin', x: 36, y: 8 },
      { type: 'coin', x: 40, y: 6 }, { type: 'coin', x: 41, y: 6 },
      { type: 'spike', x: 13, y: 10 }, { type: 'spike', x: 14, y: 10 }, { type: 'spike', x: 15, y: 10 },
      { type: 'spike', x: 30, y: 10 }, { type: 'spike', x: 31, y: 10 },
      { type: 'spike', x: 44, y: 10 }, { type: 'spike', x: 45, y: 10 }, { type: 'spike', x: 46, y: 10 },
      { type: 'hspike', x: 25, y: 7 }, { type: 'hspike', x: 26, y: 7 },
      { type: 'hspike', x: 38, y: 7 }, { type: 'hspike', x: 39, y: 7 },
      { type: 'checkpoint', x: 24, y: 9 }, { type: 'checkpoint', x: 40, y: 9 },
      { type: 'chest', x: 36, y: 8 },
      { type: 'mplatform', x: 33, y: 8, range: 3, speed: 1.2 },
      { type: 'mplatform', x: 50, y: 7, range: 2, speed: 1.8 },
      { type: 'saw', x: 18, y: 10, range: 5, speed: 1.5, axis: 'x' },
      { type: 'saw', x: 47, y: 8,  range: 3, speed: 2.0, axis: 'x' },
      { type: 'bossgate', x: 52, y: 9 },
      { type: 'portal',   x: 61, y: 9 },
    ],
    playerStart: { x: 3, y: 3 },
    boss: { x: 61, y: 8, hp: 60, phase: 0, id: 0 }
  },

  /* ─── LEVEL 2: THE STONE CITADEL ───────────────────────── */
  {
    name: 'The Stone Citadel',
    bossName: '⚔ Phantom Warlord',
    bossMaxHp: 100,
    bgColor: ['#0e0e20', '#1a0a2e'],
    width:  70,
    height: 22,
    music: 'citadel',
    data: [
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '00000001100001100000001100000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000011110000000011110000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '1111111111111199999111111111199999111111199999111111111111111111111111',
      '1111111111111199999111111111199999111111199999111111111111111111111111',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
      '3333333333333333333333333333333333333333333333333333333333333333333333',
    ],
    objects: [
      { type: 'coin', x: 5,  y: 3 }, { type: 'coin', x: 6,  y: 3 }, { type: 'coin', x: 7,  y: 3 },
      { type: 'coin', x: 14, y: 3 }, { type: 'coin', x: 15, y: 3 },
      { type: 'coin', x: 20, y: 4 }, { type: 'coin', x: 21, y: 4 },
      { type: 'coin', x: 28, y: 5 }, { type: 'coin', x: 29, y: 5 }, { type: 'coin', x: 30, y: 5 },
      { type: 'coin', x: 36, y: 5 }, { type: 'coin', x: 37, y: 5 },
      { type: 'coin', x: 44, y: 5 }, { type: 'coin', x: 45, y: 5 },
      { type: 'coin', x: 50, y: 8 }, { type: 'coin', x: 51, y: 8 }, { type: 'coin', x: 52, y: 8 },
      { type: 'spike', x: 10, y: 11 }, { type: 'spike', x: 11, y: 11 }, { type: 'spike', x: 12, y: 11 },
      { type: 'spike', x: 24, y: 11 }, { type: 'spike', x: 25, y: 11 },
      { type: 'spike', x: 38, y: 11 }, { type: 'spike', x: 39, y: 11 }, { type: 'spike', x: 40, y: 11 },
      { type: 'spike', x: 54, y: 11 }, { type: 'spike', x: 55, y: 11 },
      { type: 'hspike', x: 18, y: 10 }, { type: 'hspike', x: 19, y: 10 },
      { type: 'hspike', x: 32, y: 9  }, { type: 'hspike', x: 33, y: 9  },
      { type: 'hspike', x: 46, y: 8  }, { type: 'hspike', x: 47, y: 8  },
      // Checkpoint — posisi aman: jauh dari spike (x:10-12, x:24-25, x:38-40, x:54-55)
      // dan jauh dari saw (x:16, x:35, x:50)
      // CP1: x:7 (sebelum spike pertama), CP2: x:30 (antara spike x:25 dan x:38, area bersih)
      { type: 'checkpoint', x: 7,  y: 10 }, { type: 'checkpoint', x: 30, y: 10 },
      { type: 'chest', x: 44, y: 8 },
      { type: 'mplatform', x: 26, y: 9, range: 3, speed: 1.5 },
      { type: 'mplatform', x: 48, y: 8, range: 3, speed: 2   },
      { type: 'mplatform', x: 59, y: 7, range: 2, speed: 2.5 },
      { type: 'saw', x: 16, y: 11, range: 4, speed: 2,   axis: 'x' },
      { type: 'saw', x: 35, y: 11, range: 5, speed: 2.5, axis: 'x' },
      { type: 'saw', x: 50, y: 5,  range: 3, speed: 3,   axis: 'y' },
      { type: 'fallingspike', x: 30, y: 2, period: 120 },
      { type: 'fallingspike', x: 45, y: 2, period: 90  },
      { type: 'bossgate', x: 61, y: 10 },
      { type: 'portal',   x: 67, y: 10 },
    ],
    playerStart: { x: 3, y: 3 },
    boss: { x: 66, y: 9, hp: 100, phase: 0, id: 1 }
  },

  /* ─── LEVEL 3: THE LAVA ABYSS ──────────────────────────── */
  {
    name: 'The Lava Abyss',
    bossName: '⚔ Inferno Reaper',
    bossMaxHp: 150,
    bgColor: ['#1a0808', '#0e0404'],
    width:  72,
    height: 22,
    music: 'abyss',
    data: [
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '00000001100000000000000000000000000000000000000000000000000000000000000',
      '000000000000001100000001100000000000000000000000000000000000000000000000',
      '000000000000000000000000000000111000000001110000000000000000000000000000',
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '000000000000000000000022200000000000002220000000000000000000000000000000',
      '000000000000000000000000000000000000000000000000022200000000000000000000',
      '111111111111999991111199999111111111199999111111199999111199111111111111',
      '777777777777777777777777777777777777777777777777777777777777777777777777',
      '777777777777777777777777777777777777777777777777777777777777777777777777',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
      '333333333333333333333333333333333333333333333333333333333333333333333333',
    ],
    objects: [
      { type: 'coin', x: 5,  y: 3 }, { type: 'coin', x: 6,  y: 3 }, { type: 'coin', x: 7,  y: 3 },
      { type: 'coin', x: 12, y: 4 }, { type: 'coin', x: 13, y: 4 },
      { type: 'coin', x: 18, y: 4 }, { type: 'coin', x: 19, y: 4 },
      { type: 'coin', x: 26, y: 5 }, { type: 'coin', x: 27, y: 5 }, { type: 'coin', x: 28, y: 5 },
      { type: 'coin', x: 34, y: 5 }, { type: 'coin', x: 35, y: 5 },
      { type: 'coin', x: 42, y: 8 }, { type: 'coin', x: 43, y: 8 }, { type: 'coin', x: 44, y: 8 },
      { type: 'coin', x: 52, y: 8 }, { type: 'coin', x: 53, y: 8 },
      { type: 'coin', x: 60, y: 6 }, { type: 'coin', x: 61, y: 6 },
      { type: 'spike', x: 10, y: 11 }, { type: 'spike', x: 11, y: 11 },
      { type: 'spike', x: 22, y: 11 }, { type: 'spike', x: 23, y: 11 }, { type: 'spike', x: 24, y: 11 },
      { type: 'spike', x: 36, y: 11 }, { type: 'spike', x: 37, y: 11 },
      { type: 'spike', x: 48, y: 11 }, { type: 'spike', x: 49, y: 11 }, { type: 'spike', x: 50, y: 11 },
      { type: 'spike', x: 60, y: 11 }, { type: 'spike', x: 61, y: 11 },
      { type: 'hspike', x: 30, y: 8 }, { type: 'hspike', x: 31, y: 8 },
      { type: 'hspike', x: 45, y: 9 }, { type: 'hspike', x: 46, y: 9 },
      { type: 'hspike', x: 56, y: 8 },
      // Checkpoint — posisi aman: jauh dari spike (x:10-11, x:22-24, x:36-37, x:48-50, x:60-61)
      // dan jauh dari saw (x:8, x:27, x:40, x:58)
      // CP1: x:16 (antara spike x:11 dan x:22, area bersih), CP2: x:43 (antara spike x:37 dan x:48)
      { type: 'checkpoint', x: 16, y: 10 }, { type: 'checkpoint', x: 43, y: 10 },
      { type: 'chest', x: 53, y: 8 },
      { type: 'mplatform', x: 15, y: 10, range: 3, speed: 2   },
      { type: 'mplatform', x: 32, y: 9,  range: 2, speed: 2.5 },
      { type: 'mplatform', x: 55, y: 8,  range: 3, speed: 3   },
      { type: 'mplatform', x: 63, y: 7,  range: 2, speed: 2   },
      { type: 'saw', x: 8,  y: 11, range: 3, speed: 2.5, axis: 'x' },
      { type: 'saw', x: 27, y: 11, range: 4, speed: 3,   axis: 'x' },
      { type: 'saw', x: 40, y: 5,  range: 3, speed: 3.5, axis: 'y' },
      { type: 'saw', x: 58, y: 11, range: 3, speed: 4,   axis: 'x' },
      { type: 'fallingspike', x: 20, y: 2, period: 80 },
      { type: 'fallingspike', x: 38, y: 2, period: 60 },
      { type: 'fallingspike', x: 55, y: 2, period: 70 },
      { type: 'bossgate', x: 63, y: 10 },
      { type: 'portal',   x: 69, y: 10 },
    ],
    playerStart: { x: 3, y: 3 },
    boss: { x: 69, y: 9, hp: 150, phase: 0, id: 2 }
  }
];

// ─── ALL LEVELS (1–10) ───────────────────────────────────────
const LEVELS = [...BASE_LEVELS, ...generateExtraLevels(4, 10)];

function normalizeLevelRows(levels) {
  levels.forEach(level => {
    level.data = level.data.map(row => {
      if (row.length === level.width) return row;
      if (row.length > level.width) return row.slice(0, level.width);
      return row.padEnd(level.width, '0');
    });
  });
}

normalizeLevelRows(LEVELS);
