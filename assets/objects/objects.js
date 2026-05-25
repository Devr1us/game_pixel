/* ============================================================
   ASSETS — OBJECTS
   Semua objek interaktif dalam game:
   - Coin           (koin yang bisa dikumpulkan)
   - MovingPlatform (platform bergerak)
   - Checkpoint     (titik simpan progress)
   - BossGate       (pemicu boss fight)
   - Portal         (pintu ke level berikutnya)
   ============================================================ */

'use strict';

// ─── COIN ────────────────────────────────────────────────────
class Coin {
  constructor(x, y) {
    this.x = x * TILE + 8;
    this.y = y * TILE + 8;
    this.w = 16;
    this.h = 16;
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
      SFX.coin();
      updateHUD();
      Particles.emit(this.x + 8, this.y + 8, 6, PAL.gold, 0, -2, 2, 20);
    }
  }

  draw() {
    if (this.collected) return;
    const sc  = Camera.toScreen(this.x, this.y);
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

// ─── MOVING PLATFORM ─────────────────────────────────────────
class MovingPlatform {
  constructor(x, y, range, speed) {
    this.x = x * TILE;
    this.y = y * TILE;
    this.startX = this.x;
    this.w = TILE * 4;   // diperlebar: 4 tile agar lebih mudah dijangkau saat dash
    this.h = TILE / 2;
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

    // Bawa player jika berdiri di atas platform
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
    ctx.fillStyle = PAL.platform;
    ctx.fillRect(sc.x, sc.y + 4, this.w, this.h - 4);
    ctx.fillStyle = PAL.platformTop;
    ctx.fillRect(sc.x, sc.y, this.w, 6);
    // Baut dekoratif
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(sc.x + 4,          sc.y + 2, 4, 4);
    ctx.fillRect(sc.x + this.w - 8, sc.y + 2, 4, 4);
  }
}

// ─── CHECKPOINT ──────────────────────────────────────────────
class Checkpoint {
  constructor(x, y) {
    this.x = x * TILE + 8;
    this.y = y * TILE - 24;
    this.w = 12;
    this.h = 32;
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
      SFX.checkpoint();
      G.score += 100;
      updateHUD();
      Particles.emit(this.x + 6, this.y, 10, PAL.gold, 0, -3, 3, 30);
    }
  }

  draw() {
    const sc = Camera.toScreen(this.x, this.y);

    // Tiang bendera
    ctx.fillStyle = '#888';
    ctx.fillRect(sc.x + 5, sc.y, 2, 32);

    // Bendera (bergelombang)
    const wave = Math.sin(this.anim * 0.08) * 3;
    ctx.fillStyle = this.activated ? PAL.gold : '#888';
    ctx.beginPath();
    ctx.moveTo(sc.x + 7, sc.y + 2);
    ctx.lineTo(sc.x + 7 + 14, sc.y + 5 + wave);
    ctx.lineTo(sc.x + 7 + 14, sc.y + 14 + wave);
    ctx.lineTo(sc.x + 7, sc.y + 14);
    ctx.fill();

    // Glow saat aktif
    if (this.activated) {
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.anim * 0.1);
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(sc.x - 4, sc.y - 4, this.w + 22, this.h + 8);
      ctx.globalAlpha = 1;
    }
  }
}

// ─── BOSS GATE ───────────────────────────────────────────────
// Zona pemicu boss fight — saat player menyentuhnya, boss aktif
// Chest bonus untuk memberi alasan eksplorasi di tiap stage.
class TreasureChest {
  constructor(x, y) {
    this.x = x * TILE + 2;
    this.y = y * TILE - 18;
    this.w = 28;
    this.h = 18;
    this.opened = false;
    this.anim = 0;
  }

  update(player) {
    this.anim++;
    if (this.opened) return;
    const ab = player.attackBox;
    if (ab && player.attacking && rectsOverlap(ab, this)) {
      this.opened = true;
      G.score += 250;
      G.coins += 3;
      SFX.coin();
      updateHUD();
      Particles.emit(this.x + this.w / 2, this.y, 18, PAL.gold, 0, -3, 4, 35);
    }
  }

  draw() {
    const sc = Camera.toScreen(this.x, this.y);
    const glow = this.opened ? 0.18 : 0.08 + 0.08 * Math.sin(this.anim * 0.08);
    ctx.globalAlpha = glow;
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(sc.x - 4, sc.y - 6, this.w + 8, this.h + 10);
    ctx.globalAlpha = 1;

    ctx.fillStyle = this.opened ? '#6a4a2a' : PAL.platform;
    ctx.fillRect(sc.x, sc.y + 6, this.w, 12);
    ctx.fillStyle = this.opened ? PAL.goldDark : PAL.gold;
    ctx.fillRect(sc.x + 2, sc.y, this.w - 4, 8);
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(sc.x + 11, sc.y + 7, 6, 7);
    if (this.opened) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(sc.x + 6, sc.y - 4, 4, 4);
      ctx.fillRect(sc.x + 18, sc.y - 7, 3, 3);
    }
  }
}

class BossGate {
  constructor(x, y) {
    this.x = x * TILE;
    this.y = (y - 4) * TILE;
    this.w = TILE;
    this.h = TILE * 4;
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
    ctx.fillText('BOSS', sc.x + this.w / 2, sc.y + this.h / 2);
  }
}

// ─── PORTAL ──────────────────────────────────────────────────
// Portal ke level berikutnya — aktif setelah boss dikalahkan
class Portal {
  constructor(x, y) {
    this.x = x * TILE + 4;
    this.y = (y - 2) * TILE;
    this.w = 24;
    this.h = 64;
    this.anim = 0;
  }

  update(player, bossDefeated) {
    this.anim++;
    if (bossDefeated && rectsOverlap(this, player)) {
      return true; // Level selesai!
    }
    return false;
  }

  draw(bossDefeated) {
    const sc    = Camera.toScreen(this.x, this.y);
    const alpha = bossDefeated ? 1 : 0.3;
    ctx.globalAlpha = alpha;

    // Efek pusaran portal
    for (let i = 0; i < 3; i++) {
      const sz = 24 - i * 6;
      const r  = (this.anim * (0.05 + i * 0.02)) % (Math.PI * 2);
      ctx.fillStyle = i === 0 ? PAL.portal : (i === 1 ? PAL.portalGlow : '#fff');
      ctx.save();
      ctx.translate(sc.x + this.w / 2, sc.y + this.h / 2);
      ctx.rotate(r);
      ctx.fillRect(-sz / 2, -this.h / 2 + i * 6, sz, this.h - i * 12);
      ctx.restore();
    }

    if (bossDefeated) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.anim * 0.15);
      ctx.fillStyle = PAL.portalGlow;
      ctx.fillRect(sc.x - 8, sc.y - 8, this.w + 16, this.h + 16);
    }
    ctx.globalAlpha = 1;

    // Teks prompt saat aktif
    if (bossDefeated) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const bob = Math.sin(this.anim * 0.12) * 4;
      ctx.fillText('ENTER', sc.x + this.w / 2, sc.y - 12 + bob);
    }
  }
}
