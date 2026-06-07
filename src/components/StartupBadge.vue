<script setup>
import { ref, onMounted, watch } from 'vue'
import { useOFPlayerApp } from '../app/ofplayerApp'

const ofplayer = useOFPlayerApp()
const visible = ref(false)
const dismissed = ref(false)
const rows = ref([])

function measure(name, from, to) {
  try {
    const entries = performance.getEntriesByName(name)
    if (entries.length) return entries.at(-1).duration
    const fromMark = performance.getEntriesByName(from, 'mark').at(-1)
    const toMark = performance.getEntriesByName(to, 'mark').at(-1)
    if (fromMark && toMark) return toMark.startTime - fromMark.startTime
  } catch {
    /* performance API unavailable */
  }
  return null
}

function fmt(ms) {
  if (ms == null) return '–'
  return ms < 1 ? '<1ms' : `${Math.round(ms)}ms`
}

function collectTimings() {
  const navigationEntry = performance.getEntriesByType('navigation')[0]
  const navStart = navigationEntry?.startTime ?? 0

  const mountMark = performance.getEntriesByName('ofp:mount-start', 'mark').at(-1)
  const mountDone = performance.getEntriesByName('ofp:mount-done', 'mark').at(-1)
  const hydrateStart = performance.getEntriesByName('ofp:hydrate-start', 'mark').at(-1)
  const hydrateDone = performance.getEntriesByName('ofp:hydrate-done', 'mark').at(-1)

  const scriptReady = mountMark ? Math.round(mountMark.startTime - navStart) : null
  const mountTime =
    mountMark && mountDone ? Math.round(mountDone.startTime - mountMark.startTime) : null
  const hydrateMs =
    hydrateStart && hydrateDone ? Math.round(hydrateDone.startTime - hydrateStart.startTime) : null
  const totalMs = hydrateDone ? Math.round(hydrateDone.startTime - navStart) : null

  rows.value = [
    { label: 'JS ready → mount', value: fmt(scriptReady) },
    { label: 'Mount (Vue tree)', value: fmt(mountTime) },
    { label: 'Hydrate (IDB)', value: fmt(hydrateMs) },
    { label: 'Total interactive', value: fmt(totalMs), bold: true },
  ]
  visible.value = true

  // Auto-dismiss after 12s
  setTimeout(() => {
    dismissed.value = true
  }, 12000)
}

// Trigger once isHydrating flips false (hydrate-done mark is set at that point)
const unwatch = watch(
  () => ofplayer.isHydrating.value,
  (hydrating) => {
    if (!hydrating) {
      // One rAF so hydrate-done mark is guaranteed to be written
      requestAnimationFrame(() => {
        collectTimings()
        unwatch()
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <Transition name="badge-fade">
    <div
      v-if="visible && !dismissed"
      class="startup-badge"
      role="status"
      aria-label="Startup timing"
    >
      <div class="startup-badge__header">
        <span class="startup-badge__title">Startup Timing</span>
        <button class="startup-badge__close" aria-label="Dismiss" @click="dismissed = true">
          ×
        </button>
      </div>
      <table class="startup-badge__table">
        <tbody>
          <tr v-for="row in rows" :key="row.label">
            <td class="startup-badge__label">{{ row.label }}</td>
            <td class="startup-badge__value" :class="{ 'startup-badge__value--bold': row.bold }">
              {{ row.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Transition>
</template>

<style scoped>
.startup-badge {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 9999;
  background: rgba(10, 10, 12, 0.88);
  color: #e8e8e8;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 14px 12px;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 11px;
  line-height: 1.6;
  min-width: 210px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

.startup-badge__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.startup-badge__title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.startup-badge__close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0 0 0 8px;
}
.startup-badge__close:hover {
  color: rgba(255, 255, 255, 0.75);
}

.startup-badge__table {
  border-collapse: collapse;
  width: 100%;
}

.startup-badge__label {
  color: rgba(255, 255, 255, 0.55);
  padding-right: 16px;
  white-space: nowrap;
}

.startup-badge__value {
  text-align: right;
  color: #7dd3fc;
  font-variant-numeric: tabular-nums;
}

.startup-badge__value--bold {
  color: #bfdbfe;
  font-weight: 700;
}

.badge-fade-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.badge-fade-leave-active {
  transition: opacity 0.6s ease;
}
.badge-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.badge-fade-leave-to {
  opacity: 0;
}
</style>
