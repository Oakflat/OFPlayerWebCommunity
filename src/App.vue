<script setup>
import { RouterView } from 'vue-router'
// StartupBadge kept for dev reference — not rendered in production
// import StartupBadge from './components/StartupBadge.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page-fade">
      <KeepAlive include="PlayerPage">
        <component :is="Component" />
      </KeepAlive>
    </Transition>
  </RouterView>
</template>

<style>
/*
 * Cross-dissolve transition — simultaneous (no mode="out-in")
 * Leave page sits on top (z-index 20) and fades out + drifts up.
 * Enter page rises from below (z-index 10) with its own background.
 * The enter page always covers the body, so no background flash occurs.
 */
.page-fade-leave-active {
  z-index: 20;
  transition:
    opacity 0.15s cubic-bezier(0.4, 0, 1, 1),
    transform 0.15s cubic-bezier(0.4, 0, 1, 1);
  pointer-events: none;
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.page-fade-enter-active {
  z-index: 10;
  transition:
    opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
</style>
