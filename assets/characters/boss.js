/* ============================================================
   ASSETS — CHARACTER: BOSS
   Definisi boss (BOSS_DEFS) dan class Boss
   3 boss: Shadow Knight, Phantom Warlord, Inferno Reaper
   ============================================================ */

'use strict';

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

  activate() {
    this.active = true;
    showBossBar(this.bdef.name, this.hp, this.maxHp);
  }

  update(map, player) {
    if (!this.alive || !this.active) return;

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

    // Phase transition
    const newPhase = this.hp / this.maxHp <= this.bdef.phases[2]?.hpPct ? 2 :
                     this.hp / this.maxHp <= this.bdef.phases[1]?.hpPct ? 1 : 0;
    if (newPhase > this.phase) {
      this.phase = newPhase;
      Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 20, this.bdef.eye, 0, -4, 6, 40);
    }

    // AI: chase player
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

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 18) this.vy = 18;

    this._moveX(map);
    this._moveY(map);

    // Jump (Inferno Reaper)
    if (this.bdef.phases[this.phase]?.jumpRate > 0) {
      if (this.onGround && Math.random() < 1 / this.bdef.phases[this.phase].jumpRate) {
        this.vy = -12;
      }
    }

    // Charge
    if (pd.chargeRate > 0 && Math.random() < 1 / pd.chargeRate) {
      this.isCharging = true;
      this.chargeDir = Math.sign(dx) || 1;
      this.chargeTimer = 30;
    }

    // Teleport (Phantom Warlord)
    if (pd.teleRate > 0 && Math.random() < 1 / pd.teleRate) {
      this.x = player.x + (Math.random() > 0.5 ? 100 : -this.w - 100);
      Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 15, this.bdef.eye, 0, -2, 5, 30);
    }

    // Attack
    if (this.attackTimer > 0) this.attackTimer--;
    else {
      this.attackTimer = pd.attackRate;
      this._doAttack(player, pd);
    }

    // Update projectiles
    this.swordAttacks = this.swordAttacks.filter(s => {
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.3;
      s.life--;
      if (s.life > 0 && rectsOverlap(s, player) && player.iframes <= 0) {
        player.takeDamage('sword');
      }
      return s.life > 0;
    });

    if (Math.abs(this.vx) > 0.5) this.walkAnim += 0.25;
    if (this.iframes > 0) this.iframes--;

    // Player melee hit
    const ab = player.attackBox;
    if (ab && player.attacking && this.iframes <= 0 && rectsOverlap(ab, this)) {
      this.hp -= 10;
      this.iframes = 20;
      G.score += 50;
      updateHUD();
      Particles.emit(this.x + this.w / 2, this.y + 10, 6, PAL.gold, 0, -2, 3, 20);
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
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const ang = Math.atan2(player.y - cy, player.x - cx);
    const speed = 5;

    this.swordAttacks.push({
      x: cx - 8, y: cy - 4, w: 20, h: 8,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      life: 120, color: this.bdef.swordColor, angle: ang
    });

    if (this.phase >= 1) {
      [-0.4, 0.4].forEach(offset => {
        this.swordAttacks.push({
          x: cx - 8, y: cy - 4, w: 18, h: 7,
          vx: Math.cos(ang + offset) * speed, vy: Math.sin(ang + offset) * speed,
          life: 100, color: this.bdef.swordColor, angle: ang + offset
        });
      });
    }

    if (this.phase >= 2) {
      [-0.8, 0.8].forEach(offset => {
        this.swordAttacks.push({
          x: cx - 8, y: cy - 4, w: 16, h: 6,
          vx: Math.cos(ang + offset) * speed * 0.8, vy: Math.sin(ang + offset) * speed * 0.8,
          life: 80, color: this.bdef.swordColor, angle: ang + offset
        });
      });
    }
  }

  _moveX(map) {
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
      ctx.globalAlpha = this.deathAnim / 60;
      ctx.fillStyle = this.bdef.eye;
      const s = (60 - this.deathAnim) * 2;
      ctx.fillRect(sc.x + this.w / 2 - s / 2, sc.y + this.h / 2 - s / 2, s, s);
      ctx.globalAlpha = 1;
      if (G.tick % 4 === 0)
        Particles.emit(this.x + Math.random() * this.w, this.y + Math.random() * this.h,
          3, this.bdef.eye, 0, -2, 4, 20);
      return;
    }

    if (blink) return;

    const f  = this.facing;
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
    ctx.fillRect(cx + 6,      cy + H * 0.65, 12, H * 0.35 + legOff);
    ctx.fillRect(cx + W - 18, cy + H * 0.65, 12, H * 0.35 - legOff);

    // Body
    ctx.fillStyle = this.bdef.color;
    ctx.fillRect(cx + 4, cy + H * 0.3, W - 8, H * 0.4);

    // Armor overlay
    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6,      cy + H * 0.3, 6,  H * 0.4);
    ctx.fillRect(cx + W - 12, cy + H * 0.3, 6,  H * 0.4);

    // Head
    ctx.fillStyle = this.bdef.color;
    ctx.fillRect(cx + 8, cy + 2, W - 16, H * 0.28);

    // Helmet
    ctx.fillStyle = this.bdef.dark;
    ctx.fillRect(cx + 6,      cy, W - 12, 10);
    ctx.fillRect(cx + 6,      cy, 4, H * 0.28);
    ctx.fillRect(cx + W - 10, cy, 4, H * 0.28);

    // Eyes (glowing)
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
    ctx.fillRect(sx, cy + H * 0.3, 32, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(f === 1 ? cx + W + 26 : cx - 32, cy + H * 0.3 - 2, 8, 10);

    // Phase aura
    if (this.phase >= 1) {
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(G.tick * 0.1);
      ctx.fillStyle = this.bdef.eye;
      ctx.fillRect(cx - 4, cy - 4, W + 8, H + 8);
      ctx.globalAlpha = 1;
    }

    // Sword projectiles
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
