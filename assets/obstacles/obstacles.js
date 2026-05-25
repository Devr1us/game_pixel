/* ============================================================
   ASSETS — OBSTACLES
   Semua rintangan berbahaya:
   - Spike        (duri lantai, mengarah ke atas)
   - FallingSpike (duri jatuh dari langit-langit)
   - Saw          (gergaji berputar, bergerak horizontal/vertikal)
   ============================================================ */

'use strict';

// ─── SPIKE ──────────────────────────────────────────────────
// hanging=false → duri lantai (mengarah ke atas)
// hanging=true  → duri langit-langit (mengarah ke bawah)
class Spike {
  // yOffsetPx: koreksi kecil (pixel) jika spike terlihat "tenggelam"
  //            (mis. spike diletakkan 1 row di bawah platform).
  constructor(x, y, hanging, yOffsetPx = 0) {
    this.x = x * TILE;
    if (hanging) {
      this.y = y * TILE + yOffsetPx;
      this.w = TILE;
      this.h = 16;
    } else {
      this.y = y * TILE - 24 + yOffsetPx;
      this.w = TILE;
      this.h = 24;
    }
    this.hanging = hanging;
  }

  update(player) {
    const hb = {
      x: this.x + 2,
      y: this.y + (this.hanging ? 0 : 2),
      w: this.w - 4,
      h: this.h - 4
    };
    if (rectsOverlap(hb, player)) player.takeDamage('spike');
  }

  draw() {
    const sc    = Camera.toScreen(this.x, this.y);
    const count = 3;
    const tw    = this.w / count;

    ctx.fillStyle = PAL.spikeBase;
    ctx.fillRect(sc.x, sc.y + (this.hanging ? 0 : 10), this.w, 6);

    for (let i = 0; i < count; i++) {
      ctx.fillStyle = PAL.spike;
      const px = sc.x + i * tw + tw / 2;
      if (this.hanging) {
        ctx.beginPath();
        ctx.moveTo(px, sc.y + 16);
        ctx.lineTo(px - tw / 2 + 2, sc.y);
        ctx.lineTo(px + tw / 2 - 2, sc.y);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(px, sc.y);
        ctx.lineTo(px - tw / 2 + 2, sc.y + 16);
        ctx.lineTo(px + tw / 2 - 2, sc.y + 16);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      if (!this.hanging) ctx.fillRect(px - 1, sc.y + 2,  2, 4);
      else               ctx.fillRect(px - 1, sc.y + 10, 2, 4);
    }
  }
}

// ─── FALLING SPIKE ──────────────────────────────────────────
// Duri yang jatuh dari langit-langit secara periodik
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
      const col = Math.floor((this.x + this.w / 2) / TILE);
      const row = Math.floor((this.y + this.h) / TILE);
      if (map.isSolid(col, row)) {
        this.landed = true;
        this.falling = false;
        this.landTimer = 60;
        Particles.emit(this.x + this.w / 2, this.y + this.h, 5, PAL.spike, 0, -2, 3, 15);
      }
      if (rectsOverlap(this, player) && player.iframes <= 0) player.takeDamage('spike');
    }

    if (this.landed) {
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
      // Warning indicator di langit-langit
      const sc = Camera.toScreen(this.startX + 2, this.startY);
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(G.tick * 0.1);
      ctx.fillStyle = '#e84040';
      ctx.fillRect(sc.x + 4, sc.y, this.w - 8, 6);
      ctx.globalAlpha = 1;
      return;
    }
    const sc = Camera.toScreen(this.x + 2, this.y);
    ctx.fillStyle = PAL.spike;
    ctx.fillRect(sc.x, sc.y, this.w, this.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sc.x + this.w / 2 - 2, sc.y + 2, 4, 8);
  }
}

// ─── SAW BLADE ──────────────────────────────────────────────
// Gergaji berputar yang bergerak bolak-balik (axis x atau y)
class Saw {
  constructor(x, y, range, speed, axis) {
    this.x = x * TILE;
    this.y = y * TILE - 8;
    this.startX = this.x;
    this.startY = this.y;
    this.w = 24;
    this.h = 24;
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
    const cx = sc.x + this.w / 2;
    const cy = sc.y + this.h / 2;
    const r  = this.w / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rot);

    // Blade dengan gigi
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

    // Pusat
    ctx.fillStyle = PAL.sawEdge;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Rantai penghubung
    ctx.strokeStyle = PAL.chain;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (this.axis === 'y') {
      ctx.moveTo(sc.x + this.w / 2, sc.y);
      ctx.lineTo(sc.x + this.w / 2, sc.y - (this.y - this.startY));
    } else {
      ctx.moveTo(sc.x, sc.y + this.h / 2);
      ctx.lineTo(sc.x - (this.x - this.startX), sc.y + this.h / 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
