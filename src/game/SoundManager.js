const STORAGE_KEY = 'pixel-defense:audio:v1'

const readPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writePrefs = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

class SoundManager {
  constructor() {
    const stored = readPrefs() || {}
    this.muted = stored.muted ?? false
    this.volume = stored.volume ?? 0.5
    this.musicVolume = stored.musicVolume ?? 0.25

    this.ctx = null
    this.master = null
    this.sfxGain = null
    this.musicGain = null

    this.musicNodes = null
    this.musicTimer = null
    this.musicStep = 0

    this.lastShotAt = 0
    this.listeners = new Set()
  }

  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  notify() {
    for (const fn of this.listeners) fn(this.getState())
  }

  getState() {
    return { muted: this.muted, volume: this.volume, musicVolume: this.musicVolume }
  }

  persist() {
    writePrefs({ muted: this.muted, volume: this.volume, musicVolume: this.musicVolume })
  }

  ensureCtx() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 1
      this.master.connect(this.ctx.destination)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = this.volume
      this.sfxGain.connect(this.master)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = this.musicVolume
      this.musicGain.connect(this.master)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master) this.master.gain.value = muted ? 0 : 1
    this.persist()
    this.notify()
  }

  toggleMute() { this.setMuted(!this.muted) }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.sfxGain) this.sfxGain.gain.value = this.volume
    this.persist()
    this.notify()
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume
    this.persist()
    this.notify()
  }

  // Generic blip helper
  _blip({ freq = 440, duration = 0.08, type = 'square', volume = 0.4, slide = 0, decay = 'linear' }) {
    const ctx = this.ensureCtx()
    if (!ctx || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + duration)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.005)
    if (decay === 'expo') {
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    } else {
      gain.gain.linearRampToValueAtTime(0, now + duration)
    }

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  _noise({ duration = 0.15, volume = 0.3, filterFreq = 1200, filterType = 'lowpass' }) {
    const ctx = this.ensureCtx()
    if (!ctx || this.muted) return
    const now = ctx.currentTime
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = filterFreq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    src.start(now)
    src.stop(now + duration + 0.02)
  }

  // Public effects
  uiClick() {
    this._blip({ freq: 720, duration: 0.05, type: 'square', volume: 0.25 })
  }
  uiHover() {
    this._blip({ freq: 520, duration: 0.03, type: 'square', volume: 0.12 })
  }
  shoot(towerType = 'BASIC') {
    const ctx = this.ensureCtx()
    if (!ctx) return
    // throttle to avoid acoustic chaos when many towers fire
    if (ctx.currentTime - this.lastShotAt < 0.04) return
    this.lastShotAt = ctx.currentTime

    const profiles = {
      BASIC:  { freq: 880, slide: -300, type: 'square',   volume: 0.2,  duration: 0.06 },
      SNIPER: { freq: 320, slide: -180, type: 'sawtooth', volume: 0.25, duration: 0.18 },
      RAPID:  { freq: 1200, slide: -400, type: 'square',  volume: 0.12, duration: 0.04 },
      SPLASH: { freq: 220, slide: -120, type: 'triangle', volume: 0.25, duration: 0.14 }
    }
    this._blip(profiles[towerType] || profiles.BASIC)
  }
  hit() {
    this._blip({ freq: 180, duration: 0.04, type: 'square', volume: 0.15, slide: -80 })
  }
  enemyDeath() {
    this._blip({ freq: 660, slide: -500, type: 'square', volume: 0.25, duration: 0.18, decay: 'expo' })
    this._noise({ duration: 0.12, volume: 0.18, filterFreq: 800 })
  }
  explosion() {
    this._noise({ duration: 0.35, volume: 0.45, filterFreq: 600 })
    this._blip({ freq: 90, slide: -50, type: 'sawtooth', volume: 0.3, duration: 0.25, decay: 'expo' })
  }
  build() {
    this._blip({ freq: 440, type: 'square', volume: 0.25, duration: 0.07 })
    setTimeout(() => this._blip({ freq: 660, type: 'square', volume: 0.25, duration: 0.09 }), 70)
  }
  upgrade() {
    this._blip({ freq: 523, type: 'square', volume: 0.25, duration: 0.08 })
    setTimeout(() => this._blip({ freq: 659, type: 'square', volume: 0.25, duration: 0.08 }), 80)
    setTimeout(() => this._blip({ freq: 784, type: 'square', volume: 0.25, duration: 0.12 }), 160)
  }
  sell() {
    this._blip({ freq: 660, slide: -300, type: 'square', volume: 0.22, duration: 0.12 })
  }
  cantAfford() {
    this._blip({ freq: 200, type: 'square', volume: 0.2, duration: 0.1 })
    setTimeout(() => this._blip({ freq: 150, type: 'square', volume: 0.2, duration: 0.12 }), 80)
  }
  leak() {
    this._blip({ freq: 240, slide: -120, type: 'sawtooth', volume: 0.35, duration: 0.4, decay: 'expo' })
  }
  waveStart() {
    this._blip({ freq: 392, type: 'square', volume: 0.3, duration: 0.1 })
    setTimeout(() => this._blip({ freq: 587, type: 'square', volume: 0.3, duration: 0.18 }), 100)
  }
  waveClear() {
    this._blip({ freq: 523, type: 'square', volume: 0.28, duration: 0.1 })
    setTimeout(() => this._blip({ freq: 659, type: 'square', volume: 0.28, duration: 0.1 }), 90)
    setTimeout(() => this._blip({ freq: 784, type: 'square', volume: 0.28, duration: 0.18 }), 180)
  }
  victory() {
    const notes = [523, 659, 784, 1046]
    notes.forEach((f, i) => {
      setTimeout(() => this._blip({ freq: f, type: 'square', volume: 0.32, duration: 0.18 }), i * 140)
    })
  }
  gameOver() {
    const notes = [440, 392, 349, 261]
    notes.forEach((f, i) => {
      setTimeout(() => this._blip({ freq: f, type: 'sawtooth', volume: 0.3, duration: 0.22, decay: 'expo' }), i * 180)
    })
  }

  // Music: simple looped pulse-wave pattern, low volume
  startMusic() {
    const ctx = this.ensureCtx()
    if (!ctx || this.musicTimer) return

    const bass = ctx.createOscillator()
    const bassGain = ctx.createGain()
    bass.type = 'triangle'
    bass.frequency.value = 65
    bassGain.gain.value = 0.18
    bass.connect(bassGain); bassGain.connect(this.musicGain)
    bass.start()

    const lead = ctx.createOscillator()
    const leadGain = ctx.createGain()
    lead.type = 'square'
    lead.frequency.value = 220
    leadGain.gain.value = 0
    lead.connect(leadGain); leadGain.connect(this.musicGain)
    lead.start()

    // C minor pentatonic-ish loop
    const pattern = [262, 311, 349, 392, 466, 392, 349, 311, 262, 311, 349, 311, 262, 220, 196, 220]
    const stepMs = 280

    this.musicNodes = { bass, bassGain, lead, leadGain }
    this.musicStep = 0

    const tick = () => {
      const now = ctx.currentTime
      const f = pattern[this.musicStep % pattern.length]
      lead.frequency.setValueAtTime(f, now)
      leadGain.gain.cancelScheduledValues(now)
      leadGain.gain.setValueAtTime(0.0001, now)
      leadGain.gain.exponentialRampToValueAtTime(0.07, now + 0.02)
      leadGain.gain.exponentialRampToValueAtTime(0.0001, now + stepMs / 1000 * 0.9)

      // bassline every 4 steps
      if (this.musicStep % 4 === 0) {
        const bf = [65, 65, 73, 87][Math.floor(this.musicStep / 4) % 4]
        bass.frequency.setValueAtTime(bf, now)
      }
      this.musicStep++
    }
    tick()
    this.musicTimer = setInterval(tick, stepMs)
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }
    if (this.musicNodes) {
      try {
        this.musicNodes.bass.stop()
        this.musicNodes.lead.stop()
      } catch { /* already stopped */ }
      this.musicNodes = null
    }
  }
}

export const sound = new SoundManager()
