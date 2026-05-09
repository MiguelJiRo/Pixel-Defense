import { useEffect, useMemo, useState } from 'react'
import { getHighScore } from '../utils/storage'
import { sound } from '../game/SoundManager'
import { useT, useLang } from '../i18n/i18n'
import './StartMenu.css'

const LOGO_URL = '/logo.png'

const DIFFICULTIES = [
  { id: 'easy',    multiplier: 0.7 },
  { id: 'normal',  multiplier: 1.0 },
  { id: 'hard',    multiplier: 1.5 },
  { id: 'extreme', multiplier: 2.0 }
]

const ROUND_PRESETS = [10, 20, 30, 40]

function clampRounds(value) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return null
  return Math.max(1, Math.min(999, n))
}

function StartMenu({ onStart }) {
  const t = useT()
  const { lang, toggleLang } = useLang()
  const [difficulty, setDifficulty] = useState('normal')
  const [rounds, setRounds] = useState(20)
  const [customRounds, setCustomRounds] = useState('')
  const [highScore, setHighScore] = useState(0)
  const [audio, setAudio] = useState(sound.getState())
  const [draftEnabled, setDraftEnabled] = useState(true)
  const [modifierEnabled, setModifierEnabled] = useState(true)
  const [endlessEnabled, setEndlessEnabled] = useState(false)
  const [tutorialEnabled, setTutorialEnabled] = useState(false)
  const [colorblindEnabled, setColorblindEnabled] = useState(() => {
    try { return localStorage.getItem('pixel-defense:colorblind:v1') === '1' } catch { return false }
  })

  // Tutorial is meant for new players learning the basics — disable all
  // run-modifying modes while it's active so the experience matches the tips.
  const handleTutorialChange = (next) => {
    sound.uiClick()
    setTutorialEnabled(next)
    if (next) {
      setDraftEnabled(false)
      setModifierEnabled(false)
      setEndlessEnabled(false)
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorblindEnabled)
    try { localStorage.setItem('pixel-defense:colorblind:v1', colorblindEnabled ? '1' : '0') } catch { /* ignore */ }
  }, [colorblindEnabled])

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
      useModifier: modifierEnabled,
      endless: endlessEnabled,
      tutorial: tutorialEnabled,
      colorblind: colorblindEnabled
    })
  }

  const pickDifficulty = (id) => { sound.uiHover(); setDifficulty(id) }
  const pickRounds = (n) => { sound.uiHover(); setRounds(n); setCustomRounds('') }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleStart()
  }

  const activeDifficulty = DIFFICULTIES.find(d => d.id === difficulty)
  const activeDifficultyName = t(`menu.difficulty.${difficulty}`)
  const activeDifficultyHint = t(`menu.difficulty.${difficulty}.hint`)

  return (
    <main className="start-menu" onKeyDown={handleKeyDown}>
      <div className="top-actions">
        <button
          type="button"
          className="lang-toggle"
          onClick={() => { sound.uiClick(); toggleLang() }}
          aria-label={t('menu.toggleLanguage', 'Switch language')}
          title={t('menu.toggleLanguage', 'Switch language')}
        >
          {lang.toUpperCase()}
        </button>
        <button
          type="button"
          className="audio-toggle"
          onClick={() => sound.toggleMute()}
          aria-label={audio.muted ? t('menu.audioOff') : t('menu.audioOn')}
          title={audio.muted ? t('menu.audioOff') : t('menu.audioOn')}
        >
          {audio.muted ? '🔇' : '🔊'}
        </button>
      </div>

      <div className="title-block">
        <img
          src={LOGO_URL}
          alt=""
          className="logo"
          width="128"
          height="128"
          aria-hidden="true"
        />
        <div className="title-pre">{t('menu.preTitle')}</div>
        <h1 className="title">PIXEL DEFENSE</h1>
        <p className="subtitle">{t('menu.subtitle')}</p>
      </div>

      <div className="config-grid">
        <fieldset className="config-section">
          <legend>{t('menu.difficulty')}</legend>
          <div className="button-group" role="radiogroup" aria-label={t('menu.difficulty')}>
            {DIFFICULTIES.map(({ id }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={difficulty === id}
                className={`menu-button ${difficulty === id ? 'active' : ''}`}
                onClick={() => pickDifficulty(id)}
              >
                {t(`menu.difficulty.${id}`)}
              </button>
            ))}
          </div>
          <div className="hint">{activeDifficultyHint}</div>
        </fieldset>

        <fieldset className="config-section">
          <legend>{t('menu.rounds')}</legend>
          <div className="button-group" role="radiogroup" aria-label={t('menu.rounds')}>
            {ROUND_PRESETS.map(n => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={!endlessEnabled && !customRounds && rounds === n}
                className={`menu-button ${!endlessEnabled && !customRounds && rounds === n ? 'active' : ''}`}
                onClick={() => pickRounds(n)}
                disabled={endlessEnabled}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={endlessEnabled}
              className={`menu-button infinite-button ${endlessEnabled ? 'active' : ''}`}
              onClick={() => { sound.uiClick(); setEndlessEnabled(v => !v) }}
              title={t('menu.endless.hint')}
              disabled={tutorialEnabled}
            >
              ∞
            </button>
          </div>
          <label className="custom-input">
            <span className="visually-hidden">{t('menu.customRoundsLabel')}</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={endlessEnabled ? t('menu.endlessActive') : t('menu.customRounds')}
              value={customRounds}
              onChange={(e) => setCustomRounds(e.target.value.replace(/\D/g, ''))}
              min="1"
              max="999"
              aria-label={t('menu.customRoundsLabel')}
              disabled={endlessEnabled}
            />
          </label>
        </fieldset>
      </div>

      <fieldset className="run-modes">
        <legend>{t('menu.runModes')}</legend>
        <label
          className={`mode-checkbox ${draftEnabled ? 'on' : ''} ${tutorialEnabled ? 'disabled' : ''}`}
          title={tutorialEnabled ? t('menu.disabledByTutorial') : undefined}
        >
          <input
            type="checkbox"
            checked={draftEnabled}
            disabled={tutorialEnabled}
            onChange={(e) => { sound.uiClick(); setDraftEnabled(e.target.checked) }}
          />
          <span className="mode-box" aria-hidden="true">{draftEnabled ? '✓' : ''}</span>
          <span className="mode-label">
            <span className="mode-name">{t('menu.draft.name')}</span>
            <span className="mode-hint">{t('menu.draft.hint')}</span>
          </span>
        </label>
        <label
          className={`mode-checkbox ${modifierEnabled ? 'on' : ''} ${tutorialEnabled ? 'disabled' : ''}`}
          title={tutorialEnabled ? t('menu.disabledByTutorial') : undefined}
        >
          <input
            type="checkbox"
            checked={modifierEnabled}
            disabled={tutorialEnabled}
            onChange={(e) => { sound.uiClick(); setModifierEnabled(e.target.checked) }}
          />
          <span className="mode-box" aria-hidden="true">{modifierEnabled ? '✓' : ''}</span>
          <span className="mode-label">
            <span className="mode-name">{t('menu.modifier.name')}</span>
            <span className="mode-hint">{t('menu.modifier.hint')}</span>
          </span>
        </label>
        <label
          className={`mode-checkbox ${endlessEnabled ? 'on' : ''} ${tutorialEnabled ? 'disabled' : ''}`}
          title={tutorialEnabled ? t('menu.disabledByTutorial') : undefined}
        >
          <input
            type="checkbox"
            checked={endlessEnabled}
            disabled={tutorialEnabled}
            onChange={(e) => { sound.uiClick(); setEndlessEnabled(e.target.checked) }}
          />
          <span className="mode-box" aria-hidden="true">{endlessEnabled ? '✓' : ''}</span>
          <span className="mode-label">
            <span className="mode-name">{t('menu.endless.name')}</span>
            <span className="mode-hint">{t('menu.endless.hint')}</span>
          </span>
        </label>
        <label className={`mode-checkbox ${tutorialEnabled ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={tutorialEnabled}
            onChange={(e) => handleTutorialChange(e.target.checked)}
          />
          <span className="mode-box" aria-hidden="true">{tutorialEnabled ? '✓' : ''}</span>
          <span className="mode-label">
            <span className="mode-name">{t('menu.tutorial.name')}</span>
            <span className="mode-hint">{t('menu.tutorial.hint')}</span>
          </span>
        </label>
        <label className={`mode-checkbox ${colorblindEnabled ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={colorblindEnabled}
            onChange={(e) => { sound.uiClick(); setColorblindEnabled(e.target.checked) }}
          />
          <span className="mode-box" aria-hidden="true">{colorblindEnabled ? '✓' : ''}</span>
          <span className="mode-label">
            <span className="mode-name">{t('menu.colorblind.name')}</span>
            <span className="mode-hint">{t('menu.colorblind.hint')}</span>
          </span>
        </label>
      </fieldset>

      <div className="summary-row" aria-live="polite">
        <div>
          <span className="summary-label">{t('menu.best')}</span>
          <span className="summary-value">{highScore.toLocaleString()}</span>
        </div>
        <div>
          <span className="summary-label">{t('menu.mode')}</span>
          <span className="summary-value">
            {endlessEnabled
              ? t('menu.modeEndless', null, { difficulty: activeDifficultyName })
              : t('menu.modeFormat', null, {
                difficulty: activeDifficultyName,
                rounds: effectiveRounds
              })}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="start-button"
        onClick={handleStart}
        autoFocus
      >
        {t('menu.startGame')}
      </button>

      <footer className="credits">
        <span>{t('menu.madeBy')}</span>
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
          {t('menu.source')}
        </a>
      </footer>
    </main>
  )
}

export default StartMenu
