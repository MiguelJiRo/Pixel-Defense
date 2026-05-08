import { useEffect, useMemo, useState } from 'react'
import { getHighScore } from '../utils/storage'
import { sound } from '../game/SoundManager'
import './StartMenu.css'

const LOGO_URL = '/logo.png'

const DIFFICULTIES = [
  { id: 'easy',    name: 'Easy',    multiplier: 0.7, hint: 'Relaxed pace · less HP' },
  { id: 'normal',  name: 'Normal',  multiplier: 1.0, hint: 'The classic experience' },
  { id: 'hard',    name: 'Hard',    multiplier: 1.5, hint: 'Tougher enemies' },
  { id: 'extreme', name: 'Extreme', multiplier: 2.0, hint: 'Pure pain' }
]

const ROUND_PRESETS = [10, 20, 30, 40]

function clampRounds(value) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return null
  return Math.max(1, Math.min(999, n))
}

function StartMenu({ onStart }) {
  const [difficulty, setDifficulty] = useState('normal')
  const [rounds, setRounds] = useState(20)
  const [customRounds, setCustomRounds] = useState('')
  const [highScore, setHighScore] = useState(0)
  const [audio, setAudio] = useState(sound.getState())
  const [draftEnabled, setDraftEnabled] = useState(true)
  const [modifierEnabled, setModifierEnabled] = useState(true)

  useEffect(() => sound.subscribe(setAudio), [])

  const effectiveRounds = useMemo(() => {
    if (!customRounds) return rounds
    const c = clampRounds(customRounds)
    return c ?? rounds
  }, [customRounds, rounds])

  useEffect(() => {
    setHighScore(getHighScore(difficulty, effectiveRounds))
  }, [difficulty, effectiveRounds])

  const handleStart = () => {
    sound.uiClick()
    const config = DIFFICULTIES.find(d => d.id === difficulty)
    onStart({
      difficulty,
      rounds: effectiveRounds,
      difficultyMultiplier: config.multiplier,
      useDraft: draftEnabled,
      useModifier: modifierEnabled
    })
  }

  const pickDifficulty = (id) => { sound.uiHover(); setDifficulty(id) }
  const pickRounds = (n) => { sound.uiHover(); setRounds(n); setCustomRounds('') }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleStart()
  }

  const activeDifficulty = DIFFICULTIES.find(d => d.id === difficulty)

  return (
    <main className="start-menu" onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="audio-toggle"
        onClick={() => sound.toggleMute()}
        aria-label={audio.muted ? 'Unmute audio' : 'Mute audio'}
        title={audio.muted ? 'Unmute' : 'Mute'}
      >
        {audio.muted ? '🔇' : '🔊'}
      </button>

      <div className="title-block">
        <img
          src={LOGO_URL}
          alt=""
          className="logo"
          width="128"
          height="128"
          aria-hidden="true"
        />
        <div className="title-pre">— retro tower defense —</div>
        <h1 className="title">PIXEL DEFENSE</h1>
        <p className="subtitle">
          Build, upgrade, and survive randomized waves of pixel invaders.
        </p>
      </div>

      <div className="config-grid">
        <fieldset className="config-section">
          <legend>Difficulty</legend>
          <div className="button-group" role="radiogroup" aria-label="Difficulty">
            {DIFFICULTIES.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={difficulty === id}
                className={`menu-button ${difficulty === id ? 'active' : ''}`}
                onClick={() => pickDifficulty(id)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="hint">{activeDifficulty.hint}</div>
        </fieldset>

        <fieldset className="config-section">
          <legend>Rounds</legend>
          <div className="button-group" role="radiogroup" aria-label="Number of rounds">
            {ROUND_PRESETS.map(n => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={!customRounds && rounds === n}
                className={`menu-button ${!customRounds && rounds === n ? 'active' : ''}`}
                onClick={() => pickRounds(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="custom-input">
            <span className="visually-hidden">Custom rounds</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Custom (1–999)"
              value={customRounds}
              onChange={(e) => setCustomRounds(e.target.value.replace(/\D/g, ''))}
              min="1"
              max="999"
              aria-label="Custom rounds"
            />
          </label>
        </fieldset>
      </div>

      <fieldset className="run-modes">
        <legend>Run modes</legend>
        <label className={`mode-checkbox ${draftEnabled ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={draftEnabled}
            onChange={(e) => { sound.uiClick(); setDraftEnabled(e.target.checked) }}
          />
          <span className="mode-box" aria-hidden="true">{draftEnabled ? '✓' : ''}</span>
          <span className="mode-label">
            <span className="mode-name">Tower Draft</span>
            <span className="mode-hint">Pick 5 of 8 towers for the run</span>
          </span>
        </label>
        <label className={`mode-checkbox ${modifierEnabled ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={modifierEnabled}
            onChange={(e) => { sound.uiClick(); setModifierEnabled(e.target.checked) }}
          />
          <span className="mode-box" aria-hidden="true">{modifierEnabled ? '✓' : ''}</span>
          <span className="mode-label">
            <span className="mode-name">Run Modifier</span>
            <span className="mode-hint">Pick 1 of 3 buffs / tradeoffs</span>
          </span>
        </label>
      </fieldset>

      <div className="summary-row" aria-live="polite">
        <div>
          <span className="summary-label">Best</span>
          <span className="summary-value">{highScore.toLocaleString()}</span>
        </div>
        <div>
          <span className="summary-label">Mode</span>
          <span className="summary-value">
            {activeDifficulty.name} · {effectiveRounds} rounds
          </span>
        </div>
      </div>

      <button
        type="button"
        className="start-button"
        onClick={handleStart}
        autoFocus
      >
        Start Game
      </button>

      <footer className="credits">
        <span>Made by</span>
        <a
          href="https://github.com/MiguelJiRo"
          target="_blank"
          rel="noopener noreferrer"
        >
          MiguelJiRo
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/MiguelJiRo/Pixel-Defense"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
        </a>
      </footer>
    </main>
  )
}

export default StartMenu
