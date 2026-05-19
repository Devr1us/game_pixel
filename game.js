/* ============================================================
   THE PUNCH GUY — GAME ENGINE
   Full pixel RPG: maps, bosses, traps, checkpoints, coins
   ============================================================ */

'use strict';

// ─── CANVAS SETUP ───────────────────────────────────────────
const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ─── CONSTANTS ──────────────────────────────────────────────
const TILE    = 32;
const GRAVITY = 0.55;
const CAM_LERP= 0.08;

// ─── PALETTE ────────────────────────────────────────────────
const PAL = {
  sky1:'#1a1a3e', sky2:'#0a0a1e',
  ground:'#2d4a1e', groundTop:'#4a7c3f', groundDark:'#1a2d12',
  stone:'#4a4a6a', stoneDark:'#2d2d4a', stoneLight:'#6a6a8a',
  lava:'#e84040',  lavaGlow:'#ff8c00',
  water:'#1a4a8a', waterLight:'#4a8aff',
  spike:'#c8c8d8', spikeBase:'#6a6a8a',
  gold:'#f5c842',  goldDark:'#8a6e00',
  checkpoint:'#f5c842',
  playerBody:'#5a9ae8', playerDark:'#2d5a9a', playerFace:'#f5d0a0',
  sword:'#d0d0e8', swordGlow:'#8080ff',
  // Player punch (for "The Punch Guy" theme)
  punch:'#f5d0a0', punchGlow:'#ffcc66',
  boss1:'#c83232', boss1Dark:'#7a1a1a', boss1Eye:'#ff4444',
  boss2:'#8a3296', boss2Dark:'#4a1a5a', boss2Eye:'#ff44ff',
  boss3:'#32c896', boss3Dark:'#1a6a4a', boss3Eye:'#44ffcc',
  coinC:'#f5c842', coinH:'#ff9900',
  portal:'#9b5de5', portalGlow:'#c84aff',
  bg1:'#12122a', bg2:'#1a1a38', bg3:'#0e0e20',
  platform:'#3a2a1a', platformTop:'#6a4a2a',
  chain:'#888',
  saw:'#bbb', sawEdge:'#fff',
  cloud:'#2a2a4a',
  star:'#ffffff',
  torch:'#ff6600', torchFlame:'#ffaa00',
  pit:'#050510',
  bridge:'#6a4a2a', bridgeDark:'#3a2a12',
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

// ─── LEVEL DEFINITIONS ──────────────────────────────────────
// Tile legend:
// 0=air, 1=ground, 2=platform, 3=stone, 4=spike(up),
// 5=coin, 6=checkpoint, 7=lava(anim), 8=saw(anim),
// 9=pit(void), S=player start, E=level end portal
// B=boss trigger zone
// 'c'=cloud-platform, 'w'=water, 'h'=hanging-spike(down)

const LEVELS = [
  /* ─── LEVEL 1: THE DARK FOREST ─────────────────────────── */
  {
    name: 'The Dark Forest',
    bossName: '⚔ Shadow Knight',
    bossMaxHp: 60,
    bgColor: ['#12122a','#1a1a38'],
    width:  64,
    height: 20,
    music: 'forest',
    // 0-indexed col, row
    data: [
      // row 0 (top)
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000 S 0000000000000000000000000000000000000000000000000000000000',
      '000000011000000000000000000000000000000000000000000000000D A00000000',
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
      // coins
      {type:'coin', x:6, y:3},{type:'coin', x:7, y:3},
      {type:'coin', x:10,y:5},{type:'coin', x:11,y:5},{type:'coin', x:12,y:5},
      {type:'coin', x:16,y:5},{type:'coin', x:17,y:5},
      {type:'coin', x:20,y:6},{type:'coin', x:21,y:6},{type:'coin', x:22,y:6},
      {type:'coin', x:28,y:6},{type:'coin', x:29,y:6},
      {type:'coin', x:34,y:8},{type:'coin', x:35,y:8},{type:'coin', x:36,y:8},
      {type:'coin', x:40,y:6},{type:'coin', x:41,y:6},
      // spikes
      {type:'spike', x:13,y:10},{type:'spike', x:14,y:10},{type:'spike', x:15,y:10},
      {type:'spike', x:30,y:10},{type:'spike', x:31,y:10},
      {type:'spike', x:44,y:10},{type:'spike', x:45,y:10},{type:'spike', x:46,y:10},
      // hanging spikes
      {type:'hspike', x:25,y:7},{type:'hspike', x:26,y:7},
      {type:'hspike', x:38,y:7},{type:'hspike', x:39,y:7},
      // checkpoint
      {type:'checkpoint', x:24,y:9},{type:'checkpoint', x:40,y:9},
      // moving platform
      {type:'mplatform', x:33,y:8, range:4, speed:1.2},
      {type:'mplatform', x:50,y:7, range:3, speed:1.8},
      // saw blade
      {type:'saw', x:18,y:10, range:5, speed:1.5, axis:'x'},
      {type:'saw', x:47,y:8,  range:3, speed:2.0, axis:'x'},
      // boss trigger at col ~52
      {type:'bossgate', x:52, y:9},
      // level end portal
      {type:'portal', x:61, y:9},
    ],
    playerStart: {x: 3, y: 3},
    boss: {
      x: 61, y: 8,
      hp: 60,
      phase: 0,
      id: 0,
    }
  },

  /* ─── LEVEL 2: THE STONE CITADEL ───────────────────────── */
  {
    name: 'The Stone Citadel',
    bossName: '⚔ Phantom Warlord',
    bossMaxHp: 100,
    bgColor: ['#0e0e20','#1a0a2e'],
    width:  70,
    height: 22,
    music: 'citadel',
    data: [
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000000000000',
      '00 S 0000000000000000000000000000000000000000000000000000000000000000000',
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
      {type:'coin',x:5,y:3},{type:'coin',x:6,y:3},{type:'coin',x:7,y:3},
      {type:'coin',x:14,y:3},{type:'coin',x:15,y:3},
      {type:'coin',x:20,y:4},{type:'coin',x:21,y:4},
      {type:'coin',x:28,y:5},{type:'coin',x:29,y:5},{type:'coin',x:30,y:5},
      {type:'coin',x:36,y:5},{type:'coin',x:37,y:5},
      {type:'coin',x:44,y:5},{type:'coin',x:45,y:5},
      {type:'coin',x:50,y:8},{type:'coin',x:51,y:8},{type:'coin',x:52,y:8},
      // spikes
      {type:'spike',x:10,y:11},{type:'spike',x:11,y:11},{type:'spike',x:12,y:11},
      {type:'spike',x:24,y:11},{type:'spike',x:25,y:11},
      {type:'spike',x:38,y:11},{type:'spike',x:39,y:11},{type:'spike',x:40,y:11},
      {type:'spike',x:54,y:11},{type:'spike',x:55,y:11},
      // hanging spikes
      {type:'hspike',x:18,y:10},{type:'hspike',x:19,y:10},
      {type:'hspike',x:32,y:9},{type:'hspike',x:33,y:9},
      {type:'hspike',x:46,y:8},{type:'hspike',x:47,y:8},
      // checkpoints
      {type:'checkpoint',x:20,y:10},{type:'checkpoint',x:42,y:10},
      // moving platforms
      {type:'mplatform',x:26,y:9,range:5,speed:1.5},
      {type:'mplatform',x:48,y:8,range:4,speed:2},
      {type:'mplatform',x:59,y:7,range:3,speed:2.5},
      // saw blades
      {type:'saw',x:16,y:11,range:4,speed:2,axis:'x'},
      {type:'saw',x:35,y:11,range:5,speed:2.5,axis:'x'},
      {type:'saw',x:50,y:5,range:3,speed:3,axis:'y'},
      // falling spike trap (periodically drops)
      {type:'fallingspike',x:30,y:2,period:120},
      {type:'fallingspike',x:45,y:2,period:90},
      // boss gate
      {type:'bossgate',x:61,y:10},
      // portal
      {type:'portal',x:67,y:10},
    ],
    playerStart:{x:3,y:3},
    boss:{x:66,y:9,hp:100,phase:0,id:1}
  },

  /* ─── LEVEL 3: THE LAVA ABYSS ──────────────────────────── */
  {
    name: 'The Lava Abyss',
    bossName: '⚔ Inferno Reaper',
    bossMaxHp: 150,
    bgColor: ['#1a0808','#0e0404'],
    width:  72,
    height: 22,
    music: 'abyss',
    data: [
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '000000000000000000000000000000000000000000000000000000000000000000000000',
      '00 S 00000000000000000000000000000000000000000000000000000000000000000000',
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
      // coins
      {type:'coin',x:5,y:3},{type:'coin',x:6,y:3},{type:'coin',x:7,y:3},
      {type:'coin',x:12,y:4},{type:'coin',x:13,y:4},
      {type:'coin',x:18,y:4},{type:'coin',x:19,y:4},
      {type:'coin',x:26,y:5},{type:'coin',x:27,y:5},{type:'coin',x:28,y:5},
      {type:'coin',x:34,y:5},{type:'coin',x:35,y:5},
      {type:'coin',x:42,y:8},{type:'coin',x:43,y:8},{type:'coin',x:44,y:8},
      {type:'coin',x:52,y:8},{type:'coin',x:53,y:8},
      {type:'coin',x:60,y:6},{type:'coin',x:61,y:6},
      // spikes
      {type:'spike',x:10,y:11},{type:'spike',x:11,y:11},
      {type:'spike',x:22,y:11},{type:'spike',x:23,y:11},{type:'spike',x:24,y:11},
      {type:'spike',x:36,y:11},{type:'spike',x:37,y:11},
      {type:'spike',x:48,y:11},{type:'spike',x:49,y:11},{type:'spike',x:50,y:11},
      {type:'spike',x:60,y:11},{type:'spike',x:61,y:11},
      // hanging spikes
      {type:'hspike',x:30,y:8},{type:'hspike',x:31,y:8},
      {type:'hspike',x:45,y:9},{type:'hspike',x:46,y:9},
      {type:'hspike',x:56,y:8},
      // checkpoints
      {type:'checkpoint',x:22,y:10},{type:'checkpoint',x:48,y:10},
      // moving platforms
      {type:'mplatform',x:15,y:10,range:4,speed:2},
      {type:'mplatform',x:32,y:9,range:3,speed:2.5},
      {type:'mplatform',x:55,y:8,range:4,speed:3},
      {type:'mplatform',x:63,y:7,range:3,speed:2},
      // rotating saws
      {type:'saw',x:8,y:11,range:3,speed:2.5,axis:'x'},
      {type:'saw',x:27,y:11,range:4,speed:3,axis:'x'},
      {type:'saw',x:40,y:5,range:3,speed:3.5,axis:'y'},
      {type:'saw',x:58,y:11,range:3,speed:4,axis:'x'},
      // falling spikes
      {type:'fallingspike',x:20,y:2,period:80},
      {type:'fallingspike',x:38,y:2,period:60},
      {type:'fallingspike',x:55,y:2,period:70},
      // boss gate
      {type:'bossgate',x:63,y:10},
      // portal
      {type:'portal',x:69,y:10},
    ],
    playerStart:{x:3,y:3},
    boss:{x:69,y:9,hp:150,phase:0,id:2}
  }
];

// ─── TILEMAP CLASS ──────────────────────────────────────────
class TileMap {
  constructor(levelDef) {
    this.def = levelDef;
    this.rows = [];
    // Parse data strings into 2D array
    for (let r = 0; r < levelDef.data.length; r++) {
      const row = [];
      const str = levelDef.data[r];
      for (let c = 0; c < levelDef.width; c++) {
        const ch = str[c] || '0';
        row.push(ch);
      }
      this.rows.push(row);
    }
    this.tileW = TILE;
    this.tileH = TILE;
    this.cols  = levelDef.width;
    this.rowCount = levelDef.data.length;
  }

  get(col, row) {
    if (row < 0 || row >= this.rowCount || col < 0 || col >= this.cols) return '3';
    return this.rows[row][col];
  }

  isSolid(col, row) {
    const t = this.get(col, row);
    return t === '1' || t === '2' || t === '3' || t === 'c';
  }

  isPit(col, row) {
    if (row >= this.rowCount) return true;
    const t = this.get(col, row);
    return t === '9';
  }

  isLava(col, row) {
    return this.get(col, row) === '7';
  }

  pixelWidth()  { return this.cols * this.tileW; }
  pixelHeight() { return this.rowCount * this.tileH; }
}

// ─── CAMERA ─────────────────────────────────────────────────
const Camera = {
  x: 0, y: 0,
  tw: 0, th: 0,
  W: 0, H: 0,

  init(mapW, mapH) {
    this.W = canvas.width;
    this.H = canvas.height;
    this.maxX = Math.max(0, mapW - this.W);
    this.maxY = Math.max(0, mapH - this.H);
  },

  follow(px, py) {
    const tx = px - this.W / 2;
    const ty = py - this.H / 2;
    this.x += (Math.min(Math.max(tx, 0), this.maxX) - this.x) * CAM_LERP;
    this.y += (Math.min(Math.max(ty, 0), this.maxY) - this.y) * CAM_LERP;
  },

  toScreen(wx, wy) {
    return { x: wx - this.x, y: wy - this.y };
  },

  inView(wx, wy, w, h) {
    return wx + w > this.x && wx < this.x + this.W &&
           wy + h > this.y && wy < this.y + this.H;
  }
};

// ─── PARTICLE SYSTEM ────────────────────────────────────────
const Particles = {
  pool: [],
  emit(x, y, count, color, vx=0, vy=0, spread=3, life=30) {
    for (let i = 0; i < count; i++) {
      this.pool.push({
        x, y, life, maxLife: life,
        vx: vx + (Math.random()-0.5)*spread*2,
        vy: vy + (Math.random()-0.5)*spread*2,
        color,
        size: 2 + Math.random()*3,
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
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(sc.x - p.size/2, sc.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
};

// ─── PLAYER ─────────────────────────────────────────────────
class Player {
  constructor(x, y) {
    this.reset(x, y);
  }

  reset(x, y) {
    this.x = x; this.y = y;
    this.w = 24; this.h = 32;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.jumps = 0;
    this.maxJumps = 2;
    this.facing = 1; // 1=right, -1=left
    this.attacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.iframes = 0; // invincibility frames after hit
    this.dead = false;
    this.walkAnim = 0;
    this.checkpointX = x;
    this.checkpointY = y;
    this.dodging = false; // dodge state
    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;
    this.lavaTime = 0;
    this.hp = 100; // health points
    this.maxHp = 100;
  }

  respawn() {
    this.x = this.checkpointX;
    this.y = this.checkpointY;
    this.vx = 0; this.vy = 0;
    this.dead = false;
    this.iframes = 120;
    this.hp = this.maxHp; // restore HP on respawn
    this.lavaTime = 0;
    Camera.x = Math.max(0, this.x - canvas.width/2);
    Camera.y = Math.max(0, this.y - canvas.height/2);
  }

  update(map, objects, dt=1) {
    if (this.dead) return;

    const speed = 3.5;
    const jumpPow = -11;

    // Horizontal movement
    let moving = false;
    if (G.keys['ArrowLeft'] || G.keys['KeyA']) {
      this.vx = -speed; this.facing = -1; moving = true;
    } else if (G.keys['ArrowRight'] || G.keys['KeyD']) {
      this.vx = speed; this.facing = 1; moving = true;
    } else {
      this.vx *= 0.75;
    }

    // Jump
    const jumpKey = G.justPressed['ArrowUp'] || G.justPressed['KeyW'] || G.justPressed['Space'];
    if (jumpKey) {
      if (this.onGround) {
        this.vy = jumpPow; this.jumps = 1;
        Particles.emit(this.x + this.w/2, this.y + this.h, 4, PAL.groundTop, 0, -1, 2, 15);
      } else if (this.jumps < this.maxJumps) {
        this.vy = jumpPow * 0.85; this.jumps++;
        Particles.emit(this.x + this.w/2, this.y + this.h/2, 6, PAL.punchGlow, 0, 0, 3, 20);
      }
    }

    // Attack
    if ((G.justPressed['KeyJ'] || G.justPressed['KeyZ'] || G.mouseClicked) && this.attackCooldown <= 0) {
      this.attacking = true;
      this.attackTimer = 18;
      this.attackCooldown = 24;
      G.mouseClicked = false; // reset mouse click
    }
    if (this.attackTimer > 0) this.attackTimer--;
    else this.attacking = false;
    if (this.attackCooldown > 0) this.attackCooldown--;

    // Dodge with Shift key
    if (G.justPressed['ShiftLeft'] || G.justPressed['ShiftRight']) {
      if (this.dodgeCooldown <= 0) {
        this.dodging = true;
        this.dodgeTimer = 20;
        this.dodgeCooldown = 50; // cooldown before next dodge
        this.iframes = 25; // invulnerability during dodge
        Particles.emit(this.x + this.w/2, this.y + this.h/2, 8, PAL.punchGlow, 0, 0, 2, 15);
      }
    }

    // Dodge movement
    if (this.dodging && this.dodgeTimer > 0) {
      this.vx = this.facing * 8; // fast dash in facing direction
      this.dodgeTimer--;
    } else {
      this.dodging = false;
    }

    if (this.dodgeCooldown > 0) this.dodgeCooldown--;

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 20) this.vy = 20;

    // Move & collide
    this._moveX(map);
    this._moveY(map);

    // Walk animation
    if (moving && this.onGround) this.walkAnim += 0.3;

    // Iframes
    if (this.iframes > 0) this.iframes--;

    // Check pits / lava
    const col = Math.floor((this.x + this.w/2) / TILE);
    const rowFoot = Math.floor((this.y + this.h - 1) / TILE);
    const inPit = map.isPit(col, rowFoot) || this.y > map.pixelHeight() + 64;
    const inLava = map.isLava(col, rowFoot);

    if (inPit) {
      this.takeDamage('pit');
      return;
    }

    if (inLava) {
      if (G.currentLevel === 2) {
        this.lavaTime += dt;
        if (this.lavaTime >= 60) {
          this.takeDamage('lava');
          this.lavaTime -= 60;
        }
      } else {
        this.takeDamage('lava');
      }
    } else {
      this.lavaTime = 0;
    }
  }

  _moveX(map) {
    this.x += this.vx;
    const left  = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top   = Math.floor(this.y / TILE);
    const bot   = Math.floor((this.y + this.h - 1) / TILE);

    if (this.vx > 0) {
      if (map.isSolid(right, top) || map.isSolid(right, bot)) {
        this.x = right * TILE - this.w;
        this.vx = 0;
      }
    } else if (this.vx < 0) {
      if (map.isSolid(left, top) || map.isSolid(left, bot)) {
        this.x = (left + 1) * TILE;
        this.vx = 0;
      }
    }
  }

  _moveY(map) {
    this.y += this.vy;
    const left  = Math.floor((this.x + 2) / TILE);
    const right = Math.floor((this.x + this.w - 3) / TILE);
    const top   = Math.floor(this.y / TILE);
    const bot   = Math.floor((this.y + this.h) / TILE);

    this.onGround = false;
    if (this.vy >= 0) {
      if (map.isSolid(left, bot) || map.isSolid(right, bot)) {
        this.y = bot * TILE - this.h;
        this.vy = 0;
        this.onGround = true;
        this.jumps = 0;
      }
    } else {
      if (map.isSolid(left, top) || map.isSolid(right, top)) {
        this.y = (top + 1) * TILE;
        this.vy = 0;
      }
    }
  }

  takeDamage(source) {
    if (this.iframes > 0 || this.dead) return;
    this.hp -= 25; // boss hits reduce 25 HP
    this.iframes = 90;
    flashDamage();
    Particles.emit(this.x + this.w/2, this.y + this.h/2, 10, PAL.col_red || '#e84040', 0, -2, 4, 25);
    updateHUD();
    if (this.hp <= 0) {
      this.hp = 0;
      G.lives--;
      updateHUD();
      if (G.lives <= 0) {
        this.dead = true;
        setTimeout(() => showScreen('gameover'), 800);
      } else {
        this.dead = true;
        setTimeout(() => this.respawn(), 600);
      }
    }
  }

  die(reason) {
    if (this.dead) return;
    this.dead = true;
    Particles.emit(this.x + this.w/2, this.y + this.h/2, 14, '#e84040', 0, -3, 5, 35);
    flashDamage();
    G.lives--;
    this.hp = 0;
    updateHUD();
    if (G.lives <= 0) {
      setTimeout(() => showScreen('gameover'), 900);
    } else {
      setTimeout(() => this.respawn(), 700);
    }
  }

  get attackBox() {
    if (!this.attacking) return null;
    // Punch hitbox: shorter + a bit higher than sword
    const ax = this.facing === 1 ? this.x + this.w : this.x - 20;
    return { x: ax, y: this.y + 10, w: 20, h: 16 };
  }

  draw() {
    if (this.dead) return;
    const sc = Camera.toScreen(this.x, this.y);
    const blink = this.iframes > 0 && Math.floor(this.iframes / 5) % 2 === 0;
    if (blink && !this.dodging) return; // show player while dodging

    const cx = sc.x;
    const cy = sc.y;
    const f  = this.facing;

    // Dodging effect - glow
    if (this.dodging && this.dodgeTimer > 0) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = PAL.punchGlow;
      ctx.fillRect(cx - 2, cy - 2, this.w + 4, this.h + 4);
      ctx.globalAlpha = 1;
    }

    // Shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.fillRect(cx + 2, cy + this.h - 2, this.w - 4, 4);
    ctx.globalAlpha = 1;

    // Legs animation
    const legOff = Math.sin(this.walkAnim) * 4;
    ctx.fillStyle = PAL.playerDark;
    if (this.onGround) {
      ctx.fillRect(cx + 4,  cy + 22, 7, 10 + legOff);
      ctx.fillRect(cx + 13, cy + 22, 7, 10 - legOff);
    } else {
      ctx.fillRect(cx + 4,  cy + 22, 7, 10);
      ctx.fillRect(cx + 13, cy + 22, 7, 10);
    }

    // Body
    ctx.fillStyle = PAL.playerBody;
    ctx.fillRect(cx + 2, cy + 8, 20, 16);

    // Cape
    ctx.fillStyle = '#2a2a6a';
    const capeX = f === 1 ? cx : cx + 4;
    ctx.fillRect(capeX, cy + 8, 6, 14);

    // Head
    ctx.fillStyle = PAL.playerFace;
    ctx.fillRect(cx + 5, cy, 14, 12);

    // Eyes
    ctx.fillStyle = '#1a1a3e';
    const eyeX = f === 1 ? cx + 14 : cx + 5;
    ctx.fillRect(eyeX, cy + 3, 3, 3);

    // Hair
    ctx.fillStyle = '#3a2a0a';
    ctx.fillRect(cx + 5, cy, 14, 4);

    // Punch (replace sword)
    if (this.attacking) {
      // Simple punch animation: extend then retract
      const prog = 1 - (this.attackTimer / 18); // 0..1
      const ext  = prog < 0.5 ? prog * 18 : (1 - prog) * 18; // 0..9..0
      const fx   = f === 1 ? (cx + this.w + ext) : (cx - 10 - ext);
      const fy   = cy + 12;

      // Arm
      ctx.fillStyle = PAL.playerDark;
      const armX = f === 1 ? (cx + 18) : (cx - 6);
      ctx.fillRect(armX, cy + 14, 10, 4);

      // Fist
      ctx.fillStyle = PAL.punch;
      ctx.fillRect(fx, fy, 10, 10);
      ctx.strokeStyle = PAL.punchGlow;
      ctx.lineWidth = 2;
      ctx.strokeRect(fx, fy, 10, 10);
      ctx.lineWidth = 1;

      // Punch particles
      if (this.attackTimer % 3 === 0) {
        Particles.emit(
          this.x + (f === 1 ? this.w + 10 : -10),
          this.y + 16, 2, PAL.punchGlow, f * 3, -1, 2, 12
        );
      }
    } else {
      // Idle glove hint (small)
      ctx.fillStyle = PAL.punch;
      const hx = f === 1 ? cx + 18 : cx - 4;
      ctx.fillRect(hx, cy + 14, 6, 6);
    }
  }
}

// ─── BOSS DEFINITIONS ───────────────────────────────────────
const BOSS_DEFS = [
  {
    // Boss 0: Shadow Knight (Level 1) — charges + sword slashes
    name: 'Shadow Knight',
    w: 48, h: 56,
    color: PAL.boss1, dark: PAL.boss1Dark, eye: PAL.boss1Eye,
    swordColor: '#a0a0ff',
    phases: [
      { hpPct: 1.0,  speed: 1.8, attackRate: 90,  swordRange: 52, chargeRate: 0   },
      { hpPct: 0.5,  speed: 2.8, attackRate: 60,  swordRange: 60, chargeRate: 240 },
      { hpPct: 0.25, speed: 3.8, attackRate: 40,  swordRange: 68, chargeRate: 120 },
    ],
  },
  {
    // Boss 1: Phantom Warlord (Level 2) — teleports + sword rain
    name: 'Phantom Warlord',
    w: 52, h: 60,
    color: PAL.boss2, dark: PAL.boss2Dark, eye: PAL.boss2Eye,
    swordColor: '#ff44ff',
    phases: [
      { hpPct: 1.0,  speed: 2,   attackRate: 80,  swordRange: 56, teleRate: 0    },
      { hpPct: 0.6,  speed: 2.5, attackRate: 60,  swordRange: 64, teleRate: 300  },
      { hpPct: 0.3,  speed: 3.5, attackRate: 40,  swordRange: 72, teleRate: 150  },
    ],
  },
  {
    // Boss 2: Inferno Reaper (Level 3) — jumps + lava swords
    name: 'Inferno Reaper',
    w: 56, h: 64,
    color: PAL.boss3, dark: PAL.boss3Dark, eye: PAL.boss3Eye,
    swordColor: '#ff6600',
    phases: [
      { hpPct: 1.0,  speed: 2.2, attackRate: 70,  swordRange: 60, jumpRate: 0    },
      { hpPct: 0.55, speed: 3,   attackRate: 50,  swordRange: 70, jumpRate: 240  },
      { hpPct: 0.25, speed: 4,   attackRate: 30,  swordRange: 80, jumpRate: 120  },
    ],
  }
];

// ─── BOSS CLASS ─────────────────────────────────────────────
class Boss {
  constructor(def, level) {
    this.bdef = def;
    this.level = level;
    const bd = LEVELS[level].boss;
    this.x = bd.x * TILE;
    this.y = bd.y * TILE - def.h;
    this.w = def.w;
    this.h = def.h;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.hp = bd.hp;
    this.maxHp = bd.hp;
    this.phase = 0;
    this.facing = -1;
    this.attackTimer = 0;
    this.chargeTimer = 0;
    this.chargeDir = 0;
    this.isCharging = false;
    this.swordAttacks = [];
    this.walkAnim = 0;
    this.alive = true;
    this.iframes = 0;
    this.active = false;
    this.deathAnim = 0;
  }

  get phaseData() {
    const ph = this.bdef.phases;
    if (this.hp / this.maxHp <= ph[2].hpPct && ph.length > 2) return ph[2];
    if (this.hp / this.maxHp <= ph[1].hpPct && ph.length > 1) return ph[1];
    return ph[0];
  }

  activate() { this.active = true; showBossBar(this.bdef.name, this.hp, this.maxHp); }

  update(map, player) {
    if (!this.alive || !this.active) return;

    if (this.deathAnim > 0) {
      this.deathAnim--;
      if (this.deathAnim === 0) {
        this.alive = false;
        currentLevel.bossDefeated = true;
        hideBossBar();
        Particles.emit(this.x + this.w/2, this.y + this.h/2, 30, PAL.gold, 0, -3, 8, 50);
        setTimeout(() => showScreen('levelclear'), 1200);
      }
      return;
    }

    const pd = this.phaseData;
    const speed = pd.speed;

    // Update phase
    const newPhase = this.hp/this.maxHp <= this.bdef.phases[2]?.hpPct ? 2 :
                     this.hp/this.maxHp <= this.bdef.phases[1]?.hpPct ? 1 : 0;
    if (newPhase > this.phase) {
      this.phase = newPhase;
      Particles.emit(this.x + this.w/2, this.y + this.h/2, 20, this.bdef.eye, 0, -4, 6, 40);
    }

    // AI movement — chase player
    const px = player.x + player.w / 2;
    const bx = this.x + this.w / 2;
    const dx = px - bx;

    if (!this.isCharging) {
      if (dx > 4)      { this.vx = speed;  this.facing = 1; }
      else if (dx < -4){ this.vx = -speed; this.facing = -1; }
      else             { this.vx *= 0.85; }
    } else {
      this.vx = this.chargeDir * speed * 3.5;
      this.chargeTimer--;
      if (this.chargeTimer <= 0) this.isCharging = false;
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 18) this.vy = 18;

    // Move & collide
    this._moveX(map); this._moveY(map);

    // Jump (for lava boss)
    if (this.bdef.phases[this.phase]?.jumpRate > 0) {
      if (this.onGround && Math.random() < 1/this.bdef.phases[this.phase].jumpRate) {
        this.vy = -12;
      }
    }

    // Charge
    if (pd.chargeRate > 0 && Math.random() < 1/pd.chargeRate) {
      this.isCharging = true;
      this.chargeDir = Math.sign(dx) || 1;
      this.chargeTimer = 30;
    }

    // Teleport (phantom)
    if (pd.teleRate > 0 && Math.random() < 1/pd.teleRate) {
      this.x = player.x + (Math.random() > 0.5 ? 100 : -this.w - 100);
      Particles.emit(this.x + this.w/2, this.y + this.h/2, 15, this.bdef.eye, 0, -2, 5, 30);
    }

    // Attack
    if (this.attackTimer > 0) this.attackTimer--;
    else {
      this.attackTimer = pd.attackRate;
      this._doAttack(player, pd);
    }

    // Update sword attacks
    this.swordAttacks = this.swordAttacks.filter(s => {
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.3;
      s.life--;
      // Hit player
      if (s.life > 0 && rectsOverlap(s, player) && player.iframes <= 0) {
        player.takeDamage('sword');
      }
      return s.life > 0;
    });

    // Walk anim
    if (Math.abs(this.vx) > 0.5) this.walkAnim += 0.25;

    // Iframes
    if (this.iframes > 0) this.iframes--;

    // Check player melee hit
    const ab = player.attackBox;
    if (ab && player.attacking && this.iframes <= 0 && rectsOverlap(ab, this)) {
      this.hp -= 10;
      this.iframes = 20;
      G.score += 50;
      updateHUD();
      Particles.emit(this.x + this.w/2, this.y + 10, 6, PAL.gold, 0, -2, 3, 20);
      updateBossBar(this.hp, this.maxHp);
      if (this.hp <= 0) {
        this.hp = 0;
        this.deathAnim = 60;
        G.score += 500;
        updateHUD();
      }
    }
  }

  _doAttack(player, pd) {
    const cx = this.x + this.w/2;
    const cy = this.y + this.h/2;
    // Shoot sword projectiles toward player
    const ang = Math.atan2(player.y - cy, player.x - cx);
    const speed = 5;
    this.swordAttacks.push({
      x: cx - 8, y: cy - 4, w: 20, h: 8,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      life: 120, color: this.bdef.swordColor, angle: ang
    });
    if (this.phase >= 1) {
      // Extra angled shots
      [-0.4, 0.4].forEach(offset => {
        this.swordAttacks.push({
          x: cx - 8, y: cy - 4, w: 18, h: 7,
          vx: Math.cos(ang+offset)*speed, vy: Math.sin(ang+offset)*speed,
          life: 100, color: this.bdef.swordColor, angle: ang+offset
        });
      });
    }
    if (this.phase >= 2) {
      // Even more shots
      [-0.8, 0.8].forEach(offset => {
        this.swordAttacks.push({
          x: cx - 8, y: cy - 4, w: 16, h: 6,
          vx: Math.cos(ang+offset)*speed*0.8, vy: Math.sin(ang+offset)*speed*0.8,
          life: 80, color: this.bdef.swordColor, angle: ang+offset
        });
      });
    }
  }

  _moveX(map) {
    // Avoid walking into pits on all stages
    if (this.onGround && this.vx !== 0) {
      const nextX = this.x + this.vx;
      const probeCol = this.vx > 0
        ? Math.floor((nextX + this.w) / TILE)
        : Math.floor((nextX - 1) / TILE);
      const probeRow = Math.floor((this.y + this.h + 1) / TILE);
      if (!map.isSolid(probeCol, probeRow) && map.isPit(probeCol, probeRow)) {
        this.vx = 0;
        this.facing = this.vx > 0 ? -1 : 1;
        return;
      }
    }

    this.x += this.vx;
    const left  = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top   = Math.floor(this.y / TILE);
    const bot   = Math.floor((this.y + this.h - 1) / TILE);
    if (this.vx > 0 && (map.isSolid(right, top) || map.isSolid(right, bot))) {
      this.x = right * TILE - this.w; this.vx = -this.vx * 0.5;
    }
    if (this.vx < 0 && (map.isSolid(left, top) || map.isSolid(left, bot))) {
      this.x = (left + 1) * TILE; this.vx = -this.vx * 0.5;
    }
  }

  _moveY(map) {
    this.y += this.vy;
    const left  = Math.floor((this.x + 2) / TILE);
    const right = Math.floor((this.x + this.w - 3) / TILE);
    const top   = Math.floor(this.y / TILE);
    const bot   = Math.floor((this.y + this.h) / TILE);
    this.onGround = false;
    if (this.vy >= 0 && (map.isSolid(left, bot) || map.isSolid(right, bot))) {
      this.y = bot * TILE - this.h; this.vy = 0; this.onGround = true;
    }
    if (this.vy < 0 && (map.isSolid(left, top) || map.isSolid(right, top))) {
      this.y = (top + 1) * TILE; this.vy = 0;
    }
  }

  draw() {
    if (!this.alive && this.deathAnim === 0) return;
    const sc = Camera.toScreen(this.x, this.y);
    const blink = this.iframes > 0 && Math.floor(this.iframes / 3) % 2 === 0;

    if (this.deathAnim > 0) {
      // Death explosion
      ctx.globalAlpha = this.deathAnim / 60;
      ctx.fillStyle = this.bdef.eye;
      const s = (60 - this.deathAnim) * 2;
      ctx.fillRect(sc.x + this.w/2 - s/2, sc.y + this.h/2 - s/2, s, s);
      ctx.globalAlpha = 1;
      if (G.tick % 4 === 0)
        Particles.emit(this.x + Math.random()*this.w, this.y + Math.random()*this.h,
          3, this.bdef.eye, 0, -2, 4, 20);
      return;
    }

    if (blink) return;

    const f = this.facing;
    const cx = sc.x;
    const cy = sc.y;
    const W  = this.w;
    const H  = this.h;

    // Shadow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.fillRect(cx + 4, cy + H - 3, W - 8, 5);
    ctx.globalAlpha = 1;

    // Legs
    const legOff = Math.sin(this.walkAnim) * 5;
    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6,  cy + H*0.65, 12, H*0.35 + legOff);
    ctx.fillRect(cx + W - 18, cy + H*0.65, 12, H*0.35 - legOff);

    // Body
    ctx.fillStyle = this.bdef.color;
    ctx.fillRect(cx + 4, cy + H*0.3, W - 8, H*0.4);

    // Armor overlay
    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6,  cy + H*0.3,  6,  H*0.4);
    ctx.fillRect(cx + W - 12, cy + H*0.3, 6, H*0.4);

    // Head
    ctx.fillStyle = this.bdef.color;
    ctx.fillRect(cx + 8, cy + 2, W - 16, H*0.28);

    // Helmet
    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6, cy, W - 12, 10);
    ctx.fillRect(cx + 6, cy, 4, H*0.28);
    ctx.fillRect(cx + W - 10, cy, 4, H*0.28);

    // Eyes
    ctx.fillStyle = this.bdef.eye;
    const eyeX = f === 1 ? cx + W - 16 : cx + 10;
    ctx.fillRect(eyeX, cy + 10, 5, 5);
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.bdef.eye;
    ctx.fillRect(eyeX, cy + 10, 5, 5);
    ctx.shadowBlur = 0;

    // Sword (held)
    ctx.fillStyle = this.bdef.swordColor;
    const sx = f === 1 ? cx + W : cx - 32;
    ctx.fillRect(sx, cy + H*0.3, 32, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(f === 1 ? cx + W + 26 : cx - 32, cy + H*0.3 - 2, 8, 10);

    // Phase aura
    if (this.phase >= 1) {
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(G.tick * 0.1);
      ctx.fillStyle = this.bdef.eye;
      ctx.fillRect(cx - 4, cy - 4, W + 8, H + 8);
      ctx.globalAlpha = 1;
    }

    // Draw sword projectiles
    this.swordAttacks.forEach(s => {
      const ss = Camera.toScreen(s.x, s.y);
      ctx.save();
      ctx.translate(ss.x + s.w/2, ss.y + s.h/2);
      ctx.rotate(s.angle);
      ctx.fillStyle = this.bdef.swordColor;
      ctx.fillRect(-s.w/2, -s.h/2, s.w, s.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-s.w/2 + s.w*0.7, -s.h/2 - 2, s.w*0.3 + 4, s.h + 4);
      ctx.restore();
      // glow trail
      if (s.life % 2 === 0)
        Particles.emit(s.x + s.w/2, s.y + s.h/2, 1, this.bdef.swordColor, -s.vx*0.2, -s.vy*0.2, 1, 8);
    });
  }
}

// ─── OBJECT CLASSES ──────────────────────────────────────────

class Coin {
  constructor(x, y) {
    this.x = x * TILE + 8; this.y = y * TILE + 8;
    this.w = 16; this.h = 16;
    this.collected = false;
    this.anim = 0;
  }
  update(player) {
    if (this.collected) return;
    this.anim++;
    if (rectsOverlap(this, player)) {
      this.collected = true;
      G.coins++;
      G.score += 30;
      updateHUD();
      Particles.emit(this.x + 8, this.y + 8, 6, PAL.gold, 0, -2, 2, 20);
    }
  }
  draw() {
    if (this.collected) return;
    const sc = Camera.toScreen(this.x, this.y);
    const bob = Math.sin(this.anim * 0.05) * 3;
    ctx.fillStyle = PAL.coinC;
    ctx.fillRect(sc.x + 4, sc.y + bob, 8, 8);
    ctx.fillStyle = PAL.coinH;
    ctx.fillRect(sc.x + 5, sc.y + bob + 1, 4, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sc.x + 5, sc.y + bob + 1, 2, 2);
    // Glow
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(this.anim * 0.08);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(sc.x + 2, sc.y + bob - 2, 12, 12);
    ctx.globalAlpha = 1;
  }
}

class Spike {
  constructor(x, y, hanging) {
    this.x = x * TILE;
    if (hanging) {
      this.y = y * TILE;
      this.w = TILE;
      this.h = 16;
    } else {
      this.y = y * TILE - 24;
      this.w = TILE;
      this.h = 24;
    }
    this.hanging = hanging;
  }
  update(player) {
    // Hitbox slightly inset
    const hb = { x: this.x + 2, y: this.y + (this.hanging ? 0 : 2), w: this.w - 4, h: this.h - 4 };
    if (rectsOverlap(hb, player)) player.takeDamage('spike');
  }
  draw() {
    const sc = Camera.toScreen(this.x, this.y);
    const count = 3;
    const tw = this.w / count;
    ctx.fillStyle = PAL.spikeBase;
    ctx.fillRect(sc.x, sc.y + (this.hanging ? 0 : 10), this.w, 6);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = PAL.spike;
      const px = sc.x + i * tw + tw / 2;
      if (this.hanging) {
        ctx.beginPath();
        ctx.moveTo(px, sc.y + 16);
        ctx.lineTo(px - tw/2 + 2, sc.y);
        ctx.lineTo(px + tw/2 - 2, sc.y);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(px, sc.y);
        ctx.lineTo(px - tw/2 + 2, sc.y + 16);
        ctx.lineTo(px + tw/2 - 2, sc.y + 16);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      if (!this.hanging) ctx.fillRect(px - 1, sc.y + 2, 2, 4);
      else               ctx.fillRect(px - 1, sc.y + 10, 2, 4);
    }
  }
}

class FallingSpike {
  constructor(x, y, period) {
    this.startX = x * TILE;
    this.startY = y * TILE;
    this.x = this.startX;
    this.y = this.startY;
    this.w = TILE - 4;
    this.h = 20;
    this.vy = 0;
    this.falling = false;
    this.period = period;
    this.timer = Math.floor(Math.random() * period);
    this.landed = false;
    this.landTimer = 0;
  }
  update(player, map) {
    if (!this.falling) {
      this.timer++;
      if (this.timer >= this.period) {
        this.falling = true;
        this.timer = 0;
        this.y = this.startY;
        this.vy = 0;
        this.landed = false;
      }
    } else {
      this.vy += 0.8;
      this.y += this.vy;
      const col = Math.floor((this.x + this.w/2) / TILE);
      const row = Math.floor((this.y + this.h) / TILE);
      if (map.isSolid(col, row)) {
        this.landed = true;
        this.falling = false;
        this.landTimer = 60;
        Particles.emit(this.x + this.w/2, this.y + this.h, 5, PAL.spike, 0, -2, 3, 15);
      }
      // Hit player during fall
      if (rectsOverlap(this, player) && player.iframes <= 0) player.takeDamage('spike');
    }
    if (this.landed) {
      // Linger on ground, still dangerous
      const hb = { x: this.x, y: this.y, w: this.w, h: this.h };
      if (rectsOverlap(hb, player)) player.takeDamage('spike');
      this.landTimer--;
      if (this.landTimer <= 0) {
        this.landed = false;
        this.x = this.startX;
        this.y = this.startY;
        this.vy = 0;
      }
    }
  }
  draw() {
    if (!this.falling && !this.landed) {
      // Draw shadow/warning at ceiling
      const sc = Camera.toScreen(this.startX + 2, this.startY);
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(G.tick * 0.1);
      ctx.fillStyle = PAL.col_red || '#e84040';
      ctx.fillRect(sc.x + 4, sc.y, this.w - 8, 6);
      ctx.globalAlpha = 1;
      return;
    }
    const sc = Camera.toScreen(this.x + 2, this.y);
    ctx.fillStyle = PAL.spike;
    ctx.fillRect(sc.x, sc.y, this.w, this.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sc.x + this.w/2 - 2, sc.y + 2, 4, 8);
  }
}

class Saw {
  constructor(x, y, range, speed, axis) {
    this.x = x * TILE;
    this.y = y * TILE - 8;
    this.startX = this.x; this.startY = this.y;
    this.w = 24; this.h = 24;
    this.range = range * TILE;
    this.speed = speed;
    this.axis = axis;
    this.dir = 1;
    this.dist = 0;
    this.rot = 0;
  }
  update(player) {
    const move = this.speed * this.dir;
    if (this.axis === 'x') {
      this.x += move;
      this.dist += Math.abs(move);
      if (this.dist >= this.range) { this.dir *= -1; this.dist = 0; }
    } else {
      this.y += move;
      this.dist += Math.abs(move);
      if (this.dist >= this.range) { this.dir *= -1; this.dist = 0; }
    }
    this.rot += 0.15 * this.speed;
    const hb = { x: this.x + 3, y: this.y + 3, w: this.w - 6, h: this.h - 6 };
    if (rectsOverlap(hb, player)) player.takeDamage('saw');
  }
  draw() {
    const sc = Camera.toScreen(this.x, this.y);
    const cx = sc.x + this.w/2;
    const cy = sc.y + this.h/2;
    const r  = this.w / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rot);

    // Blade
    ctx.fillStyle = PAL.saw;
    ctx.beginPath();
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2;
      const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a3 = ((i + 1) / teeth) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(a1) * r, Math.sin(a1) * r);
      ctx.lineTo(Math.cos(a2) * (r + 6), Math.sin(a2) * (r + 6));
      ctx.lineTo(Math.cos(a3) * r, Math.sin(a3) * r);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PAL.sawEdge;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Chain (draw vertical to wall for axis y, horizontal for axis x)
    ctx.strokeStyle = PAL.chain;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (this.axis === 'y') {
      ctx.moveTo(sc.x + this.w/2, sc.y);
      ctx.lineTo(sc.x + this.w/2, sc.y - (this.y - this.startY));
    } else {
      ctx.moveTo(sc.x, sc.y + this.h/2);
      ctx.lineTo(sc.x - (this.x - this.startX), sc.y + this.h/2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

class MovingPlatform {
  constructor(x, y, range, speed) {
    this.x = x * TILE; this.y = y * TILE;
    this.startX = this.x;
    this.w = TILE * 3; this.h = TILE / 2;
    this.range = range * TILE;
    this.speed = speed;
    this.dir = 1;
    this.dist = 0;
  }
  update(player) {
    const move = this.speed * this.dir;
    this.x += move;
    this.dist += Math.abs(move);
    if (this.dist >= this.range) { this.dir *= -1; this.dist = 0; }

    // Carry player if standing on top
    const onTop =
      player.vy >= 0 &&
      player.x + player.w > this.x + 2 &&
      player.x < this.x + this.w - 2 &&
      player.y + player.h >= this.y &&
      player.y + player.h <= this.y + this.h + 4;

    if (onTop) {
      player.x += move;
      player.y = this.y - player.h;
      player.onGround = true;
      player.jumps = 0;
      player.vy = 0;
    }
  }
  draw() {
    const sc = Camera.toScreen(this.x, this.y);
    // Platform body
    ctx.fillStyle = PAL.platform;
    ctx.fillRect(sc.x, sc.y + 4, this.w, this.h - 4);
    ctx.fillStyle = PAL.platformTop;
    ctx.fillRect(sc.x, sc.y, this.w, 6);
    // Bolts
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(sc.x + 4,  sc.y + 2, 4, 4);
    ctx.fillRect(sc.x + this.w - 8, sc.y + 2, 4, 4);
  }
}

class Checkpoint {
  constructor(x, y) {
    this.x = x * TILE + 8; this.y = y * TILE - 24;
    this.w = 12; this.h = 32;
    this.activated = false;
    this.anim = 0;
  }
  update(player) {
    this.anim++;
    if (!this.activated && rectsOverlap(this, { x: player.x, y: player.y, w: player.w, h: player.h })) {
      this.activated = true;
      player.checkpointX = this.x - 2;
      player.checkpointY = this.y - 2;
      showCheckpointPopup();
      G.score += 100;
      updateHUD();
      Particles.emit(this.x + 6, this.y, 10, PAL.gold, 0, -3, 3, 30);
    }
  }
  draw() {
    const sc = Camera.toScreen(this.x, this.y);
    // Flag pole
    ctx.fillStyle = '#888';
    ctx.fillRect(sc.x + 5, sc.y, 2, 32);
    // Flag
    const wave = Math.sin(this.anim * 0.08) * 3;
    ctx.fillStyle = this.activated ? PAL.gold : '#888';
    ctx.beginPath();
    ctx.moveTo(sc.x + 7, sc.y + 2);
    ctx.lineTo(sc.x + 7 + 14, sc.y + 5 + wave);
    ctx.lineTo(sc.x + 7 + 14, sc.y + 14 + wave);
    ctx.lineTo(sc.x + 7, sc.y + 14);
    ctx.fill();
    // Glow when activated
    if (this.activated) {
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.anim * 0.1);
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(sc.x - 4, sc.y - 4, this.w + 22, this.h + 8);
      ctx.globalAlpha = 1;
    }
  }
}

class BossGate {
  constructor(x, y) {
    this.x = x * TILE; this.y = (y - 4) * TILE;
    this.w = TILE; this.h = TILE * 4;
    this.triggered = false;
  }
  update(player, boss) {
    if (!this.triggered && rectsOverlap(this, player)) {
      this.triggered = true;
      boss.activate();
    }
  }
  draw() {
    if (this.triggered) return;
    const sc = Camera.toScreen(this.x, this.y);
    // Warning gate
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(G.tick * 0.1);
    ctx.fillStyle = '#8a0000';
    ctx.fillRect(sc.x, sc.y, this.w, this.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff4444';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(sc.x + 2, sc.y + i * TILE + 2, this.w - 4, TILE - 4);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', sc.x + this.w/2, sc.y + this.h/2);
  }
}

class Portal {
  constructor(x, y) {
    this.x = x * TILE + 4; this.y = (y - 2) * TILE;
    this.w = 24; this.h = 64;
    this.anim = 0;
  }
  update(player, bossDefeated) {
    this.anim++;
    if (bossDefeated && rectsOverlap(this, player)) {
      return true; // Level complete!
    }
    return false;
  }
  draw(bossDefeated) {
    const sc = Camera.toScreen(this.x, this.y);
    const alpha = bossDefeated ? 1 : 0.3;
    ctx.globalAlpha = alpha;
    // Portal swirl
    for (let i = 0; i < 3; i++) {
      const sz = 24 - i * 6;
      const r = (this.anim * (0.05 + i * 0.02)) % (Math.PI * 2);
      ctx.fillStyle = i === 0 ? PAL.portal : (i === 1 ? PAL.portalGlow : '#fff');
      ctx.save();
      ctx.translate(sc.x + this.w/2, sc.y + this.h/2);
      ctx.rotate(r);
      ctx.fillRect(-sz/2, -this.h/2 + i * 6, sz, this.h - i * 12);
      ctx.restore();
    }
    if (bossDefeated) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.anim * 0.15);
      ctx.fillStyle = PAL.portalGlow;
      ctx.fillRect(sc.x - 8, sc.y - 8, this.w + 16, this.h + 16);
    }
    ctx.globalAlpha = 1;
    // Arrow prompt if active
    if (bossDefeated) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const bob = Math.sin(this.anim * 0.12) * 4;
      ctx.fillText('ENTER', sc.x + this.w/2, sc.y - 12 + bob);
    }
  }
}

// ─── CURRENT LEVEL STATE ─────────────────────────────────────
let currentLevel = {};
let player;

function initLevel(levelIdx) {
  G.currentLevel = levelIdx;
  const def = LEVELS[levelIdx];
  const map = new TileMap(def);

  // Resize canvas
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  Camera.init(map.pixelWidth(), map.pixelHeight());

  // Player
  const ps = def.playerStart;
  player = new Player(ps.x * TILE, ps.y * TILE - 32);

  // Objects
  const coins       = [];
  const spikes      = [];
  const hspikes     = [];
  const fspikes     = [];
  const saws        = [];
  const mplatforms  = [];
  const checkpoints = [];
  let   bossgate    = null;
  let   portal      = null;
  const boss        = new Boss(BOSS_DEFS[def.boss.id], levelIdx);

  def.objects.forEach(o => {
    switch(o.type) {
      case 'coin':         coins.push(new Coin(o.x, o.y)); break;
      case 'spike':        spikes.push(new Spike(o.x, o.y, false)); break;
      case 'hspike':       hspikes.push(new Spike(o.x, o.y, true)); break;
      case 'fallingspike': fspikes.push(new FallingSpike(o.x, o.y, o.period)); break;
      case 'saw':          saws.push(new Saw(o.x, o.y, o.range, o.speed, o.axis)); break;
      case 'mplatform':    mplatforms.push(new MovingPlatform(o.x, o.y, o.range, o.speed)); break;
      case 'checkpoint':   checkpoints.push(new Checkpoint(o.x, o.y)); break;
      case 'bossgate':     bossgate = new BossGate(o.x, o.y); break;
      case 'portal':       portal = new Portal(o.x, o.y); break;
    }
  });

  currentLevel = {
    def, map,
    coins, spikes, hspikes, fspikes, saws,
    mplatforms, checkpoints, bossgate, portal, boss,
    bossDefeated: false,
    elapsedMs: 0,
    coinTotal: coins.length,
    startLives: G.lives,
    bgStars: generateStars(100),
    bgClouds: generateClouds(12, map.pixelWidth()),
  };

  document.getElementById('hud-level-num').textContent = levelIdx + 1;
  hideBossBar();
  updateHUD();
}

// ─── BACKGROUND GENERATION ───────────────────────────────────
function generateStars(n) {
  const stars = [];
  for (let i = 0; i < n; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random() * 0.7,
      size: 1 + Math.floor(Math.random() * 2),
      twinkle: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function generateClouds(n, mapW) {
  const clouds = [];
  for (let i = 0; i < n; i++) {
    clouds.push({
      x: Math.random() * mapW,
      y: 50 + Math.random() * 150,
      w: 60 + Math.random() * 80,
      h: 20 + Math.random() * 20,
      speed: 0.1 + Math.random() * 0.15,
      parallax: 0.2 + Math.random() * 0.4,
    });
  }
  return clouds;
}

// ─── DRAW BACKGROUND ─────────────────────────────────────────
function drawBackground() {
  const def = currentLevel.def;
  const [bg1, bg2] = def.bgColor;
  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grd.addColorStop(0, bg2);
  grd.addColorStop(1, bg1);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars (parallax 0.1)
  currentLevel.bgStars.forEach(s => {
    const sx = s.x * canvas.width - Camera.x * 0.05;
    const sy = s.y * canvas.height;
    const alpha = 0.4 + 0.4 * Math.sin(s.twinkle + G.tick * 0.03);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PAL.star;
    ctx.fillRect(sx % canvas.width, sy, s.size, s.size);
  });
  ctx.globalAlpha = 1;

  // Clouds (parallax)
  currentLevel.bgClouds.forEach(c => {
    const cx = c.x - Camera.x * c.parallax;
    const cy = c.y - Camera.y * 0.05;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = PAL.cloud;
    ctx.fillRect(cx, cy, c.w, c.h);
    ctx.fillRect(cx + 12, cy - 8, c.w * 0.7, c.h);
    ctx.globalAlpha = 1;
  });
}

// ─── DRAW TILEMAP ─────────────────────────────────────────────
function drawTiles(map) {
  const startCol = Math.max(0, Math.floor(Camera.x / TILE));
  const endCol   = Math.min(map.cols - 1, Math.ceil((Camera.x + canvas.width) / TILE));
  const startRow = Math.max(0, Math.floor(Camera.y / TILE));
  const endRow   = Math.min(map.rowCount - 1, Math.ceil((Camera.y + canvas.height) / TILE));

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const t = map.get(c, r);
      const sx = c * TILE - Camera.x;
      const sy = r * TILE - Camera.y;

      if (t === '1') {
        // Grass ground
        ctx.fillStyle = PAL.ground;
        ctx.fillRect(sx, sy + 6, TILE, TILE - 6);
        ctx.fillStyle = PAL.groundTop;
        ctx.fillRect(sx, sy, TILE, 7);
        // Pixel detail
        ctx.fillStyle = PAL.groundDark;
        ctx.fillRect(sx + 2, sy + 8, 3, 3);
        ctx.fillRect(sx + 10, sy + 14, 4, 2);
        ctx.fillRect(sx + 22, sy + 10, 3, 3);
      } else if (t === '2') {
        // Platform
        ctx.fillStyle = PAL.platform;
        ctx.fillRect(sx, sy + 6, TILE, TILE - 6);
        ctx.fillStyle = PAL.platformTop;
        ctx.fillRect(sx, sy, TILE, 7);
      } else if (t === '3') {
        // Stone
        ctx.fillStyle = PAL.stone;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = PAL.stoneDark;
        ctx.fillRect(sx, sy, TILE, 2);
        ctx.fillRect(sx, sy, 2, TILE);
        ctx.fillStyle = PAL.stoneLight;
        ctx.fillRect(sx + 2, sy + 2, 6, 4);
        ctx.fillRect(sx + 18, sy + 16, 8, 4);
      } else if (t === '7') {
        // Lava
        const lavaOff = Math.sin(G.tick * 0.08 + c * 0.5) * 3;
        ctx.fillStyle = PAL.lava;
        ctx.fillRect(sx, sy + lavaOff, TILE, TILE);
        ctx.fillStyle = PAL.lavaGlow;
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(G.tick * 0.1 + c);
        ctx.fillRect(sx, sy + lavaOff, TILE, 8);
        ctx.globalAlpha = 1;
        // Lava glow on ceiling
        if (r > 0 && map.get(c, r-1) === '0') {
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = PAL.lavaGlow;
          ctx.fillRect(sx, sy - 12, TILE, 12);
          ctx.globalAlpha = 1;
        }
      } else if (t === '9') {
        // Pit (draw dark abyss)
        ctx.fillStyle = PAL.pit;
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    }
  }
}

// ─── GAME LOOP ───────────────────────────────────────────────
let lastTime = 0;
let animId;

function gameLoop(ts) {
  if (!G.running) return;
  animId = requestAnimationFrame(gameLoop);

  const dt = Math.min((ts - lastTime) / 16.67, 3);
  const frameMs = ts - lastTime;
  lastTime = ts;

  if (G.paused) {
    drawPaused();
    G.justPressed = {};
    return;
  }

  if (currentLevel) currentLevel.elapsedMs += frameMs;
  G.tick++;

  // Update
  updateGame(dt);
  updateHUD();

  // Draw
  drawBackground();
  drawTiles(currentLevel.map);
  drawObjects();
  Particles.draw();
  player.draw();
  currentLevel.boss.draw();
  drawHUDCanvas(player);

  G.justPressed = {};
}

function updateGame(dt) {
  const cl = currentLevel;

  // Moving platforms first (carry player)
  cl.mplatforms.forEach(mp => mp.update(player));

  // Player
  player.update(cl.map, cl, dt);

  // Camera follow
  Camera.follow(player.x + player.w / 2, player.y + player.h / 2);

  // Coins
  cl.coins.forEach(c => c.update(player));

  // Spikes
  if (!player.dead) {
    cl.spikes.forEach(s  => s.update(player));
    cl.hspikes.forEach(s => s.update(player));
    cl.fspikes.forEach(s => s.update(player, cl.map));
    cl.saws.forEach(s    => s.update(player));
  }

  // Checkpoints
  cl.checkpoints.forEach(cp => cp.update(player));

  // Boss gate
  if (cl.bossgate) cl.bossgate.update(player, cl.boss);

  // Boss
  if (!player.dead) cl.boss.update(cl.map, player);

  // Portal
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
  if (cl.portal) cl.portal.draw(cl.bossDefeated);
}

function drawPaused() {
  // Just keep screen dim during pause, overlay handled by CSS
}

function drawHUDCanvas(player) {
  // HP Bar at top left
  if (player && !player.dead) {
    const barWidth = 200;
    const barHeight = 12;
    const barX = 20;
    const barY = 20;
    const hpPercent = Math.max(0, player.hp / player.maxHp);
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Border
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // HP fill (gradient from green to red)
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    if (hpPercent > 0.5) {
      gradient.addColorStop(0, '#42e86c');
      gradient.addColorStop(1, '#f5c842');
    } else if (hpPercent > 0.25) {
      gradient.addColorStop(0, '#f5c842');
      gradient.addColorStop(1, '#e84040');
    } else {
      gradient.addColorStop(0, '#e84040');
      gradient.addColorStop(1, '#8a0000');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * hpPercent, barHeight - 2);
    
    // HP text
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(player.hp) + '/' + player.maxHp, barX + barWidth / 2, barY + barHeight - 1);
  }

  // Torch flicker at top corners
  drawTorch(20, 60);
  drawTorch(canvas.width - 30, 60);
}

function drawTorch(x, y) {
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(x - 4, y, 8, 16);
  const fh = 8 + Math.random() * 6;
  ctx.fillStyle = PAL.torch;
  ctx.fillRect(x - 3, y - fh, 6, fh);
  ctx.fillStyle = PAL.torchFlame;
  ctx.fillRect(x - 1, y - fh + 2, 3, fh - 4);
  ctx.globalAlpha = 0.08 + 0.06 * Math.sin(G.tick * 0.3);
  ctx.fillStyle = PAL.torch;
  ctx.fillRect(x - 30, y - 30, 60, 60);
  ctx.globalAlpha = 1;
}

// ─── HELPERS ────────────────────────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function flashDamage() {
  const el = document.getElementById('damage-flash');
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 120);
}

function showCheckpointPopup() {
  const el = document.getElementById('checkpoint-popup');
  el.classList.remove('hidden');
  clearTimeout(showCheckpointPopup._t);
  showCheckpointPopup._t = setTimeout(() => el.classList.add('hidden'), 2000);
}

function updateHUD() {
  document.getElementById('hud-score-num').textContent = G.score;
  document.getElementById('hud-coin-num').textContent  = G.coins;
  const livesEl = document.getElementById('hud-lives');
  livesEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const span = document.createElement('span');
    span.textContent = i < G.lives ? '❤' : '🖤';
    livesEl.appendChild(span);
  }
  const timeEl = document.getElementById('hud-time');
  if (timeEl) {
    const remainingMs = currentLevel ? Math.max(0, 90000 - currentLevel.elapsedMs) : 90000;
    const remainingSec = Math.floor(remainingMs / 1000);
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    timeEl.textContent = `Waktu: ${mins}:${secs.toString().padStart(2,'0')}`;
  }
}

function showBossBar(name, hp, max) {
  document.getElementById('hud-boss-bar').classList.remove('hidden');
  document.getElementById('boss-name-label').textContent = '⚔ ' + name;
  updateBossBar(hp, max);
}

function updateBossBar(hp, max) {
  document.getElementById('boss-bar-inner').style.width = Math.max(0, hp / max * 100) + '%';
}

function hideBossBar() {
  document.getElementById('hud-boss-bar').classList.add('hidden');
}

// ─── LEVEL TRANSITIONS ───────────────────────────────────────
function computeLevelStars() {
  if (!currentLevel || !player) return { timeStar: false, coinsStar: false, perfectStar: false, total: 0 };
  const timeStar = currentLevel.elapsedMs <= 90000;
  const coinsStar = currentLevel.coinTotal === 0 || currentLevel.coins.every(c => c.collected);
  const perfectStar = G.lives === 3;
  return {
    timeStar,
    coinsStar,
    perfectStar,
    total: [timeStar, coinsStar, perfectStar].filter(Boolean).length,
  };
}

function renderLevelClearStars() {
  const stars = computeLevelStars();
  const starRow = document.getElementById('lc-stars');
  const statusTime = document.getElementById('lc-cond-time');
  const statusCoins = document.getElementById('lc-cond-coins');
  const statusPerfect = document.getElementById('lc-cond-perfect');
  const starCount = document.getElementById('lc-star-count');

  if (starRow) {
    starRow.innerHTML = [stars.timeStar, stars.coinsStar, stars.perfectStar]
      .map(ok => ok ? '★' : '☆')
      .join('');
  }
  if (starCount) starCount.textContent = `${stars.total}/3`;
  if (statusTime) statusTime.textContent = `⏱ Waktu di bawah 1:30: ${stars.timeStar ? 'TERCAPAI' : 'GAGAL'}`;
  if (statusCoins) statusCoins.textContent = `🪙 Kumpulkan semua koin: ${stars.coinsStar ? 'TERCAPAI' : 'GAGAL'}`;
  if (statusPerfect) statusPerfect.textContent = `❤ Nyawa penuh tanpa mati: ${stars.perfectStar ? 'TERCAPAI' : 'GAGAL'}`;
}

function nextLevel() {
  if (G.currentLevel + 1 >= LEVELS.length) {
    // Victory!
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

// ─── SCREEN MANAGEMENT ───────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = '';
  });
  const map = {
    title: 'screen-title',
    howto: 'screen-howto',
    game:  'screen-game',
    gameover: 'screen-gameover',
    levelclear: 'screen-levelclear',
    victory: 'screen-victory',
  };
  const el = document.getElementById(map[name]);
  if (el) { el.classList.add('active'); el.style.display = 'flex'; }
  if (name === 'levelclear') renderLevelClearStars();
}

// ─── TITLE PARTICLES ─────────────────────────────────────────
function spawnTitleParticles() {
  const container = document.getElementById('title-particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.bottom = '-10px';
    p.style.animationDuration = (4 + Math.random() * 6) + 's';
    p.style.animationDelay    = (Math.random() * 8) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    p.style.background = Math.random() > 0.5 ? PAL.gold : PAL.purple;
    container.appendChild(p);
  }
}

// ─── INPUT ───────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (!G.keys[e.code]) G.justPressed[e.code] = true;
  G.keys[e.code] = true;
  if (e.code === 'Escape' && G.running) {
    G.paused = !G.paused;
    document.getElementById('pause-overlay').classList.toggle('hidden', !G.paused);
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => {
  G.keys[e.code] = false;
});

// Mouse click for attacking
document.addEventListener('click', () => {
  if (G.running && !G.paused) {
    G.mouseClicked = true;
  }
});

window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (currentLevel.map) Camera.init(currentLevel.map.pixelWidth(), currentLevel.map.pixelHeight());
});

// ─── UI BINDINGS ─────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', startGame);

document.getElementById('btn-how').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('title'));

document.getElementById('btn-resume').addEventListener('click', () => {
  G.paused = false;
  document.getElementById('pause-overlay').classList.add('hidden');
});
document.getElementById('btn-menu').addEventListener('click', () => {
  G.running = false;
  cancelAnimationFrame(animId);
  showScreen('title');
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
  startLevel(G.currentLevel + 1);
});

document.getElementById('btn-vic-menu').addEventListener('click', () => showScreen('title'));

document.getElementById('go-score').textContent = 0;

// ─── BOOT ────────────────────────────────────────────────────
spawnTitleParticles();
showScreen('title');
