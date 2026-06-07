/**
 * CN: 专辑封面颜色提取工具
 * CN: 从图片中提取主色调，用于生成沉浸式播放页背景
 *
 * EN: Album cover color extraction tool
 * EN: Extracts dominant colors from images for generating immersive player backgrounds
 */

/**
 * CN: RGB 转 HSL
 *
 * EN: RGB to HSL conversion
 */
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * CN: 将 sRGB 值（0-255）转换到线性光照空间（0-1）
 * CN: 用于 gamma 正确的颜色插值，消除色阶问题
 *
 * EN: Convert sRGB values (0-255) to linear light space (0-1)
 * EN: Used for gamma-correct color interpolation, eliminating banding issues
 */
function toLinear(c) {
  const f = c / 255
  return f <= 0.04045 ? f / 12.92 : Math.pow((f + 0.055) / 1.055, 2.4)
}

/**
 * CN: 将线性光照值（0-1）转换回 sRGB（0-255）
 *
 * EN: Convert linear light values (0-1) back to sRGB (0-255)
 */
function toSRGB(c) {
  const f = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.max(0, Math.min(1, f)) * 255)
}

/**
 * CN: 在线性光照空间中插值两个颜色（gamma 正确，避免色阶/posterization）
 *
 * EN: Interpolate two colors in linear light space (gamma-correct, avoids banding/posterization)
 */
function lerpColorLinear(c1, c2, t) {
  const r1l = toLinear(c1.r),
    g1l = toLinear(c1.g),
    b1l = toLinear(c1.b)
  const r2l = toLinear(c2.r),
    g2l = toLinear(c2.g),
    b2l = toLinear(c2.b)
  return {
    r: toSRGB(r1l + (r2l - r1l) * t),
    g: toSRGB(g1l + (g2l - g1l) * t),
    b: toSRGB(b1l + (b2l - b1l) * t),
  }
}

/**
 * CN: 提取 ImageData 特定像素区域的平均颜色
 *
 * EN: Extract average color from a specific pixel region of ImageData
 */
function extractRegionColor(imageData, width, xStart, yStart, xEnd, yEnd) {
  const data = imageData.data
  let r = 0,
    g = 0,
    b = 0,
    count = 0

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] < 128) continue
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      count++
    }
  }

  if (count === 0) return { r: 40, g: 40, b: 50 }
  r = Math.round(r / count)
  g = Math.round(g / count)
  b = Math.round(b / count)
  return { r, g, b, ...rgbToHsl(r, g, b) }
}

/**
 * CN: 调整颜色使其更适合作为深色沉浸背景
 *
 * EN: Adjust colors to be more suitable as dark immersive background
 */
function adjustForBackground(color) {
  let s = color.s * 0.55
  let l = Math.max(10, Math.min(36, color.l * 0.6))
  const h = color.h / 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * CN: 从图片 URL 提取封面角落颜色
 * CN: 采样左上角、中心、右下角三个区域，用于生成对角线渐变
 * CN: @param {string} imageUrl
 * CN: @returns {Promise<{ topLeft, center, bottomRight }>}
 *
 * EN: Extract cover corner colors from image URL
 * EN: Samples top-left, center, and bottom-right regions for generating diagonal gradients
 * EN: @param {string} imageUrl
 * EN: @returns {Promise<{ topLeft, center, bottomRight }>}
 */
export async function extractDominantColors(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 200
        canvas.width = size
        canvas.height = size

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const imageData = ctx.getImageData(0, 0, size, size)

        // CN: 采样三个区域：左上角、中心、右下角
        // EN: Sample three regions: top-left, center, bottom-right
        const q = Math.floor(size * 0.38)
        const mid = Math.floor(size * 0.3)
        const midEnd = Math.floor(size * 0.7)

        const topLeft = extractRegionColor(imageData, size, 0, 0, q, q)
        const center = extractRegionColor(imageData, size, mid, mid, midEnd, midEnd)
        const bottomRight = extractRegionColor(imageData, size, size - q, size - q, size, size)

        resolve({
          topLeft: adjustForBackground(topLeft),
          center: adjustForBackground(center),
          bottomRight: adjustForBackground(bottomRight),
        })
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

/**
 * CN: 生成对角线 CSS 背景渐变
 * CN: 使用 gamma 正确的线性光照空间插值 + 18 个停止点，消除色阶问题
 * CN: 颜色从封面左上角流向右下角，产生自然的沉浸感
 * CN: @param {{ topLeft, center, bottomRight }} colors
 * CN: @returns {string} CSS background 值
 *
 * EN: Generate diagonal CSS background gradient
 * EN: Uses gamma-correct linear light space interpolation + 18 stops, eliminating banding issues
 * EN: Colors flow from cover's top-left to bottom-right, creating natural immersive feel
 * EN: @param {{ topLeft, center, bottomRight }} colors
 * EN: @returns {string} CSS background value
 */
export function generateBackgroundGradient(colors) {
  const { topLeft, center, bottomRight } = colors
  const stops = []
  const N = 18

  for (let i = 0; i <= N; i++) {
    const t = i / N
    const color =
      t <= 0.5
        ? lerpColorLinear(topLeft, center, t * 2)
        : lerpColorLinear(center, bottomRight, (t - 0.5) * 2)
    stops.push(`rgb(${color.r}, ${color.g}, ${color.b}) ${(t * 100).toFixed(2)}%`)
  }

  return `linear-gradient(135deg, ${stops.join(', ')})`
}

/**
 * CN: 默认颜色（无封面时使用）
 *
 * EN: Default colors (used when no cover image)
 */
export const defaultColors = {
  topLeft: { r: 28, g: 24, b: 38 },
  center: { r: 20, g: 18, b: 28 },
  bottomRight: { r: 14, g: 12, b: 20 },
}
