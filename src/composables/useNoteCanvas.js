import { onBeforeUnmount, onMounted, ref } from 'vue'

const NOTE_CHARS = ['♩', '♪', '♫', '♬', '♭', '♯', '𝄞']
const INTERACTION_RADIUS = 120
const REPEL_STRENGTH = 60
const SPRING_FACTOR = 0.08
const DAMPING = 0.85
const PARTICLE_LIFE = 40
const PARTICLE_SPAWN_CHANCE = 0.03
const MAX_PARTICLES = 80

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1)
}

function createNote(x, y, fontSize) {
  return {
    char: randomPick(NOTE_CHARS),
    baseX: x,
    baseY: y,
    x,
    y,
    vx: 0,
    vy: 0,
    scale: 1,
    baseScale: 0.6 + Math.random() * 0.6,
    opacity: 0.12 + Math.random() * 0.18,
    baseOpacity: 0.12 + Math.random() * 0.18,
    hueShift: 0,
    fontSize,
  }
}

function createParticle(x, y) {
  const angle = Math.random() * Math.PI * 2
  const speed = 0.5 + Math.random() * 1.5
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: PARTICLE_LIFE,
    maxLife: PARTICLE_LIFE,
    radius: 1 + Math.random() * 2,
  }
}

function generateNotes(width, height) {
  const isMobile = width < 640
  const count = isMobile ? 25 : 55
  const fontSize = isMobile ? 18 : 26
  const notes = []
  const padding = 60

  for (let i = 0; i < count; i++) {
    const x = padding + Math.random() * (width - padding * 2)
    const y = padding + Math.random() * (height - padding * 2)
    notes.push(createNote(x, y, fontSize))
  }

  return notes
}

export function useNoteCanvas(canvasRef) {
  const mouse = { x: -9999, y: -9999 }
  let notes = []
  let particles = []
  let raf = 0
  let ctx = null
  let reducedMotion = false
  let accentColor = [249, 115, 22]

  function readAccentColor() {
    if (typeof getComputedStyle === 'undefined') return
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    const m = raw.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
    if (m) {
      accentColor = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    }
  }

  function resize() {
    const canvas = canvasRef.value
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    notes = generateNotes(rect.width, rect.height)
    particles = []
  }

  function onMouseMove(e) {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    mouse.x = e.clientX - rect.left
    mouse.y = e.clientY - rect.top
  }

  function onMouseLeave() {
    mouse.x = -9999
    mouse.y = -9999
  }

  function tick() {
    if (!ctx || !canvasRef.value) return
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    ctx.clearRect(0, 0, w, h)

    // glow at mouse position
    if (mouse.x > 0 && mouse.y > 0 && !reducedMotion) {
      const [r, g, b] = accentColor
      const grad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        INTERACTION_RADIUS * 1.5,
      )
      grad.addColorStop(0, `rgba(${r},${g},${b},0.08)`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }

    const [ar, ag, ab] = accentColor

    // update & draw notes
    for (const n of notes) {
      if (!reducedMotion) {
        const d = dist(mouse.x, mouse.y, n.x, n.y)
        if (d < INTERACTION_RADIUS && d > 0) {
          const force = (1 - d / INTERACTION_RADIUS) * REPEL_STRENGTH
          const dx = (n.x - mouse.x) / d
          const dy = (n.y - mouse.y) / d
          n.vx += dx * force * 0.1
          n.vy += dy * force * 0.1
          n.scale = n.baseScale + (1 - d / INTERACTION_RADIUS) * 0.4
          n.opacity = n.baseOpacity + (1 - d / INTERACTION_RADIUS) * 0.35
          n.hueShift = (1 - d / INTERACTION_RADIUS) * 40

          // maybe spawn particle
          if (Math.random() < PARTICLE_SPAWN_CHANCE && particles.length < MAX_PARTICLES) {
            particles.push(createParticle(n.x, n.y))
          }
        } else {
          n.scale += (n.baseScale - n.scale) * 0.1
          n.opacity += (n.baseOpacity - n.opacity) * 0.1
          n.hueShift *= 0.9
        }

        // spring back
        n.vx += (n.baseX - n.x) * SPRING_FACTOR
        n.vy += (n.baseY - n.y) * SPRING_FACTOR
        n.vx *= DAMPING
        n.vy *= DAMPING
        n.x += n.vx
        n.y += n.vy
      } else {
        n.x = n.baseX
        n.y = n.baseY
        n.scale = n.baseScale
        n.opacity = n.baseOpacity
        n.hueShift = 0
      }

      ctx.save()
      ctx.translate(n.x, n.y)
      ctx.scale(n.scale, n.scale)
      ctx.globalAlpha = n.opacity
      ctx.font = `${n.fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const hue = n.hueShift
      if (hue > 1) {
        // blend towards accent
        const t = Math.min(hue / 40, 1)
        const r = Math.round(100 * (1 - t) + ar * t)
        const g = Math.round(100 * (1 - t) + ag * t)
        const b = Math.round(100 * (1 - t) + ab * t)
        ctx.fillStyle = `rgb(${r},${g},${b})`
      } else {
        ctx.fillStyle = `rgba(0,0,0,${n.opacity})`
      }

      ctx.fillText(n.char, 0, 0)
      ctx.restore()
    }

    // update & draw particles
    if (!reducedMotion) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life--

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const alpha = (p.life / p.maxLife) * 0.4
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${ar},${ag},${ab},${alpha})`
        ctx.fill()
      }
    }

    raf = requestAnimationFrame(tick)
  }

  let ro = null

  onMounted(() => {
    reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    readAccentColor()
    resize()

    const canvas = canvasRef.value
    if (canvas) {
      canvas.addEventListener('mousemove', onMouseMove)
      canvas.addEventListener('mouseleave', onMouseLeave)
    }

    ro = new ResizeObserver(resize)
    if (canvas) ro.observe(canvas)

    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    const canvas = canvasRef.value
    if (canvas) {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
    if (ro) ro.disconnect()
  })
}
