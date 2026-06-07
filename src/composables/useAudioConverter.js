import { ref, shallowRef } from 'vue'
import {
  BrowserFfmpegRuntime,
  shouldPreload,
  schedulePreload,
} from '../tools/audio/runtime/browserFfmpegRuntime.js'
import {
  RUNTIME_STATUS,
  SUPPORTED_OUTPUT_FORMATS,
  QUALITY_PRESETS,
} from '../tools/audio/runtime/AudioConverterRuntime.js'

export function useAudioConverter() {
  const runtime = shallowRef(new BrowserFfmpegRuntime())

  const phase = ref('idle')
  const progress = ref(0)
  const progressMessage = ref('')
  const runtimeStatus = ref(RUNTIME_STATUS.NOT_LOADED)
  const error = ref(null)
  const result = ref(null)

  const isConverting = ref(false)
  const isRuntimeLoading = ref(false)

  let cancelPreload = null

  function onProgress(p) {
    phase.value = p.phase
    progress.value = p.progress
    progressMessage.value = p.message
    runtimeStatus.value =
      p.phase === 'loading_core'
        ? RUNTIME_STATUS.LOADING
        : p.phase === 'ready'
          ? RUNTIME_STATUS.READY
          : p.phase === 'error'
            ? RUNTIME_STATUS.ERROR
            : runtimeStatus.value
  }

  function initPreload() {
    cancelPreload = schedulePreload(runtime.value, 2500, onProgress)
  }

  function cancelPreloadSchedule() {
    if (cancelPreload) {
      cancelPreload()
      cancelPreload = null
    }
  }

  async function ensureRuntime() {
    if (runtime.value.status === RUNTIME_STATUS.READY && runtime.value.ready) return

    isRuntimeLoading.value = true
    error.value = null
    try {
      await runtime.value.load(onProgress)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isRuntimeLoading.value = false
    }
  }

  async function convert(file, targetFormat, quality = 'medium') {
    error.value = null
    result.value = null
    isConverting.value = true
    phase.value = 'loading_core'
    progress.value = 0

    try {
      await ensureRuntime()

      phase.value = 'converting'
      progress.value = 0
      progressMessage.value = 'Converting...'

      const output = await runtime.value.convert({ file }, { targetFormat, quality }, onProgress)

      result.value = output
      phase.value = 'done'
      progress.value = 100
      return output
    } catch (err) {
      error.value = err.message
      phase.value = 'error'
      throw err
    } finally {
      isConverting.value = false
    }
  }

  function downloadResult() {
    if (!result.value) return
    const url = URL.createObjectURL(result.value.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.value.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    error.value = null
    result.value = null
    phase.value = 'idle'
    progress.value = 0
    progressMessage.value = ''
    isConverting.value = false
  }

  function dispose() {
    cancelPreloadSchedule()
    runtime.value.dispose()
    runtime.value = new BrowserFfmpegRuntime()
    runtimeStatus.value = RUNTIME_STATUS.NOT_LOADED
    reset()
  }

  return {
    runtime,
    phase,
    progress,
    progressMessage,
    runtimeStatus,
    error,
    result,
    isConverting,
    isRuntimeLoading,
    initPreload,
    cancelPreloadSchedule,
    ensureRuntime,
    convert,
    downloadResult,
    reset,
    dispose,
    SUPPORTED_OUTPUT_FORMATS,
    QUALITY_PRESETS,
  }
}
