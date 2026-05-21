/* ============================================================
   ASSETS — CHARACTER: BOSS + MINION
   10 boss unik (1 per stage) dengan difficulty berbeda
   Minion kecil muncul di stage 6–10
   ============================================================ */

'use strict';

// ─── BOSS DEFINITIONS (10 boss, 1 per stage) ────────────────
// speed      : kecepatan gerak boss
// attackRate : interval serangan (makin kecil = makin sering)
// chargeRate : interval charge (0 = tidak charge)
// teleRate   : interval teleport (0 = tidak teleport)
// jumpRate   : interval lompat (0 = tidak lompat)
// shotCount  : jumlah proyektil per serangan di phase terakhir
const BOSS_DEFS = [
  {
    // Stage 1 — Shadow Knight (EASY)
    name: 'Shadow Knight', w: 48, h: 56,
    color: PAL.boss1, dark: PAL.boss1Dark, eye: PAL.boss1Eye,
    swordColor: '#a0a0ff',
    phases: [
      { hpPct: 1.0,  speed: 1.6, attackRate: 100, chargeRate: 0,   teleRate: 0, jumpRate: 0, shotCount: 1 },
      { hpPct: 0.5,  speed: 2.4, attackRate: 70,  chargeRate: 280, teleRate: 0, jumpRate: 0, shotCount: 2 },
      { hpPct: 0.25, speed: 3.2, attackRate: 50,  chargeRate: 160, teleRate: 0, jumpRate: 0, shotCount: 3 },
    ],
  },
  {
    // Stage 2 — Phantom Warlord (EASY-MED)
    name: 'Phantom Warlord', w: 52, h: 60,
    color: PAL.boss2, dark: PAL.boss2Dark, eye: PAL.boss2Eye,
    swordColor: '#ff44ff',
    phases: [
      { hpPct: 1.0,  speed: 2.0, attackRate: 85,  chargeRate: 0,   teleRate: 0,   jumpRate: 0, shotCount: 1 },
      { hpPct: 0.6,  speed: 2.8, attackRate: 60,  chargeRate: 0,   teleRate: 320, jumpRate: 0, shotCount: 2 },
      { hpPct: 0.3,  speed: 3.6, attackRate: 40,  chargeRate: 200, teleRate: 180, jumpRate: 0, shotCount: 3 },
    ],
  },
  {
    // Stage 3 — Inferno Reaper (MEDIUM)
    name: 'Inferno Reaper', w: 56, h: 64,
    color: PAL.boss3, dark: PAL.boss3Dark, eye: PAL.boss3Eye,
    swordColor: '#ff6600',
    phases: [
      { hpPct: 1.0,  speed: 2.2, attackRate: 75,  chargeRate: 0,   teleRate: 0, jumpRate: 300, shotCount: 1 },
      { hpPct: 0.55, speed: 3.0, attackRate: 55,  chargeRate: 220, teleRate: 0, jumpRate: 200, shotCount: 3 },
      { hpPct: 0.25, speed: 4.0, attackRate: 35,  chargeRate: 130, teleRate: 0, jumpRate: 120, shotCount: 4 },
    ],
  },
  {
    // Stage 4 — Void Stalker (MEDIUM)
    name: 'Void Stalker', w: 52, h: 58,
    color: '#4a2a6a', dark: '#2a1a3a', eye: '#cc44ff',
    swordColor: '#cc44ff',
    phases: [
      { hpPct: 1.0,  speed: 2.4, attackRate: 72,  chargeRate: 260, teleRate: 0,   jumpRate: 0,   shotCount: 2 },
      { hpPct: 0.55, speed: 3.2, attackRate: 52,  chargeRate: 180, teleRate: 350, jumpRate: 0,   shotCount: 3 },
      { hpPct: 0.25, speed: 4.2, attackRate: 34,  chargeRate: 110, teleRate: 200, jumpRate: 0,   shotCount: 4 },
    ],
  },
  {
    // Stage 5 — Iron Colossus (MEDIUM-HARD)
    name: 'Iron Colossus', w: 60, h: 68,
    color: '#5a5a7a', dark: '#2a2a4a', eye: '#44ccff',
    swordColor: '#44ccff',
    phases: [
      { hpPct: 1.0,  speed: 2.0, attackRate: 68,  chargeRate: 200, teleRate: 0,   jumpRate: 280, shotCount: 2 },
      { hpPct: 0.55, speed: 3.0, attackRate: 48,  chargeRate: 140, teleRate: 0,   jumpRate: 180, shotCount: 3 },
      { hpPct: 0.25, speed: 4.2, attackRate: 30,  chargeRate: 90,  teleRate: 0,   jumpRate: 100, shotCount: 5 },
    ],
  },
  {
    // Stage 6 — Plague Wraith (HARD)
    name: 'Plague Wraith', w: 54, h: 62,
    color: '#2a6a2a', dark: '#1a3a1a', eye: '#44ff44',
    swordColor: '#44ff44',
    phases: [
      { hpPct: 1.0,  speed: 2.6, attackRate: 62,  chargeRate: 180, teleRate: 280, jumpRate: 0,   shotCount: 2 },
      { hpPct: 0.55, speed: 3.4, attackRate: 44,  chargeRate: 120, teleRate: 180, jumpRate: 0,   shotCount: 4 },
      { hpPct: 0.25, speed: 4.6, attackRate: 28,  chargeRate: 80,  teleRate: 120, jumpRate: 0,   shotCount: 5 },
    ],
  },
  {
    // Stage 7 — Storm Titan (HARD)
    name: 'Storm Titan', w: 58, h: 66,
    color: '#2a4a7a', dark: '#1a2a4a', eye: '#44aaff',
    swordColor: '#44aaff',
    phases: [
      { hpPct: 1.0,  speed: 2.8, attackRate: 58,  chargeRate: 160, teleRate: 0,   jumpRate: 240, shotCount: 3 },
      { hpPct: 0.5,  speed: 3.8, attackRate: 40,  chargeRate: 100, teleRate: 260, jumpRate: 160, shotCount: 4 },
      { hpPct: 0.25, speed: 5.0, attackRate: 26,  chargeRate: 70,  teleRate: 150, jumpRate: 100, shotCount: 6 },
    ],
  },
  {
    // Stage 8 — Chaos Demon (VERY HARD)
    name: 'Chaos Demon', w: 60, h: 68,
    color: '#7a1a1a', dark: '#4a0a0a', eye: '#ff2222',
    swordColor: '#ff4400',
    phases: [
      { hpPct: 1.0,  speed: 3.0, attackRate: 54,  chargeRate: 140, teleRate: 240, jumpRate: 200, shotCount: 3 },
      { hpPct: 0.5,  speed: 4.2, attackRate: 36,  chargeRate: 90,  teleRate: 160, jumpRate: 140, shotCount: 5 },
      { hpPct: 0.25, speed: 5.5, attackRate: 22,  chargeRate: 60,  teleRate: 100, jumpRate: 90,  shotCount: 7 },
    ],
  },
  {
    // Stage 9 — Abyssal Overlord (VERY HARD)
    name: 'Abyssal Overlord', w: 64, h: 72,
    color: '#1a1a5a', dark: '#0a0a2a', eye: '#8844ff',
    swordColor: '#8844ff',
    phases: [
      { hpPct: 1.0,  speed: 3.2, attackRate: 50,  chargeRate: 120, teleRate: 200, jumpRate: 180, shotCount: 4 },
      { hpPct: 0.5,  speed: 4.5, attackRate: 32,  chargeRate: 80,  teleRate: 130, jumpRate: 120, shotCount: 6 },
      { hpPct: 0.2,  speed: 6.0, attackRate: 18,  chargeRate: 50,  teleRate: 80,  jumpRate: 80,  shotCount: 8 },
    ],
  },
  {
    // Stage 10 — Eternal Destroyer (EXTREME)
    name: 'Eternal Destroyer', w: 68, h: 76,
    color: '#3a0a0a', dark: '#1a0000', eye: '#ff0000',
    swordColor: '#ff6600',
    phases: [
      { hpPct: 1.0,  speed: 3.6, attackRate: 44,  chargeRate: 100, teleRate: 160, jumpRate: 160, shotCount: 4 },
      { hpPct: 0.5,  speed: 5.0, attackRate: 26,  chargeRate: 65,  teleRate: 100, jumpRate: 100, shotCount: 6 },
      { hpPct: 0.2,  speed: 7.0, attackRate: 14,  chargeRate: 40,  teleRate: 60,  jumpRate: 60,  shotCount: 9 },
    ],
  },
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

  activate() {
    this.active = true;
    showBossBar(this.bdef.name, this.hp, this.maxHp);
  }

  update(map, player) {
    if (!this.alive) return;
    if (!this.active) {
      this.vy += GRAVITY;
      if (this.vy > 18) this.vy = 18;
      this._moveY(map);
      return;
    }
    if (this.deathAnim > 0) {
      this.deathAnim--;
      if (this.deathAnim === 0) {
        this.alive = false;
        currentLevel.bossDefeated = true;
        hideBossBar();
        Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 30, PAL.gold, 0, -3, 8, 50);
        setTimeout(() => showScreen('levelclear'), 1200);
      }
      return;
    }

    const pd = this.phaseData;
    const speed = pd.speed;

    const newPhase = this.hp / this.maxHp <= this.bdef.phases[2]?.hpPct ? 2 :
                     this.hp / this.maxHp <= this.bdef.phases[1]?.hpPct ? 1 : 0;
    if (newPhase > this.phase) {
      this.phase = newPhase;
      Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 20, this.bdef.eye, 0, -4, 6, 40);
    }

    const px = player.x + player.w / 2;
    const bx = this.x + this.w / 2;
    const dx = px - bx;

    if (!this.isCharging) {
      if (dx > 4)       { this.vx = speed;  this.facing = 1; }
      else if (dx < -4) { this.vx = -speed; this.facing = -1; }
      else              { this.vx *= 0.85; }
    } else {
      this.vx = this.chargeDir * speed * 3.5;
      this.chargeTimer--;
      if (this.chargeTimer <= 0) this.isCharging = false;
    }

    this.vy += GRAVITY;
    if (this.vy > 18) this.vy = 18;
    this._moveX(map);
    this._moveY(map);

    if (pd.jumpRate > 0 && this.onGround && Math.random() < 1 / pd.jumpRate) this.vy = -13;
    if (pd.chargeRate > 0 && Math.random() < 1 / pd.chargeRate) {
      this.isCharging = true;
      this.chargeDir = Math.sign(dx) || 1;
      this.chargeTimer = 30;
    }
    if (pd.teleRate > 0 && Math.random() < 1 / pd.teleRate) {
      this.x = player.x + (Math.random() > 0.5 ? 110 : -this.w - 110);
      Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 15, this.bdef.eye, 0, -2, 5, 30);
    }

    if (this.attackTimer > 0) this.attackTimer--;
    else { this.attackTimer = pd.attackRate; this._doAttack(player, pd); }

    this.swordAttacks = this.swordAttacks.filter(s => {
      s.x += s.vx; s.y += s.vy; s.vy += 0.3; s.life--;
      if (s.life > 0 && rectsOverlap(s, player) && player.iframes <= 0) player.takeDamage('sword');
      return s.life > 0;
    });

    if (Math.abs(this.vx) > 0.5) this.walkAnim += 0.25;
    if (this.iframes > 0) this.iframes--;

    const ab = player.attackBox;
    if (ab && player.attacking && this.iframes <= 0 && rectsOverlap(ab, this)) {
      this.hp -= 10; this.iframes = 20; G.score += 50; updateHUD();
      Particles.emit(this.x + this.w / 2, this.y + 10, 6, PAL.gold, 0, -2, 3, 20);
      updateBossBar(this.hp, this.maxHp);
      if (this.hp <= 0) { this.hp = 0; this.deathAnim = 60; G.score += 500; updateHUD(); }
    }
  }

  _doAttack(player, pd) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const ang = Math.atan2(player.y - cy, player.x - cx);
    const spd = 5 + this.phase * 0.8;
    const count = pd.shotCount || 1;
    const spread = Math.PI * 0.18;

    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      this.swordAttacks.push({
        x: cx - 8, y: cy - 4, w: 20 - i * 1, h: 8,
        vx: Math.cos(ang + offset) * spd,
        vy: Math.sin(ang + offset) * spd,
        life: 130, color: this.bdef.swordColor, angle: ang + offset
      });
    }
  }

  _moveX(map) {
    if (this.onGround && this.vx !== 0) {
      const nextX = this.x + this.vx;
      const probeCol = this.vx > 0 ? Math.floor((nextX + this.w) / TILE) : Math.floor((nextX - 1) / TILE);
      const probeRow = Math.floor((this.y + this.h + 1) / TILE);
      if (!map.isSolid(probeCol, probeRow) && map.isPit(probeCol, probeRow)) { this.vx = 0; return; }
    }
    this.x += this.vx;
    const left = Math.floor(this.x / TILE), right = Math.floor((this.x + this.w - 1) / TILE);
    const top  = Math.floor(this.y / TILE), bot   = Math.floor((this.y + this.h - 1) / TILE);
    if (this.vx > 0 && (map.isSolid(right, top) || map.isSolid(right, bot))) { this.x = right * TILE - this.w; this.vx *= -0.5; }
    if (this.vx < 0 && (map.isSolid(left,  top) || map.isSolid(left,  bot))) { this.x = (left + 1) * TILE;    this.vx *= -0.5; }
  }

  _moveY(map) {
    this.y += this.vy;
    const left = Math.floor((this.x + 2) / TILE), right = Math.floor((this.x + this.w - 3) / TILE);
    const top  = Math.floor(this.y / TILE),        bot   = Math.floor((this.y + this.h) / TILE);
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
      ctx.globalAlpha = this.deathAnim / 60;
      ctx.fillStyle = this.bdef.eye;
      const s = (60 - this.deathAnim) * 2;
      ctx.fillRect(sc.x + this.w / 2 - s / 2, sc.y + this.h / 2 - s / 2, s, s);
      ctx.globalAlpha = 1;
      if (G.tick % 4 === 0)
        Particles.emit(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 3, this.bdef.eye, 0, -2, 4, 20);
      return;
    }
    if (blink) return;

    const f = this.facing, cx = sc.x, cy = sc.y, W = this.w, H = this.h;
    const legOff = Math.sin(this.walkAnim) * 5;

    ctx.globalAlpha = 0.35; ctx.fillStyle = '#000';
    ctx.fillRect(cx + 4, cy + H - 3, W - 8, 5); ctx.globalAlpha = 1;

    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6,      cy + H * 0.65, 12, H * 0.35 + legOff);
    ctx.fillRect(cx + W - 18, cy + H * 0.65, 12, H * 0.35 - legOff);

    ctx.fillStyle = this.bdef.color;
    ctx.fillRect(cx + 4, cy + H * 0.3, W - 8, H * 0.4);
    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6,      cy + H * 0.3, 6, H * 0.4);
    ctx.fillRect(cx + W - 12, cy + H * 0.3, 6, H * 0.4);

    ctx.fillStyle = this.bdef.color;
    ctx.fillRect(cx + 8, cy + 2, W - 16, H * 0.28);
    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6, cy, W - 12, 10);
    ctx.fillRect(cx + 6, cy, 4, H * 0.28);
    ctx.fillRect(cx + W - 10, cy, 4, H * 0.28);

    ctx.fillStyle = this.bdef.eye;
    const eyeX = f === 1 ? cx + W - 16 : cx + 10;
    ctx.shadowBlur = 10; ctx.shadowColor = this.bdef.eye;
    ctx.fillRect(eyeX, cy + 10, 5, 5); ctx.shadowBlur = 0;

    ctx.fillStyle = this.bdef.swordColor;
    const sx = f === 1 ? cx + W : cx - 32;
    ctx.fillRect(sx, cy + H * 0.3, 32, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(f === 1 ? cx + W + 26 : cx - 32, cy + H * 0.3 - 2, 8, 10);

    if (this.phase >= 1) {
      ctx.globalAlpha = 0.22 + 0.1 * Math.sin(G.tick * 0.1);
      ctx.fillStyle = this.bdef.eye;
      ctx.fillRect(cx - 4, cy - 4, W + 8, H + 8);
      ctx.globalAlpha = 1;
    }

    this.swordAttacks.forEach(s => {
      const ss = Camera.toScreen(s.x, s.y);
      ctx.save();
      ctx.translate(ss.x + s.w / 2, ss.y + s.h / 2);
      ctx.rotate(s.angle);
      ctx.fillStyle = this.bdef.swordColor;
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-s.w / 2 + s.w * 0.7, -s.h / 2 - 2, s.w * 0.3 + 4, s.h + 4);
      ctx.restore();
      if (s.life % 2 === 0)
        Particles.emit(s.x + s.w / 2, s.y + s.h / 2, 1, this.bdef.swordColor, -s.vx * 0.2, -s.vy * 0.2, 1, 8);
    });
  }
}
