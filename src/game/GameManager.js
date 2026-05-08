import {
  GRID_SIZE, GRID_WIDTH, GRID_HEIGHT, PATHS,
  TOWER_TYPES, ENEMY_TYPES, INITIAL_HEALTH, INITIAL_MONEY, WAVE_PREP_TIME
} from './constants'
import { selectRandomEvent } from './events'
import { ParticleSystem } from './ParticleSystem'
import { sound } from './SoundManager'

const SELL_REFUND_RATIO = 0.7

export class GameManager {
  constructor(config, onGameOver) {
    this.config = config
    this.onGameOver = onGameOver

    this.health = INITIAL_HEALTH
    this.money = INITIAL_MONEY
    this.currentRound = 0
    this.score = 0
    this.gameOver = false
    this.victory = false
    this.paused = false

    this.towers = []
    this.enemies = []
    this.projectiles = []
    this.particles = new ParticleSystem()

    this.waveActive = false
    this.wavePrepTime = WAVE_PREP_TIME
    this.waveTimer = 0
    this.currentEvent = null
    this.enemiesSpawned = 0
    this.enemiesToSpawn = 0
    this.spawnQueue = []

    this.stats = {
      kills: 0,
      towersBuilt: 0,
      moneySpent: 0,
      moneyEarned: 0,
      leaks: 0
    }

    this.currentPath = this.selectRandomPath()
    this.gameTime = 0
  }

  selectRandomPath() {
    return PATHS[Math.floor(Math.random() * PATHS.length)]
  }

  togglePause() {
    if (this.gameOver || this.victory) return
    this.paused = !this.paused
  }

  skipPrep() {
    if (this.waveActive || this.gameOver || this.victory) return
    this.waveTimer = this.wavePrepTime
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

    this.currentEvent = selectRandomEvent(this.currentRound)
    sound.waveStart()
    this.spawnWave()
  }

  spawnWave() {
    const baseEnemyCount = 5 + this.currentRound * 2
    let enemyCount = Math.floor(baseEnemyCount * this.config.difficultyMultiplier)

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

    this.spawnQueue = []

    if (waveConfig.bossCount > 0) {
      this.enemiesToSpawn = waveConfig.bossCount
      for (let i = 0; i < waveConfig.bossCount; i++) {
        this.spawnQueue.push({
          delay: i * 1500,
          type: ENEMY_TYPES.BOSS,
          waveConfig
        })
      }
      return
    }

    this.enemiesToSpawn = enemyCount

    for (let i = 0; i < enemyCount; i++) {
      const rand = Math.random()
      let enemyType

      if (waveConfig.swarmMode) {
        enemyType = rand < 0.7 ? ENEMY_TYPES.FAST : ENEMY_TYPES.BASIC
      } else if (waveConfig.airRaid) {
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

      if (this.currentRound % 5 === 0 && i === enemyCount - 1 && !waveConfig.swarmMode) {
        enemyType = ENEMY_TYPES.BOSS
      }

      const spawnDelay = waveConfig.swarmMode ? 300 : 800

      this.spawnQueue.push({
        delay: i * spawnDelay,
        type: enemyType,
        waveConfig
      })
    }
  }

  spawnEnemy(enemyType, waveConfig = {}) {
    const startPos = this.currentPath[0]

    const healthMultiplier = waveConfig.healthMultiplier || 1
    const speedMultiplier = waveConfig.speedMultiplier || 1
    const rewardMultiplier = waveConfig.rewardMultiplier || 1

    const health = enemyType.health * this.config.difficultyMultiplier * healthMultiplier

    this.enemies.push({
      type: enemyType,
      health,
      maxHealth: health,
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
    if (!tower || this.money < tower.cost) return false

    this.money -= tower.cost
    this.stats.moneySpent += tower.cost
    this.stats.towersBuilt++
    sound.build()

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
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return false

    const cx = gridX + 0.5
    const cy = gridY + 0.5
    const blockDistance = 0.85

    for (let i = 0; i < this.currentPath.length - 1; i++) {
      const a = this.currentPath[i]
      const b = this.currentPath[i + 1]
      const ax = a.x + 0.5
      const ay = a.y + 0.5
      const bx = b.x + 0.5
      const by = b.y + 0.5

      const dx = bx - ax
      const dy = by - ay
      const lenSq = dx * dx + dy * dy
      let t = lenSq === 0 ? 0 : ((cx - ax) * dx + (cy - ay) * dy) / lenSq
      if (t < 0) t = 0
      if (t > 1) t = 1
      const px = ax + t * dx
      const py = ay + t * dy

      if (Math.hypot(cx - px, cy - py) < blockDistance) return false
    }

    for (const tower of this.towers) {
      if (tower.x === gridX && tower.y === gridY) return false
    }

    return true
  }

  upgradeTower(tower) {
    if (!tower || tower.level >= 3) return false
    if (this.money < tower.type.upgradeCost) return false

    this.money -= tower.type.upgradeCost
    this.stats.moneySpent += tower.type.upgradeCost
    tower.level++
    tower.damage = tower.type.upgradeDamage * tower.level
    tower.range = tower.type.upgradeRange || tower.range
    sound.upgrade()

    return true
  }

  sellTower(tower) {
    const idx = this.towers.indexOf(tower)
    if (idx === -1) return 0
    const refund = Math.floor(tower.type.cost * SELL_REFUND_RATIO)
    this.money += refund
    this.towers.splice(idx, 1)
    sound.sell()
    return refund
  }

  update(deltaTime) {
    if (this.gameOver || this.victory || this.paused) return

    this.gameTime += deltaTime

    if (this.spawnQueue.length > 0) {
      const remaining = []
      for (const spawn of this.spawnQueue) {
        spawn.delay -= deltaTime
        if (spawn.delay <= 0) {
          this.spawnEnemy(spawn.type, spawn.waveConfig)
          this.enemiesSpawned++
        } else {
          remaining.push(spawn)
        }
      }
      this.spawnQueue = remaining
    }

    if (!this.waveActive) {
      this.waveTimer += deltaTime
      if (this.waveTimer >= this.wavePrepTime) {
        this.startWave()
      }
    } else if (this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.length === 0) {
      this.waveActive = false
      this.waveTimer = 0
      this.currentEvent = null

      if (this.currentRound >= this.config.rounds) {
        this.victory = true
        sound.victory()
      } else {
        sound.waveClear()
      }
    }

    this.updateEnemies(deltaTime)
    this.updateTowers(deltaTime)
    this.updateProjectiles(deltaTime)
    this.particles.update(deltaTime)
  }

  updateEnemies(deltaTime) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]

      if (enemy.pathIndex < this.currentPath.length - 1) {
        const targetPoint = this.currentPath[enemy.pathIndex + 1]
        const targetX = targetPoint.x * GRID_SIZE + GRID_SIZE / 2
        const targetY = targetPoint.y * GRID_SIZE + GRID_SIZE / 2

        const dx = targetX - enemy.x
        const dy = targetY - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const step = enemy.speed * deltaTime / 16

        if (distance < step) {
          enemy.pathIndex++
        } else {
          enemy.x += (dx / distance) * step
          enemy.y += (dy / distance) * step
        }
      } else {
        const targetPoint = this.currentPath[this.currentPath.length - 1]
        const targetX = targetPoint.x * GRID_SIZE + GRID_SIZE / 2
        const targetY = targetPoint.y * GRID_SIZE + GRID_SIZE / 2

        const dx = targetX - enemy.x
        const dy = targetY - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const step = enemy.speed * deltaTime / 16

        if (distance < 5) {
          this.health--
          this.stats.leaks++
          sound.leak()
          this.enemies.splice(i, 1)

          if (this.health <= 0) {
            this.health = 0
            this.gameOver = true
            this.spawnQueue = []
            this.enemies = []
            this.projectiles = []
            sound.gameOver()
            this.onGameOver?.()
          }
          continue
        }

        enemy.x += (dx / distance) * step
        enemy.y += (dy / distance) * step
      }

      if (enemy.health <= 0) {
        this.money += enemy.reward
        this.score += enemy.reward * 10
        this.stats.kills++
        this.stats.moneyEarned += enemy.reward

        this.particles.createExplosion(enemy.x, enemy.y, enemy.type.color, 8)
        this.particles.createMoneyEffect(enemy.x, enemy.y, enemy.reward)
        sound.enemyDeath()

        this.enemies.splice(i, 1)
      }
    }
  }

  updateTowers() {
    const currentTime = this.gameTime

    for (const tower of this.towers) {
      if (currentTime - tower.lastFire < tower.fireRate) continue

      const towerX = tower.x * GRID_SIZE + GRID_SIZE / 2
      const towerY = tower.y * GRID_SIZE + GRID_SIZE / 2
      const rangePx = tower.range * GRID_SIZE

      let bestEnemy = null
      let bestProgress = -1

      for (const enemy of this.enemies) {
        const dx = enemy.x - towerX
        const dy = enemy.y - towerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > rangePx) continue

        const progress = enemy.pathIndex + (1 - distance / rangePx) * 0.001
        if (progress > bestProgress) {
          bestProgress = progress
          bestEnemy = enemy
        }
      }

      if (bestEnemy) {
        tower.lastFire = currentTime
        sound.shoot(tower.type.id)

        this.projectiles.push({
          x: towerX,
          y: towerY,
          targetX: bestEnemy.x,
          targetY: bestEnemy.y,
          target: bestEnemy,
          damage: tower.damage,
          damageType: tower.type.damageType,
          speed: 8,
          color: tower.type.color,
          splash: tower.type.splashRadius || 0
        })
      }
    }
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]

      const dx = proj.targetX - proj.x
      const dy = proj.targetY - proj.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < proj.speed) {
        if (proj.splash > 0) {
          this.particles.createSplashEffect(proj.targetX, proj.targetY, proj.splash * GRID_SIZE, proj.color)
          sound.explosion()

          for (const enemy of this.enemies) {
            const edx = enemy.x - proj.targetX
            const edy = enemy.y - proj.targetY
            const dist = Math.sqrt(edx * edx + edy * edy)
            if (dist <= proj.splash * GRID_SIZE) {
              this.applyDamage(enemy, proj.damage, proj.damageType)
            }
          }
        } else {
          this.particles.createHitEffect(proj.targetX, proj.targetY)
          sound.hit()
          if (proj.target && proj.target.health > 0) {
            this.applyDamage(proj.target, proj.damage, proj.damageType)
          }
        }

        this.projectiles.splice(i, 1)
      } else {
        proj.x += (dx / distance) * proj.speed
        proj.y += (dy / distance) * proj.speed
      }
    }
  }

  applyDamage(enemy, baseDamage, damageType) {
    if (!enemy || enemy.health <= 0) return
    const resist = enemy.type.resistances?.[damageType]
    const multiplier = damageType === 'TRUE' ? 1 : (resist ?? 1)
    enemy.health -= baseDamage * multiplier
  }

  destroy() {
    this.spawnQueue = []
    this.enemies = []
    this.projectiles = []
    this.towers = []
    this.particles.clear()
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
      victory: this.victory,
      gameOver: this.gameOver,
      paused: this.paused,
      stats: this.stats
    }
  }
}
