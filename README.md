# The Punch Guy 👊
### A Pixel RPG Adventure — v1.0

---

## 🚀 Cara Membuka di VS Code

1. Buka folder `pixel-rpg` di VS Code
2. Install ekstensi **Live Server** (oleh Ritwick Dey)
3. Klik kanan pada `index.html` → **"Open with Live Server"**
4. Game akan terbuka di browser secara otomatis!

> Atau cukup buka file `index.html` langsung di browser (double-click)

---

## 🎮 Kontrol

| Tombol              | Aksi             |
|---------------------|------------------|
| `A` / `←`           | Gerak kiri       |
| `D` / `→`           | Gerak kanan      |
| `W` / `↑` / `Space` | Lompat           |
| `K` / `X` (di udara)| Double Jump      |
| `J` / `Z`           | Serang (pukul)   |
| `ESC`               | Pause            |

---

## 🗺️ Level Overview

### Level 1 — The Dark Forest
- Hutan gelap dengan jurang dan paku
- Boss: **Shadow Knight** — meluncurkan proyektil pedang, makin cepat di fase rendah HP
- Terdapat 2 checkpoint, moving platform, saw blade bergerak

### Level 2 — The Stone Citadel
- Benteng batu dengan jebakan lebih kompleks
- Boss: **Phantom Warlord** — bisa teleport, tembakan multi-arah
- Falling spike dari langit-langit, 3 jurang lebar

### Level 3 — The Lava Abyss
- Jurang lava aktif — jatuh = mati langsung
- Boss: **Inferno Reaper** — melompat, tembakan 5 arah di fase akhir
- Saw blade paling banyak, checkpoint di tengah lava pit

---

## ⚠️ Rintangan & Jebakan

| Rintangan         | Efek                              |
|-------------------|-----------------------------------|
| 🔺 Paku (atas)    | Respawn di checkpoint terakhir    |
| 🔻 Paku gantung   | Respawn di checkpoint terakhir    |
| 💀 Falling Spike  | Jatuh dari langit-langit tiba-tiba|
| ⚙️ Saw Blade      | Bergerak bolak-balik, mati seketika|
| 🕳️ Jurang / Lava  | Jatuh = mati, -1 nyawa            |
| ⚔️ Proyektil Bos  | Setiap kena = -1 ❤ (heart)       |

---

## 🏆 Sistem Skor

- Coin dikumpulkan: **+30 poin**
- Hit bos: **+50 poin**
- Bos dikalahkan: **+500 poin**
- Checkpoint disentuh: **+100 poin**

---

## 📁 Struktur File

```
pixel-rpg/
├── index.html          # Halaman utama game
├── css/
│   └── style.css       # Semua styling & animasi UI
├── js/
│   └── game.js         # Engine game + level + bos + fisika
└── README.md           # Panduan ini
```

---

*Semua asset (karakter, bos, tile, efek) dibuat dengan Canvas 2D API — tidak ada gambar eksternal yang dibutuhkan!*
