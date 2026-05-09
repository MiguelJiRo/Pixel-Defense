import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STRINGS } from './strings'

const STORAGE_KEY = 'pixel-defense:lang:v1'
export const SUPPORTED_LANGS = ['en', 'es']

export function detectLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED_LANGS.includes(stored)) return stored
  } catch {
    // localStorage may not be available (private mode); fall through
  }
  if (typeof navigator === 'undefined') return 'en'
  const candidates = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || '']
  for (const raw of candidates) {
    const code = (raw || '').toLowerCase().slice(0, 2)
    if (SUPPORTED_LANGS.includes(code)) return code
  }
  return 'en'
}

function format(template, params) {
  if (!params) return template
  let out = template
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v))
  }
  return out
}

export function translate(lang, key, fallback, params) {
  const table = STRINGS[lang] || STRINGS.en
  const raw = table[key] ?? STRINGS.en[key] ?? fallback ?? key
  return format(raw, params)
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (k, f, p) => translate('en', k, f, p)
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => detectLanguage())

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = useCallback((next) => {
    if (!SUPPORTED_LANGS.includes(next)) return
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'es' : 'en'
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
      return next
    })
  }, [])

  const value = useMemo(() => ({
    lang,
    setLang,
    toggleLang,
    t: (key, fallback, params) => translate(lang, key, fallback, params)
  }), [lang, setLang, toggleLang])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT() { return useContext(LanguageContext).t }
export function useLang() { return useContext(LanguageContext) }
