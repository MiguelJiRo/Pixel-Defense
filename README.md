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
- **Pause / Resume**, **skip prep timer**, and **keyboard shortcuts** (1–8 / Space / P / M / L / Esc).
- **In-game Legend** (`L` or the `?` icon) — full reference of damage types, towers, enemies and events.
- **Run modes** (toggleable in the main menu, both on by default):
  - *Tower Draft* — pick 5 of 8 towers for the run (56 unique builds).
  - *Run Modifier* — pick 1 of 3 random cards (buffs / tradeoffs / challenges) for the whole run.
- **High-score persistence** per difficulty/round combo via `localStorage`.
- **Responsive layout**: works on desktop and tablet; sidebar collapses below the canvas on small screens.
- **Accessible**: keyboard-controllable menus, ARIA roles, focus rings, `prefers-reduced-motion` support.
- **SEO-ready**: full meta tags, Open Graph, Twitter cards, JSON-LD `VideoGame` schema.

---

## Towers

Eight towers, each with a unique damage type and combat behavior. Mixing them is essential — no single tower handles every threat.

| Tower   | Cost | Damage    | Range | Behavior      | Damage type    | Notes                                                |
| ------- | ---- | --------- | ----- | ------------- | -------------- | ---------------------------------------------------- |
| Basic   | $100 | 10        | 3     | Projectile    | ● Kinetic      | All-rounder, cheap and balanced                      |
| Sniper  | $200 | 50        | 6     | Projectile    | → Piercing     | Long range alpha. Best vs Tanks and Bosses           |
| Rapid   | $150 | 5         | 2.5   | Projectile    | ⚡ Energy      | Very fast rate of fire vs swarms                     |
| Splash  | $250 | 20        | 3     | Splash AoE    | ✺ Explosive   | Hits clusters; bypasses Phantom evasion              |
| Frost   | $200 | 4         | 3     | Projectile +slow | ⚡ Energy   | Slows enemies 50% for 1.5s. Counters Speed Boost     |
| Burn    | $220 | 6 + DoT   | 3     | Projectile +DoT | ✺ Explosive | 12 dmg/s burning for 4s — DoT bypasses shields       |
| Chain   | $280 | 18        | 3     | Chain (3)     | ⚡ Energy      | Bounces to up to 3 enemies with 60% falloff per hop  |
| Beam    | $300 | 14/s      | 4     | Continuous laser | → Piercing | Locks on target, ramps to full damage. Never misses  |

Each tower can be upgraded up to **level 3** during preparation phases. Selling a tower refunds **70%** of its build cost.

## Enemies

Each enemy has a unique resistance profile. Some also carry a special ability with a visible aura on the board.

| Enemy        | First seen | Visible cue                                | Ability                                                                   |
| ------------ | ---------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| **Basic**    | round 1    | plain red square                           | Neutral target dummy, no resistances.                                     |
| **Fast**     | round 1    | small yellow square                        | Dodgy: resists Kinetic / Piercing, melts to Energy / Explosive.           |
| **Tank**     | round 5    | large purple square                        | Heavy armor: resists Kinetic / Explosive, weak to Piercing / Energy.      |
| **Boss**     | every 5    | huge magenta square                        | Massive HP. Weak to Piercing, resists Energy.                             |
| **Shielded** | round 4    | flickering **cyan ring** + blue shield bar | Energy shield absorbs damage first; break it with Piercing or Energy.     |
| **Healer**   | round 6    | pulsing **green halo** + white "+" cross   | Heals every nearby enemy in a radius. Kill it on sight.                   |
| **Splitter** | round 8    | pink body with **4 white corner dots**     | On death, spawns 2 fast, weaker minis. Don't kill it near the path's end. |
| **Phantom**  | round 10   | **translucent body** + orbiting sparkles   | 50% chance to phase through single-target shots. Use area damage.         |

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

## Run Modes

Two opt-in modes selectable from the main menu. They're **on by default** but can be toggled off independently.

### Tower Draft 🎴

Before each run, choose **5 of the 8 towers**. The rest are locked for the run. With 56 possible 5-of-8 combinations you'll constantly face builds that force creative play.

### Run Modifier ⚖️

Pick **1 of 3 random cards** that bend the game's rules for the entire run. Each card is signed:

- **+** purely positive (e.g. *Sharpshooters* +15% range, *Frugal* −12% cost)
- **±** tradeoff (e.g. *Glass Cannons* +40% damage but −25% range, *Speed Demons* faster towers but faster enemies, *Pyromaniac Pact* burn lasts 2× but towers cost +15%)
- **−** challenge (e.g. *Iron Legion* +25% enemy HP but +30% gold, *Thin Line* half starting HP but +20% score)

Both modes can be combined for maximum variety, or disabled if you want the classic experience.

---

## In-game Legend

Press **`L`** or click the **`?`** icon in the header at any time to open a full reference panel covering:

- **Damage types** — icon, color and short description of each.
- **Towers** — stats and which damage type they deal.
- **Enemies** — visual sample of every aura and a one-line description of each ability.
- **Wave events** — every random modifier that can hit a wave.
- **Run modifiers** — every card that can show up in the pre-game pick.
- **Field indicators** — what the ▲ ▼ markers, cyan rings, green halos and translucent bodies mean.

Opening the legend pauses the game; closing it resumes (unless you were already paused).

---

## Controls

| Action                | Mouse / Touch        | Keyboard          |
| --------------------- | -------------------- | ----------------- |
| Select tower type     | Click in shop        | `1` – `8`         |
| Place tower           | Click on grid        | —                 |
| Place multiple        | Hold `Shift` + click | —                 |
| Inspect / select tower| Click on tower       | —                 |
| Skip prep timer       | "Skip" button        | `Space` (in prep) |
| Pause / Resume        | Pause icon           | `P` or `Space`    |
| Mute / Unmute audio   | Speaker icon         | `M`               |
| Open / close Legend   | `?` icon             | `L`               |
| Deselect / close modal| —                    | `Esc`             |

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
│   │   ├── Game.css
│   │   ├── DamageIcon.jsx     # Pixel-style SVG icons for damage types
│   │   ├── Legend.jsx         # In-game reference modal
│   │   ├── Legend.css
│   │   ├── TowerDraft.jsx     # Pre-game draft (pick 5 of 8 towers)
│   │   ├── ModifierPicker.jsx # Pre-game modifier card picker
│   │   └── PreGame.css
│   ├── game/
│   │   ├── GameManager.js     # Game loop, towers, enemies, waves, abilities
│   │   ├── ParticleSystem.js  # Visual effects
│   │   ├── SoundManager.js    # Web Audio synthesizer (SFX + ambient music)
│   │   ├── events.js          # Random wave events
│   │   ├── modifiers.js       # Run modifier registry
│   │   └── constants.js       # Tower / enemy / damage type tuning
│   └── utils/
│       └── storage.js         # High-score persistence
├── package.json
└── vite.config.js
```

---

## Tips

1. **Cover bends in the path** — corners give towers more attack window.
2. **Mix tower types** — Sniper for tanks, Rapid for swarms, Splash for groups, and at least one Splash to deal with Phantoms.
3. **Kill Healers first** — their pulsing green aura tells you the heal range; pull them out of the pack with high-priority Snipers.
4. **Don't kill Splitters near the end** — the minis they spawn can leak before you finish them off; chew them earlier in the path.
5. **Pierce or zap shields** — Kinetic and Explosive bounce off shielded enemies; Piercing or Energy break the bubble in seconds.
6. **Save during prep** — money does not roll over from sells, so don't over-build.
7. **Upgrade > rebuild** — a level-3 tower usually beats two level-1 ones.
8. **Watch the event banner** — adapt your placements before the wave starts.
9. **Hit `L`** anytime — the legend pauses the game and explains every icon you'll meet.

---

## License

MIT © Miguel Jiménez Rodríguez ([MiguelJiRo](https://github.com/MiguelJiRo)).
