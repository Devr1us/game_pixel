/* ============================================================
   ASSETS — UI: HUD (Heads-Up Display)
   Semua elemen UI dalam game:
   - HP bar player (canvas)
   - Torch dekoratif (canvas)
   - Update HUD HTML (lives, score, coins, timer)
   - Boss bar (show/hide/update)
   - Damage flash overlay
   - Checkpoint popup
   ============================================================ */

'use strict';

// ─── HUD CANVAS (digambar di atas canvas game) ───────────────
function drawHUDCanvas(player) {
  // HP Bar kiri atas
  if (player && !player.dead) {
    const barWidth  = 200;
    const barHeight = 12;
    const barX      = 20;
    const barY      = 20;
    const hpPercent = Math.max(0, player.hp / player.maxHp);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Border
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // HP fill (gradient hijau → merah)
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

    // Teks HP
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(player.hp) + '/' + player.maxHp, barX + barWidth / 2, barY + barHeight - 1);
  }

  // Obor dekoratif di sudut atas
  drawTorch(20, 60);
  drawTorch(canvas.width - 30, 60);
}

// ─── TORCH ───────────────────────────────────────────────────
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

// ─── HUD HTML (lives, score, coins, timer) ───────────────────
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
    const remainingMs  = currentLevel ? Math.max(0, 90000 - currentLevel.elapsedMs) : 90000;
    const remainingSec = Math.floor(remainingMs / 1000);
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    timeEl.textContent = `Waktu: ${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// ─── BOSS BAR ────────────────────────────────────────────────
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

// ─── DAMAGE FLASH ────────────────────────────────────────────
function flashDamage() {
  const el = document.getElementById('damage-flash');
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 120);
}

// ─── CHECKPOINT POPUP ────────────────────────────────────────
function showCheckpointPopup() {
  const el = document.getElementById('checkpoint-popup');
  el.classList.remove('hidden');
  clearTimeout(showCheckpointPopup._t);
  showCheckpointPopup._t = setTimeout(() => el.classList.add('hidden'), 2000);
}
