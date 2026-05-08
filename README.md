# Pixel Defense

A minimalist, retro pixel-art tower defense built with **React 19** + **HTML5 Canvas** + **Vite**.
Place towers, survive randomized waves, master random events, and chase the high-score.

> Free, browser-based, mobile-friendly, no tracking.

---

## Features

- **Retro pixel-art aesthetic** with scanlines, particle effects and a custom pixel font (`Press Start 2P`).
- **Endless mode** with 5 random paths chosen each run.
- **4 difficulty levels**: Easy, Normal, Hard, Extreme.
- **Customizable run length**: 10 / 20 / 30 / 40 rounds, or any custom value (1–999).
- **Random wave events**: Double Wave, Speed Boost, Armored, Boss Rush, Swarm, Money Bonus, Air Raid.
- **Pause / Resume**, **skip prep timer**, and **keyboard shortcuts** (1–4 / Space / P / Esc).
- **High-score persistence** per difficulty/round combo via `localStorage`.
- **Responsive layout**: works on desktop and tablet; sidebar collapses below the canvas on small screens.
- **Accessible**: keyboard-controllable menus, ARIA roles, focus rings, `prefers-reduced-motion` support.
- **SEO-ready**: full meta tags, Open Graph, Twitter cards, JSON-LD `VideoGame` schema.

---

## Towers

Every tower deals a unique damage type. The damage type matters: enemies have resistances and vulnerabilities to each one.

| Tower   | Cost | Damage | Range | Speed     | Damage type   | Notes                            |
| ------- | ---- | ------ | ----- | --------- | ------------- | -------------------------------- |
| Basic   | $100 | 10     | 3     | Medium    | ● Kinetic     | All-rounder, no specialization   |
| Sniper  | $200 | 50     | 6     | Slow      | → Piercing    | Punches through armor            |
| Rapid   | $150 | 5      | 2.5   | Very fast | ⚡ Energy     | Bypasses physical defenses       |
| Splash  | $250 | 20     | 3     | Medium    | ✺ Explosive  | Area damage, devastates clusters |

Each tower can be upgraded up to **level 3** during preparation phases. Selling a tower refunds **70%** of its build cost.

## Enemies

- **Basic** — neutral target dummy, no resistances.
- **Fast** — low HP, very high speed; small and dodgy (resists Kinetic / Piercing, weak to Energy / Explosive).
- **Tank** — slow but heavily armored (resists Kinetic / Explosive, weak to Piercing / Energy).
- **Boss** — appears every 5 rounds and during Boss Rush events (weak to Piercing, resists Energy).

## Damage Types & Resistances

The colored badge on every tower tells you what type of damage it deals. While a tower (or its preview) is selected, every enemy on the board shows a small marker:

- **▲ yellow** — vulnerable to that damage type (extra damage)
- **▼ blue** — resistant to that damage type (reduced damage)
- nothing — neutral

Mixing tower types is now mandatory: a Sniper-only run will struggle against Fast swarms, and a Splash-only run will bounce off Tanks.

| Enemy / Type | ● Kinetic | → Piercing | ⚡ Energy | ✺ Explosive |
| ------------ | --------- | ---------- | --------- | ----------- |
| Basic        | 1.0       | 1.0        | 1.0       | 1.0         |
| Fast         | 0.7       | 0.6        | **1.4**   | **1.3**     |
| Tank         | **0.5**   | **1.4**    | 1.2       | **0.6**     |
| Boss         | 0.85      | **1.3**    | 0.8       | 0.9         |

> Values are damage multipliers. **Bold** marks the meaningful resistance / vulnerability.

---

## Controls

| Action                | Mouse / Touch       | Keyboard         |
| --------------------- | ------------------- | ---------------- |
| Select tower type     | Click in shop       | `1` – `4`        |
| Place tower           | Click on grid       | —                |
| Place multiple        | Hold `Shift` + click | —               |
| Inspect / select tower| Click on tower      | —                |
| Skip prep timer       | "Skip" button       | `Space` (in prep)|
| Pause / Resume        | Pause icon          | `P` or `Space`   |
| Deselect              | —                   | `Esc`            |

---

## Run locally

Requires Node.js 18+.

```bash
git clone https://github.com/MiguelJiRo/Pixel-Defense.git
cd Pixel-Defense
npm install
npm run dev          # http://localhost:5173
```

### Production build

```bash
npm run build        # outputs to ./dist
npm run preview      # serves the production build locally
```

---

## Project structure

```
pixel-defense/
├── index.html                 # SEO meta, fonts, design tokens
├── src/
│   ├── App.jsx                # Routing between menu / game / end-screen
│   ├── App.css
│   ├── main.jsx
│   ├── components/
│   │   ├── StartMenu.jsx      # Difficulty / round / high-score panel
│   │   ├── StartMenu.css
│   │   ├── Game.jsx           # Canvas + sidebar + keyboard shortcuts
│   │   └── Game.css
│   ├── game/
│   │   ├── GameManager.js     # Game loop, towers, enemies, waves
│   │   ├── ParticleSystem.js  # Visual effects
│   │   ├── events.js          # Random wave events
│   │   └── constants.js       # Tower/enemy/path tuning
│   └── utils/
│       └── storage.js         # High-score persistence
├── package.json
└── vite.config.js
```

---

## Tips

1. **Cover bends in the path** — corners give towers more attack window.
2. **Mix tower types** — Sniper for tanks, Rapid for swarms, Splash for groups.
3. **Save during prep** — money does not roll over from sells, so don't over-build.
4. **Upgrade > rebuild** — a level-3 tower usually beats two level-1 ones.
5. **Watch the event banner** — adapt your placements before the wave starts.

---

## License

MIT © Miguel Jiménez Rodríguez ([MiguelJiRo](https://github.com/MiguelJiRo)).
