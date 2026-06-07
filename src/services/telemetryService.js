/**
 * CN: telemetryService.js
 *
 * CN: 通过 Umami Analytics 进行隐私优先的使用遥测。
 *
 * CN: 我们收集什么（以及为什么）：
 * CN:  - playback.play / pause / skip_next / skip_prev / seek
 * CN:    → 衡量哪些控件实际被使用，检测是否 skip > play
 * CN:      （不良默认行为的标志）
 *
 * CN: 我们永远不会收集：
 * CN:  - 曲目名称、艺术家、专辑、文件名或任何内容元数据
 * CN:  - 文件大小、比特率或路径
 * CN:  - 任何持久用户标识符
 * CN:  - IP 地址（由服务器上的 Umami IP 匿名化标志处理）
 *
 * CN: 需要两个环境变量（在 .env.local 中设置）：
 * CN:  VITE_UMAMI_URL         → 例如 https://analytics.example.com
 * CN:  VITE_UMAMI_WEBSITE_ID  → 在 Umami 站点设置中显示的 UUID
 *
 * CN: 如果任一变量缺失，服务将静默无操作，
 * CN: 因此开发构建和未配置 Umami 的自托管实例完全不受影响。
 *
 * EN: telemetryService.js
 *
 * EN: Privacy-first usage telemetry via Umami Analytics.
 *
 * EN: What we collect (and why):
 * EN:  - playback.play / pause / skip_next / skip_prev / seek
 * EN:    → measure which controls are actually used, detect if skip > play
 * EN:      (sign of bad default behavior)
 *
 * EN: What we NEVER collect:
 * EN:  - Track names, artists, albums, file names, or any content metadata
 * EN:  - File sizes, bit-rates, or paths
 * EN:  - Any persistent user identifier
 * EN:  - IP addresses (handled by Umami's IP anonymisation flag on the server)
 *
 * EN: Requires two environment variables (set in .env.local):
 * EN:  VITE_UMAMI_URL         → e.g. https://analytics.example.com
 * EN:  VITE_UMAMI_WEBSITE_ID  → UUID shown in your Umami site settings
 *
 * EN: If either variable is missing the service is a silent no-op,
 * EN: so dev builds and self-hosted instances without Umami configured
 * EN: are completely unaffected.
 */

const UMAMI_URL = import.meta.env.VITE_UMAMI_URL ?? ''
const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID ?? ''

// CN: 仅当两个变量都设置且用户选择加入时才启用。
// EN: Enabled only when both variables are set AND the user has opted in.
const UMAMI_READY = Boolean(UMAMI_URL && UMAMI_WEBSITE_ID)

// CN: 模块级启用标志 — 由 setEnabled() 更新。
// EN: Module-level enabled flag — updated by setEnabled().
let _enabled = false

// CN: 临时会话标识符 — 每次页面加载随机生成，永不持久化。
// CN: 使用 crypto.randomUUID() (CSPRNG)，与 externalLibrary.js 中的 createConnectionId() 一致；
// CN: 对于旧运行时回退到 getRandomValues()。
// CN: 故意避免使用 Math.random() — 它不是加密随机的。
// EN: Ephemeral session identifier — random per page load, never persisted.
// EN: Uses crypto.randomUUID() (CSPRNG) consistent with createConnectionId() in
// EN: externalLibrary.js; falls back to getRandomValues() for older runtimes.
// EN: Math.random() is deliberately avoided — it is not cryptographically random.
const _sessionToken = UMAMI_READY
  ? typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
  : null

/**
 * CN: 在运行时启用或禁用遥测（反映用户同意）。
 * CN: @param {boolean} value
 *
 * EN: Enable or disable telemetry at runtime (reflects user consent).
 * EN: @param {boolean} value
 */
export function setTelemetryEnabled(value) {
  _enabled = Boolean(value)
}

/**
 * CN: 返回当前选择加入状态。
 *
 * EN: Returns the current opt-in state.
 */
export function isTelemetryEnabled() {
  return _enabled
}

/**
 * CN: 向 Umami 的 /api/send 端点发送单个事件。
 *
 * CN: 所有字段都是 Umami 负载模式：
 * CN:   https://umami.is/docs/api/sending-stats
 *
 * CN: @param {string} eventName   — 例如 'playback.play'
 * CN: @param {Record<string,string|number>} [data]  — 可选的额外键值对
 *
 * EN: Send a single event to Umami's /api/send endpoint.
 *
 * EN: All fields are the Umami payload schema:
 * EN:   https://umami.is/docs/api/sending-stats
 *
 * EN: @param {string} eventName   — e.g. 'playback.play'
 * EN: @param {Record<string,string|number>} [data]  — optional extra key/value pairs
 */
export function track(eventName, data = {}) {
  if (!_enabled || !UMAMI_READY) return

  const payload = {
    type: 'event',
    payload: {
      website: UMAMI_WEBSITE_ID,
      url: '/', // single-page app — constant path is fine
      referrer: '',
      title: 'OFPlayer',
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      name: eventName,
      data: sanitize(data),
    },
  }

  // CN: sendBeacon 是即发即忘的，能在页面卸载时存活。
  // CN: 如果 sendBeacon 不可用，则回退到 fetch。
  // EN: sendBeacon is fire-and-forget and survives page unload.
  // EN: Falls back to fetch if sendBeacon is unavailable.
  const endpoint = `${UMAMI_URL}/api/send`
  const body = JSON.stringify(payload)

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
    } else {
      void fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'omit',
      })
    }
  } catch {
    // CN: 永远不要让遥测错误暴露给用户。
    // EN: Never let telemetry errors surface to the user.
  }
}

// ---------------------------------------------------------------------------
// CN: 便利包装器 — 每个诊断检查点一个
// EN: Convenience wrappers — one per diagnostic checkpoint
// ---------------------------------------------------------------------------

/** CN: 用户按下播放（或自动播放触发）。 */
/** EN: User pressed play (or auto-play fired). */
export function trackPlay() {
  track('playback.play')
}

/** CN: 用户按下暂停。 */
/** EN: User pressed pause. */
export function trackPause() {
  track('playback.pause')
}

/** CN: 用户跳到下一首曲目。 */
/** EN: User skipped to the next track. */
export function trackSkipNext() {
  track('playback.skip_next')
}

/** CN: 用户返回上一首曲目。 */
/** EN: User went back to the previous track. */
export function trackSkipPrev() {
  track('playback.skip_prev')
}

/** CN: 用户拖动/点击了搜索栏。 */
/** EN: User dragged / clicked the seek bar. */
export function trackSeek() {
  track('playback.seek')
}

// ---------------------------------------------------------------------------
// CN: 内部辅助函数
// EN: Internal helpers
// ---------------------------------------------------------------------------

/**
 * CN: 剥离任何键或字符串值可能包含 PII 的字段。
 * CN: 允许的值类型：数字和短字母数字字符串。
 * CN: 其他所有内容都被丢弃。
 *
 * EN: Strip any field whose key or string value might contain PII.
 * EN: Allowed value types: numbers and short alphanumeric strings.
 * EN: Everything else is dropped.
 */
function sanitize(obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      result[k] = v
    } else if (typeof v === 'string' && /^[\w\-.]+$/.test(v) && v.length <= 64) {
      result[k] = v
    }
    // CN: 任何其他类型（数组、对象、长字符串）都被静默丢弃。
    // EN: Any other type (arrays, objects, long strings) is silently dropped.
  }
  return result
}
