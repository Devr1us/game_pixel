# Assets — The Punch Guy

Folder ini berisi semua asset game yang dipisah berdasarkan kategori.
Semua asset digambar secara programatik menggunakan HTML5 Canvas API (tidak ada file gambar eksternal).

---

## Struktur Folder

```
assets/
├── characters/
│   ├── player.js       ← Karakter utama (The Punch Guy)
│   └── boss.js         ← Definisi boss + class Boss
│
├── map/
│   ├── tilemap.js      ← Class TileMap, Camera, drawTiles, drawBackground
│   └── levels.js       ← Definisi semua level (1–10) + generator level
│
├── obstacles/
│   └── obstacles.js    ← Spike, FallingSpike, Saw
│
├── objects/
│   └── objects.js      ← Coin, MovingPlatform, Checkpoint, BossGate, Portal
│
├── ui/
│   ├── hud.js          ← HP bar, boss bar, damage flash, checkpoint popup
│   └── screens.js      ← Screen management, stage select, progress save/load
│
└── sprites/            ← Referensi sprite sheet (tidak digunakan langsung)
    ├── characters-32.jpg
    ├── objects-32.jpg
    └── ...
```

---

## Deskripsi Tiap File

### `characters/player.js`
- Class `Player` — logika gerak, lompat, serang, dodge, HP, respawn
- Animasi pixel art: badan, kaki, kepala, kepalan tangan (punch)

### `characters/boss.js`
- `BOSS_DEFS[]` — data 3 boss: Shadow Knight, Phantom Warlord, Inferno Reaper
- Class `Boss` — AI chase, charge, teleport, lompat, tembak proyektil pedang
- Sistem fase (makin sedikit HP → makin agresif)

### `map/tilemap.js`
- Class `TileMap` — parse data level, cek solid/pit/lava
- Object `Camera` — follow player dengan lerp, konversi world→screen
- `drawBackground()` — gradient langit, bintang parallax, awan
- `drawTiles()` — render tile: ground, platform, stone, lava, pit

### `map/levels.js`
- `BASE_LEVELS[]` — 3 level hand-crafted (Dark Forest, Stone Citadel, Lava Abyss)
- `generateExtraLevels()` — generator prosedural level 4–10
- `LEVELS[]` — gabungan semua level

### `obstacles/obstacles.js`
- `Spike` — duri lantai (mengarah atas) atau langit-langit (mengarah bawah)
- `FallingSpike` — duri jatuh periodik dari langit-langit
- `Saw` — gergaji berputar, bergerak horizontal atau vertikal

### `objects/objects.js`
- `Coin` — koin beranimasi, bisa dikumpulkan (+30 score)
- `MovingPlatform` — platform bergerak, membawa player
- `Checkpoint` — bendera simpan progress (+100 score)
- `BossGate` — zona pemicu boss fight
- `Portal` — pintu ke level berikutnya (aktif setelah boss kalah)

### `ui/hud.js`
- `drawHUDCanvas()` — HP bar gradient + obor dekoratif (canvas)
- `updateHUD()` — update lives, score, coins, timer (HTML)
- `showBossBar()` / `updateBossBar()` / `hideBossBar()` — boss HP bar
- `flashDamage()` — overlay merah saat kena damage
- `showCheckpointPopup()` — notifikasi checkpoint tersimpan

### `ui/screens.js`
- `showScreen()` — ganti layar aktif
- `loadProgress()` / `saveProgress()` / `resetProgress()` — localStorage
- `isStageUnlocked()` — cek syarat buka stage (min 2 bintang)
- `renderStageSelect()` — render kartu stage di UI
- `computeLevelStars()` / `renderLevelClearStars()` — hitung & tampilkan bintang
- `spawnTitleParticles()` — partikel animasi di title screen

---

## Urutan Load (index.html)

```
game.js              ← engine: canvas, PAL, G, Particles, helpers, game loop
assets/map/tilemap.js
assets/map/levels.js
assets/obstacles/obstacles.js
assets/objects/objects.js
assets/characters/player.js
assets/characters/boss.js
assets/ui/hud.js
assets/ui/screens.js ← terakhir: memanggil _bindUIAndBoot()
```
