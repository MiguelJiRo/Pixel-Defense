import { useMemo, useState } from 'react'
import { pickModifierChoices } from '../game/modifiers'
import './PreGame.css'

function ModifierPicker({ onConfirm, onCancel, stepLabel = 'Step 2 / Run setup' }) {
  const choices = useMemo(() => pickModifierChoices(3), [])
  const [selected, setSelected] = useState(null)

  const confirm = () => {
    if (selected) onConfirm(selected)
  }

  return (
    <div className="pregame-backdrop" role="dialog" aria-modal="true" aria-label="Run modifier">
      <div className="pregame-card">
        <header className="pregame-header">
          <div>
            <div className="pregame-tag">{stepLabel}</div>
            <h2>Choose a run modifier</h2>
            <p className="pregame-sub">
              Picks one of three random cards. Effects apply for the entire run.
            </p>
          </div>
        </header>

        <div className="modifier-grid">
          {choices.map(mod => {
            const isSelected = selected?.id === mod.id
            return (
              <button
                key={mod.id}
                type="button"
                className={`modifier-card ${isSelected ? 'picked' : ''} sign-${mod.sign === '+' ? 'pos' : mod.sign === '-' || mod.sign === '−' ? 'neg' : 'mix'}`}
                onClick={() => setSelected(mod)}
                aria-pressed={isSelected}
                style={{ '--card-color': mod.color }}
              >
                <div className="modifier-sign" aria-hidden="true">{mod.sign}</div>
                <div className="modifier-name">{mod.name}</div>
                <div className="modifier-desc">{mod.description}</div>
                <div className="modifier-flavor">"{mod.flavor}"</div>
              </button>
            )
          })}
        </div>

        <footer className="pregame-footer">
          <button type="button" className="pregame-btn pregame-btn-secondary" onClick={onCancel}>
            Back
          </button>
          <button
            type="button"
            className="pregame-btn pregame-btn-primary"
            onClick={confirm}
            disabled={!selected}
          >
            {selected ? 'Start run ▶' : 'Pick one card'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ModifierPicker
