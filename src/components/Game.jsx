import { useEffect, useRef, useState } from 'react'
import { GameManager } from '../game/GameManager'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_WIDTH, GRID_HEIGHT,
  TOWER_TYPES
} from '../game/constants'
import './Game.css'

function Game({ config, onGameOver, onReturnToMenu }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const animationRef = useRef(null)

  const [gameState, setGameState] = useState({
    health: 20,
    money: 400,
    round: 0,
    totalRounds: config.rounds,
    score: 0,
    waveActive: false,
    waveTimer: 0,  // Start at 0 for initial prep time
    wavePrepTime: 15000,
    enemies: [],
    towers: [],
    projectiles: [],
    currentPath: [],
    currentEvent: null,
    victory: false
  })
  const [selectedTowerType, setSelectedTowerType] = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)
  const [selectedTower, setSelectedTower] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas not available')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Could not get canvas context')
      return
    }

    // Enable pixel art rendering
    ctx.imageSmoothingEnabled = false

    // Initialize game
    const game = new GameManager(config, onGameOver)
    gameRef.current = game

    // Game loop
    let lastTime = Date.now()

    const gameLoop = () => {
      const currentTime = Date.now()
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Update game
      game.update(deltaTime)

      // Render
      render(ctx, game)

      // Update state for UI
      setGameState(game.getState())

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [config, onGameOver])

  const render = (ctx, game) => {
    const state = game.getState()

    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw scanline effect for retro look
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 2)
    }

    // Draw grid
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * GRID_SIZE, 0)
      ctx.lineTo(x * GRID_SIZE, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * GRID_SIZE)
      ctx.lineTo(CANVAS_WIDTH, y * GRID_SIZE)
      ctx.stroke()
    }

    // Draw path
    ctx.strokeStyle = '#333'
    ctx.lineWidth = GRID_SIZE * 0.6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let i = 0; i < state.currentPath.length; i++) {
      const point = state.currentPath[i]
      const x = point.x * GRID_SIZE + GRID_SIZE / 2
      const y = point.y * GRID_SIZE + GRID_SIZE / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Draw path markers (start and end)
    const startPoint = state.currentPath[0]
    const endPoint = state.currentPath[state.currentPath.length - 1]

    ctx.fillStyle = '#00ff00'
    ctx.fillRect(
      startPoint.x * GRID_SIZE + GRID_SIZE / 4,
      startPoint.y * GRID_SIZE + GRID_SIZE / 4,
      GRID_SIZE / 2,
      GRID_SIZE / 2
    )

    ctx.fillStyle = '#ff0000'
    ctx.fillRect(
      endPoint.x * GRID_SIZE + GRID_SIZE / 4,
      endPoint.y * GRID_SIZE + GRID_SIZE / 4,
      GRID_SIZE / 2,
      GRID_SIZE / 2
    )

    // Draw towers
    for (const tower of state.towers) {
      const x = tower.x * GRID_SIZE + GRID_SIZE / 2
      const y = tower.y * GRID_SIZE + GRID_SIZE / 2

      // Range indicator for selected tower
      if (selectedTower === tower) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.beginPath()
        ctx.arc(x, y, tower.range * GRID_SIZE, 0, Math.PI * 2)
        ctx.fill()

        // Range circle outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Tower shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.fillRect(
        tower.x * GRID_SIZE + 6,
        tower.y * GRID_SIZE + 6,
        GRID_SIZE - 8,
        GRID_SIZE - 8
      )

      // Tower base
      ctx.fillStyle = '#333'
      ctx.fillRect(
        tower.x * GRID_SIZE + 4,
        tower.y * GRID_SIZE + 4,
        GRID_SIZE - 8,
        GRID_SIZE - 8
      )

      // Tower base border
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 2
      ctx.strokeRect(
        tower.x * GRID_SIZE + 4,
        tower.y * GRID_SIZE + 4,
        GRID_SIZE - 8,
        GRID_SIZE - 8
      )

      // Tower turret shadow
      const turretSize = 12 + tower.level * 2
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(
        x - turretSize / 2 + 2,
        y - turretSize / 2 + 2,
        turretSize,
        turretSize
      )

      // Tower turret
      ctx.fillStyle = tower.type.color
      ctx.fillRect(
        x - turretSize / 2,
        y - turretSize / 2,
        turretSize,
        turretSize
      )

      // Tower turret highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillRect(
        x - turretSize / 2 + 2,
        y - turretSize / 2 + 2,
        turretSize - 4,
        2
      )

      // Level indicator
      ctx.fillStyle = '#000'
      ctx.font = 'bold 10px Courier New'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(tower.level, x + 1, y + 1)

      ctx.fillStyle = '#fff'
      ctx.fillText(tower.level, x, y)
    }

    // Draw enemies
    for (const enemy of state.enemies) {
      // Enemy shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(
        enemy.x - enemy.type.size / 2 + 2,
        enemy.y - enemy.type.size / 2 + 2,
        enemy.type.size,
        enemy.type.size
      )

      // Enemy body
      ctx.fillStyle = enemy.type.color
      ctx.fillRect(
        enemy.x - enemy.type.size / 2,
        enemy.y - enemy.type.size / 2,
        enemy.type.size,
        enemy.type.size
      )

      // Enemy highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(
        enemy.x - enemy.type.size / 2 + 2,
        enemy.y - enemy.type.size / 2 + 2,
        enemy.type.size - 4,
        2
      )

      // Health bar
      const healthBarWidth = enemy.type.size
      const healthBarHeight = 3
      const healthPercent = enemy.health / enemy.maxHealth

      ctx.fillStyle = '#000'
      ctx.fillRect(
        enemy.x - healthBarWidth / 2,
        enemy.y - enemy.type.size / 2 - 6,
        healthBarWidth,
        healthBarHeight
      )

      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000'
      ctx.fillRect(
        enemy.x - healthBarWidth / 2,
        enemy.y - enemy.type.size / 2 - 6,
        healthBarWidth * healthPercent,
        healthBarHeight
      )
    }

    // Draw projectiles with glow effect
    for (const proj of state.projectiles) {
      // Glow
      ctx.fillStyle = proj.color + '44'
      ctx.fillRect(proj.x - 5, proj.y - 5, 10, 10)

      // Core
      ctx.fillStyle = proj.color
      ctx.fillRect(proj.x - 3, proj.y - 3, 6, 6)

      // Highlight
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2)
    }

    // Draw particles
    if (state.particles) {
      state.particles.render(ctx)
    }

    // Draw hover effect
    if (hoveredCell && selectedTowerType) {
      const { x, y } = hoveredCell
      const canPlace = game.canPlaceTower(x, y)

      ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'
      ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)

      if (canPlace) {
        const tower = TOWER_TYPES[selectedTowerType]
        const centerX = x * GRID_SIZE + GRID_SIZE / 2
        const centerY = y * GRID_SIZE + GRID_SIZE / 2

        // Show range
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.beginPath()
        ctx.arc(centerX, centerY, tower.range * GRID_SIZE, 0, Math.PI * 2)
        ctx.fill()

        // Show preview
        ctx.fillStyle = tower.color + '88'
        ctx.fillRect(
          centerX - 8,
          centerY - 8,
          16,
          16
        )
      }
    }

    // Event banner
    if (state.currentEvent && state.waveActive) {
      const bannerHeight = 40
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 10, CANVAS_WIDTH, bannerHeight)

      ctx.fillStyle = state.currentEvent.color
      ctx.fillRect(0, 10, 5, bannerHeight)

      ctx.fillStyle = state.currentEvent.color
      ctx.font = 'bold 16px Courier New'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(state.currentEvent.name, 15, 17)

      ctx.fillStyle = '#fff'
      ctx.font = '12px Courier New'
      ctx.fillText(state.currentEvent.description, 15, 35)
    }

    // Victory/Game Over overlay
    if (state.victory) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = '#00ff00'
      ctx.font = 'bold 48px Courier New'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

      ctx.fillStyle = '#fff'
      ctx.font = '24px Courier New'
      ctx.fillText(`Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
    }
  }

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const game = gameRef.current

    if (!canvas || !game) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY

    const x = Math.floor(canvasX / GRID_SIZE)
    const y = Math.floor(canvasY / GRID_SIZE)

    if (selectedTowerType && !gameState.waveActive) {
      // Place tower
      const success = game.placeTower(x, y, selectedTowerType)
      if (success) {
        setSelectedTowerType(null)
      }
    } else {
      // Select tower
      const tower = game.towers.find(t => t.x === x && t.y === y)
      setSelectedTower(tower || null)
    }
  }

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY

    const x = Math.floor(canvasX / GRID_SIZE)
    const y = Math.floor(canvasY / GRID_SIZE)

    setHoveredCell({ x, y })
  }

  const handleUpgradeTower = () => {
    if (selectedTower) {
      const game = gameRef.current
      if (!game) return
      game.upgradeTower(selectedTower)
    }
  }

  const handleSellTower = () => {
    if (selectedTower) {
      const game = gameRef.current
      if (!game) return
      const refund = Math.floor(selectedTower.type.cost * 0.7)
      game.money += refund
      game.towers = game.towers.filter(t => t !== selectedTower)
      setSelectedTower(null)
    }
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="stat">
          <span className="stat-label">Health:</span>
          <span className="stat-value health">{gameState.health}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Money:</span>
          <span className="stat-value money">${gameState.money}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Round:</span>
          <span className="stat-value">{gameState.round}/{gameState.totalRounds}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Score:</span>
          <span className="stat-value">{gameState.score}</span>
        </div>
      </div>

      <div className="game-content">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="game-canvas"
        />

        <div className="game-sidebar">
          {!gameState.waveActive ? (
            <>
              <div className="wave-status">
                <h3>{gameState.round === 0 ? 'Get Ready!' : 'Preparation Phase'}</h3>
                <div className="timer">
                  {gameState.round === 0 ? 'Wave 1' : 'Next wave'} in: {Math.ceil((gameState.wavePrepTime - gameState.waveTimer) / 1000)}s
                </div>
              </div>

              <div className="tower-shop">
                <h3>Build Towers</h3>
                {Object.values(TOWER_TYPES).map(tower => (
                  <button
                    key={tower.id}
                    className={`tower-button ${selectedTowerType === tower.id ? 'active' : ''}`}
                    onClick={() => setSelectedTowerType(tower.id)}
                    disabled={gameState.money < tower.cost}
                  >
                    <div className="tower-icon" style={{ background: tower.color }}></div>
                    <div className="tower-info">
                      <div className="tower-name">{tower.name}</div>
                      <div className="tower-cost">${tower.cost}</div>
                      <div className="tower-stats">
                        DMG: {tower.damage} | RNG: {tower.range} | SPD: {(1000/tower.fireRate).toFixed(1)}/s
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="wave-status active">
                <h3>Wave {gameState.round} Active!</h3>
                <div className="enemy-count">
                  Enemies: {gameState.enemies.length}
                </div>
              </div>
              {gameState.currentEvent && (
                <div className="event-banner" style={{ borderColor: gameState.currentEvent.color }}>
                  <div className="event-title" style={{ color: gameState.currentEvent.color }}>
                    {gameState.currentEvent.name}
                  </div>
                  <div className="event-description">
                    {gameState.currentEvent.description}
                  </div>
                </div>
              )}
            </>
          )}

          {selectedTower && (
            <div className="tower-detail">
              <h3>Tower Details</h3>
              <div className="detail-content">
                <div className="detail-row">
                  <span>Type:</span>
                  <span>{selectedTower.type.name}</span>
                </div>
                <div className="detail-row">
                  <span>Level:</span>
                  <span>{selectedTower.level}/3</span>
                </div>
                <div className="detail-row">
                  <span>Damage:</span>
                  <span>{selectedTower.damage}</span>
                </div>
                <div className="detail-row">
                  <span>Range:</span>
                  <span>{selectedTower.range}</span>
                </div>
                <div className="actions">
                  {selectedTower.level < 3 && (
                    <button
                      onClick={handleUpgradeTower}
                      disabled={gameState.money < selectedTower.type.upgradeCost}
                    >
                      Upgrade (${selectedTower.type.upgradeCost})
                    </button>
                  )}
                  <button onClick={handleSellTower} className="sell-button">
                    Sell (${Math.floor(selectedTower.type.cost * 0.7)})
                  </button>
                </div>
              </div>
            </div>
          )}

          <button className="menu-button-game" onClick={onReturnToMenu}>
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default Game
