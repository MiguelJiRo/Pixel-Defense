import { useState } from 'react'
import { TOWER_TYPES, DAMAGE_TYPE_META } from '../game/constants'
import DamageIcon from './DamageIcon'
import './PreGame.css'

const ALL_TOWERS = Object.values(TOWER_TYPES)
const REQUIRED_PICKS = 5

function TowerDraft({ onConfirm, onCancel }) {
  const [picked, setPicked] = useState(new Set())

  const toggle = (id) => {
    const next = new Set(picked)
    if (next.has(id)) {
      next.delete(id)
    } else if (next.size < REQUIRED_PICKS) {
      next.add(id)
    }
    setPicked(next)
  }

  const ready = picked.size === REQUIRED_PICKS
  const remaining = REQUIRED_PICKS - picked.size

  const confirm = () => {
    if (ready) onConfirm(Array.from(picked))
  }

  return (
    <div className="pregame-backdrop" role="dialog" aria-modal="true" aria-label="Tower draft">
      <div className="pregame-card">
        <header className="pregame-header">
          <div>
            <div className="pregame-tag">Step 1 / Run setup</div>
            <h2>Draft your towers</h2>
            <p className="pregame-sub">
              Pick {REQUIRED_PICKS} of {ALL_TOWERS.length}. Only these will be available for the run.
            </p>
          </div>
          <div className="pregame-counter" aria-live="polite">
            <span className="pregame-counter-num">{picked.size}</span>
            <span className="pregame-counter-divider">/</span>
            <span>{REQUIRED_PICKS}</span>
          </div>
        </header>

        <div className="draft-grid">
          {ALL_TOWERS.map(tower => {
            const dt = DAMAGE_TYPE_META[tower.damageType]
            const isPicked = picked.has(tower.id)
            const disabled = !isPicked && picked.size >= REQUIRED_PICKS
            const shortName = tower.name.replace(/\s*Tower$/i, '')
            return (
              <button
                key={tower.id}
                type="button"
                className={`draft-card ${isPicked ? 'picked' : ''}`}
                onClick={() => toggle(tower.id)}
                disabled={disabled}
                aria-pressed={isPicked}
              >
                <div className="draft-card-head">
                  <span
                    className="draft-color"
                    style={{ background: tower.color }}
                  />
                  {dt && (
                    <span
                      className="dmg-badge"
                      style={{ color: dt.color, borderColor: dt.color }}
                    >
                      <DamageIcon type={tower.damageType} size={11} title={dt.label} />
                    </span>
                  )}
                </div>
                <div className="draft-name">{shortName}</div>
                <div className="draft-cost">${tower.cost}</div>
                <div className="draft-stats">
                  DMG {tower.damage} · RNG {tower.range}
                </div>
                {isPicked && <div className="draft-checkmark">✓</div>}
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
            disabled={!ready}
          >
            {ready ? 'Continue ▶' : `Pick ${remaining} more`}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default TowerDraft
