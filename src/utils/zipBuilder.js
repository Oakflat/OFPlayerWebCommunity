// ---------------------------------------------------------------------------
// CN: 最小 ZIP 构建器 — 存储文件时不压缩（method=0）。
// CN: 音频文件已经压缩过；重新压缩浪费 CPU 和时间。
// CN: 文件以 4 MB 块读取，因此一次只有一个块在内存中。
//
// EN: Minimal ZIP builder — stores files without compression (method=0).
// EN: Audio files are already compressed; re-compressing wastes CPU and time.
// EN: Files are read in 4 MB chunks so only one chunk lives in memory at a time.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    t[n] = c
  }
  return t
})()

async function crc32OfBlob(blob) {
  const CHUNK = 4 * 1024 * 1024 // 4 MB
  let crc = 0xffffffff
  let offset = 0
  while (offset < blob.size) {
    const chunk = new Uint8Array(await blob.slice(offset, offset + CHUNK).arrayBuffer())
    for (let i = 0; i < chunk.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ chunk[i]) & 0xff]
    }
    offset += CHUNK
  }
  return (crc ^ 0xffffffff) >>> 0
}

function u16(view, pos, v) {
  view.setUint16(pos, v, true)
}
function u32(view, pos, v) {
  view.setUint32(pos, v, true)
}

function dosDateTime(date = new Date()) {
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f)
  const dosDate =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f)
  return { dosTime, dosDate }
}

function localHeader(nameBytes, crc, size, dosDate, dosTime) {
  const buf = new ArrayBuffer(30 + nameBytes.length)
  const v = new DataView(buf)
  u32(v, 0, 0x04034b50)
  u16(v, 4, 20)
  u16(v, 6, 0)
  u16(v, 8, 0) // method: store
  u16(v, 10, dosTime)
  u16(v, 12, dosDate)
  u32(v, 14, crc)
  u32(v, 18, size)
  u32(v, 22, size)
  u16(v, 26, nameBytes.length)
  u16(v, 28, 0)
  new Uint8Array(buf).set(nameBytes, 30)
  return new Uint8Array(buf)
}

function centralHeader(nameBytes, crc, size, dosDate, dosTime, localOffset) {
  const buf = new ArrayBuffer(46 + nameBytes.length)
  const v = new DataView(buf)
  u32(v, 0, 0x02014b50)
  u16(v, 4, 0x0314) // version made by: Unix 3.20
  u16(v, 6, 20)
  u16(v, 8, 0)
  u16(v, 10, 0) // method: store
  u16(v, 12, dosTime)
  u16(v, 14, dosDate)
  u32(v, 16, crc)
  u32(v, 20, size)
  u32(v, 24, size)
  u16(v, 28, nameBytes.length)
  u16(v, 30, 0)
  u16(v, 32, 0)
  u16(v, 34, 0)
  u16(v, 36, 0)
  u32(v, 38, 0)
  u32(v, 42, localOffset)
  new Uint8Array(buf).set(nameBytes, 46)
  return new Uint8Array(buf)
}

function eocdRecord(count, cdSize, cdOffset) {
  const buf = new ArrayBuffer(22)
  const v = new DataView(buf)
  u32(v, 0, 0x06054b50)
  u16(v, 4, 0)
  u16(v, 6, 0)
  u16(v, 8, count)
  u16(v, 10, count)
  u32(v, 12, cdSize)
  u32(v, 16, cdOffset)
  u16(v, 20, 0)
  return new Uint8Array(buf)
}

/**
 * CN: 从 `{ name: string, blob: Blob }` 数组构建 ZIP Blob。
 * CN: 文件以无压缩方式存储 — 对已压缩的音频最优。
 *
 * CN: @param {Array<{ name: string, blob: Blob }>} entries
 * CN: @param {{ onProgress?: (done: number, total: number) => void }} options
 * CN: @returns {Promise<Blob>}
 *
 * EN: Build a ZIP Blob from an array of `{ name: string, blob: Blob }` entries.
 * EN: Files are stored with no compression — optimal for already-compressed audio.
 *
 * EN: @param {Array<{ name: string, blob: Blob }>} entries
 * EN: @param {{ onProgress?: (done: number, total: number) => void }} options
 * EN: @returns {Promise<Blob>}
 */
export async function buildZip(entries, options = {}) {
  const { onProgress } = options
  const { dosTime, dosDate } = dosDateTime()
  const enc = new TextEncoder()

  /** CN: @type {(Uint8Array|Blob)[]} */
/** EN: @type {(Uint8Array|Blob)[]} */
  const parts = []
  /** CN: @type {Uint8Array[]} */
/** EN: @type {Uint8Array[]} */
  const cdParts = []

  let offset = 0

  for (let i = 0; i < entries.length; i++) {
    const { name, blob } = entries[i]
    const nameBytes = enc.encode(name)
    const crc = await crc32OfBlob(blob)
    const size = blob.size

    const lh = localHeader(nameBytes, crc, size, dosDate, dosTime)
    const cd = centralHeader(nameBytes, crc, size, dosDate, dosTime, offset)

    parts.push(lh, blob)
    cdParts.push(cd)

    offset += lh.byteLength + size
    onProgress?.(i + 1, entries.length)
  }

  const cdOffset = offset
  let cdSize = 0
  for (const cd of cdParts) {
    cdSize += cd.byteLength
    parts.push(cd)
  }
  parts.push(eocdRecord(entries.length, cdSize, cdOffset))

  return new Blob(parts, { type: 'application/zip' })
}

/** CN: 触发浏览器下载给定的 Blob。 */
/** EN: Trigger a browser download for the given Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // CN: 短延迟后撤销以确保下载开始
  // EN: Revoke after a short delay to ensure the download starts
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
