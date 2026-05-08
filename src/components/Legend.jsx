import { useEffect } from 'react'
import { TOWER_TYPES, ENEMY_TYPES, DAMAGE_TYPE_META } from '../game/constants'
import { EVENT_TYPES } from '../game/events'
import DamageIcon from './DamageIcon'
import './Legend.css'

const ENEMY_DESCRIPTIONS = {
  BASIC: 'Neutral target dummy. No resistances.',
  FAST: 'Small and dodgy. Resists direct fire, melts to area damage.',
  TANK: 'Heavy plating: piercing & energy punch through, kinetic & explosive bounce.',
  BOSS: 'Slow, massive HP. Vulnerable to piercing, resists energy.',
  SHIELDED: 'Energy shield absorbs damage first. Pierce or zap to break it fast.',
  HEALER: 'Heals every nearby enemy in a radius. Kill it on sight.',
  SPLITTER: 'Splits into two fast, weaker minis on death. Don\'t kill it near the end.',
  PHANTOM: 'Phases through single-target shots half the time. Use area damage.'
}

const TOWER_DESCRIPTIONS = {
  BASIC: 'All-rounder. Cheap, balanced, no specialization.',
  SNIPER: 'Long range, slow fire rate, big damage. Best vs Tanks and Bosses.',
  RAPID: 'Tiny damage at very high rate of fire. Excellent vs Fast enemies.',
  SPLASH: 'Area-of-effect blast. Hits hidden targets and clusters.'
}

function Legend({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="legend-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Legend"
      onClick={onClose}
    >
      <div className="legend-card" onClick={(e) => e.stopPropagation()}>
        <header className="legend-header">
          <h2>Legend</h2>
          <button
            type="button"
            className="legend-close"
            onClick={onClose}
            aria-label="Close legend"
          >
            ✕
          </button>
        </header>

        <div className="legend-body">
          <section>
            <h3>Damage Types</h3>
            <ul className="legend-grid">
              {Object.entries(DAMAGE_TYPE_META).map(([key, meta]) => (
                <li key={key}>
                  <span className="legend-icon" style={{ color: meta.color, borderColor: meta.color }}>
                    <DamageIcon type={key} size={14} />
                  </span>
                  <div>
                    <strong style={{ color: meta.color }}>{meta.label}</strong>
                    <span className="legend-text">
                      {key === 'KINETIC' && 'Bullet damage. Neutral, no specialization.'}
                      {key === 'PIERCING' && 'Punches through armor. Excellent vs Tanks and Bosses.'}
                      {key === 'ENERGY' && 'Bypasses physical defenses. Melts Fast enemies.'}
                      {key === 'EXPLOSIVE' && 'Area damage. Devastates clusters but bounces off armor.'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Towers</h3>
            <ul className="legend-grid">
              {Object.values(TOWER_TYPES).map((t) => {
                const dt = DAMAGE_TYPE_META[t.damageType]
                return (
                  <li key={t.id}>
                    <span className="legend-tower" style={{ background: t.color }} />
                    <div>
                      <strong>{t.name}</strong>{' '}
                      <span className="legend-mini-badge" style={{ color: dt.color, borderColor: dt.color }}>
                        <DamageIcon type={t.damageType} size={10} />
                      </span>
                      <span className="legend-text">{TOWER_DESCRIPTIONS[t.id]}</span>
                      <span className="legend-stats">
                        ${t.cost} · DMG {t.damage} · RNG {t.range} · {(1000 / t.fireRate).toFixed(1)}/s
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section>
            <h3>Enemies</h3>
            <ul className="legend-grid enemies">
              {Object.values(ENEMY_TYPES).map((e) => (
                <li key={e.id}>
                  <span className="legend-enemy">
                    <span
                      className="legend-enemy-body"
                      style={{ background: e.color, width: e.size, height: e.size }}
                    />
                    {e.ability?.kind === 'SHIELD' && <span className="legend-aura shield" />}
                    {e.ability?.kind === 'HEAL' && <span className="legend-aura heal">+</span>}
                    {e.ability?.kind === 'SPLIT' && <span className="legend-aura split" />}
                    {e.ability?.kind === 'PHASE' && <span className="legend-aura phase" />}
                  </span>
                  <div>
                    <strong>{e.id.charAt(0) + e.id.slice(1).toLowerCase()}</strong>
                    <span className="legend-text">{ENEMY_DESCRIPTIONS[e.id]}</span>
                    <span className="legend-stats">
                      HP {e.health} · Speed {e.speed} · Reward ${e.reward}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Wave Events</h3>
            <ul className="legend-grid">
              {Object.values(EVENT_TYPES).map((ev) => (
                <li key={ev.id}>
                  <span className="legend-event-dot" style={{ background: ev.color }} />
                  <div>
                    <strong style={{ color: ev.color }}>{ev.name}</strong>
                    <span className="legend-text">{ev.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="legend-keys">
            <h3>Indicators on the field</h3>
            <ul>
              <li><span className="legend-arrow up">▲</span> Enemy is <strong>vulnerable</strong> to the selected tower's damage type.</li>
              <li><span className="legend-arrow down">▼</span> Enemy <strong>resists</strong> the selected tower's damage type.</li>
              <li><span className="legend-aura inline shield" /> Cyan ring → active shield (extra HP layer).</li>
              <li><span className="legend-aura inline heal">+</span> Pulsing green halo → healer's heal radius.</li>
              <li><span className="legend-aura inline phase" /> Translucent body → phantom; can phase through single-target shots.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Legend
