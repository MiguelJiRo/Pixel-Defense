import { useCallback, useState } from 'react'
import StartMenu from './components/StartMenu'
import Game from './components/Game'
import TowerDraft from './components/TowerDraft'
import ModifierPicker from './components/ModifierPicker'
import { saveHighScore, getHighScore } from './utils/storage'
import { useT } from './i18n/i18n'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu')
  const [pendingConfig, setPendingConfig] = useState(null)
  const [draftPicks, setDraftPicks] = useState(null)
  const [gameConfig, setGameConfig] = useState(null)
  const [endSummary, setEndSummary] = useState(null)

  const buildFinalConfig = (config, allowedTowers, modifier) => {
    const final = { ...config }
    if (allowedTowers) final.allowedTowers = allowedTowers
    if (modifier) final.modifier = modifier
    return final
  }

  const advanceFromMenu = useCallback((config) => {
    setPendingConfig(config)
    setEndSummary(null)
    setDraftPicks(null)
    if (config.useDraft) {
      setGameState('draft')
    } else if (config.useModifier) {
      setGameState('modifier')
    } else {
      const final = buildFinalConfig(config, null, null)
      setGameConfig(final)
      setGameState('playing')
    }
  }, [])

  const onDraftConfirm = useCallback((picks) => {
    setDraftPicks(picks)
    if (pendingConfig?.useModifier) {
      setGameState('modifier')
    } else {
      const final = buildFinalConfig(pendingConfig, picks, null)
      setGameConfig(final)
      setGameState('playing')
    }
  }, [pendingConfig])

  const onModifierConfirm = useCallback((modifier) => {
    const final = buildFinalConfig(pendingConfig, draftPicks, modifier)
    setGameConfig(final)
    setGameState('playing')
  }, [pendingConfig, draftPicks])

  const cancelToMenu = useCallback(() => {
    setGameState('menu')
    setPendingConfig(null)
    setDraftPicks(null)
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
      bestScore: newBest,
      modifier: state.modifier
    })
    setGameState(outcome)
  }, [gameConfig])

  const handleGameOver = useCallback((state) => finishWith('gameover', state), [finishWith])
  const handleVictory = useCallback((state) => finishWith('victory', state), [finishWith])

  const returnToMenu = useCallback(() => {
    setGameState('menu')
    setGameConfig(null)
    setEndSummary(null)
    setPendingConfig(null)
    setDraftPicks(null)
  }, [])

  const playAgain = useCallback(() => {
    if (gameConfig) {
      setEndSummary(null)
      // Clone the config so Game's useEffect treats it as a new run and re-mounts state
      setGameConfig({ ...gameConfig })
      setGameState('playing')
    }
  }, [gameConfig])

  const showModifierStep = pendingConfig?.useDraft && pendingConfig?.useModifier
  const modifierStepKey = showModifierStep ? 'pregame.step2' : 'pregame.step1'

  return (
    <div className="app">
      {gameState === 'menu' && <StartMenu onStart={advanceFromMenu} />}

      {gameState === 'draft' && pendingConfig && (
        <TowerDraft onConfirm={onDraftConfirm} onCancel={cancelToMenu} />
      )}

      {gameState === 'modifier' && pendingConfig && (
        <ModifierPicker
          stepKey={modifierStepKey}
          onConfirm={onModifierConfirm}
          onCancel={cancelToMenu}
        />
      )}

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
  const t = useT()
  const { outcome, score, round, totalRounds, stats, newRecord, bestScore, modifier } = summary
  const won = outcome === 'victory'

  return (
    <div className={`end-screen ${won ? 'win' : 'loss'}`} role="dialog" aria-modal="true">
      <div className="end-card">
        <div className="end-tag">{won ? t('end.victoryTag') : t('end.gameOverTag')}</div>
        <h1 className="end-title">
          {won ? t('end.victoryTitle') : t('end.defeatTitle')}
        </h1>

        <dl className="end-stats">
          <div><dt>{t('end.score')}</dt><dd>{score.toLocaleString()}</dd></div>
          <div><dt>{t('end.best')}</dt><dd>{bestScore.toLocaleString()}{newRecord && <span className="new-record"> {t('end.new')}</span>}</dd></div>
          <div><dt>{t('end.roundReached')}</dt><dd>{round}/{totalRounds}</dd></div>
          <div><dt>{t('end.kills')}</dt><dd>{stats.kills}</dd></div>
          <div><dt>{t('end.towersBuilt')}</dt><dd>{stats.towersBuilt}</dd></div>
          <div><dt>{t('end.moneyEarned')}</dt><dd>${stats.moneyEarned}</dd></div>
          <div><dt>{t('end.leaks')}</dt><dd>{stats.leaks}</dd></div>
          {modifier && (
            <div><dt>{t('end.modifier')}</dt><dd style={{ color: modifier.color }}>{t(`modifier.${modifier.id}.name`, modifier.name)}</dd></div>
          )}
        </dl>

        <div className="end-actions">
          <button type="button" className="btn-primary" onClick={onPlayAgain}>
            {t('end.playAgain')}
          </button>
          <button type="button" className="btn-secondary" onClick={onReturnToMenu}>
            {t('end.mainMenu')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
