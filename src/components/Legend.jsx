import { useEffect } from 'react'
import { TOWER_TYPES, ENEMY_TYPES, DAMAGE_TYPE_META } from '../game/constants'
import { EVENT_TYPES } from '../game/events'
import { RUN_MODIFIERS } from '../game/modifiers'
import DamageIcon from './DamageIcon'
import { useT } from '../i18n/i18n'
import './Legend.css'

function Legend({ onClose }) {
  const t = useT()

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
      aria-label={t('legend.title')}
      onClick={onClose}
    >
      <div className="legend-card" onClick={(e) => e.stopPropagation()}>
        <header className="legend-header">
          <h2>{t('legend.title')}</h2>
          <button
            type="button"
            className="legend-close"
            onClick={onClose}
            aria-label={t('legend.close')}
          >
            ✕
          </button>
        </header>

        <div className="legend-body">
          <section>
            <h3>{t('legend.damageTypes')}</h3>
            <ul className="legend-grid">
              {Object.entries(DAMAGE_TYPE_META).map(([key, meta]) => (
                <li key={key}>
                  <span className="legend-icon" style={{ color: meta.color, borderColor: meta.color }}>
                    <DamageIcon type={key} size={14} />
                  </span>
                  <div>
                    <strong style={{ color: meta.color }}>{t(`damage.${key}.label`, meta.label)}</strong>
                    <span className="legend-text">{t(`damage.${key}.desc`)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>{t('legend.towers')}</h3>
            <ul className="legend-grid">
              {Object.values(TOWER_TYPES).map((tw) => {
                const dt = DAMAGE_TYPE_META[tw.damageType]
                return (
                  <li key={tw.id}>
                    <span className="legend-tower" style={{ background: tw.color }} />
                    <div>
                      <strong>{t(`tower.${tw.id}.name`, tw.name)}</strong>{' '}
                      <span className="legend-mini-badge" style={{ color: dt.color, borderColor: dt.color }}>
                        <DamageIcon type={tw.damageType} size={10} />
                      </span>
                      <span className="legend-text">{t(`tower.${tw.id}.desc`)}</span>
                      <span className="legend-stats">
                        ${tw.cost} · {t('game.towerDamage')} {tw.damage} · {t('game.towerRange')} {tw.range} · {(1000 / tw.fireRate).toFixed(1)}/s
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section>
            <h3>{t('legend.enemies')}</h3>
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
                    <strong>{t(`enemy.${e.id}.name`, e.id)}</strong>
                    <span className="legend-text">{t(`enemy.${e.id}.desc`)}</span>
                    <span className="legend-stats">
                      {t('enemy.statsFmt', null, { hp: e.health, speed: e.speed, reward: e.reward })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>{t('legend.modifiers')}</h3>
            <p className="legend-section-hint">{t('legend.modifiersHint')}</p>
            <ul className="legend-grid">
              {Object.values(RUN_MODIFIERS).map((mod) => (
                <li key={mod.id}>
                  <span className="legend-mod-sign" style={{ color: mod.color, borderColor: mod.color }}>
                    {mod.sign}
                  </span>
                  <div>
                    <strong style={{ color: mod.color }}>{t(`modifier.${mod.id}.name`, mod.name)}</strong>
                    <span className="legend-text">{t(`modifier.${mod.id}.desc`, mod.description)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>{t('legend.events')}</h3>
            <ul className="legend-grid">
              {Object.values(EVENT_TYPES).map((ev) => (
                <li key={ev.id}>
                  <span className="legend-event-dot" style={{ background: ev.color }} />
                  <div>
                    <strong style={{ color: ev.color }}>{t(`event.${ev.id}.name`, ev.name)}</strong>
                    <span className="legend-text">{t(`event.${ev.id}.desc`, ev.description)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="legend-keys">
            <h3>{t('legend.indicators')}</h3>
            <ul>
              <li>
                <span className="legend-arrow up">▲</span>
                {t('legend.indicator.vulnerable', null, { strong: t('legend.vulnerable') })}
              </li>
              <li>
                <span className="legend-arrow down">▼</span>
                {t('legend.indicator.resists', null, { strong: t('legend.resists') })}
              </li>
              <li><span className="legend-aura inline shield" /> {t('legend.indicator.shield')}</li>
              <li><span className="legend-aura inline heal">+</span> {t('legend.indicator.heal')}</li>
              <li><span className="legend-aura inline phase" /> {t('legend.indicator.phase')}</li>
              <li><span className="legend-status-pill slow">{t('legend.statusSlow')}</span> {t('legend.indicator.slow')}</li>
              <li><span className="legend-status-pill burn">{t('legend.statusBurn')}</span> {t('legend.indicator.burn')}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Legend
