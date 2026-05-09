import { useEffect, useMemo, useState } from 'react'
import { useT } from '../i18n/i18n'
import './Tutorial.css'

// Tutorial system: drives a queue of contextual tips that fire as the run
// progresses. Each tip has a `condition` evaluated against game state and
// only shows once per run. Player can dismiss with the close button.

const TIPS = [
  {
    id: 'shop',
    when: (s) => s.round === 0 && s.waveActive === false
  },
  {
    id: 'damageTypes',
    when: (s) => s.round >= 1
  },
  {
    id: 'firstWave',
    when: (s) => s.waveActive === true
  },
  {
    id: 'leak',
    when: (s) => s.stats?.leaks > 0
  },
  {
    id: 'firstTank',
    when: (s) => (s.enemies || []).some(e => e.type?.id === 'TANK')
  },
  {
    id: 'firstShielded',
    when: (s) => (s.enemies || []).some(e => e.type?.id === 'SHIELDED')
  },
  {
    id: 'firstBoss',
    when: (s) => (s.enemies || []).some(e => e.type?.isBoss)
  },
  {
    id: 'legend',
    when: (s) => s.round >= 2
  }
]

function Tutorial({ getState, enabled }) {
  const t = useT()
  const [shown, setShown] = useState(() => new Set())
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!enabled) return
    let raf
    const tick = () => {
      const state = getState?.()
      if (state) {
        const next = TIPS.find(tip => !shown.has(tip.id) && tip.when(state))
        if (next && (!active || active.id !== next.id)) {
          setActive(next)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enabled, getState, shown, active])

  const dismiss = () => {
    if (!active) return
    setShown(prev => {
      const n = new Set(prev)
      n.add(active.id)
      return n
    })
    setActive(null)
  }

  if (!enabled || !active) return null

  return (
    <div className="tutorial-toast" role="status" aria-live="polite">
      <div className="tutorial-step">{t('tutorial.step', null, { current: shown.size + 1, total: TIPS.length })}</div>
      <h3 className="tutorial-title">{t(`tutorial.${active.id}.title`)}</h3>
      <p className="tutorial-body">{t(`tutorial.${active.id}.body`)}</p>
      <button type="button" className="tutorial-close" onClick={dismiss} aria-label={t('tutorial.dismiss')}>
        {t('tutorial.gotIt')}
      </button>
    </div>
  )
}

export default Tutorial
