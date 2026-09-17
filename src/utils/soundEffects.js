/**
 * Web Audio API Sound Effects for FINNTECH Pro Trade
 * Generates crisp, realistic trading audio without requiring external audio files.
 */

class SoundEffectsService {
  constructor() {
    this.ctx = null
    this.enabled = true
    const saved = localStorage.getItem('finntech_sound_enabled')
    if (saved !== null) {
      this.enabled = JSON.parse(saved)
    }
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  toggleSound() {
    this.enabled = !this.enabled
    localStorage.setItem('finntech_sound_enabled', JSON.stringify(this.enabled))
    if (this.enabled) {
      this.playOrderFilled()
    }
    return this.enabled
  }

  isEnabled() {
    return this.enabled
  }

  // Double beep when an order is opened / placed
  playOrderFilled() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc1 = this.ctx.createOscillator()
      const gain1 = this.ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, now) // A5
      osc1.frequency.setValueAtTime(1174.66, now + 0.08) // D6

      gain1.gain.setValueAtTime(0.12, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc1.connect(gain1)
      gain1.connect(this.ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.22)
    } catch (e) {
      // Audio not permitted yet
    }
  }

  // MT5-style candle close pip/tick
  playCandleClose() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1046.50, now) // C6
      gain.gain.setValueAtTime(0.09, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } catch (e) {}
  }

  // Harmonic ascending chime when closing position in profit
  playProfitClose() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [587.33, 739.99, 880.00, 1174.66] // D, F#, A, D
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const start = now + idx * 0.06

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.15, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(start)
        osc.stop(start + 0.25)
      })
    } catch (e) {
      // Ignore
    }
  }

  // Soft descending chord when closing in loss / Stop Loss
  playLossClose() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [659.25, 523.25, 440.00] // E, C, A
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const start = now + idx * 0.08

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.12, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(start)
        osc.stop(start + 0.3)
      })
    } catch (e) {
      // Ignore
    }
  }

  // Bell chime when Take Profit is hit automatically
  playTPHit() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1318.51, now) // E6
      osc.frequency.setValueAtTime(1760.00, now + 0.1) // A6

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.4)
    } catch (e) {
      // Ignore
    }
  }

  // Alert Bell Chime when Price Alert is triggered
  playAlertChime() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [1046.50, 1318.51, 1567.98] // C6, E6, G6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const start = now + idx * 0.08

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.2, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(start)
        osc.stop(start + 0.35)
      })
    } catch (e) {
      // Ignore
    }
  }
}

export const soundEffects = new SoundEffectsService()
export default soundEffects
