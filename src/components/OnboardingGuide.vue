<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Library,
  ListMusic,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  HardDriveDownload,
  FileText,
  ExternalLink,
  Check,
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'

// ── Storage key ──
const SEEN_KEY = 'ofplayer:onboarding:seen:v1'

const { t } = useI18n()

const emit = defineEmits(['close'])

// ── State ──
const step = ref(0)
const TOTAL = 5

const isFirst = computed(() => step.value === 0)
const isLast = computed(() => step.value === TOTAL - 1)

function prev() {
  if (!isFirst.value) step.value--
}
function next() {
  if (!isLast.value) step.value++
}

function finish() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* storage unavailable */
  }
  emit('close')
}

function dismiss() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* storage unavailable */
  }
  emit('close')
}

// ── Demo animation state (step 0 — hover + button) ──
const plusVisible = ref(false)
let plusTimer = null
function startPlusDemo() {
  plusTimer = setInterval(() => {
    plusVisible.value = !plusVisible.value
  }, 1400)
}
function stopPlusDemo() {
  clearInterval(plusTimer)
}

onMounted(() => {
  startPlusDemo()
})
onUnmounted(() => {
  stopPlusDemo()
})

// ── Demo library structure (step 1 — nested) ──
const demoLibraries = [
  { label: t('onboarding.demoLocalLib'), active: true },
  { label: t('onboarding.demoWorkLib'), active: false },
]
const demoPlaylists = [
  { label: t('onboarding.demoPlaylistDefault'), sys: true },
  { label: t('onboarding.demoPlaylistFav'), sys: false },
  { label: t('onboarding.demoPlaylistDrive'), sys: false },
]
</script>

<template>
  <!-- ── Backdrop ── -->
  <Teleport to="body">
    <div
      class="og-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="t('onboarding.ariaLabel')"
      @click.self="dismiss"
    >
      <div class="og-card">
        <!-- Header -->
        <div class="og-header">
          <div class="og-header-brand">
            <span class="og-header-logo">OF</span>
            <span class="og-header-title">{{ t('onboarding.title') }}</span>
          </div>
          <button class="og-close" :aria-label="t('onboarding.close')" @click="dismiss">
            <X :size="15" />
          </button>
        </div>

        <!-- Progress dots -->
        <div class="og-dots" role="tablist" aria-label="Steps">
          <button
            v-for="i in TOTAL"
            :key="i"
            class="og-dot"
            :class="{ 'og-dot--active': step === i - 1 }"
            role="tab"
            :aria-selected="step === i - 1"
            :aria-label="`Step ${i}`"
            @click="step = i - 1"
          />
        </div>

        <!-- ══════ STEP 0 — Library ══════ -->
        <Transition name="og-slide" mode="out-in">
          <div v-if="step === 0" key="step0" class="og-body">
            <div class="og-illus">
              <!-- Mini sidebar showing library section + hover + button -->
              <div class="og-mini-sidebar">
                <p class="og-mini-section-label">{{ t('sidebar.librarySection') }}</p>
                <div class="og-mini-lib-row" :class="{ 'og-mini-lib-row--hover': plusVisible }">
                  <Library class="og-mini-icon" :size="13" aria-hidden="true" />
                  <span class="og-mini-name">{{ t('onboarding.demoLocalLib') }}</span>
                  <span class="og-mini-count" :class="{ 'og-mini-count--hidden': plusVisible }"
                    >54</span
                  >
                  <span
                    class="og-mini-dots-btn"
                    :class="{ 'og-mini-dots-btn--visible': plusVisible }"
                    aria-hidden="true"
                    >···</span
                  >
                </div>

                <!-- Add Library button in header -->
                <div class="og-mini-add-row">
                  <span class="og-mini-add-label">{{ t('sidebar.librarySection') }}</span>
                  <span class="og-mini-add-btn" :class="{ 'og-mini-add-btn--pulse': plusVisible }">
                    <Plus :size="12" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>

            <div class="og-text">
              <h2 class="og-step-title">{{ t('onboarding.step0Title') }}</h2>
              <p class="og-step-body">{{ t('onboarding.step0Body') }}</p>
              <ul class="og-bullets">
                <li>{{ t('onboarding.step0Bullet0') }}</li>
                <li>{{ t('onboarding.step0Bullet1') }}</li>
              </ul>
            </div>
          </div>

          <!-- ══════ STEP 1 — Library management ══════ -->
          <div v-else-if="step === 1" key="step1mgmt" class="og-body">
            <div class="og-illus">
              <div class="og-mini-sidebar og-mini-sidebar--menu-demo">
                <p class="og-mini-section-label">{{ t('sidebar.librarySection') }}</p>
                <div class="og-mini-lib-row og-mini-lib-row--hover">
                  <Library class="og-mini-icon" :size="13" aria-hidden="true" />
                  <span class="og-mini-name">{{ t('onboarding.demoLocalLib') }}</span>
                  <span class="og-mini-dots-btn og-mini-dots-btn--visible" aria-hidden="true"
                    >···</span
                  >
                </div>
                <div class="og-mini-menu" :class="{ 'og-mini-menu--open': plusVisible }">
                  <div class="og-mini-menu-item">{{ t('onboarding.menuRename') }}</div>
                  <div class="og-mini-menu-item og-mini-menu-item--disabled">
                    {{ t('onboarding.menuDelete') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="og-text">
              <h2 class="og-step-title">{{ t('onboarding.stepMgmtTitle') }}</h2>
              <p class="og-step-body">{{ t('onboarding.stepMgmtBody') }}</p>
              <ul class="og-bullets">
                <li>{{ t('onboarding.stepMgmtBullet0') }}</li>
                <li>{{ t('onboarding.stepMgmtBullet1') }}</li>
              </ul>
            </div>
          </div>

          <!-- ══════ STEP 2 — Playlist inside Library ══════ -->
          <div v-else-if="step === 2" key="step2" class="og-body">
            <div class="og-illus">
              <div class="og-mini-sidebar og-mini-sidebar--wide">
                <!-- Library row -->
                <p class="og-mini-section-label">{{ t('sidebar.librarySection') }}</p>
                <div
                  v-for="lib in demoLibraries"
                  :key="lib.label"
                  class="og-mini-lib-row"
                  :class="{ 'og-mini-lib-row--active': lib.active }"
                >
                  <Library class="og-mini-icon" :size="13" aria-hidden="true" />
                  <span class="og-mini-name">{{ lib.label }}</span>
                </div>

                <!-- Divider -->
                <div class="og-mini-divider" />

                <!-- Playlist rows — nested indicator -->
                <p class="og-mini-section-label">{{ t('sidebar.playlistSection') }}</p>
                <div
                  v-for="pl in demoPlaylists"
                  :key="pl.label"
                  class="og-mini-pl-row"
                  :class="{ 'og-mini-pl-row--sys': pl.sys }"
                >
                  <ListMusic class="og-mini-icon" :size="12" aria-hidden="true" />
                  <span class="og-mini-name">{{ pl.label }}</span>
                  <span v-if="pl.sys" class="og-mini-badge">{{
                    t('onboarding.defaultBadge')
                  }}</span>
                </div>
              </div>
            </div>

            <div class="og-text">
              <h2 class="og-step-title">{{ t('onboarding.step1Title') }}</h2>
              <p class="og-step-body">{{ t('onboarding.step1Body') }}</p>
              <ul class="og-bullets">
                <li>{{ t('onboarding.step1Bullet0') }}</li>
                <li>{{ t('onboarding.step1Bullet1') }}</li>
              </ul>
            </div>
          </div>

          <!-- ══════ STEP 3 — Import audio ══════ -->
          <div v-else-if="step === 3" key="step3" class="og-body">
            <div class="og-illus">
              <div class="og-import-demo">
                <div class="og-import-icon-wrap">
                  <HardDriveDownload :size="28" class="og-import-icon" aria-hidden="true" />
                </div>
                <div class="og-import-formats">
                  <span
                    v-for="fmt in ['FLAC', 'MP3', 'WAV', 'AIFF', 'M4A', 'OGG', 'AAC']"
                    :key="fmt"
                    class="og-fmt-badge"
                    >{{ fmt }}</span
                  >
                </div>
                <div class="og-import-arrow">
                  <div class="og-import-bar" />
                  <div class="og-import-bar og-import-bar--2" />
                </div>
                <div class="og-import-dest">
                  <Library :size="13" aria-hidden="true" />
                  <span>{{ t('onboarding.demoLocalLib') }}</span>
                  <ChevronRight :size="11" aria-hidden="true" />
                  <ListMusic :size="12" aria-hidden="true" />
                  <span>{{ t('onboarding.demoPlaylistDefault') }}</span>
                </div>
              </div>
            </div>

            <div class="og-text">
              <h2 class="og-step-title">{{ t('onboarding.step2Title') }}</h2>
              <p class="og-step-body">{{ t('onboarding.step2Body') }}</p>
              <ul class="og-bullets">
                <li>{{ t('onboarding.step2Bullet0') }}</li>
                <li>{{ t('onboarding.step2Bullet1') }}</li>
              </ul>
            </div>
          </div>

          <!-- ══════ STEP 4 — Lyrics ══════ -->
          <div v-else-if="step === 4" key="step4" class="og-body">
            <div class="og-illus">
              <div class="og-lyrics-demo">
                <div class="og-lrc-file">
                  <FileText :size="22" class="og-lrc-icon" aria-hidden="true" />
                  <span class="og-lrc-name">track.lrc</span>
                </div>
                <div class="og-lrc-preview">
                  <div class="og-lrc-line og-lrc-line--ts">[00:12.34]</div>
                  <div class="og-lrc-line">{{ t('onboarding.lrcLine0') }}</div>
                  <div class="og-lrc-line og-lrc-line--ts">[00:16.80]</div>
                  <div class="og-lrc-line">{{ t('onboarding.lrcLine1') }}</div>
                  <div class="og-lrc-line og-lrc-line--ts">[00:21.00]</div>
                  <div class="og-lrc-line">{{ t('onboarding.lrcLine2') }}</div>
                </div>
                <div class="og-lrc-sources">
                  <a
                    class="og-lrc-source-link"
                    href="https://lrclib.net"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink :size="11" aria-hidden="true" />
                    lrclib.net
                  </a>
                  <a
                    class="og-lrc-source-link"
                    href="https://www.lrcgc.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink :size="11" aria-hidden="true" />
                    lrcgc.com
                  </a>
                  <a
                    class="og-lrc-source-link"
                    href="https://megalobiz.com/lrc/maker"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink :size="11" aria-hidden="true" />
                    megalobiz
                  </a>
                </div>
              </div>
            </div>

            <div class="og-text">
              <h2 class="og-step-title">{{ t('onboarding.step3Title') }}</h2>
              <p class="og-step-body">{{ t('onboarding.step3Body') }}</p>
              <ul class="og-bullets">
                <li>{{ t('onboarding.step3Bullet0') }}</li>
                <li>{{ t('onboarding.step3Bullet1') }}</li>
                <li>{{ t('onboarding.step3Bullet2') }}</li>
              </ul>
            </div>
          </div>
        </Transition>

        <!-- Footer nav -->
        <div class="og-footer">
          <button class="og-btn og-btn--ghost" :disabled="isFirst" @click="prev">
            <ChevronLeft :size="15" />
            {{ t('onboarding.prev') }}
          </button>

          <button v-if="!isLast" class="og-btn og-btn--primary" @click="next">
            {{ t('onboarding.next') }}
            <ChevronRight :size="15" />
          </button>
          <button v-else class="og-btn og-btn--done" @click="finish">
            <Check :size="14" />
            {{ t('onboarding.done') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Backdrop ── */
.og-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ── Card ── */
.og-card {
  background: #fff;
  border-radius: 20px;
  width: 640px;
  max-width: 100%;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.06),
    0 24px 64px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.og-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem 0;
}
.og-header-brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.og-header-logo {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  background: linear-gradient(120deg, var(--of-warm-hover), #e87eb0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.og-header-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.4);
  letter-spacing: 0.01em;
}
.og-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.og-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1a1a1a;
}

/* ── Dots ── */
.og-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 0.8rem 0 0;
}
.og-dot {
  width: 20px;
  height: 4px;
  border-radius: 2px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    background 0.25s,
    width 0.25s;
  padding: 0;
}
.og-dot--active {
  width: 32px;
  background: var(--of-warm-hover);
}

/* ── Body ── */
.og-body {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  padding: 1.4rem 1.6rem 0.8rem;
  min-height: 260px;
}

/* ── Illustration area ── */
.og-illus {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Mini Sidebar ── */
.og-mini-sidebar {
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 10px 10px;
  width: 160px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.og-mini-sidebar--wide {
  width: 168px;
}

.og-mini-section-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.3);
  margin: 4px 2px 3px;
}

.og-mini-lib-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: default;
  transition: background 0.15s;
  position: relative;
}
.og-mini-lib-row--hover {
  background: var(--of-warm-soft);
}
.og-mini-lib-row--active {
  background: var(--of-warm-soft);
}

.og-mini-icon {
  color: rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}
.og-mini-name {
  flex: 1;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.og-mini-count {
  font-size: 9px;
  color: rgba(0, 0, 0, 0.3);
  font-weight: 600;
}

.og-mini-dots-btn {
  position: absolute;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  height: 16px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.07);
  color: rgba(0, 0, 0, 0.45);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0;
  transition: opacity 0.35s;
}
.og-mini-dots-btn--visible {
  opacity: 1;
}
.og-mini-count--hidden {
  opacity: 0;
  transition: opacity 0.2s;
}

/* ── Mini Context Menu ── */
.og-mini-menu {
  background: #fff;
  border-radius: 7px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.14),
    0 0 0 1px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition:
    max-height 0.35s ease,
    opacity 0.3s ease;
  margin-top: 3px;
  margin-left: 6px;
  width: 118px;
}
.og-mini-menu--open {
  max-height: 80px;
  opacity: 1;
}
.og-mini-menu-item {
  padding: 6px 10px;
  font-size: 10.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.75);
}
.og-mini-menu-item--disabled {
  color: rgba(0, 0, 0, 0.28);
}

.og-mini-add-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding: 2px 2px;
}
.og-mini-add-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.3);
}
.og-mini-add-btn {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.3s,
    color 0.3s,
    transform 0.2s;
}
.og-mini-add-btn--pulse {
  background: var(--of-warm-soft);
  color: var(--of-warm-hover);
  transform: scale(1.15);
}

.og-mini-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 5px 0;
}

.og-mini-pl-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 6px 3px 14px; /* indent to show nesting */
  border-radius: 6px;
}
.og-mini-pl-row--sys .og-mini-name {
  color: rgba(0, 0, 0, 0.5);
}
.og-mini-badge {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--of-warm-soft);
  color: var(--of-warm-hover);
  white-space: nowrap;
}

/* ── Import Demo ── */
.og-import-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 170px;
}
.og-import-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--of-warm-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.og-import-icon {
  color: var(--of-warm-hover);
}
.og-import-formats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
.og-fmt-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.5);
}
.og-import-arrow {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  width: 80%;
}
.og-import-bar {
  height: 2px;
  background: linear-gradient(90deg, var(--of-warm-hover), #e87eb0);
  border-radius: 1px;
  width: 100%;
  animation: bar-slide 1.4s ease-in-out infinite;
}
.og-import-bar--2 {
  width: 70%;
  animation-delay: 0.3s;
}
@keyframes bar-slide {
  0%,
  100% {
    transform: scaleX(0);
    transform-origin: left;
  }
  50% {
    transform: scaleX(1);
  }
}
.og-import-dest {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 7px;
  padding: 5px 8px;
}
.og-import-dest svg {
  color: rgba(0, 0, 0, 0.4);
}

/* ── Lyrics Demo ── */
.og-lyrics-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 170px;
}
.og-lrc-file {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  width: 100%;
}
.og-lrc-icon {
  color: var(--of-warm-hover);
}
.og-lrc-name {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
}
.og-lrc-preview {
  background: rgba(248, 250, 252, 0.8);
  border-radius: 7px;
  padding: 7px 10px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.og-lrc-line {
  font-size: 9.5px;
  color: rgba(0, 0, 0, 0.55);
  font-family: 'SF Mono', 'Consolas', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.og-lrc-line--ts {
  color: var(--of-warm-soft);
  font-size: 9px;
}

.og-lrc-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
.og-lrc-source-link {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--of-warm-hover);
  text-decoration: none;
  padding: 3px 7px;
  border-radius: 5px;
  background: var(--of-warm-soft);
  transition: background 0.15s;
}
.og-lrc-source-link:hover {
  background: var(--of-warm-soft);
}

/* ── Text ── */
.og-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.6rem;
}
.og-step-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1a1a1a;
  line-height: 1.25;
}
.og-step-body {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.65;
}
.og-bullets {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.og-bullets li {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.5;
}

/* ── Footer ── */
.og-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.6rem 1.3rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 0.6rem;
}
.og-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.45em 1em;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.og-btn:disabled {
  opacity: 0.3;
  pointer-events: none;
}
.og-btn--ghost {
  background: transparent;
  color: rgba(0, 0, 0, 0.45);
}
.og-btn--ghost:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a1a;
}
.og-btn--primary {
  background: #1a1a1a;
  color: #fff;
}
.og-btn--primary:hover {
  background: #333;
}
.og-btn--done {
  background: var(--of-warm-hover);
  color: #fff;
}
.og-btn--done:hover {
  background: var(--of-warm-active);
}

/* ── Slide Transition ── */
.og-slide-enter-active,
.og-slide-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.og-slide-enter-from {
  opacity: 0;
  transform: translateX(18px);
}
.og-slide-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}
</style>
