<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
  anchorEl: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'select'])

const menuRef = ref(null)
const menuStyle = ref({})

function handleDocumentClick(event) {
  if (!props.isOpen) {
    return
  }

  if (menuRef.value?.contains(event.target) || props.anchorEl?.contains?.(event.target)) {
    return
  }

  emit('close')
}

function updatePosition() {
  if (!props.isOpen || !props.anchorEl) {
    menuStyle.value = {}
    return
  }

  const anchorRect = props.anchorEl.getBoundingClientRect()
  const menuWidth = menuRef.value?.offsetWidth ?? 168
  const menuHeight = menuRef.value?.offsetHeight ?? 0
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 12
  const gap = 6

  let left = anchorRect.right - menuWidth
  left = Math.max(margin, Math.min(left, viewportWidth - menuWidth - margin))

  let top = anchorRect.bottom + gap

  if (top + menuHeight > viewportHeight - margin) {
    top = Math.max(margin, anchorRect.top - menuHeight - gap)
  }

  menuStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
  }
}

function handleViewportChange() {
  if (!props.isOpen) {
    emit('close')
    return
  }

  updatePosition()
}

function handleEscape(event) {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

function handleItemClick(item) {
  if (item.disabled) {
    return
  }

  emit('select', item)
  emit('close')
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true)
  document.addEventListener('keydown', handleEscape, true)
  window.addEventListener('resize', handleViewportChange)
  window.addEventListener('scroll', handleViewportChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  document.removeEventListener('keydown', handleEscape, true)
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('scroll', handleViewportChange, true)
})

watch(
  () => [props.isOpen, props.anchorEl, props.items.length],
  async ([isOpen]) => {
    if (!isOpen) {
      menuStyle.value = {}
      return
    }

    await nextTick()
    updatePosition()
    window.requestAnimationFrame(updatePosition)
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="of-ui-menu-dropdown">
      <div v-if="isOpen" ref="menuRef" class="of-ui-menu-dropdown" :style="menuStyle" role="menu">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="of-ui-menu-dropdown-item"
          :class="{ 'is-disabled': item.disabled }"
          :disabled="item.disabled"
          role="menuitem"
          @click="handleItemClick(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.of-ui-menu-dropdown {
  position: fixed;
  z-index: 64;
  min-width: 160px;
  padding: 0.25rem;
  border-radius: var(--of-ui-radius-lg);
  border: 1px solid var(--of-ui-line);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--of-ui-shadow-soft);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.of-ui-menu-dropdown-item {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: var(--of-ui-radius-md);
  background: transparent;
  text-align: left;
  font-size: var(--of-ui-font-size-sm);
  font-weight: 500;
  color: var(--of-ui-ink);
  cursor: pointer;
  transition: all var(--of-ui-transition-fast);
}

.of-ui-menu-dropdown-item:hover:not(:disabled) {
  background: rgba(248, 250, 253, 0.96);
}

.of-ui-menu-dropdown-item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.of-ui-menu-dropdown-enter-active,
.of-ui-menu-dropdown-leave-active {
  transition: all var(--of-ui-transition-fast);
}

.of-ui-menu-dropdown-enter-from,
.of-ui-menu-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
