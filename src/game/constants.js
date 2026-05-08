// Grid and canvas settings
export const GRID_SIZE = 32 // pixels per tile
export const GRID_WIDTH = 25
export const GRID_HEIGHT = 16
export const CANVAS_WIDTH = GRID_WIDTH * GRID_SIZE
export const CANVAS_HEIGHT = GRID_HEIGHT * GRID_SIZE

// Damage types — one per tower. Each interacts uniquely with enemy resistances.
// KINETIC:   basic kinetic rounds — neutral, no specialization.
// PIERCING:  high-velocity sniper darts — punch through armor.
// ENERGY:    rapid energy bolts — bypass physical defenses, struggle vs shielded.
// EXPLOSIVE: splash blasts — devastate clusters, weak vs heavy armor.
export const DAMAGE_TYPES = {
  KINETIC: 'KINETIC',
  PIERCING: 'PIERCING',
  ENERGY: 'ENERGY',
  EXPLOSIVE: 'EXPLOSIVE'
}

export const DAMAGE_TYPE_META = {
  KINETIC:   { label: 'Kinetic',   color: '#cfd2dc' },
  PIERCING:  { label: 'Piercing',  color: '#4ad1ff' },
  ENERGY:    { label: 'Energy',    color: '#ffe066' },
  EXPLOSIVE: { label: 'Explosive', color: '#ff7a3a' }
}

// Tower types — each tower has a unique damage type
export const TOWER_TYPES = {
  BASIC: {
    id: 'BASIC',
    name: 'Basic Tower',
    cost: 100,
    damage: 10,
    range: 3,
    fireRate: 1000,
    color: '#00ff00',
    damageType: DAMAGE_TYPES.KINETIC,
    upgradeCost: 150,
    upgradeDamage: 15,
    upgradeRange: 4
  },
  SNIPER: {
    id: 'SNIPER',
    name: 'Sniper Tower',
    cost: 200,
    damage: 50,
    range: 6,
    fireRate: 2000,
    color: '#0088ff',
    damageType: DAMAGE_TYPES.PIERCING,
    upgradeCost: 300,
    upgradeDamage: 80,
    upgradeRange: 8
  },
  RAPID: {
    id: 'RAPID',
    name: 'Rapid Tower',
    cost: 150,
    damage: 5,
    range: 2.5,
    fireRate: 300,
    color: '#ff00ff',
    damageType: DAMAGE_TYPES.ENERGY,
    upgradeCost: 200,
    upgradeDamage: 8,
    upgradeRange: 3
  },
  SPLASH: {
    id: 'SPLASH',
    name: 'Splash Tower',
    cost: 250,
    damage: 20,
    range: 3,
    fireRate: 1500,
    splashRadius: 1.5,
    color: '#ff8800',
    damageType: DAMAGE_TYPES.EXPLOSIVE,
    upgradeCost: 350,
    upgradeDamage: 35,
    upgradeRange: 4,
    upgradeSplashRadius: 2
  }
}

// Resistance multiplier per damage type (1 = neutral, <1 resists, >1 vulnerable).
// Default is 1 when a key is omitted.
export const ENEMY_TYPES = {
  BASIC: {
    id: 'BASIC',
    health: 50,
    speed: 1.5,
    reward: 10,
    color: '#ff0000',
    size: 12,
    // Neutral target dummy
    resistances: { KINETIC: 1.0, PIERCING: 1.0, ENERGY: 1.0, EXPLOSIVE: 1.0 }
  },
  FAST: {
    id: 'FAST',
    health: 30,
    speed: 3,
    reward: 15,
    color: '#ffff00',
    size: 10,
    // Small and dodgy: hard to hit with direct fire, fries to area damage
    resistances: { KINETIC: 0.7, PIERCING: 0.6, ENERGY: 1.4, EXPLOSIVE: 1.3 }
  },
  TANK: {
    id: 'TANK',
    health: 200,
    speed: 0.8,
    reward: 30,
    color: '#8800ff',
    size: 16,
    // Heavy plating: kinetic bounces, explosives shrug off, but piercing & energy punch through
    resistances: { KINETIC: 0.5, PIERCING: 1.4, ENERGY: 1.2, EXPLOSIVE: 0.6 }
  },
  BOSS: {
    id: 'BOSS',
    health: 500,
    speed: 1,
    reward: 100,
    color: '#ff00ff',
    size: 20,
    // Boss has a weak point exploitable by piercing; resists energy magic
    resistances: { KINETIC: 0.85, PIERCING: 1.3, ENERGY: 0.8, EXPLOSIVE: 0.9 }
  },
  SHIELDED: {
    id: 'SHIELDED',
    health: 60,
    speed: 1.2,
    reward: 25,
    color: '#74e3ff',
    size: 13,
    // Energy shield absorbs the first hits — break it with Piercing or Energy
    resistances: { KINETIC: 0.4, PIERCING: 1.5, ENERGY: 1.4, EXPLOSIVE: 0.4 },
    ability: { kind: 'SHIELD', shield: 60 }
  },
  HEALER: {
    id: 'HEALER',
    health: 80,
    speed: 0.9,
    reward: 35,
    color: '#5cf07a',
    size: 14,
    // Neutral durability — kill priority because it heals nearby enemies
    resistances: { KINETIC: 1.0, PIERCING: 1.0, ENERGY: 1.0, EXPLOSIVE: 1.0 },
    ability: { kind: 'HEAL', radiusTiles: 2.2, healPerSecond: 8, cooldownMs: 1000 }
  },
  SPLITTER: {
    id: 'SPLITTER',
    health: 110,
    speed: 1.0,
    reward: 30,
    color: '#ff6ad5',
    size: 15,
    // Hard to chew without explosives. On death, spawns 2 minis along the path.
    resistances: { KINETIC: 0.85, PIERCING: 1.0, ENERGY: 1.1, EXPLOSIVE: 1.4 },
    ability: { kind: 'SPLIT', count: 2, child: { health: 25, speed: 1.8, reward: 8, color: '#ff9be0', size: 9 } }
  },
  PHANTOM: {
    id: 'PHANTOM',
    health: 50,
    speed: 1.4,
    reward: 40,
    color: '#c9b3ff',
    size: 12,
    // Half-incorporeal: dodges single-target shots half the time, area damage works
    resistances: { KINETIC: 0.6, PIERCING: 0.6, ENERGY: 1.0, EXPLOSIVE: 1.3 },
    ability: { kind: 'PHASE', evadeChance: 0.5 }
  }
}

// Game settings
export const INITIAL_HEALTH = 20
export const INITIAL_MONEY = 400
export const WAVE_PREP_TIME = 15000 // ms between waves

// Paths - multiple predefined paths
export const PATHS = [
  // Path 1: Top to bottom snake
  [
    { x: 0, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 5 },
    { x: 10, y: 5 }, { x: 10, y: 2 }, { x: 15, y: 2 },
    { x: 15, y: 8 }, { x: 20, y: 8 }, { x: 20, y: 12 },
    { x: 24, y: 12 }
  ],
  // Path 2: Left to right waves
  [
    { x: 0, y: 8 }, { x: 4, y: 8 }, { x: 4, y: 4 },
    { x: 8, y: 4 }, { x: 8, y: 12 }, { x: 12, y: 12 },
    { x: 12, y: 6 }, { x: 16, y: 6 }, { x: 16, y: 10 },
    { x: 24, y: 10 }
  ],
  // Path 3: Spiral from outside to inside
  [
    { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 14 },
    { x: 4, y: 14 }, { x: 4, y: 4 }, { x: 16, y: 4 },
    { x: 16, y: 10 }, { x: 24, y: 10 }
  ],
  // Path 4: Diagonal crosses
  [
    { x: 0, y: 4 }, { x: 6, y: 10 }, { x: 12, y: 4 },
    { x: 18, y: 10 }, { x: 24, y: 4 }
  ],
  // Path 5: Double path split
  [
    { x: 0, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 3 },
    { x: 12, y: 3 }, { x: 12, y: 9 }, { x: 16, y: 9 },
    { x: 16, y: 6 }, { x: 24, y: 6 }
  ]
]
