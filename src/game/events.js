// Random events that can occur during waves

export const EVENT_TYPES = {
  DOUBLE_WAVE: {
    id: 'DOUBLE_WAVE',
    name: 'Double Wave!',
    description: 'Twice as many enemies',
    probability: 0.15,
    color: '#ff8800',
    apply: (waveConfig) => {
      waveConfig.enemyCount *= 2
      return waveConfig
    }
  },
  SPEED_BOOST: {
    id: 'SPEED_BOOST',
    name: 'Speed Boost!',
    description: 'Enemies are 50% faster',
    probability: 0.15,
    color: '#ffff00',
    apply: (waveConfig) => {
      waveConfig.speedMultiplier = 1.5
      return waveConfig
    }
  },
  ARMORED: {
    id: 'ARMORED',
    name: 'Armored Enemies!',
    description: 'Enemies have 50% more health',
    probability: 0.15,
    color: '#8800ff',
    apply: (waveConfig) => {
      waveConfig.healthMultiplier = 1.5
      return waveConfig
    }
  },
  BOSS_RUSH: {
    id: 'BOSS_RUSH',
    name: 'Boss Rush!',
    description: 'Multiple bosses incoming',
    probability: 0.1,
    color: '#ff00ff',
    minRound: 5,
    apply: (waveConfig) => {
      waveConfig.bossCount = 3 + Math.floor(waveConfig.round / 5)
      return waveConfig
    }
  },
  SWARM: {
    id: 'SWARM',
    name: 'Swarm!',
    description: 'Many weak, fast enemies',
    probability: 0.15,
    color: '#00ffff',
    apply: (waveConfig) => {
      waveConfig.enemyCount *= 3
      waveConfig.swarmMode = true
      return waveConfig
    }
  },
  MONEY_BONUS: {
    id: 'MONEY_BONUS',
    name: 'Money Bonus!',
    description: 'Double rewards this wave',
    probability: 0.2,
    color: '#00ff00',
    apply: (waveConfig) => {
      waveConfig.rewardMultiplier = 2
      return waveConfig
    }
  },
  AIR_RAID: {
    id: 'AIR_RAID',
    name: 'Air Raid!',
    description: 'Fast flying enemies',
    probability: 0.1,
    color: '#00aaff',
    minRound: 3,
    apply: (waveConfig) => {
      waveConfig.airRaid = true
      waveConfig.speedMultiplier = 2
      return waveConfig
    }
  }
}

export function selectRandomEvent(round) {
  // No events on first 2 rounds
  if (round < 3) return null

  // Every 10 rounds, guaranteed event
  const guaranteedEvent = round % 10 === 0

  if (!guaranteedEvent && Math.random() > 0.3) {
    return null // 70% chance of no event normally
  }

  // Filter events by minimum round requirement
  const availableEvents = Object.values(EVENT_TYPES).filter(
    event => !event.minRound || round >= event.minRound
  )

  // Weighted random selection
  const totalProbability = availableEvents.reduce((sum, e) => sum + e.probability, 0)
  let random = Math.random() * totalProbability

  for (const event of availableEvents) {
    random -= event.probability
    if (random <= 0) {
      return event
    }
  }

  return null
}
