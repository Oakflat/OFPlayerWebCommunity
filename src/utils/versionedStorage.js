/**
 * CN: 版本化 localStorage 工具。
 *
 * CN: 每个条目存储为：
 * CN:   { v: "<BUILD_ID>", data: <payload> }
 *
 * CN: 读取时，存储的版本与当前 BUILD_ID 进行比较。
 * CN: 如果不同（即新部署已落地），条目将被丢弃，返回回退值 —
 * CN: 调用者然后从规范源（IDB、网络等）重新填充并写入新条目。
 *
 * CN: BUILD_ID 在构建时通过 `define` 由 Vite 注入：
 * CN:   production → ISO 时间戳，如 "2026-04-27@14:30"
 * CN:   dev        → 字面字符串 "dev"（在 HMR 重载间稳定）
 *
 * EN: Versioned localStorage utility.
 *
 * EN: Every entry is stored as:
 * EN:   { v: "<BUILD_ID>", data: <payload> }
 *
 * EN: On read, the stored version is compared against the current BUILD_ID.
 * EN: If they differ (i.e. a new deploy landed) the entry is discarded and the
 * EN: fallback value is returned — the caller then repopulates from the canonical
 * EN: source (IDB, network, …) and writes a fresh entry.
 *
 * EN: BUILD_ID is injected by Vite at build time via `define`:
 * EN:   production → ISO timestamp like "2026-04-27@14:30"
 * EN:   dev        → the literal string "dev" (stable across HMR reloads)
 */

// CN: __BUILD_ID__ 在构建时由 Vite 的 `define` 配置替换。
// CN: `typeof` 保护防止纯 Node 测试环境崩溃。
// EN: __BUILD_ID__ is replaced at build time by Vite's `define` config.
// EN: The `typeof` guard keeps plain Node test environments from crashing.
const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'

/**
 * CN: 从 localStorage 读取版本化条目。
 *
 * CN: @param {string} key         localStorage 键
 * CN: @param {*}      [fallback]  当键缺失、无法解析或由不同构建写入时返回的值
 * CN: @returns {*} 存储的负载，或 `fallback`
 *
 * EN: Read a versioned entry from localStorage.
 *
 * EN: @param {string} key         localStorage key
 * EN: @param {*}      [fallback]  value returned when the key is missing,
 * EN:                             unparseable, or was written by a different build
 * EN: @returns {*} the stored payload, or `fallback`
 */
export function readVersioned(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const entry = JSON.parse(raw)
    if (!entry || entry.v !== BUILD_ID) return fallback
    return entry.data ?? fallback
  } catch {
    return fallback
  }
}

/**
 * CN: 向 localStorage 写入版本化条目。
 *
 * CN: @param {string} key   localStorage 键
 * CN: @param {*}      data  要持久化的值
 *
 * EN: Write a versioned entry to localStorage.
 *
 * EN: @param {string} key   localStorage key
 * EN: @param {*}      data  value to persist
 */
export function writeVersioned(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ v: BUILD_ID, data }))
  } catch {
    // CN: localStorage 不可用（隐私模式、配额超限）— 可安全忽略。
    // EN: localStorage unavailable (private mode, quota exceeded) — safe to ignore.
  }
}

/**
 * CN: 从 localStorage 移除版本化条目（或任意键）。
 *
 * CN: @param {string} key
 *
 * EN: Remove a versioned entry (or any key) from localStorage.
 *
 * EN: @param {string} key
 */
export function removeVersioned(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // CN: 忽略
    // EN: ignore
  }
}
