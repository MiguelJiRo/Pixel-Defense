import { useState } from 'react'
import './StartMenu.css'

const DIFFICULTIES = {
  easy: { name: 'Easy', multiplier: 0.7 },
  normal: { name: 'Normal', multiplier: 1.0 },
  hard: { name: 'Hard', multiplier: 1.5 },
  extreme: { name: 'Extreme', multiplier: 2.0 }
}

function StartMenu({ onStart }) {
  const [difficulty, setDifficulty] = useState('normal')
  const [rounds, setRounds] = useState(20)
  const [customRounds, setCustomRounds] = useState('')

  const handleStart = () => {
    const finalRounds = customRounds ? parseInt(customRounds) : rounds
    onStart({
      difficulty,
      rounds: finalRounds,
      difficultyMultiplier: DIFFICULTIES[difficulty].multiplier
    })
  }

  return (
    <div className="start-menu">
      <h1 className="title">PIXEL DEFENSE</h1>
      <div className="subtitle">Endless Tower Defense</div>

      <div className="config-section">
        <h2>Difficulty</h2>
        <div className="button-group">
          {Object.entries(DIFFICULTIES).map(([key, { name }]) => (
            <button
              key={key}
              className={`menu-button ${difficulty === key ? 'active' : ''}`}
              onClick={() => setDifficulty(key)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="config-section">
        <h2>Rounds</h2>
        <div className="button-group">
          <button
            className={`menu-button ${!customRounds && rounds === 20 ? 'active' : ''}`}
            onClick={() => { setRounds(20); setCustomRounds('') }}
          >
            20
          </button>
          <button
            className={`menu-button ${!customRounds && rounds === 30 ? 'active' : ''}`}
            onClick={() => { setRounds(30); setCustomRounds('') }}
          >
            30
          </button>
          <button
            className={`menu-button ${!customRounds && rounds === 40 ? 'active' : ''}`}
            onClick={() => { setRounds(40); setCustomRounds('') }}
          >
            40
          </button>
        </div>
        <div className="custom-input">
          <input
            type="number"
            placeholder="Custom rounds"
            value={customRounds}
            onChange={(e) => setCustomRounds(e.target.value)}
            min="1"
            max="999"
          />
        </div>
      </div>

      <button className="start-button" onClick={handleStart}>
        START GAME
      </button>

      <div className="credits">
        Made by <a href="https://github.com/MiguelJiRo" target="_blank" rel="noopener noreferrer">MiguelJiRo</a>
      </div>
    </div>
  )
}

export default StartMenu
