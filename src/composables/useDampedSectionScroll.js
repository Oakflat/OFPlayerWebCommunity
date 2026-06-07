import { onBeforeUnmount, onMounted } from 'vue'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function easeOutCubic(t) {
  const p = 1 - t
  return 1 - p * p * p
}

function findNearestIndex(positions, top) {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < positions.length; i += 1) {
    const distance = Math.abs(positions[i] - top)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  }

  return bestIndex
}

function canNestedScroll(target, root, direction) {
  let node = target instanceof Element ? target : null

  while (node && node !== root) {
    const style = window.getComputedStyle(node)
    const overflowY = style.overflowY
    const scrollable =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight

    if (scrollable) {
      const maxScrollTop = node.scrollHeight - node.clientHeight
      if (direction > 0 && node.scrollTop < maxScrollTop) return true
      if (direction < 0 && node.scrollTop > 0) return true
    }

    node = node.parentElement
  }

  return false
}

export function useDampedSectionScroll(containerRef, options = {}) {
  let rafId = null
  let isAnimating = false

  const snapSelector = options.snapSelector ?? 'section, .pp-footer'
  const minDesktopWidth = options.minDesktopWidth ?? 900
  const wheelThreshold = options.wheelThreshold ?? 26
  const cooldownMs = options.cooldownMs ?? 110

  function getSnapPositions(root) {
    const nodes = root.querySelectorAll(snapSelector)
    return Array.from(nodes)
      .map((node) => Math.max(0, node.offsetTop))
      .sort((a, b) => a - b)
  }

  function getNavOffset(root) {
    if (!options.navSelector) return 0
    const nav = root.querySelector(options.navSelector)
    return nav ? nav.offsetHeight : 0
  }

  function stopAnimation() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function animateScroll(root, targetTop) {
    stopAnimation()
    isAnimating = true

    const startTop = root.scrollTop
    const distance = targetTop - startTop
    const duration = clamp(360 + Math.abs(distance) * 0.28, 420, 760)
    const startedAt = performance.now()

    const tick = (now) => {
      const elapsed = now - startedAt
      const progress = clamp(elapsed / duration, 0, 1)
      root.scrollTop = startTop + distance * easeOutCubic(progress)

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
        return
      }

      rafId = null
      window.setTimeout(() => {
        isAnimating = false
      }, cooldownMs)
    }

    rafId = requestAnimationFrame(tick)
  }

  function onWheel(event) {
    const root = containerRef?.value
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.innerWidth < minDesktopWidth) return
    if (event.ctrlKey) return

    const deltaY = event.deltaY
    const absDeltaY = Math.abs(deltaY)
    if (absDeltaY < wheelThreshold) return

    const direction = deltaY > 0 ? 1 : -1
    if (canNestedScroll(event.target, root, direction)) return

    const positions = getSnapPositions(root)
    if (positions.length < 2) return

    const navOffset = getNavOffset(root)
    const probeTop = root.scrollTop + navOffset + 20
    const currentIndex = findNearestIndex(positions, probeTop)
    const nextIndex = clamp(currentIndex + direction, 0, positions.length - 1)

    if (nextIndex === currentIndex && !isAnimating) return

    event.preventDefault()

    if (isAnimating) return

    const targetTop = Math.max(0, positions[nextIndex] - navOffset)
    animateScroll(root, targetTop)
  }

  onMounted(() => {
    const root = containerRef?.value
    if (!root) return
    root.addEventListener('wheel', onWheel, { passive: false })
  })

  onBeforeUnmount(() => {
    const root = containerRef?.value
    if (root) root.removeEventListener('wheel', onWheel)
    stopAnimation()
  })
}
