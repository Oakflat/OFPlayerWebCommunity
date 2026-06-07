const FALLBACK_BUILD_INFO = Object.freeze({
  app: 'ofplayer-web',
  version: '0.0.0',
  commit: 'unknown',
  sourceCommit: 'unknown',
  dirty: false,
  buildId: 'dev',
  buildTime: '',
})

const injectedBuildInfo =
  typeof __OFPLAYER_BUILD_INFO__ !== 'undefined' ? __OFPLAYER_BUILD_INFO__ : FALLBACK_BUILD_INFO

export const buildInfo = Object.freeze({
  ...FALLBACK_BUILD_INFO,
  ...injectedBuildInfo,
})

export function exposeBuildInfo() {
  if (typeof window === 'undefined') {
    return buildInfo
  }

  try {
    Object.defineProperty(window, '__OFPLAYER_BUILD__', {
      value: buildInfo,
      configurable: true,
      enumerable: false,
      writable: false,
    })
  } catch {
    window.__OFPLAYER_BUILD__ = buildInfo
  }

  return buildInfo
}
