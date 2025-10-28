// Particle system for visual effects

export class ParticleSystem {
  constructor() {
    this.particles = []
  }

  createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 2 + Math.random() * 3

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        type: 'explosion'
      })
    }
  }

  createMoneyEffect(x, y, amount) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -2,
      text: `+$${amount}`,
      color: '#00ff00',
      life: 1.0,
      decay: 0.015,
      type: 'text'
    })
  }

  createHitEffect(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff',
        size: 2,
        life: 0.5,
        decay: 0.04,
        type: 'spark'
      })
    }
  }

  createSplashEffect(x, y, radius, color) {
    const particleCount = Math.floor(radius * 4)
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 1 + Math.random() * 2

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 2,
        life: 0.8,
        decay: 0.03,
        type: 'splash'
      })
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]

      p.x += p.vx
      p.y += p.vy
      p.life -= p.decay

      // Gravity for explosion particles
      if (p.type === 'explosion' || p.type === 'splash') {
        p.vy += 0.1
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.life

      if (p.type === 'text') {
        ctx.fillStyle = p.color
        ctx.font = 'bold 14px Courier New'
        ctx.textAlign = 'center'
        ctx.fillText(p.text, p.x, p.y)
      } else {
        ctx.fillStyle = p.color
        ctx.fillRect(
          Math.floor(p.x - p.size / 2),
          Math.floor(p.y - p.size / 2),
          Math.floor(p.size),
          Math.floor(p.size)
        )
      }
    }

    ctx.globalAlpha = 1.0
  }

  clear() {
    this.particles = []
  }
}
