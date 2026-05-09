import { useMemo, useState } from 'react'
import { pickModifierChoices } from '../game/modifiers'
import { useT } from '../i18n/i18n'
import './PreGame.css'

function ModifierPicker({ onConfirm, onCancel, stepKey = 'pregame.step2' }) {
  const t = useT()
  const choices = useMemo(() => pickModifierChoices(3), [])
  const [selected, setSelected] = useState(null)

  const confirm = () => {
    if (selected) onConfirm(selected)
  }

  return (
    <div className="pregame-backdrop" role="dialog" aria-modal="true" aria-label={t('modifierPicker.title')}>
      <div className="pregame-card">
        <header className="pregame-header">
          <div>
            <div className="pregame-tag">{t(stepKey)}</div>
            <h2>{t('modifierPicker.title')}</h2>
            <p className="pregame-sub">{t('modifierPicker.sub')}</p>
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
                <div className="modifier-name">{t(`modifier.${mod.id}.name`, mod.name)}</div>
                <div className="modifier-desc">{t(`modifier.${mod.id}.desc`, mod.description)}</div>
                <div className="modifier-flavor">"{t(`modifier.${mod.id}.flavor`, mod.flavor)}"</div>
              </button>
            )
          })}
        </div>

        <footer className="pregame-footer">
          <button type="button" className="pregame-btn pregame-btn-secondary" onClick={onCancel}>
            {t('common.back')}
          </button>
          <button
            type="button"
            className="pregame-btn pregame-btn-primary"
            onClick={confirm}
            disabled={!selected}
          >
            {selected ? t('common.startRun') : t('modifierPicker.pickOne')}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ModifierPicker
