import { useCallback, useState } from 'react'
import StartMenu from './components/StartMenu'
import Game from './components/Game'
import { saveHighScore, getHighScore } from './utils/storage'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu')
  const [gameConfig, setGameConfig] = useState(null)
  const [endSummary, setEndSummary] = useState(null)

  const startGame = useCallback((config) => {
    setGameConfig(config)
    setEndSummary(null)
    setGameState('playing')
  }, [])

  const finishWith = useCallback((outcome, state) => {
    if (!gameConfig) return
    const previousBest = getHighScore(gameConfig.difficulty, gameConfig.rounds)
    const newBest = saveHighScore(gameConfig.difficulty, gameConfig.rounds, state.score)
    setEndSummary({
      outcome,
      score: state.score,
      round: state.round,
      totalRounds: state.totalRounds,
      stats: state.stats,
      newRecord: state.score > previousBest,
      bestScore: newBest
    })
    setGameState(outcome)
  }, [gameConfig])

  const handleGameOver = useCallback((state) => finishWith('gameover', state), [finishWith])
  const handleVictory = useCallback((state) => finishWith('victory', state), [finishWith])

  const returnToMenu = useCallback(() => {
    setGameState('menu')
    setGameConfig(null)
    setEndSummary(null)
  }, [])

  const playAgain = useCallback(() => {
    if (gameConfig) startGame(gameConfig)
  }, [gameConfig, startGame])

  return (
    <div className="app">
      {gameState === 'menu' && <StartMenu onStart={startGame} />}

      {gameState === 'playing' && gameConfig && (
        <Game
          config={gameConfig}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
          onReturnToMenu={returnToMenu}
        />
      )}

      {(gameState === 'gameover' || gameState === 'victory') && endSummary && (
        <EndScreen
          summary={endSummary}
          onPlayAgain={playAgain}
          onReturnToMenu={returnToMenu}
        />
      )}
    </div>
  )
}

function EndScreen({ summary, onPlayAgain, onReturnToMenu }) {
  const { outcome, score, round, totalRounds, stats, newRecord, bestScore } = summary
  const won = outcome === 'victory'

  return (
    <div className={`end-screen ${won ? 'win' : 'loss'}`} role="dialog" aria-modal="true">
      <div className="end-card">
        <div className="end-tag">{won ? 'VICTORY' : 'GAME OVER'}</div>
        <h1 className="end-title">
          {won ? 'You held the line.' : 'The line has fallen.'}
        </h1>

        <dl className="end-stats">
          <div><dt>Score</dt><dd>{score.toLocaleString()}</dd></div>
          <div><dt>Best</dt><dd>{bestScore.toLocaleString()}{newRecord && <span className="new-record"> NEW</span>}</dd></div>
          <div><dt>Round reached</dt><dd>{round}/{totalRounds}</dd></div>
          <div><dt>Kills</dt><dd>{stats.kills}</dd></div>
          <div><dt>Towers built</dt><dd>{stats.towersBuilt}</dd></div>
          <div><dt>Money earned</dt><dd>${stats.moneyEarned}</dd></div>
          <div><dt>Leaks</dt><dd>{stats.leaks}</dd></div>
        </dl>

        <div className="end-actions">
          <button type="button" className="btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <button type="button" className="btn-secondary" onClick={onReturnToMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
