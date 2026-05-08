// Run modifiers — applied for the entire run when chosen at game start.
// Each modifier carries an `apply` block with multipliers / flags read by GameManager.
//
// Sign legend:
//   '+'  → purely positive
//   '−'  → purely negative (challenge runs)
//   '±'  → tradeoff
export const RUN_MODIFIERS = {
  COMPOUND_INTEREST: {
    id: 'COMPOUND_INTEREST',
    name: 'Compound Interest',
    description: '+5% interest on saved gold at the start of each wave',
    flavor: 'Money makes money.',
    sign: '+',
    color: '#ffd24a',
    apply: { goldInterest: 0.05 }
  },
  FRUGAL: {
    id: 'FRUGAL',
    name: 'Frugal Engineering',
    description: 'Towers cost 12% less to build',
    flavor: 'Smart shopping.',
    sign: '+',
    color: '#5cf07a',
    apply: { towerCostMul: 0.88 }
  },
  SHARPSHOOTERS: {
    id: 'SHARPSHOOTERS',
    name: 'Sharpshooters',
    description: '+15% range to all towers',
    flavor: 'Eyes on the horizon.',
    sign: '+',
    color: '#4ad1ff',
    apply: { towerRangeMul: 1.15 }
  },
  OVERCHARGE: {
    id: 'OVERCHARGE',
    name: 'Overcharge',
    description: '+12% damage to all towers',
    flavor: 'More juice.',
    sign: '+',
    color: '#ffe066',
    apply: { towerDamageMul: 1.12 }
  },
  GLASS_CANNONS: {
    id: 'GLASS_CANNONS',
    name: 'Glass Cannons',
    description: 'Towers deal +40% damage but lose 25% range',
    flavor: 'Hit hard, hit close.',
    sign: '±',
    color: '#ff7a3a',
    apply: { towerDamageMul: 1.4, towerRangeMul: 0.75 }
  },
  SPEED_DEMONS: {
    id: 'SPEED_DEMONS',
    name: 'Speed Demons',
    description: 'Towers fire 20% faster, enemies move 10% faster',
    flavor: 'Everything goes faster.',
    sign: '±',
    color: '#ff5ad8',
    apply: { towerFireRateMul: 0.8, enemySpeedMul: 1.1 }
  },
  PYROMANIAC_PACT: {
    id: 'PYROMANIAC_PACT',
    name: 'Pyromaniac Pact',
    description: 'Burn lasts twice as long, but towers cost 15% more',
    flavor: 'Light it up.',
    sign: '±',
    color: '#ff5b3a',
    apply: { burnDurationMul: 2, towerCostMul: 1.15 }
  },
  IRON_LEGION: {
    id: 'IRON_LEGION',
    name: 'Iron Legion',
    description: 'Enemies have +25% HP but drop +30% gold',
    flavor: 'Tougher waves, fatter purses.',
    sign: '−',
    color: '#a47bff',
    apply: { enemyHealthMul: 1.25, rewardMul: 1.3 }
  },
  THIN_LINE: {
    id: 'THIN_LINE',
    name: 'Thin Line',
    description: 'Start with half HP, but kills are worth +20% score',
    flavor: 'Live dangerously.',
    sign: '−',
    color: '#ff3355',
    apply: { startHealthMul: 0.5, scoreMul: 1.2 }
  },
  DEEP_POCKETS: {
    id: 'DEEP_POCKETS',
    name: 'Deep Pockets',
    description: 'Start with +$200, but enemy rewards reduced 15%',
    flavor: 'Front-loaded.',
    sign: '±',
    color: '#74e3ff',
    apply: { startMoneyAdd: 200, rewardMul: 0.85 }
  }
}

// Pick `count` random modifiers as choices for the player
export function pickModifierChoices(count = 3) {
  const all = Object.values(RUN_MODIFIERS)
  const pool = [...all]
  const out = []
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}
