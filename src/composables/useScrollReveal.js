import { onBeforeUnmount, onMounted } from 'vue'

// CN: 观察 containerRef 内部的 [data-reveal] 元素。
// CN: 使用 containerRef 本身作为 IntersectionObserver 的根。
// EN: Observes [data-reveal] elements inside containerRef.
// EN: Uses containerRef itself as the IntersectionObserver root.
export function useScrollReveal(containerRef, options = {}) {
  let observer = null

  function observe() {
    const root = containerRef?.value ?? null
    const targets = (root ?? document).querySelectorAll('[data-reveal]')
    if (!targets.length) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      {
        root, // scroll inside the fixed div
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '0px 0px -60px 0px',
      },
    )

    for (const el of targets) observer.observe(el)
  }

  onMounted(() => {
    requestAnimationFrame(observe)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
  })
}
