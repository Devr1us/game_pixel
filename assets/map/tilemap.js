/* ============================================================
   ASSETS — MAP: TILEMAP
   Class TileMap, Camera, dan fungsi drawTiles / drawBackground
   Tile legend:
     0=air, 1=ground, 2=platform, 3=stone,
     7=lava, 9=pit(void), c=cloud-platform
   ============================================================ */

'use strict';

// ─── TILEMAP CLASS ──────────────────────────────────────────
class TileMap {
  constructor(levelDef) {
    this.def = levelDef;
    this.rows = [];
    for (let r = 0; r < levelDef.data.length; r++) {
      const row = [];
      const str = levelDef.data[r];
      for (let c = 0; c < levelDef.width; c++) {
        const ch = str[c] || '0';
        row.push(ch);
      }
      this.rows.push(row);
    }
    this.tileW    = TILE;
    this.tileH    = TILE;
    this.cols     = levelDef.width;
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
    return this.get(col, row) === '9';
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
  W: 0, H: 0,
  maxX: 0, maxY: 0,

  init(mapW, mapH) {
    this.W    = canvas.width;
    this.H    = canvas.height;
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

  // Stars (parallax)
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
      const t  = map.get(c, r);
      const sx = c * TILE - Camera.x;
      const sy = r * TILE - Camera.y;

      if (t === '1') {
        // Grass ground
        ctx.fillStyle = PAL.ground;
        ctx.fillRect(sx, sy + 6, TILE, TILE - 6);
        ctx.fillStyle = PAL.groundTop;
        ctx.fillRect(sx, sy, TILE, 7);
        ctx.fillStyle = PAL.groundDark;
        ctx.fillRect(sx + 2,  sy + 8,  3, 3);
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
        ctx.fillRect(sx + 2,  sy + 2,  6, 4);
        ctx.fillRect(sx + 18, sy + 16, 8, 4);

      } else if (t === '7') {
        // Lava (animated)
        const lavaOff = Math.sin(G.tick * 0.08 + c * 0.5) * 3;
        ctx.fillStyle = PAL.lava;
        ctx.fillRect(sx, sy + lavaOff, TILE, TILE);
        ctx.fillStyle = PAL.lavaGlow;
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(G.tick * 0.1 + c);
        ctx.fillRect(sx, sy + lavaOff, TILE, 8);
        ctx.globalAlpha = 1;
        if (r > 0 && map.get(c, r - 1) === '0') {
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = PAL.lavaGlow;
          ctx.fillRect(sx, sy - 12, TILE, 12);
          ctx.globalAlpha = 1;
        }

      } else if (t === '9') {
        // Pit (dark abyss)
        ctx.fillStyle = PAL.pit;
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    }
  }
}
