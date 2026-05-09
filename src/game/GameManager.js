import {
  GRID_SIZE, GRID_WIDTH, GRID_HEIGHT, PATHS,
  TOWER_TYPES, ENEMY_TYPES, INITIAL_HEALTH, INITIAL_MONEY, WAVE_PREP_TIME,
  WAVE_CLEAR_BONUS_BASE, WAVE_CLEAR_BONUS_PER_ROUND,
  getBossForRound
} from './constants'
import { selectRandomEvent } from './events'
import { ParticleSystem } from './ParticleSystem'
import { sound } from './SoundManager'

const SELL_REFUND_RATIO = 0.7

export class GameManager {
  constructor(config, onGameOver) {
    this.config = config
    this.onGameOver = onGameOver
    this.modifier = config.modifier || null
    this.modifierApply = this.modifier?.apply || {}

    const startHealthMul = this.modifierApply.startHealthMul ?? 1
    const startMoneyAdd = this.modifierApply.startMoneyAdd ?? 0

    this.health = Math.max(1, Math.round(INITIAL_HEALTH * startHealthMul))
    this.maxHealth = this.health
    this.money = INITIAL_MONEY + startMoneyAdd
    this.currentRound = 0
    this.score = 0
    this.gameOver = false
    this.victory = false
    this.paused = false

    this.towers = []
    this.enemies = []
    this.projectiles = []
    this.chainTraces = []
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
    if (!this.config.endless && this.currentRound >= this.config.rounds) {
      this.victory = true
      return
    }

    // Compound interest: applied at the start of every wave to current savings
    const interest = this.modifierApply.goldInterest
    if (interest && this.currentRound > 0) {
      const bonus = Math.floor(this.money * interest)
      if (bonus > 0) {
        this.money += bonus
        this.stats.moneyEarned += bonus
      }
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
    // Smaller waves in early rounds to give the player time to build up an economy.
    const baseEnemyCount = 4 + this.currentRound * 2
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
      // Boss Rush spawns the round-themed unique boss when applicable, else a default
      const bossId = getBossForRound(this.currentRound) || 'OVERLORD'
      const bossType = ENEMY_TYPES[bossId] || ENEMY_TYPES.BOSS
      for (let i = 0; i < waveConfig.bossCount; i++) {
        this.spawnQueue.push({
          delay: i * 1500,
          type: bossType,
          waveConfig
        })
      }
      return
    }

    this.enemiesToSpawn = enemyCount

    for (let i = 0; i < enemyCount; i++) {
      const enemyType = this.pickEnemyForWave(waveConfig, i, enemyCount)

      const spawnDelay = waveConfig.swarmMode ? 300 : 800

      this.spawnQueue.push({
        delay: i * spawnDelay,
        type: enemyType,
        waveConfig
      })
    }
  }

  pickEnemyForWave(waveConfig, index, totalCount) {
    const round = this.currentRound
    const rand = Math.random()

    if (waveConfig.swarmMode) {
      return rand < 0.7 ? ENEMY_TYPES.FAST : ENEMY_TYPES.BASIC
    }
    if (waveConfig.airRaid) {
      return ENEMY_TYPES.FAST
    }

    // Force a unique themed boss as the last enemy of every 5th round
    if (round % 5 === 0 && index === totalCount - 1) {
      const bossId = getBossForRound(round)
      return ENEMY_TYPES[bossId] || ENEMY_TYPES.BOSS
    }

    // Build a weighted pool that introduces new enemies progressively
    const pool = [
      [ENEMY_TYPES.BASIC, 1.0],
      [ENEMY_TYPES.FAST, round >= 2 ? 0.8 : 0.3]
    ]
    if (round >= 4) pool.push([ENEMY_TYPES.SHIELDED, 0.45])
    if (round >= 5) pool.push([ENEMY_TYPES.TANK, 0.5])
    if (round >= 6) pool.push([ENEMY_TYPES.HEALER, 0.25])
    if (round >= 8) pool.push([ENEMY_TYPES.SPLITTER, 0.35])
    if (round >= 10) pool.push([ENEMY_TYPES.PHANTOM, 0.4])

    const total = pool.reduce((s, [, w]) => s + w, 0)
    let r = rand * total
    for (const [type, w] of pool) {
      r -= w
      if (r <= 0) return type
    }
    return pool[0][0]
  }

  spawnEnemy(enemyType, waveConfig = {}, overrides = {}) {
    const startPos = this.currentPath[0]

    const healthMultiplier = waveConfig.healthMultiplier || 1
    const speedMultiplier = waveConfig.speedMultiplier || 1
    const rewardMultiplier = waveConfig.rewardMultiplier || 1

    const modHealthMul = this.modifierApply.enemyHealthMul ?? 1
    const modSpeedMul = this.modifierApply.enemySpeedMul ?? 1
    const modRewardMul = this.modifierApply.rewardMul ?? 1

    // Endless mode: exponential scaling beyond round 20
    let endlessHealthMul = 1
    let endlessRewardMul = 1
    if (this.config.endless && this.currentRound > 20) {
      const extra = this.currentRound - 20
      endlessHealthMul = Math.pow(1.08, extra)
      endlessRewardMul = Math.pow(1.04, extra)
    }

    const baseHealth = (overrides.health ?? enemyType.health) * this.config.difficultyMultiplier * healthMultiplier * modHealthMul * endlessHealthMul
    const baseSpeed = (overrides.speed ?? enemyType.speed) * speedMultiplier * modSpeedMul
    const baseReward = Math.floor((overrides.reward ?? enemyType.reward) * rewardMultiplier * modRewardMul * endlessRewardMul)

    const enemy = {
      type: enemyType,
      health: baseHealth,
      maxHealth: baseHealth,
      speed: baseSpeed,
      x: (overrides.spawnX ?? startPos.x * GRID_SIZE + GRID_SIZE / 2),
      y: (overrides.spawnY ?? startPos.y * GRID_SIZE + GRID_SIZE / 2),
      pathIndex: overrides.pathIndex ?? 0,
      reward: baseReward
    }

    // Initialize ability state per enemy
    const ability = enemyType.ability
    if (ability) {
      if (ability.kind === 'SHIELD') {
        const shieldValue = ability.shield * this.config.difficultyMultiplier * healthMultiplier
        enemy.shield = shieldValue
        enemy.maxShield = shieldValue
      } else if (ability.kind === 'HEAL') {
        enemy.healCooldown = ability.cooldownMs
        enemy.healPulse = 0
      } else if (ability.kind === 'PHASE') {
        enemy.phaseTimer = 0
      } else if (ability.kind === 'REGEN') {
        enemy.regenIdleSince = 0
      } else if (ability.kind === 'SUMMON') {
        enemy.summonCooldown = ability.cooldownMs
      } else if (ability.kind === 'TELEPORT') {
        enemy.teleportCooldown = 0
      } else if (ability.kind === 'OVERLORD') {
        const sh = ability.shield * this.config.difficultyMultiplier * healthMultiplier
        enemy.shield = sh
        enemy.maxShield = sh
        enemy.summonCooldown = ability.summonCooldownMs
        enemy.regenIdleSince = 0
      }
    }

    this.enemies.push(enemy)
    return enemy
  }

  spawnMinion(parent, minionDef) {
    const t = {
      id: 'MINION',
      health: minionDef.health,
      speed: minionDef.speed,
      reward: minionDef.reward,
      color: minionDef.color,
      size: minionDef.size,
      resistances: { KINETIC: 1.0, PIERCING: 1.0, ENERGY: 1.0, EXPLOSIVE: 1.0 }
    }
    return this.spawnEnemy(t, {}, {
      health: minionDef.health,
      speed: minionDef.speed,
      reward: minionDef.reward,
      spawnX: parent.x,
      spawnY: parent.y,
      pathIndex: Math.max(0, parent.pathIndex - 1)
    })
  }

  placeTower(gridX, gridY, towerType) {
    if (!this.canPlaceTower(gridX, gridY)) return false

    if (this.config.allowedTowers && this.config.allowedTowers.length > 0 && !this.config.allowedTowers.includes(towerType)) {
      return false
    }

    const tower = TOWER_TYPES[towerType]
    if (!tower) return false

    // Run modifier: cost, damage, range, fire rate multipliers
    const costMul = this.modifierApply.towerCostMul ?? 1
    const dmgMul = this.modifierApply.towerDamageMul ?? 1
    const rangeMul = this.modifierApply.towerRangeMul ?? 1
    const fireRateMul = this.modifierApply.towerFireRateMul ?? 1

    const cost = Math.ceil(tower.cost * costMul)
    if (this.money < cost) return false

    this.money -= cost
    this.stats.moneySpent += cost
    this.stats.towersBuilt++
    sound.build()

    this.towers.push({
      type: tower,
      x: gridX,
      y: gridY,
      lastFire: 0,
      level: 1,
      damage: tower.damage * dmgMul,
      range: tower.range * rangeMul,
      fireRate: tower.fireRate * fireRateMul,
      effectiveCost: cost
    })

    return true
  }

  effectiveCost(tower) {
    if (!tower) return 0
    const costMul = this.modifierApply.towerCostMul ?? 1
    return Math.ceil(tower.cost * costMul)
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

  upgradeCostFor(tower) {
    const costMul = this.modifierApply.towerCostMul ?? 1
    return Math.ceil(tower.type.upgradeCost * costMul)
  }

  upgradeTower(tower) {
    if (!tower || tower.level >= 3) return false
    const upCost = this.upgradeCostFor(tower)
    if (this.money < upCost) return false

    const dmgMul = this.modifierApply.towerDamageMul ?? 1
    const rangeMul = this.modifierApply.towerRangeMul ?? 1

    this.money -= upCost
    this.stats.moneySpent += upCost
    tower.level++
    tower.damage = tower.type.upgradeDamage * tower.level * dmgMul
    if (tower.type.upgradeRange) tower.range = tower.type.upgradeRange * rangeMul
    sound.upgrade()

    return true
  }

  sellTower(tower) {
    const idx = this.towers.indexOf(tower)
    if (idx === -1) return 0
    const baseCost = tower.effectiveCost ?? tower.type.cost
    const refund = Math.floor(baseCost * SELL_REFUND_RATIO)
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

      // Wave-clear bonus: cushions the early economy without breaking late-game scaling.
      const bonus = WAVE_CLEAR_BONUS_BASE + this.currentRound * WAVE_CLEAR_BONUS_PER_ROUND
      this.money += bonus
      this.stats.moneyEarned += bonus
      this.particles.createMoneyEffect(GRID_SIZE * 1.5, GRID_SIZE * 0.8, bonus)

      if (!this.config.endless && this.currentRound >= this.config.rounds) {
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
    // First pass: tick abilities + status effects
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue

      // Slow status: countdown
      if (enemy.slowRemaining > 0) {
        enemy.slowRemaining -= deltaTime
        if (enemy.slowRemaining <= 0) {
          enemy.slowRemaining = 0
          enemy.slowMultiplier = 1
        }
      }

      // Burn DoT: ticks roughly 4 times per second, ignores shield (it's already inside)
      if (enemy.burnRemaining > 0) {
        enemy.burnRemaining -= deltaTime
        enemy.burnTickAcc = (enemy.burnTickAcc || 0) + deltaTime
        while (enemy.burnTickAcc >= 250 && enemy.health > 0) {
          enemy.burnTickAcc -= 250
          const tickDmg = enemy.burnDamagePerSecond * 0.25
          enemy.health -= tickDmg
        }
      }

      const ability = enemy.type.ability
      if (!ability) continue

      if (ability.kind === 'HEAL') {
        enemy.healCooldown -= deltaTime
        enemy.healPulse = (enemy.healPulse + deltaTime) % 1200
        if (enemy.healCooldown <= 0) {
          enemy.healCooldown = ability.cooldownMs
          const radiusPx = ability.radiusTiles * GRID_SIZE
          const healAmount = ability.healPerSecond * (ability.cooldownMs / 1000)
          for (const ally of this.enemies) {
            if (ally === enemy || ally.health <= 0) continue
            const dx = ally.x - enemy.x
            const dy = ally.y - enemy.y
            if (dx * dx + dy * dy <= radiusPx * radiusPx) {
              ally.health = Math.min(ally.maxHealth, ally.health + healAmount)
              this.particles.createHitEffect(ally.x, ally.y - 6)
            }
          }
        }
      } else if (ability.kind === 'PHASE') {
        if (enemy.phaseTimer > 0) enemy.phaseTimer = Math.max(0, enemy.phaseTimer - deltaTime)
      } else if (ability.kind === 'REGEN') {
        enemy.regenIdleSince = (enemy.regenIdleSince || 0) + deltaTime
        if (enemy.regenIdleSince >= ability.regenDelayMs && enemy.health < enemy.maxHealth) {
          const heal = ability.regenPerSecond * (deltaTime / 1000)
          enemy.health = Math.min(enemy.maxHealth, enemy.health + heal)
          enemy.regenPulse = (enemy.regenPulse || 0) + deltaTime
        }
      } else if (ability.kind === 'SUMMON') {
        enemy.summonCooldown -= deltaTime
        if (enemy.summonCooldown <= 0) {
          enemy.summonCooldown = enemy.health < enemy.maxHealth * 0.5
            ? ability.hurtCooldownMs
            : ability.cooldownMs
          this.spawnMinion(enemy, ability.minion)
          this.particles.createHitEffect(enemy.x, enemy.y)
        }
      } else if (ability.kind === 'TELEPORT') {
        if (enemy.teleportCooldown > 0) enemy.teleportCooldown = Math.max(0, enemy.teleportCooldown - deltaTime)
      } else if (ability.kind === 'OVERLORD') {
        // Combined behavior: regen + summon when wounded
        enemy.regenIdleSince = (enemy.regenIdleSince || 0) + deltaTime
        if (enemy.regenIdleSince >= ability.regenDelayMs && enemy.health < enemy.maxHealth) {
          const heal = ability.regenPerSecond * (deltaTime / 1000)
          enemy.health = Math.min(enemy.maxHealth, enemy.health + heal)
        }
        enemy.summonCooldown -= deltaTime
        if (enemy.summonCooldown <= 0) {
          enemy.summonCooldown = enemy.health < enemy.maxHealth * 0.5
            ? ability.hurtSummonCooldownMs
            : ability.summonCooldownMs
          this.spawnMinion(enemy, ability.minion)
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]

      if (enemy.pathIndex < this.currentPath.length - 1) {
        const targetPoint = this.currentPath[enemy.pathIndex + 1]
        const targetX = targetPoint.x * GRID_SIZE + GRID_SIZE / 2
        const targetY = targetPoint.y * GRID_SIZE + GRID_SIZE / 2

        const dx = targetX - enemy.x
        const dy = targetY - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const speedMul = enemy.slowMultiplier || 1
        const step = enemy.speed * speedMul * deltaTime / 16

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
        const speedMul = enemy.slowMultiplier || 1
        const step = enemy.speed * speedMul * deltaTime / 16

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
            return
          }
          continue
        }

        enemy.x += (dx / distance) * step
        enemy.y += (dy / distance) * step
      }

      if (enemy.health <= 0) {
        const scoreMul = this.modifierApply.scoreMul ?? 1
        this.money += enemy.reward
        this.score += Math.round(enemy.reward * 10 * scoreMul)
        this.stats.kills++
        this.stats.moneyEarned += enemy.reward

        this.particles.createExplosion(enemy.x, enemy.y, enemy.type.color, 8)
        this.particles.createMoneyEffect(enemy.x, enemy.y, enemy.reward)
        sound.enemyDeath()

        // Splitter: spawn small offspring along the path before removing the parent
        const ability = enemy.type.ability
        if (ability?.kind === 'SPLIT' && !enemy.isChild) {
          const child = ability.child
          for (let s = 0; s < ability.count; s++) {
            const offset = (s - (ability.count - 1) / 2) * 14
            const spawned = this.spawnEnemy(enemy.type, {}, {
              health: child.health,
              speed: child.speed,
              reward: child.reward,
              spawnX: enemy.x,
              spawnY: enemy.y + offset,
              pathIndex: Math.max(0, enemy.pathIndex - 1)
            })
            // Mark the spawned enemy as a child to prevent infinite splits
            if (spawned) {
              spawned.isChild = true
              spawned.childOverride = child
            }
          }
        }

        this.enemies.splice(i, 1)
      }
    }
  }

  findBestEnemyInRange(tower) {
    const towerX = tower.x * GRID_SIZE + GRID_SIZE / 2
    const towerY = tower.y * GRID_SIZE + GRID_SIZE / 2
    const rangePx = tower.range * GRID_SIZE

    let bestEnemy = null
    let bestProgress = -1
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue
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
    return bestEnemy
  }

  tickBeamTower(tower, deltaTime) {
    const towerX = tower.x * GRID_SIZE + GRID_SIZE / 2
    const towerY = tower.y * GRID_SIZE + GRID_SIZE / 2
    const rangePx = tower.range * GRID_SIZE

    if (tower.beamTarget) {
      const t = tower.beamTarget
      const dx = t.x - towerX
      const dy = t.y - towerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (t.health <= 0 || dist > rangePx) {
        tower.beamTarget = null
        tower.beamLocked = 0
      }
    }
    if (!tower.beamTarget) {
      tower.beamTarget = this.findBestEnemyInRange(tower)
      tower.beamLocked = 0
    }
    if (!tower.beamTarget) return

    tower.beamLocked = (tower.beamLocked || 0) + deltaTime
    const ramp = Math.min(1, tower.beamLocked / (tower.type.rampDurationMs || 500))
    const dmg = tower.damage * ramp * (deltaTime / 1000)
    this.applyDamage(tower.beamTarget, dmg, tower.type.damageType, false)
  }

  fireChainStrike(tower, primary) {
    const tt = tower.type
    const fromX = tower.x * GRID_SIZE + GRID_SIZE / 2
    const fromY = tower.y * GRID_SIZE + GRID_SIZE / 2
    const trace = [{ x: fromX, y: fromY }]
    let target = primary
    let dmg = tower.damage
    const hitSet = new Set()
    const maxBounces = tt.chainBounces ?? 3
    const falloff = tt.chainFalloff ?? 0.5
    const chainRangePx = (tt.chainRangeTiles ?? 2) * GRID_SIZE

    for (let i = 0; i <= maxBounces; i++) {
      if (!target || target.health <= 0) break
      trace.push({ x: target.x, y: target.y })
      this.applyDamage(target, dmg, tt.damageType, false)
      hitSet.add(target)
      dmg *= falloff

      let nextTarget = null
      let bestDist = chainRangePx
      for (const e of this.enemies) {
        if (hitSet.has(e) || e.health <= 0) continue
        const dx = e.x - target.x
        const dy = e.y - target.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d <= bestDist) {
          bestDist = d
          nextTarget = e
        }
      }
      target = nextTarget
    }
    this.chainTraces.push({ trace, color: tt.color, life: 280, maxLife: 280 })
  }

  updateTowers(deltaTime) {
    const currentTime = this.gameTime

    // Tick chain trace fade-out
    for (let i = this.chainTraces.length - 1; i >= 0; i--) {
      this.chainTraces[i].life -= deltaTime
      if (this.chainTraces[i].life <= 0) this.chainTraces.splice(i, 1)
    }

    for (const tower of this.towers) {
      const behavior = tower.type.behavior

      if (behavior === 'BEAM') {
        this.tickBeamTower(tower, deltaTime)
        continue
      }

      if (currentTime - tower.lastFire < tower.fireRate) continue

      const bestEnemy = this.findBestEnemyInRange(tower)
      if (!bestEnemy) continue

      tower.lastFire = currentTime
      sound.shoot(tower.type.id)

      if (behavior === 'CHAIN') {
        this.fireChainStrike(tower, bestEnemy)
        continue
      }

      // PROJECTILE / SPLASH
      const towerX = tower.x * GRID_SIZE + GRID_SIZE / 2
      const towerY = tower.y * GRID_SIZE + GRID_SIZE / 2
      const tt = tower.type

      const projectile = {
        x: towerX,
        y: towerY,
        targetX: bestEnemy.x,
        targetY: bestEnemy.y,
        target: bestEnemy,
        damage: tower.damage,
        damageType: tt.damageType,
        speed: 8,
        color: tt.color,
        splash: tt.splashRadius || 0
      }
      if (tt.slowAmount) {
        projectile.slowAmount = tt.slowAmount
        projectile.slowDuration = tt.slowDuration
      }
      if (tt.burnDamagePerSecond) {
        const burnMul = this.modifierApply.burnDurationMul ?? 1
        projectile.burnDamagePerSecond = tt.burnDamagePerSecond
        projectile.burnDuration = tt.burnDuration * burnMul
      }
      this.projectiles.push(projectile)
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
              this.applyDamage(enemy, proj.damage, proj.damageType, true)
              this.applyStatuses(enemy, proj)
            }
          }
        } else {
          this.particles.createHitEffect(proj.targetX, proj.targetY)
          sound.hit()
          if (proj.target && proj.target.health > 0) {
            this.applyDamage(proj.target, proj.damage, proj.damageType, false)
            this.applyStatuses(proj.target, proj)
          }
        }

        this.projectiles.splice(i, 1)
      } else {
        proj.x += (dx / distance) * proj.speed
        proj.y += (dy / distance) * proj.speed
      }
    }
  }

  applyStatuses(enemy, proj) {
    if (!enemy || enemy.health <= 0) return
    if (proj.slowDuration && proj.slowAmount) {
      enemy.slowMultiplier = 1 - proj.slowAmount
      enemy.slowRemaining = Math.max(enemy.slowRemaining || 0, proj.slowDuration)
    }
    if (proj.burnDuration && proj.burnDamagePerSecond) {
      enemy.burnDamagePerSecond = Math.max(enemy.burnDamagePerSecond || 0, proj.burnDamagePerSecond)
      enemy.burnRemaining = Math.max(enemy.burnRemaining || 0, proj.burnDuration)
    }
  }

  applyDamage(enemy, baseDamage, damageType, isAreaHit = false) {
    if (!enemy || enemy.health <= 0) return
    const resist = enemy.type.resistances?.[damageType]
    const multiplier = damageType === 'TRUE' ? 1 : (resist ?? 1)
    let dmg = baseDamage * multiplier

    // Phantom: single-target shots have a chance to phase through
    const ability = enemy.type.ability
    if (!isAreaHit && ability?.kind === 'PHASE') {
      if (Math.random() < ability.evadeChance) {
        // Trigger short shimmer (visual cue handled by render via timer)
        enemy.phaseTimer = 250
        return
      }
    }

    // Teleporter: when struck by area damage, jumps forward along the path
    if (isAreaHit && ability?.kind === 'TELEPORT' && enemy.teleportCooldown <= 0) {
      this.teleportEnemyForward(enemy, ability.tilesAhead)
      enemy.teleportCooldown = ability.cooldownMs
    }

    // Shielded: damage hits the shield first
    if (enemy.shield > 0) {
      const absorbed = Math.min(enemy.shield, dmg)
      enemy.shield -= absorbed
      dmg -= absorbed
    }

    if (dmg > 0) {
      enemy.health -= dmg
      // Reset regen idle timer on any meaningful damage
      if (ability?.kind === 'REGEN' || ability?.kind === 'OVERLORD') {
        enemy.regenIdleSince = 0
      }
    }
  }

  teleportEnemyForward(enemy, tilesAhead) {
    // Walk along the remaining path measuring distance until we've moved `tilesAhead` tiles forward.
    let remaining = tilesAhead * GRID_SIZE
    let i = enemy.pathIndex
    let curX = enemy.x
    let curY = enemy.y
    while (i < this.currentPath.length - 1 && remaining > 0) {
      const next = this.currentPath[i + 1]
      const tx = next.x * GRID_SIZE + GRID_SIZE / 2
      const ty = next.y * GRID_SIZE + GRID_SIZE / 2
      const dx = tx - curX
      const dy = ty - curY
      const seg = Math.sqrt(dx * dx + dy * dy)
      if (seg <= remaining) {
        curX = tx
        curY = ty
        i++
        remaining -= seg
      } else {
        const r = remaining / seg
        curX += dx * r
        curY += dy * r
        remaining = 0
      }
    }
    enemy.x = curX
    enemy.y = curY
    enemy.pathIndex = i
    this.particles.createHitEffect(enemy.x, enemy.y)
    this.particles.createHitEffect(enemy.x + 4, enemy.y - 2)
    this.particles.createHitEffect(enemy.x - 4, enemy.y + 2)
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
      maxHealth: this.maxHealth,
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
      chainTraces: this.chainTraces,
      particles: this.particles,
      currentPath: this.currentPath,
      currentEvent: this.currentEvent,
      victory: this.victory,
      gameOver: this.gameOver,
      paused: this.paused,
      stats: this.stats,
      modifier: this.modifier,
      allowedTowers: this.config.allowedTowers,
      endless: !!this.config.endless
    }
  }
}
