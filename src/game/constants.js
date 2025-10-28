// Grid and canvas settings
export const GRID_SIZE = 32 // pixels per tile
export const GRID_WIDTH = 25
export const GRID_HEIGHT = 16
export const CANVAS_WIDTH = GRID_WIDTH * GRID_SIZE
export const CANVAS_HEIGHT = GRID_HEIGHT * GRID_SIZE

// Tower types
export const TOWER_TYPES = {
  BASIC: {
    id: 'BASIC',
    name: 'Basic Tower',
    cost: 100,
    damage: 10,
    range: 3,
    fireRate: 1000, // ms
    color: '#00ff00',
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
    upgradeCost: 350,
    upgradeDamage: 35,
    upgradeRange: 4,
    upgradeSplashRadius: 2
  }
}

// Enemy types
export const ENEMY_TYPES = {
  BASIC: {
    id: 'BASIC',
    health: 50,
    speed: 1.5,
    reward: 10,
    color: '#ff0000',
    size: 12
  },
  FAST: {
    id: 'FAST',
    health: 30,
    speed: 3,
    reward: 15,
    color: '#ffff00',
    size: 10
  },
  TANK: {
    id: 'TANK',
    health: 200,
    speed: 0.8,
    reward: 30,
    color: '#8800ff',
    size: 16
  },
  BOSS: {
    id: 'BOSS',
    health: 500,
    speed: 1,
    reward: 100,
    color: '#ff00ff',
    size: 20
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
