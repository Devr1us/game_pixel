/* ============================================================
   ASSETS — CHARACTER: MINION
   Musuh kecil yang muncul di stage 6–10.
   Bergerak bolak-balik di lantai, menyerang player saat dekat.
   Stage 8+: ada minion "elite" dengan HP 2x, kecepatan 1.5x,
             dan tampilan berbeda (lebih besar, warna lebih gelap).
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

    // Elite minion: HP ≥ 60 (stage 8+, isElite = hp >= 2x normal)
    this.isElite = hp >= 60;

    if (this.isElite) {
      // Elite: lebih besar, warna ungu gelap, mata merah menyala
      this.w = 26;
      this.h = 34;
      this.color  = '#5a1a6a';
      this.darkColor = '#2a0a3a';
      this.eyeCol = '#ff2222';
    } else {
      // Normal: warna berdasarkan HP (makin kuat makin merah)
      const t = Math.min(1, hp / 60);
      this.color  = `rgb(${Math.floor(180 + t * 60)}, ${Math.floor(60 - t * 40)}, ${Math.floor(60 - t * 40)})`;
      this.darkColor = '#5a1a1a';
      this.eyeCol = hp >= 45 ? '#ff2222' : (hp >= 30 ? '#ff8800' : '#ffcc00');
    }
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
    // Elite: jangkauan serangan lebih lebar, cooldown lebih pendek
    if (this.attackTimer > 0) { this.attackTimer--; return; }
    const attackRange = this.isElite ? 32 : 24;
    const attackCooldown = this.isElite ? 45 : 60;
    const dx = Math.abs((player.x + player.w / 2) - (this.x + this.w / 2));
    const dy = Math.abs((player.y + player.h / 2) - (this.y + this.h / 2));
    if (dx < attackRange && dy < 36 && player.iframes <= 0) {
      player.takeDamage('minion');
      this.attackTimer = attackCooldown;
    }

    // Terima serangan player
    const ab = player.attackBox;
    if (ab && player.attacking && this.iframes <= 0 && rectsOverlap(ab, this)) {
      const baseDmg = player.attackDamage || 10;
      const dmg = this.isElite ? Math.max(15, baseDmg) : Math.max(25, baseDmg);
      this.hp -= dmg;
      this.iframes = player.attackCharged ? 38 : 30;
      G.score += player.attackCharged ? (this.isElite ? 60 : 40) : (this.isElite ? 30 : 20);
      updateHUD();
      Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 5, this.eyeCol, 0, -2, 3, 18);
      if (this.hp <= 0) {
        this.hp = 0;
        this.deathAnim = 20;
        G.score += this.isElite ? 150 : 80;
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
    ctx.fillStyle = this.darkColor;
    ctx.fillRect(cx + 3,  cy + Math.floor(this.h * 0.65), 6, Math.floor(this.h * 0.35) + legOff);
    ctx.fillRect(cx + 11, cy + Math.floor(this.h * 0.65), 6, Math.floor(this.h * 0.35) - legOff);

    // Badan
    ctx.fillStyle = this.color;
    ctx.fillRect(cx + 2, cy + Math.floor(this.h * 0.3), this.w - 4, Math.floor(this.h * 0.38));

    // Kepala
    ctx.fillStyle = this.color;
    ctx.fillRect(cx + 3, cy, this.w - 6, Math.floor(this.h * 0.32));

    // Tanduk elite
    if (this.isElite) {
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(cx + 4,  cy - 6, 4, 8);
      ctx.fillRect(cx + this.w - 8, cy - 6, 4, 8);
    }

    // Mata menyala
    ctx.fillStyle = this.eyeCol;
    ctx.shadowBlur = this.isElite ? 10 : 6;
    ctx.shadowColor = this.eyeCol;
    const eyeX = this.facing === 1 ? cx + this.w - 8 : cx + 3;
    ctx.fillRect(eyeX, cy + 3, this.isElite ? 5 : 4, this.isElite ? 5 : 4);
    ctx.shadowBlur = 0;

    // HP bar mini di atas kepala
    if (this.hp < this.maxHp) {
      const bw = this.w;
      ctx.fillStyle = '#333';
      ctx.fillRect(cx, cy - 6, bw, 3);
      ctx.fillStyle = this.isElite ? '#ff44ff' : this.eyeCol;
      ctx.fillRect(cx, cy - 6, bw * (this.hp / this.maxHp), 3);
    }
  }
}
