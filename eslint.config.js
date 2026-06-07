import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVueScopedCss from 'eslint-plugin-vue-scoped-css'
import prettier from 'eslint-config-prettier'

export default [
  // ── Global ignores ─────────────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**', '.sisyphus/**', 'packages/**', 'scripts/**'],
  },

  // ── Base JS rules ──────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── Vue 3 SFC rules ────────────────────────────────────────────────────────
  ...pluginVue.configs['flat/recommended'],

  // ── Vue Scoped CSS rules ───────────────────────────────────────────────────
  ...pluginVueScopedCss.configs['flat/recommended'],

  // ── Project-specific overrides ──────────────────────────────────────────────
  {
    files: ['src/**/*.{js,vue}', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        ArrayBuffer: 'readonly',
        Uint8Array: 'readonly',
        crypto: 'readonly',
        indexedDB: 'readonly',
        IDBDatabase: 'readonly',
        matchMedia: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        Image: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        MediaMetadata: 'readonly',
        MediaSession: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        Audio: 'readonly',
        Element: 'readonly',
        getComputedStyle: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        DOMParser: 'readonly',
        XMLSerializer: 'readonly',
        screen: 'readonly',
        alert: 'readonly',
        location: 'readonly',
        // Vite-injected
        __BUILD_ID__: 'readonly',
        __OFPLAYER_BUILD_INFO__: 'readonly',
      },
    },
    rules: {
      // Relax rules for practical development
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'warn',
      'vue-scoped-css/enforce-style-type': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in a local-first app for debugging
    },
  },

  // ── Disable style rules that conflict with Prettier ────────────────────────
  prettier,
]
