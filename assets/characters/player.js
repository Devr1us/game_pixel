/* ============================================================
   ASSETS — CHARACTER: PLAYER (The Punch Guy)
   Semua logika, animasi, dan drawing karakter player
   ============================================================ */

'use strict';

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
    this.attackDamage = 10;
    this.attackCharged = false;
    this.chargeTimer = 0;
    this.chargeReady = false;
    this.iframes = 0;
    this.dead = false;
    this.walkAnim = 0;
    this.checkpointX = x;
    this.checkpointY = y;
    this.dodging = false;
    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;
    this.lavaTime = 0;
    this.hp = 100;
    this.maxHp = 100;
  }

  respawn() {
    this.x = this.checkpointX;
    this.y = this.checkpointY;
    this.vx = 0; this.vy = 0;
    this.dead = false;
    this.iframes = 120;
    this.hp = this.maxHp;
    this.lavaTime = 0;
    Camera.x = Math.min(Camera.maxX, Math.max(0, this.x - Camera.viewW / 2));
    Camera.y = Math.min(Camera.maxY, Math.max(0, this.y - Camera.viewH / 2));
  }

  update(map, objects, dt = 1) {
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
        SFX.jump();
        Particles.emit(this.x + this.w / 2, this.y + this.h, 4, PAL.groundTop, 0, -1, 2, 15);
      } else if (this.jumps < this.maxJumps) {
        this.vy = jumpPow * 0.85; this.jumps++;
        SFX.jump();
        Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 6, PAL.punchGlow, 0, 0, 3, 20);
      }
    }

    // Attack: tap/click for quick punch, hold J/Z for charged punch.
    const attackHeld = G.keys['KeyJ'] || G.keys['KeyZ'];
    if (!this.attacking && this.attackCooldown <= 0 && attackHeld) {
      this.chargeTimer = Math.min(45, this.chargeTimer + 1);
      this.chargeReady = this.chargeTimer >= 24;
      if (this.chargeReady && this.chargeTimer % 8 === 0) {
        Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 2, PAL.punchGlow, 0, -1, 2, 12);
      }
    }
    const attackReleased = this.chargeTimer > 0 && !attackHeld;
    if ((G.mouseClicked || attackReleased) && this.attackCooldown <= 0) {
      const charged = this.chargeReady;
      this.attacking = true;
      this.attackCharged = charged;
      this.attackDamage = charged ? 25 : 10;
      this.attackTimer = charged ? 24 : 18;
      this.attackCooldown = charged ? 38 : 24;
      this.chargeTimer = 0;
      this.chargeReady = false;
      SFX.attack();
      if (charged) {
        ScreenShake.trigger(3, 8);
        Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 10, PAL.punchGlow, this.facing * 1.5, -1, 3, 22);
      }
      G.mouseClicked = false;
    }
    if (this.attackTimer > 0) this.attackTimer--;
    else {
      this.attacking = false;
      this.attackCharged = false;
      this.attackDamage = 10;
    }
    if (this.attackCooldown > 0) this.attackCooldown--;

    // Dodge
    if (G.justPressed['ShiftLeft'] || G.justPressed['ShiftRight']) {
      if (this.dodgeCooldown <= 0) {
        this.dodging = true;
        this.dodgeTimer = 20;
        this.dodgeCooldown = 50;
        this.iframes = 90;
        SFX.dodge();
        Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 8, PAL.punchGlow, 0, 0, 2, 15);
      }
    }

    if (this.dodging && this.dodgeTimer > 0) {
      this.vx = this.facing * 8;
      this.dodgeTimer--;
    } else {
      this.dodging = false;
    }
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > 20) this.vy = 20;

    this._moveX(map);
    this._moveY(map);

    if (moving && this.onGround) this.walkAnim += 0.3;
    if (this.iframes > 0) this.iframes--;

    // Pit / lava check
    const col = Math.floor((this.x + this.w / 2) / TILE);
    const rowFoot = Math.floor((this.y + this.h - 1) / TILE);
    const inPit = map.isPit(col, rowFoot) || this.y > map.pixelHeight() + 64;
    const inLava = map.isLava(col, rowFoot);

    if (inPit) { this.takeDamage('pit'); return; }

    if (inLava) {
      this.lavaTime += dt;
      if (this.lavaTime >= 60) { this.takeDamage('lava'); this.lavaTime -= 60; }
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
        this.x = right * TILE - this.w; this.vx = 0;
      }
    } else if (this.vx < 0) {
      if (map.isSolid(left, top) || map.isSolid(left, bot)) {
        this.x = (left + 1) * TILE; this.vx = 0;
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
        this.y = bot * TILE - this.h; this.vy = 0;
        this.onGround = true; this.jumps = 0;
      }
    } else {
      if (map.isSolid(left, top) || map.isSolid(right, top)) {
        this.y = (top + 1) * TILE; this.vy = 0;
      }
    }
  }

  takeDamage(source) {
    if (this.iframes > 0 || this.dead) return;
    this.hp -= 25;
    this.iframes = 90;
    flashDamage();
    ScreenShake.trigger(6, 12);
    resetCombo();
    SFX.hit();
    Particles.emit(this.x + this.w / 2, this.y + this.h / 2, 10, '#e84040', 0, -2, 4, 25);
    updateHUD();
    if (this.hp <= 0) {
      this.hp = 0;
      G.lives--;
      updateHUD();
      checkHighScore();
      if (G.lives <= 0) {
        this.dead = true;
        SFX.playerDie();
        setTimeout(() => {
          G.running = false;
          cancelAnimationFrame(animId);
          showScreen('gameover');
        }, 800);
      } else {
        this.dead = true;
        SFX.playerDie();
        setTimeout(() => this.respawn(), 600);
      }
    }
  }

  get attackBox() {
    if (!this.attacking) return null;
    const ax = this.facing === 1 ? this.x + this.w - 2 : this.x - 18;
    if (this.attackCharged) {
      const cx = this.facing === 1 ? this.x + this.w - 2 : this.x - 30;
      return { x: cx, y: this.y + 6, w: 32, h: 22 };
    }
    return { x: ax, y: this.y + 10, w: 20, h: 16 };
  }

  draw() {
    if (this.dead) return;
    const sc = Camera.toScreen(this.x, this.y);
    const blink = this.iframes > 0 && Math.floor(this.iframes / 5) % 2 === 0;
    if (blink && !this.dodging) return;

    const cx = sc.x;
    const cy = sc.y;
    const f  = this.facing;

    // Dodge glow
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

    // Legs
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

    // Punch / attack
    if (this.attacking) {
      const baseTimer = this.attackCharged ? 24 : 18;
      const prog = 1 - (this.attackTimer / baseTimer);
      const maxExt = this.attackCharged ? 28 : 18;
      const ext  = prog < 0.5 ? prog * maxExt : (1 - prog) * maxExt;
      const fx   = f === 1 ? (cx + this.w + ext) : (cx - 10 - ext);
      const fy   = cy + 12;

      ctx.fillStyle = PAL.playerDark;
      const armX = f === 1 ? (cx + 18) : (cx - 6);
      ctx.fillRect(armX, cy + 14, 10, 4);

      ctx.fillStyle = PAL.punch;
      ctx.fillRect(fx, fy - (this.attackCharged ? 2 : 0), this.attackCharged ? 14 : 10, this.attackCharged ? 14 : 10);
      ctx.strokeStyle = PAL.punchGlow;
      ctx.lineWidth = this.attackCharged ? 3 : 2;
      ctx.strokeRect(fx, fy - (this.attackCharged ? 2 : 0), this.attackCharged ? 14 : 10, this.attackCharged ? 14 : 10);
      ctx.lineWidth = 1;

      if (this.attackTimer % 3 === 0) {
        Particles.emit(
          this.x + (f === 1 ? this.w + 10 : -10),
          this.y + 16, 2, PAL.punchGlow, f * 3, -1, 2, 12
        );
      }
    } else {
      if (this.chargeTimer > 0) {
        ctx.globalAlpha = this.chargeReady ? 0.45 : 0.25;
        ctx.fillStyle = PAL.punchGlow;
        ctx.fillRect(cx - 3, cy - 3, this.w + 6, this.h + 6);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = PAL.punch;
      const hx = f === 1 ? cx + 18 : cx - 4;
      ctx.fillRect(hx, cy + 14, 6, 6);
    }
  }
}
