import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'path'

function readPackageVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    return packageJson.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function readGitCommit() {
  try {
    return execSync('git rev-parse --short=12 HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim()
  } catch {
    return 'unknown'
  }
}

function readGitDirty() {
  try {
    return execSync('git status --porcelain', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim().length > 0
  } catch {
    return true
  }
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function createBuildInfo(mode) {
  const buildTime = new Date().toISOString()
  const buildId = mode === 'production'
    ? buildTime.slice(0, 16).replace('T', '@')
    : 'dev'
  const sourceCommit = readGitCommit()
  const dirty = readGitDirty()

  return {
    app: 'ofplayer-web',
    version: process.env.VITE_OFPLAYER_VERSION ?? readPackageVersion(),
    commit: dirty && sourceCommit !== 'unknown' ? `${sourceCommit}-dirty` : sourceCommit,
    sourceCommit,
    dirty,
    buildId,
    buildTime,
  }
}

function createBuildInfoPlugin(buildInfo) {
  return {
    name: 'ofplayer-build-info',
    transformIndexHtml(html) {
      const tags = [
        ['ofplayer-build-app', buildInfo.app],
        ['ofplayer-build-version', buildInfo.version],
        ['ofplayer-build-commit', buildInfo.commit],
        ['ofplayer-build-source-commit', buildInfo.sourceCommit],
        ['ofplayer-build-dirty', buildInfo.dirty],
        ['ofplayer-build-id', buildInfo.buildId],
        ['ofplayer-build-time', buildInfo.buildTime],
      ].map(([name, content]) =>
        `    <meta name="${name}" content="${escapeHtmlAttribute(content)}">`,
      ).join('\n')

      return html.replace('</head>', `${tags}\n  </head>`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const buildInfo = createBuildInfo(mode)

  return {
    // __BUILD_ID__ is injected at build time so versioned localStorage caches
    // are automatically invalidated on every new deploy.
    // In dev mode it's fixed to 'dev' so HMR doesn't keep busting the cache.
    define: {
      __BUILD_ID__: JSON.stringify(buildInfo.buildId),
      __OFPLAYER_BUILD_INFO__: JSON.stringify(buildInfo),
    },
    plugins: [createBuildInfoPlugin(buildInfo), vue()],
    resolve: {
      alias: [
        // Use a regex so only the bare 'lucide-vue-next' specifier is redirected
        // to our shim.  Sub-path imports like
        // 'lucide-vue-next/dist/esm/icons/x.js' (used inside the shim itself)
        // are NOT matched and resolve normally to node_modules.
        {
          find: /^lucide-vue-next$/,
          replacement: resolve(__dirname, 'src/lib/lucide.js'),
        },
      ],
    },
    build: {
      target: 'es2020',
      // lightningcss (Vite 8 default) incorrectly strips spaces between CSS
      // filter functions, e.g. "blur(24px) saturate(120%)" → "blur(24px)saturate(120%)"
      // which is invalid CSS and kills all backdrop-filter effects. esbuild handles
      // this correctly.
      cssMinify: 'esbuild',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/vue/') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/vue-router/')
            ) {
              return 'vue-vendor'
            }
            if (
              id.includes('node_modules/@ffmpeg/') ||
              id.includes('node_modules/@ffmpeg/ffmpeg/') ||
              id.includes('node_modules/@ffmpeg/util/')
            ) {
              return 'ffmpeg-wasm'
            }
            // Merge all individual lucide icon files into one chunk to reduce
            // the number of small HTTP requests (previously ~25 tiny chunks).
            if (id.includes('lucide-vue-next/dist/esm/icons/')) {
              return 'lucide-icons'
            }
            // Bundle all music-metadata format parsers together — they are
            // dynamically imported by music-metadata but always all needed.
            if (id.includes('node_modules/music-metadata/')) {
              return 'music-metadata'
            }
          },
        },
      },
    },
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: false,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
      },
      watch: {
        usePolling: true,
        interval: 300,
        ignored: ['**/node_modules/**', '**/dist/**', '**/src-tauri/target/**'],
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    optimizeDeps: {
      // Only scan the web entry — prevents Vite from crawling the Tauri build
      // artifacts under ofplayer-tauri/src-tauri/target/ which contain hundreds
      // of generated HTML files and inflate the dep scan by 10-20 seconds.
      entries: ['index.html'],
    },
  }
})
