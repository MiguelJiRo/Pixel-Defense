import { useEffect, useRef, useState, useCallback } from 'react'
import { GameManager } from '../game/GameManager'
import { sound } from '../game/SoundManager'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_WIDTH, GRID_HEIGHT,
  TOWER_TYPES, INITIAL_HEALTH, INITIAL_MONEY, DAMAGE_TYPE_META
} from '../game/constants'
import DamageIcon from './DamageIcon'
import Legend from './Legend'
import Tutorial from './Tutorial'
import { useT, useLang, translate } from '../i18n/i18n'
import './Game.css'

const TOWER_HOTKEYS = ['1', '2', '3', '4', '5', '6', '7', '8']
const ALL_TOWER_TYPES = Object.values(TOWER_TYPES)
const UI_TICK_MS = 100

function Game({ config, onGameOver, onReturnToMenu, onVictory }) {
  const t = useT()
  const { lang } = useLang()
  const langRef = useRef(lang)
  useEffect(() => { langRef.current = lang }, [lang])
  const colorblindRef = useRef(!!config.colorblind)
  useEffect(() => { colorblindRef.current = !!config.colorblind }, [config.colorblind])

  const towerTypeList = config.allowedTowers && config.allowedTowers.length > 0
    ? ALL_TOWER_TYPES.filter(tw => config.allowedTowers.includes(tw.id))
    : ALL_TOWER_TYPES

  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const gameRef = useRef(null)
  const animationRef = useRef(null)
  const selectedTowerTypeRef = useRef(null)
  const hoveredCellRef = useRef(null)
  const selectedTowerRef = useRef(null)

  const [uiState, setUiState] = useState({
    health: INITIAL_HEALTH,
    maxHealth: INITIAL_HEALTH,
    money: INITIAL_MONEY,
    round: 0,
    totalRounds: config.rounds,
    score: 0,
    waveActive: false,
    waveTimer: 0,
    wavePrepTime: 15000,
    enemyCount: 0,
    currentEvent: null,
    paused: false,
    victory: false,
    gameOver: false,
    stats: { kills: 0, towersBuilt: 0, moneySpent: 0, moneyEarned: 0, leaks: 0 },
    modifier: config.modifier || null
  })
  const [selectedTowerType, setSelectedTowerType] = useState(null)
  const [selectedTower, setSelectedTower] = useState(null)
  const [audio, setAudio] = useState(sound.getState())
  const [legendOpen, setLegendOpen] = useState(false)
  const finishedRef = useRef(false)
  const wasPausedBeforeLegend = useRef(false)
  const legendOpenRef = useRef(false)
  const legendActionsRef = useRef({ open: () => {}, close: () => {} })

  useEffect(() => { selectedTowerTypeRef.current = selectedTowerType }, [selectedTowerType])
  useEffect(() => { selectedTowerRef.current = selectedTower }, [selectedTower])
  useEffect(() => sound.subscribe(setAudio), [])

  useEffect(() => {
    sound.startMusic()
    return () => sound.stopMusic()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const game = new GameManager(config, () => {
      if (finishedRef.current) return
      finishedRef.current = true
      onGameOver?.(game.getState())
    })
    gameRef.current = game

    let lastTime = performance.now()
    let lastUiPush = 0

    const gameLoop = (now) => {
      const deltaTime = Math.min(50, now - lastTime)
      lastTime = now

      game.update(deltaTime)
      render(ctx, game)

      const state = game.getState()

      if (now - lastUiPush > UI_TICK_MS) {
        lastUiPush = now
        setUiState({
          health: state.health,
          maxHealth: state.maxHealth ?? INITIAL_HEALTH,
          money: state.money,
          round: state.round,
          totalRounds: state.totalRounds,
          score: state.score,
          waveActive: state.waveActive,
          waveTimer: state.waveTimer,
          wavePrepTime: state.wavePrepTime,
          enemyCount: state.enemies.length,
          currentEvent: state.currentEvent,
          paused: state.paused,
          victory: state.victory,
          gameOver: state.gameOver,
          stats: { ...state.stats },
          modifier: state.modifier
        })

        if (state.victory && !finishedRef.current) {
          finishedRef.current = true
          onVictory?.(state)
        }
      }

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      game.destroy()
    }
  }, [config, onGameOver, onVictory])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.repeat) return
      const game = gameRef.current
      if (!game) return

      if (e.key === 'Escape') {
        if (legendOpenRef.current) {
          legendActionsRef.current.close()
        } else {
          setSelectedTowerType(null)
          setSelectedTower(null)
        }
        return
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (!game.waveActive && !game.paused) {
          game.skipPrep()
        } else {
          game.togglePause()
        }
        return
      }

      if (e.key.toLowerCase() === 'p') {
        game.togglePause()
        return
      }

      if (e.key.toLowerCase() === 'm') {
        sound.toggleMute()
        return
      }

      if (e.key.toLowerCase() === 'l') {
        if (legendOpenRef.current) legendActionsRef.current.close()
        else legendActionsRef.current.open()
        return
      }

      const idx = TOWER_HOTKEYS.indexOf(e.key)
      if (idx !== -1 && idx < towerTypeList.length) {
        const t = towerTypeList[idx]
        sound.uiClick()
        setSelectedTowerType((cur) => (cur === t.id ? null : t.id))
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const render = useCallback((ctx, game) => {
    const state = game.getState()

    ctx.fillStyle = '#07070b'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) ctx.fillRect(0, y, CANVAS_WIDTH, 1)

    ctx.strokeStyle = '#15151f'
    ctx.lineWidth = 1
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath(); ctx.moveTo(x * GRID_SIZE, 0); ctx.lineTo(x * GRID_SIZE, CANVAS_HEIGHT); ctx.stroke()
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * GRID_SIZE); ctx.lineTo(CANVAS_WIDTH, y * GRID_SIZE); ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(255, 200, 100, 0.08)'
    ctx.lineWidth = GRID_SIZE * 0.85
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let i = 0; i < state.currentPath.length; i++) {
      const p = state.currentPath[i]
      const x = p.x * GRID_SIZE + GRID_SIZE / 2
      const y = p.y * GRID_SIZE + GRID_SIZE / 2
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.strokeStyle = '#2b2438'
    ctx.lineWidth = GRID_SIZE * 0.6
    ctx.beginPath()
    for (let i = 0; i < state.currentPath.length; i++) {
      const p = state.currentPath[i]
      const x = p.x * GRID_SIZE + GRID_SIZE / 2
      const y = p.y * GRID_SIZE + GRID_SIZE / 2
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()

    const startPoint = state.currentPath[0]
    const endPoint = state.currentPath[state.currentPath.length - 1]
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 250)

    ctx.fillStyle = `rgba(0, 255, 136, ${0.5 + pulse * 0.5})`
    ctx.fillRect(
      startPoint.x * GRID_SIZE + GRID_SIZE / 4,
      startPoint.y * GRID_SIZE + GRID_SIZE / 4,
      GRID_SIZE / 2,
      GRID_SIZE / 2
    )

    ctx.fillStyle = `rgba(255, 51, 85, ${0.5 + pulse * 0.5})`
    ctx.fillRect(
      endPoint.x * GRID_SIZE + GRID_SIZE / 4,
      endPoint.y * GRID_SIZE + GRID_SIZE / 4,
      GRID_SIZE / 2,
      GRID_SIZE / 2
    )

    for (const tower of state.towers) {
      const x = tower.x * GRID_SIZE + GRID_SIZE / 2
      const y = tower.y * GRID_SIZE + GRID_SIZE / 2

      if (selectedTowerRef.current === tower) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.08)'
        ctx.beginPath(); ctx.arc(x, y, tower.range * GRID_SIZE, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(tower.x * GRID_SIZE + 6, tower.y * GRID_SIZE + 6, GRID_SIZE - 8, GRID_SIZE - 8)

      ctx.fillStyle = '#1c1c2a'
      ctx.fillRect(tower.x * GRID_SIZE + 4, tower.y * GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8)

      ctx.strokeStyle = '#3c3c55'
      ctx.lineWidth = 2
      ctx.strokeRect(tower.x * GRID_SIZE + 4, tower.y * GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8)

      const turretSize = 12 + tower.level * 2
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.fillRect(x - turretSize / 2 + 2, y - turretSize / 2 + 2, turretSize, turretSize)

      ctx.fillStyle = tower.type.color
      ctx.fillRect(x - turretSize / 2, y - turretSize / 2, turretSize, turretSize)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillRect(x - turretSize / 2 + 2, y - turretSize / 2 + 2, turretSize - 4, 2)

      ctx.fillStyle = '#000'
      ctx.font = 'bold 10px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(tower.level, x + 1, y + 1)
      ctx.fillStyle = '#fff'
      ctx.fillText(tower.level, x, y)
    }

    const previewType = selectedTowerTypeRef.current
      ? TOWER_TYPES[selectedTowerTypeRef.current]?.damageType
      : (selectedTowerRef.current?.type?.damageType || null)

    const now = performance.now()

    for (const enemy of state.enemies) {
      const ability = enemy.type.ability

      // === ABILITY AURAS (rendered behind the enemy body) ===

      // Healer aura: pulsing green circle showing heal radius
      if (ability?.kind === 'HEAL') {
        const radiusPx = ability.radiusTiles * GRID_SIZE
        const pulse = 0.5 + 0.5 * Math.sin(now / 300)
        ctx.fillStyle = `rgba(92, 240, 122, ${0.06 + pulse * 0.06})`
        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, radiusPx, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = `rgba(92, 240, 122, ${0.35 + pulse * 0.25})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Phantom: skip body partially, draw with transparency
      const phantomAlpha = ability?.kind === 'PHASE'
        ? (enemy.phaseTimer > 0 ? 0.25 : 0.55 + 0.15 * Math.sin(now / 200))
        : 1

      // Body shadow
      ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * phantomAlpha})`
      ctx.fillRect(enemy.x - enemy.type.size / 2 + 2, enemy.y - enemy.type.size / 2 + 2, enemy.type.size, enemy.type.size)

      // Body
      ctx.globalAlpha = phantomAlpha
      ctx.fillStyle = enemy.type.color
      ctx.fillRect(enemy.x - enemy.type.size / 2, enemy.y - enemy.type.size / 2, enemy.type.size, enemy.type.size)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillRect(enemy.x - enemy.type.size / 2 + 2, enemy.y - enemy.type.size / 2 + 2, enemy.type.size - 4, 2)

      // === ABILITY MARKERS ON THE BODY ===

      // Colorblind: tiny shape glyphs to distinguish base enemies by form
      if (colorblindRef.current) {
        const id = enemy.type.id
        const cx = enemy.x
        const cy = enemy.y
        ctx.fillStyle = '#ffffff'
        if (id === 'FAST') {
          // Triangle pointing right
          ctx.beginPath()
          ctx.moveTo(cx - 2, cy - 3)
          ctx.lineTo(cx + 3, cy)
          ctx.lineTo(cx - 2, cy + 3)
          ctx.closePath()
          ctx.fill()
        } else if (id === 'TANK') {
          // Inner ring
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(cx, cy, 3, 0, Math.PI * 2)
          ctx.stroke()
        } else if (id === 'BOSS' || enemy.type.isBoss) {
          // Diamond
          ctx.beginPath()
          ctx.moveTo(cx, cy - 4)
          ctx.lineTo(cx + 4, cy)
          ctx.lineTo(cx, cy + 4)
          ctx.lineTo(cx - 4, cy)
          ctx.closePath()
          ctx.fill()
        }
      }

      // Healer: white "+" cross
      if (ability?.kind === 'HEAL') {
        ctx.fillStyle = '#ffffff'
        const cs = enemy.type.size - 6
        ctx.fillRect(enemy.x - 1, enemy.y - cs / 2, 2, cs)
        ctx.fillRect(enemy.x - cs / 2, enemy.y - 1, cs, 2)
      }

      // Splitter: 4 small dots indicating split potential
      if (ability?.kind === 'SPLIT' && !enemy.isChild) {
        ctx.fillStyle = '#ffffff'
        const off = enemy.type.size / 2 - 3
        ctx.fillRect(enemy.x - off - 1, enemy.y - off - 1, 2, 2)
        ctx.fillRect(enemy.x + off - 1, enemy.y - off - 1, 2, 2)
        ctx.fillRect(enemy.x - off - 1, enemy.y + off - 1, 2, 2)
        ctx.fillRect(enemy.x + off - 1, enemy.y + off - 1, 2, 2)
      }
      ctx.globalAlpha = 1

      // Shielded: outer ring whose thickness reflects current shield
      if (ability?.kind === 'SHIELD' && enemy.shield > 0) {
        const shieldPct = enemy.shield / enemy.maxShield
        const ringRadius = enemy.type.size / 2 + 4
        const flicker = 0.7 + 0.3 * Math.sin(now / 180)
        ctx.strokeStyle = `rgba(116, 227, 255, ${flicker})`
        ctx.lineWidth = 1 + 2 * shieldPct
        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, ringRadius, 0, Math.PI * 2); ctx.stroke()
        // inner soft glow
        ctx.fillStyle = `rgba(116, 227, 255, ${0.05 + 0.05 * shieldPct})`
        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, ringRadius, 0, Math.PI * 2); ctx.fill()
      }

      // Phantom: occasional sparkle dots around it
      if (ability?.kind === 'PHASE') {
        const sparkleAngle = now / 200
        for (let s = 0; s < 3; s++) {
          const a = sparkleAngle + (s * Math.PI * 2) / 3
          const sx = enemy.x + Math.cos(a) * (enemy.type.size / 2 + 4)
          const sy = enemy.y + Math.sin(a) * (enemy.type.size / 2 + 4)
          ctx.fillStyle = `rgba(201, 179, 255, ${0.6 + 0.3 * Math.sin(now / 150 + s)})`
          ctx.fillRect(sx - 1, sy - 1, 2, 2)
        }
      }

      const healthBarWidth = enemy.type.size
      const healthBarHeight = 3
      const healthPercent = Math.max(0, enemy.health / enemy.maxHealth)

      ctx.fillStyle = '#000'
      ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.type.size / 2 - 6, healthBarWidth, healthBarHeight)

      ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffcc00' : '#ff3355'
      ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.type.size / 2 - 6, healthBarWidth * healthPercent, healthBarHeight)

      // Shield bar above the health bar
      if (ability?.kind === 'SHIELD' && enemy.maxShield > 0) {
        const sPct = Math.max(0, enemy.shield / enemy.maxShield)
        ctx.fillStyle = '#000'
        ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.type.size / 2 - 10, healthBarWidth, healthBarHeight)
        ctx.fillStyle = '#74e3ff'
        ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.type.size / 2 - 10, healthBarWidth * sPct, healthBarHeight)
      }

      // Slow status: blue tint over body + small icicle marker
      if (enemy.slowRemaining > 0) {
        ctx.fillStyle = `rgba(92, 230, 255, ${0.25 + 0.15 * Math.sin(now / 150)})`
        ctx.fillRect(enemy.x - enemy.type.size / 2, enemy.y - enemy.type.size / 2, enemy.type.size, enemy.type.size)
        ctx.fillStyle = '#5ce6ff'
        ctx.fillRect(enemy.x - enemy.type.size / 2 - 3, enemy.y - enemy.type.size / 2 - 1, 2, 4)
      }

      // Burn status: flickering flames above
      if (enemy.burnRemaining > 0) {
        const flicker = Math.sin(now / 80 + enemy.x) * 0.5 + 0.5
        ctx.fillStyle = `rgba(255, 91, 58, ${0.6 + 0.3 * flicker})`
        ctx.fillRect(enemy.x - 4, enemy.y - enemy.type.size / 2 - 14, 2, 4 + Math.floor(flicker * 3))
        ctx.fillStyle = `rgba(255, 200, 60, ${0.7 + 0.2 * flicker})`
        ctx.fillRect(enemy.x - 1, enemy.y - enemy.type.size / 2 - 16, 2, 5 + Math.floor((1 - flicker) * 3))
        ctx.fillStyle = `rgba(255, 91, 58, ${0.6 + 0.2 * flicker})`
        ctx.fillRect(enemy.x + 2, enemy.y - enemy.type.size / 2 - 14, 2, 4 + Math.floor(flicker * 2))
      }

      // Resistance / vulnerability indicator vs the selected damage type
      if (previewType && enemy.type.resistances) {
        const resist = enemy.type.resistances[previewType]
        if (resist != null && resist !== 1) {
          const isResist = resist < 1
          const color = isResist ? '#7a8bff' : '#ffe066'
          ctx.font = 'bold 9px "Press Start 2P", monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const txt = isResist ? '▼' : '▲'
          const ix = enemy.x + enemy.type.size / 2 + 4
          const iy = enemy.y - enemy.type.size / 2 - 1
          ctx.fillStyle = '#000'
          ctx.fillText(txt, ix + 1, iy + 1)
          ctx.fillStyle = color
          ctx.fillText(txt, ix, iy)
        }
      }
    }

    for (const proj of state.projectiles) {
      ctx.fillStyle = proj.color + '44'
      ctx.fillRect(proj.x - 5, proj.y - 5, 10, 10)
      ctx.fillStyle = proj.color
      ctx.fillRect(proj.x - 3, proj.y - 3, 6, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2)
    }

    // BEAM: continuous laser from each beam tower to its locked target
    for (const tower of state.towers) {
      if (tower.type.behavior !== 'BEAM' || !tower.beamTarget) continue
      const target = tower.beamTarget
      if (!target || target.health <= 0) continue
      const fromX = tower.x * GRID_SIZE + GRID_SIZE / 2
      const fromY = tower.y * GRID_SIZE + GRID_SIZE / 2
      const ramp = Math.min(1, (tower.beamLocked || 0) / (tower.type.rampDurationMs || 500))

      // Outer glow
      ctx.strokeStyle = tower.type.color + '55'
      ctx.lineWidth = 5 + ramp * 2
      ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(target.x, target.y); ctx.stroke()
      // Inner core
      ctx.strokeStyle = tower.type.color
      ctx.lineWidth = 1 + ramp * 2
      ctx.stroke()
      // Bright impact dot
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(target.x - 2, target.y - 2, 4, 4)
    }

    // CHAIN: render fading lightning trails
    if (state.chainTraces) {
      for (const tr of state.chainTraces) {
        const alpha = tr.life / tr.maxLife
        ctx.strokeStyle = tr.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 2
        ctx.beginPath()
        const pts = tr.trace
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1]
          // Jagged segments for lightning feel
          const midX = (a.x + b.x) / 2 + (Math.sin(now / 30 + i) * 4)
          const midY = (a.y + b.y) / 2 + (Math.cos(now / 35 + i) * 4)
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(midX, midY)
          ctx.lineTo(b.x, b.y)
        }
        ctx.stroke()
        // Bright core
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    if (state.particles) state.particles.render(ctx)

    const hovered = hoveredCellRef.current
    const towerType = selectedTowerTypeRef.current
    if (hovered && towerType) {
      const { x, y } = hovered
      const canPlace = game.canPlaceTower(x, y)
      const tower = TOWER_TYPES[towerType]
      const affordable = game.money >= tower.cost

      ctx.fillStyle = canPlace && affordable
        ? 'rgba(0, 255, 136, 0.25)'
        : 'rgba(255, 51, 85, 0.25)'
      ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)

      if (canPlace) {
        const centerX = x * GRID_SIZE + GRID_SIZE / 2
        const centerY = y * GRID_SIZE + GRID_SIZE / 2
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.beginPath(); ctx.arc(centerX, centerY, tower.range * GRID_SIZE, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = tower.color + '99'
        ctx.fillRect(centerX - 8, centerY - 8, 16, 16)
      }
    }

    if (state.paused && !state.gameOver && !state.victory) {
      const curLang = langRef.current
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(translate(curLang, 'game.paused'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
      ctx.fillStyle = '#8a8aa3'
      ctx.font = '14px "Press Start 2P", monospace'
      ctx.fillText(translate(curLang, 'game.pausedHint'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
  }, [])

  const cellFromEvent = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const cx = (e.clientX - rect.left) * scaleX
    const cy = (e.clientY - rect.top) * scaleY
    return { x: Math.floor(cx / GRID_SIZE), y: Math.floor(cy / GRID_SIZE) }
  }, [])

  const handleCanvasClick = (e) => {
    const game = gameRef.current
    if (!game) return
    const cell = cellFromEvent(e)
    if (!cell) return

    if (selectedTowerType) {
      const success = game.placeTower(cell.x, cell.y, selectedTowerType)
      if (!success) sound.cantAfford()
      if (success && !e.shiftKey) setSelectedTowerType(null)
    } else {
      const tower = game.towers.find(t => t.x === cell.x && t.y === cell.y)
      if (tower) sound.uiClick()
      setSelectedTower(tower || null)
    }
  }

  const handleCanvasMouseMove = (e) => {
    hoveredCellRef.current = cellFromEvent(e)
  }

  const handleCanvasMouseLeave = () => {
    hoveredCellRef.current = null
  }

  const handleUpgradeTower = () => {
    const game = gameRef.current
    if (game && selectedTower) {
      const ok = game.upgradeTower(selectedTower)
      if (!ok) sound.cantAfford()
    }
  }

  const handleSellTower = () => {
    const game = gameRef.current
    if (game && selectedTower) {
      game.sellTower(selectedTower)
      setSelectedTower(null)
    }
  }

  const handlePauseToggle = () => { sound.uiClick(); gameRef.current?.togglePause() }
  const handleSkipPrep = () => { sound.uiClick(); gameRef.current?.skipPrep() }
  const handleMuteToggle = () => sound.toggleMute()

  const openLegend = () => {
    sound.uiClick()
    const game = gameRef.current
    if (game) {
      wasPausedBeforeLegend.current = game.paused
      if (!game.paused) game.togglePause()
    }
    legendOpenRef.current = true
    setLegendOpen(true)
  }

  const closeLegend = () => {
    legendOpenRef.current = false
    setLegendOpen(false)
    const game = gameRef.current
    if (game && game.paused && !wasPausedBeforeLegend.current) {
      game.togglePause()
    }
  }

  legendActionsRef.current = { open: openLegend, close: closeLegend }

  const prepRemaining = Math.max(0, Math.ceil((uiState.wavePrepTime - uiState.waveTimer) / 1000))
  const healthPct = Math.max(0, Math.min(100, (uiState.health / (uiState.maxHealth || INITIAL_HEALTH)) * 100))

  return (
    <div className="game-container" ref={wrapRef}>
      <header className="game-header" role="banner">
        <div className="header-stats">
          <div className="stat" aria-label={`${t('game.health')} ${uiState.health}/${uiState.maxHealth || INITIAL_HEALTH}`}>
            <span className="stat-label">{t('game.health')}</span>
            <div className="stat-bar">
              <div className="stat-bar-fill health" style={{ width: `${healthPct}%` }} />
              <span className="stat-bar-text">{uiState.health}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">{t('game.money')}</span>
            <span className="stat-value money">${uiState.money}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('game.round')}</span>
            <span className="stat-value">
              {uiState.round}{config.endless ? <span className="endless-mark" title={t('menu.endless.name')}>/∞</span> : `/${uiState.totalRounds}`}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('game.score')}</span>
            <span className="stat-value">{uiState.score}</span>
          </div>
          {uiState.modifier && (
            <div
              className="modifier-pill"
              style={{ borderColor: uiState.modifier.color, color: uiState.modifier.color }}
              title={t(`modifier.${uiState.modifier.id}.desc`, uiState.modifier.description)}
            >
              <span className="modifier-pill-sign">{uiState.modifier.sign}</span>
              <span className="modifier-pill-name">{t(`modifier.${uiState.modifier.id}.name`, uiState.modifier.name)}</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            onClick={openLegend}
            aria-label={t('game.openLegend')}
            title={t('game.legendTitle')}
          >
            ?
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={handleMuteToggle}
            aria-label={audio.muted ? t('menu.audioOff') : t('menu.audioOn')}
            title={audio.muted ? t('game.unmuteTitle') : t('game.muteTitle')}
          >
            {audio.muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={handlePauseToggle}
            aria-label={uiState.paused ? t('game.resume') : t('game.pause')}
            title={t('game.pauseTitle')}
          >
            {uiState.paused ? '▶' : 'II'}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onReturnToMenu}
            aria-label={t('game.returnToMenu')}
            title={t('game.returnToMenu')}
          >
            ✕
          </button>
        </div>
      </header>

      <div className="game-content">
        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            className="game-canvas"
            aria-label="Pixel Defense game board"
          />
        </div>

        <aside className="game-sidebar" aria-label="Game controls">
          {!uiState.waveActive && !uiState.victory && !uiState.gameOver ? (
            <div className="wave-status prep">
              <div className="wave-status-row">
                <h3>{uiState.round === 0 ? t('game.prepare') : t('game.prepPhase')}</h3>
                <button
                  type="button"
                  className="skip-button"
                  onClick={handleSkipPrep}
                  title={t('game.skipTitle')}
                >
                  {t('game.skipBtn')}
                </button>
              </div>
              <div className="timer">
                {t('game.nextWaveIn')} <strong>{prepRemaining}s</strong>
              </div>
              <div className="prep-progress">
                <div
                  className="prep-progress-fill"
                  style={{ width: `${(uiState.waveTimer / uiState.wavePrepTime) * 100}%` }}
                />
              </div>
            </div>
          ) : uiState.waveActive ? (
            <div className="wave-status active">
              <h3>{t('game.wave', null, { n: uiState.round })}</h3>
              <div className="enemy-count">
                {t('game.enemiesLeft')} <strong>{uiState.enemyCount}</strong>
              </div>
              {uiState.currentEvent && (
                <div className="event-banner" style={{ borderColor: uiState.currentEvent.color }}>
                  <div className="event-title" style={{ color: uiState.currentEvent.color }}>
                    {t(`event.${uiState.currentEvent.id}.name`, uiState.currentEvent.name)}
                  </div>
                  <div className="event-description">
                    {t(`event.${uiState.currentEvent.id}.desc`, uiState.currentEvent.description)}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <section className="tower-shop" aria-label={t('game.build')}>
            <h3>{t('game.build')}</h3>
            <ul className="tower-list">
              {towerTypeList.map((tower, idx) => {
                const costMul = uiState.modifier?.apply?.towerCostMul ?? 1
                const effCost = Math.ceil(tower.cost * costMul)
                const affordable = uiState.money >= effCost
                const active = selectedTowerType === tower.id
                const dt = DAMAGE_TYPE_META[tower.damageType]
                const localizedName = t(`tower.${tower.id}.name`, tower.name)
                const localizedShort = t(`tower.${tower.id}.short`, tower.name.replace(/\s*Tower$/i, ''))
                const dtLabel = dt ? t(`damage.${tower.damageType}.label`, dt.label) : ''
                return (
                  <li key={tower.id}>
                    <button
                      type="button"
                      className={`tower-button ${active ? 'active' : ''}`}
                      onClick={() => setSelectedTowerType(active ? null : tower.id)}
                      disabled={!affordable}
                      aria-pressed={active}
                      title={`${localizedName} ($${effCost}) — ${dtLabel}`}
                    >
                      <span className="tower-row-top">
                        <span className="tower-hotkey" aria-hidden="true">{idx + 1}</span>
                        <span className="tower-icon" style={{ background: tower.color }} />
                        {dt && (
                          <span
                            className="dmg-badge"
                            style={{ color: dt.color, borderColor: dt.color }}
                            title={dtLabel}
                          >
                            <DamageIcon type={tower.damageType} size={10} title={dtLabel} />
                          </span>
                        )}
                      </span>
                      <span className="tower-name">{localizedShort}</span>
                      <span className="tower-cost">${effCost}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          {selectedTower && (() => {
            const dt = DAMAGE_TYPE_META[selectedTower.type.damageType]
            const dtLabel = dt ? t(`damage.${selectedTower.type.damageType}.label`, dt.label) : ''
            const costMul = uiState.modifier?.apply?.towerCostMul ?? 1
            const upgradeCost = Math.ceil(selectedTower.type.upgradeCost * costMul)
            const sellRefund = Math.floor((selectedTower.effectiveCost ?? selectedTower.type.cost) * 0.7)
            return (
            <section className="tower-detail" aria-label="Tower details">
              <h3>{t(`tower.${selectedTower.type.id}.name`, selectedTower.type.name)}</h3>
              <div className="detail-content">
                <div className="detail-row"><span>{t('game.towerLevel')}</span><span>{selectedTower.level}/3</span></div>
                <div className="detail-row">
                  <span>{t('game.towerDamage')}</span>
                  <span className="detail-damage">
                    {Math.round(selectedTower.damage)}
                    {dt && (
                      <span className="dmg-badge inline" style={{ color: dt.color, borderColor: dt.color }} title={dtLabel}>
                        <DamageIcon type={selectedTower.type.damageType} size={10} title={dtLabel} />
                      </span>
                    )}
                  </span>
                </div>
                <div className="detail-row"><span>{t('game.towerRange')}</span><span>{selectedTower.range.toFixed(1)}</span></div>
                <div className="actions">
                  {selectedTower.level < 3 && (
                    <button
                      type="button"
                      onClick={handleUpgradeTower}
                      disabled={uiState.money < upgradeCost}
                    >
                      {t('game.upgradeFmt', null, { cost: upgradeCost })}
                    </button>
                  )}
                  <button type="button" onClick={handleSellTower} className="sell-button">
                    {t('game.sellFmt', null, { cost: sellRefund })}
                  </button>
                </div>
              </div>
            </section>
            )
          })()}

          <div className="hotkeys-hint" aria-hidden="true">
            <span><kbd>1</kbd>–<kbd>8</kbd> {t('hotkey.tower')}</span>
            <span><kbd>Space</kbd> {t('hotkey.skipPause')}</span>
            <span><kbd>P</kbd> {t('hotkey.pause')}</span>
            <span><kbd>M</kbd> {t('hotkey.mute')}</span>
            <span><kbd>L</kbd> {t('hotkey.legend')}</span>
            <span><kbd>Esc</kbd> {t('hotkey.deselect')}</span>
          </div>
        </aside>
      </div>

      {legendOpen && <Legend onClose={closeLegend} />}

      {config.tutorial && (
        <Tutorial
          enabled={!!config.tutorial}
          getState={() => gameRef.current?.getState() ?? null}
        />
      )}
    </div>
  )
}

export default Game
