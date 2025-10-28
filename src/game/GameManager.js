import {
  GRID_SIZE, GRID_WIDTH, GRID_HEIGHT, PATHS,
  TOWER_TYPES, ENEMY_TYPES, INITIAL_HEALTH, INITIAL_MONEY, WAVE_PREP_TIME
} from './constants'
import { selectRandomEvent } from './events'
import { ParticleSystem } from './ParticleSystem'

export class GameManager {
  constructor(config, onGameOver) {
    this.config = config
    this.onGameOver = onGameOver

    // Game state
    this.health = INITIAL_HEALTH
    this.money = INITIAL_MONEY
    this.currentRound = 0
    this.score = 0
    this.gameOver = false

    // Entities
    this.towers = []
    this.enemies = []
    this.projectiles = []
    this.particles = new ParticleSystem()

    // Wave management
    this.waveActive = false
    this.wavePrepTime = WAVE_PREP_TIME
    this.waveTimer = 0  // Start at 0 to give prep time before first wave
    this.currentEvent = null
    this.enemiesSpawned = 0
    this.enemiesToSpawn = 0

    // Path selection
    this.currentPath = this.selectRandomPath()

    // Tower placement
    this.selectedTowerType = null
    this.hoveredCell = null

    // Time tracking
    this.lastTime = Date.now()
  }

  selectRandomPath() {
    return PATHS[Math.floor(Math.random() * PATHS.length)]
  }

  startWave() {
    if (this.currentRound >= this.config.rounds) {
      this.victory = true
      return
    }

    this.currentRound++
    this.waveActive = true
    this.waveTimer = 0
    this.enemiesSpawned = 0

    // Select random event
    this.currentEvent = selectRandomEvent(this.currentRound)

    // Spawn enemies
    this.spawnWave()
  }

  spawnWave() {
    const baseEnemyCount = 5 + this.currentRound * 2
    let enemyCount = Math.floor(baseEnemyCount * this.config.difficultyMultiplier)

    // Apply event modifications
    let waveConfig = {
      round: this.currentRound,
      enemyCount,
      speedMultiplier: 1,
      healthMultiplier: 1,
      rewardMultiplier: 1,
      bossCount: 0,
      swarmMode: false,
      airRaid: false
    }

    if (this.currentEvent) {
      waveConfig = this.currentEvent.apply(waveConfig)
      enemyCount = waveConfig.enemyCount
    }

    const enemyTypes = Object.values(ENEMY_TYPES)

    // Boss Rush event
    if (waveConfig.bossCount > 0) {
      this.enemiesToSpawn = waveConfig.bossCount
      for (let i = 0; i < waveConfig.bossCount; i++) {
        setTimeout(() => {
          if (!this.gameOver) {
            this.spawnEnemy(ENEMY_TYPES.BOSS, waveConfig)
            this.enemiesSpawned++
          }
        }, i * 1500)
      }
      return
    }

    this.enemiesToSpawn = enemyCount

    for (let i = 0; i < enemyCount; i++) {
      // Random enemy type with weighting
      let enemyType
      const rand = Math.random()

      if (waveConfig.swarmMode) {
        // Swarm: mostly fast and basic
        enemyType = rand < 0.7 ? ENEMY_TYPES.FAST : ENEMY_TYPES.BASIC
      } else if (waveConfig.airRaid) {
        // Air raid: all fast
        enemyType = ENEMY_TYPES.FAST
      } else if (this.currentRound < 5) {
        enemyType = rand < 0.8 ? ENEMY_TYPES.BASIC : ENEMY_TYPES.FAST
      } else if (this.currentRound < 10) {
        if (rand < 0.5) enemyType = ENEMY_TYPES.BASIC
        else if (rand < 0.8) enemyType = ENEMY_TYPES.FAST
        else enemyType = ENEMY_TYPES.TANK
      } else {
        if (rand < 0.4) enemyType = ENEMY_TYPES.BASIC
        else if (rand < 0.6) enemyType = ENEMY_TYPES.FAST
        else if (rand < 0.9) enemyType = ENEMY_TYPES.TANK
        else enemyType = ENEMY_TYPES.BOSS
      }

      // Add boss every 5 rounds (unless event overrides)
      if (this.currentRound % 5 === 0 && i === enemyCount - 1 && !waveConfig.swarmMode) {
        enemyType = ENEMY_TYPES.BOSS
      }

      const spawnDelay = waveConfig.swarmMode ? 300 : 800

      setTimeout(() => {
        if (!this.gameOver) {
          this.spawnEnemy(enemyType, waveConfig)
          this.enemiesSpawned++
        }
      }, i * spawnDelay)
    }
  }

  spawnEnemy(enemyType, waveConfig = {}) {
    const startPos = this.currentPath[0]

    const healthMultiplier = waveConfig.healthMultiplier || 1
    const speedMultiplier = waveConfig.speedMultiplier || 1
    const rewardMultiplier = waveConfig.rewardMultiplier || 1

    this.enemies.push({
      type: enemyType,
      health: enemyType.health * this.config.difficultyMultiplier * healthMultiplier,
      maxHealth: enemyType.health * this.config.difficultyMultiplier * healthMultiplier,
      speed: enemyType.speed * speedMultiplier,
      x: startPos.x * GRID_SIZE + GRID_SIZE / 2,
      y: startPos.y * GRID_SIZE + GRID_SIZE / 2,
      pathIndex: 0,
      reward: Math.floor(enemyType.reward * rewardMultiplier)
    })
  }

  placeTower(gridX, gridY, towerType) {
    if (!this.canPlaceTower(gridX, gridY)) return false

    const tower = TOWER_TYPES[towerType]
    if (this.money < tower.cost) return false

    this.money -= tower.cost
    this.towers.push({
      type: tower,
      x: gridX,
      y: gridY,
      lastFire: 0,
      level: 1,
      damage: tower.damage,
      range: tower.range,
      fireRate: tower.fireRate
    })

    return true
  }

  canPlaceTower(gridX, gridY) {
    // Check if on path
    for (const pathPoint of this.currentPath) {
      if (pathPoint.x === gridX && pathPoint.y === gridY) {
        return false
      }
    }

    // Check if tower already exists
    for (const tower of this.towers) {
      if (tower.x === gridX && tower.y === gridY) {
        return false
      }
    }

    return gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT
  }

  upgradeTower(tower) {
    if (this.money < tower.type.upgradeCost) return false
    if (tower.level >= 3) return false

    this.money -= tower.type.upgradeCost
    tower.level++
    tower.damage = tower.type.upgradeDamage * tower.level
    tower.range = tower.type.upgradeRange || tower.range

    return true
  }

  update(deltaTime) {
    if (this.gameOver || this.victory) return

    // Update wave timer
    if (!this.waveActive) {
      this.waveTimer += deltaTime
      if (this.waveTimer >= this.wavePrepTime) {
        this.startWave()
      }
    } else {
      // Check if wave is complete: all enemies spawned AND no enemies left
      if (this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.length === 0) {
        this.waveActive = false
        this.waveTimer = 0
      }
    }

    // Update enemies
    this.updateEnemies(deltaTime)

    // Update towers
    this.updateTowers(deltaTime)

    // Update projectiles
    this.updateProjectiles(deltaTime)

    // Update particles
    this.particles.update(deltaTime)
  }

  updateEnemies(deltaTime) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]

      // Move along path
      if (enemy.pathIndex < this.currentPath.length - 1) {
        const targetPoint = this.currentPath[enemy.pathIndex + 1]
        const targetX = targetPoint.x * GRID_SIZE + GRID_SIZE / 2
        const targetY = targetPoint.y * GRID_SIZE + GRID_SIZE / 2

        const dx = targetX - enemy.x
        const dy = targetY - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < enemy.speed * deltaTime / 16) {
          enemy.pathIndex++
        } else {
          enemy.x += (dx / distance) * enemy.speed * deltaTime / 16
          enemy.y += (dy / distance) * enemy.speed * deltaTime / 16
        }
      } else {
        // Reached end
        const targetPoint = this.currentPath[this.currentPath.length - 1]
        const targetX = targetPoint.x * GRID_SIZE + GRID_SIZE / 2
        const targetY = targetPoint.y * GRID_SIZE + GRID_SIZE / 2

        const dx = targetX - enemy.x
        const dy = targetY - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 5) {
          this.health--
          this.enemies.splice(i, 1)

          if (this.health <= 0) {
            this.gameOver = true
            this.onGameOver()
          }
          continue
        } else {
          enemy.x += (dx / distance) * enemy.speed * deltaTime / 16
          enemy.y += (dy / distance) * enemy.speed * deltaTime / 16
        }
      }

      // Check if dead
      if (enemy.health <= 0) {
        this.money += enemy.reward
        this.score += enemy.reward * 10

        // Create death effects
        this.particles.createExplosion(enemy.x, enemy.y, enemy.type.color, 8)
        this.particles.createMoneyEffect(enemy.x, enemy.y, enemy.reward)

        this.enemies.splice(i, 1)
      }
    }
  }

  updateTowers(deltaTime) {
    const currentTime = Date.now()

    for (const tower of this.towers) {
      if (currentTime - tower.lastFire < tower.fireRate) continue

      // Find target
      let closestEnemy = null
      let closestDistance = Infinity

      const towerX = tower.x * GRID_SIZE + GRID_SIZE / 2
      const towerY = tower.y * GRID_SIZE + GRID_SIZE / 2

      for (const enemy of this.enemies) {
        const dx = enemy.x - towerX
        const dy = enemy.y - towerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= tower.range * GRID_SIZE && distance < closestDistance) {
          closestDistance = distance
          closestEnemy = enemy
        }
      }

      if (closestEnemy) {
        tower.lastFire = currentTime

        // Create projectile
        this.projectiles.push({
          x: towerX,
          y: towerY,
          targetX: closestEnemy.x,
          targetY: closestEnemy.y,
          target: closestEnemy,
          damage: tower.damage,
          speed: 8,
          color: tower.type.color,
          splash: tower.type.splashRadius || 0
        })
      }
    }
  }

  updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]

      const dx = proj.targetX - proj.x
      const dy = proj.targetY - proj.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < proj.speed) {
        // Hit target
        if (proj.splash > 0) {
          // Splash damage
          this.particles.createSplashEffect(proj.targetX, proj.targetY, proj.splash * GRID_SIZE, proj.color)

          for (const enemy of this.enemies) {
            const edx = enemy.x - proj.targetX
            const edy = enemy.y - proj.targetY
            const dist = Math.sqrt(edx * edx + edy * edy)

            if (dist <= proj.splash * GRID_SIZE) {
              enemy.health -= proj.damage
            }
          }
        } else {
          // Single target
          this.particles.createHitEffect(proj.targetX, proj.targetY)

          if (proj.target && proj.target.health > 0) {
            proj.target.health -= proj.damage
          }
        }

        this.projectiles.splice(i, 1)
      } else {
        proj.x += (dx / distance) * proj.speed
        proj.y += (dy / distance) * proj.speed
      }
    }
  }

  getState() {
    return {
      health: this.health,
      money: this.money,
      round: this.currentRound,
      totalRounds: this.config.rounds,
      score: this.score,
      waveActive: this.waveActive,
      waveTimer: this.waveTimer,
      wavePrepTime: this.wavePrepTime,
      towers: this.towers,
      enemies: this.enemies,
      projectiles: this.projectiles,
      particles: this.particles,
      currentPath: this.currentPath,
      currentEvent: this.currentEvent,
      victory: this.victory || false
    }
  }
}
