const HIGH_SCORE_KEY = 'pixel-defense:highscores:v1'

const readAll = () => {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const buildKey = (difficulty, rounds) => `${difficulty}:${rounds}`

export const getHighScore = (difficulty, rounds) => {
  const all = readAll()
  return all[buildKey(difficulty, rounds)] || 0
}

export const saveHighScore = (difficulty, rounds, score) => {
  const all = readAll()
  const key = buildKey(difficulty, rounds)
  const previous = all[key] || 0
  if (score <= previous) return previous
  all[key] = score
  try {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(all))
  } catch {
    // storage may be unavailable (private mode) — fail silently
  }
  return score
}

export const getAllHighScores = () => readAll()
