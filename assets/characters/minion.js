/* ============================================================
   ASSETS — CHARACTER: MINION
   Musuh kecil yang muncul di stage 6–10.
   Bergerak bolak-balik di lantai, menyerang player saat dekat.
   ============================================================ */

'use strict';

class Minion {
  constructor(x, y, speed, hp) {
    this.x = x * TILE;
    this.y = y * TILE - 28;
    this.w = 20;
    this.h = 28;
    this.vx = speed;
    this.vy = 0;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.facing = 1;
    this.onGround = false;
    this.alive = true;
    this.iframes = 0;
    this.walkAnim = 0;
    this.attackTimer = 0;
    this.deathAnim = 0;
    // Warna berdasarkan HP (makin kuat makin merah)
    const t = Math.min(1, hp / 80);
    this.color  = `rgb(${Math.floor(180 + t * 60)}, ${Math.floor(60 - t * 40)}, ${Math.floor(60 - t * 40)})`;
    this.eyeCol = hp >= 60 ? '#ff2222' : (hp >= 40 ? '#ff8800' : '#ffcc00');
  }

  update(map, player) {
    if (!this.alive) return;

    if (this.deathAnim > 0) {
      this.deathAnim--;
      if (this.deathAnim === 0) this.alive = false;
      return;
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 16) this.vy = 16;

    // Gerak horizontal — balik arah di tepi/dinding/pit
    this.x += this.vx;
    const left  = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top   = Math.floor(this.y / TILE);
    const bot   = Math.floor((this.y + this.h - 1) / TILE);

    if (this.vx > 0 && (map.isSolid(right, top) || map.isSolid(right, bot))) {
      this.x = right * TILE - this.w; this.vx = -this.speed; this.facing = -1;
    } else if (this.vx < 0 && (map.isSolid(left, top) || map.isSolid(left, bot))) {
      this.x = (left + 1) * TILE; this.vx = this.speed; this.facing = 1;
    }

    // Balik di tepi pit
    if (this.onGround) {
      const probeCol = this.vx > 0 ? Math.floor((this.x + this.w + 2) / TILE) : Math.floor((this.x - 2) / TILE);
      const probeRow = Math.floor((this.y + this.h + 1) / TILE);
      if (map.isPit(probeCol, probeRow)) {
        this.vx = -this.vx;
        this.facing = this.vx > 0 ? 1 : -1;
      }
    }

    // Gerak vertikal
    this.y += this.vy;
    const botRow = Math.floor((this.y + this.h) / TILE);
    const topRow = Math.floor(this.y / TILE);
    const lCol   = Math.floor((this.x + 2) / TILE);
    const rCol   = Math.floor((this.x + this.w - 3) / TILE);
    this.onGround = false;
    if (this.vy >= 0 && (map.isSolid(lCol, botRow) || map.isSolid(rCol, botRow))) {
      this.y = botRow * TILE - this.h; this.vy = 0; this.onGround = true;
    }
    if (this.vy < 0 && (map.isSolid(lCol, topRow) || map.isSolid(rCol, topRow))) {
      this.y = (topRow + 1) * TILE; this.vy = 0;
    }

    // Mati jika jatuh ke pit/lava
    const midCol = Math.floor((this.x + this.w / 2) / TILE);
    const footRow = Math.floor((this.y + this.h - 1) / TILE);
    if (map.isPit(midCol, footRow) || map.isLava(midCol, footRow) || this.y > map.pixelHeight() + 64) {
      this.alive = false; return;
    }

    this.walkAnim += 0.25;
    if (this.iframes > 0) this.iframes--;

    // Serang player saat dekat
    if (this.attackTimer > 0) { this.attackTimer--; return; }
    const dx = Math.abs((player.x + player.w / 2) - (this.x + this.w / 2));
    const dy = Math.abs((player.y + player.h / 2) - (this.y + this.h / 2));
    if (dx < 28 && dy < 32 && player.iframes <= 0) {
      player.takeDamage('minion');
      this.attackTimer = 60;
    }

    // Terima serangan player
    const ab = player.attackBox;
    if (ab && player.attacking && this.iframes <= 0 && rectsOverlap(ab, this)) {
      this.hp -= 25;
      this.iframes = 30;
      G.score += 20;
      updateHUD();
      Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 5, this.eyeCol, 0, -2, 3, 18);
      if (this.hp <= 0) {
        this.hp = 0;
        this.deathAnim = 20;
        G.score += 80;
        updateHUD();
        Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 10, this.eyeCol, 0, -3, 4, 25);
      }
    }
  }

  draw() {
    if (!this.alive && this.deathAnim === 0) return;
    const sc = Camera.toScreen(this.x, this.y);
    const blink = this.iframes > 0 && Math.floor(this.iframes / 4) % 2 === 0;
    if (blink) return;

    if (this.deathAnim > 0) {
      ctx.globalAlpha = this.deathAnim / 20;
      ctx.fillStyle = this.eyeCol;
      ctx.fillRect(sc.x, sc.y, this.w, this.h);
      ctx.globalAlpha = 1;
      return;
    }

    const cx = sc.x, cy = sc.y;
    const legOff = Math.sin(this.walkAnim) * 3;

    // Shadow
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
    ctx.fillRect(cx + 2, cy + this.h - 2, this.w - 4, 3); ctx.globalAlpha = 1;

    // Kaki
    ctx.fillStyle = '#5a1a1a';
    ctx.fillRect(cx + 3,  cy + 18, 6, 10 + legOff);
    ctx.fillRect(cx + 11, cy + 18, 6, 10 - legOff);

    // Badan
    ctx.fillStyle = this.color;
    ctx.fillRect(cx + 2, cy + 8, this.w - 4, 12);

    // Kepala
    ctx.fillStyle = this.color;
    ctx.fillRect(cx + 3, cy, this.w - 6, 10);

    // Mata merah menyala
    ctx.fillStyle = this.eyeCol;
    ctx.shadowBlur = 6; ctx.shadowColor = this.eyeCol;
    const eyeX = this.facing === 1 ? cx + this.w - 8 : cx + 3;
    ctx.fillRect(eyeX, cy + 2, 4, 4);
    ctx.shadowBlur = 0;

    // HP bar mini di atas kepala
    if (this.hp < this.maxHp) {
      const bw = this.w;
      ctx.fillStyle = '#333';
      ctx.fillRect(cx, cy - 6, bw, 3);
      ctx.fillStyle = this.eyeCol;
      ctx.fillRect(cx, cy - 6, bw * (this.hp / this.maxHp), 3);
    }
  }
}
