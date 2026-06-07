/**
 * OFPlayer Tools — 工具页 SEO 元数据（精简版）
 *
 * 仅包含浏览器运行时 SEO 所需的字段（metaTitle、metaDescription、h1、intro）。
 * 用于替代 siteMetadata.js 中对 toolContentRegistry 的 eager import，
 * 将完整的工具内容（guideSections、useCases、faq 等）推迟到工具页实际访问时才加载。
 *
 * prerender-seo.mjs 仍直接 import toolContentRegistry 以获取完整内容。
 */

const SITE_URL = ''

export const toolSeoMeta = {
  'lrc-offset': {
    metaTitle: 'LRC Lyrics Offset Tool — Fix Out-of-Sync Lyrics | OFPlayer',
    metaDescription:
      'Shift all LRC timestamps forward or backward to fix lyrics that are out of sync. Works locally in your browser — no upload required.',
    h1: 'LRC Lyrics Offset Tool',
    url: `${SITE_URL}/tools/lyrics/lrc-offset`,
    intro:
      'Fix lyrics that are out of sync by shifting all timestamps at once. Supports seconds and milliseconds, positive and negative offsets. All processing is local — your lyrics never leave your device.',
  },

  'lrc-validator': {
    metaTitle: 'LRC Lyrics Validator — Check LRC Format Errors | OFPlayer',
    metaDescription:
      'Validate LRC lyrics files for format errors, invalid timestamps, and sync issues. Get actionable fix suggestions.',
    h1: 'LRC Lyrics Validator',
    url: `${SITE_URL}/tools/lyrics/lrc-validator`,
    intro:
      'Diagnose format errors, invalid timestamps, and sync issues in your LRC lyrics file. Get a full issue report with line numbers and fix suggestions.',
  },

  'lrc-to-srt': {
    metaTitle: 'LRC to SRT Converter — Convert Lyrics to Subtitles | OFPlayer',
    metaDescription:
      'Convert LRC lyrics files to SRT subtitle format for video players. Fast, local, no upload required.',
    h1: 'LRC to SRT Converter',
    url: `${SITE_URL}/tools/lyrics/lrc-to-srt`,
    intro:
      'Convert LRC music lyrics to SRT subtitle format. End times are computed automatically: each line ends when the next one starts. The last line defaults to 5 seconds.',
  },

  'srt-to-lrc': {
    metaTitle: 'SRT to LRC Converter — Convert Subtitles to Lyrics | OFPlayer',
    metaDescription:
      'Convert SRT subtitle files to LRC lyrics format for music players like OFPlayer, Navidrome, and Jellyfin.',
    h1: 'SRT to LRC Converter',
    url: `${SITE_URL}/tools/lyrics/srt-to-lrc`,
    intro:
      "Convert SRT subtitle files to LRC format for use in music players. Each subtitle's start time becomes the LRC timestamp. Multi-line subtitles are joined automatically.",
  },

  'audio-metadata-viewer': {
    metaTitle: 'Audio Metadata Viewer — Read MP3, FLAC, M4A Tags | OFPlayer',
    metaDescription:
      'View embedded metadata from MP3, FLAC, M4A, AAC, OGG, and WAV audio files. Fully local — no upload required.',
    h1: 'Audio Metadata Viewer',
    url: `${SITE_URL}/tools/audio/audio-metadata-viewer`,
    intro:
      'Read and inspect embedded tags from any audio file — title, artist, album, year, genre, bitrate, sample rate, bit depth, and more. All processing is local in your browser.',
  },

  'filename-normalizer': {
    metaTitle: 'Music Filename Normalizer — Rename Files from Tags | OFPlayer',
    metaDescription:
      'Preview and generate normalized music file names based on embedded metadata tags. Supports {artist}, {title}, {album}, {year}, {track} templates.',
    h1: 'Music Filename Normalizer',
    url: `${SITE_URL}/tools/library/filename-normalizer`,
    intro:
      'Generate consistent file names for your music library based on embedded tags. Drop your audio files, set a naming template, preview the result, and download each file with its new name.',
  },

  'audio-converter': {
    metaTitle: 'Audio Format Converter — Convert MP3, FLAC, WAV, M4A, Opus | OFPlayer',
    metaDescription:
      'Convert audio files between MP3, FLAC, WAV, M4A, and Opus locally in your browser. No upload required — powered by WebAssembly.',
    h1: 'Audio Format Converter',
    url: `${SITE_URL}/tools/audio/audio-converter`,
    intro:
      'Convert audio files between formats directly in your browser. Supports MP3, FLAC, WAV, M4A, Opus, and OGG Vorbis. All processing is local — your files never leave your device.',
  },

  'spectrum-viewer': {
    metaTitle: 'Audio Spectrum Viewer — Visualize Frequency Distribution | OFPlayer',
    metaDescription:
      'Visualize the frequency spectrum of MP3, FLAC, WAV, and other audio files. See high-frequency rolloff as a reference for encoding characteristics. Runs locally in your browser.',
    h1: 'Audio Spectrum Viewer',
    url: `${SITE_URL}/tools/audio/spectrum-viewer`,
    intro:
      'Drop any audio file to see its frequency distribution as a spectrum chart. Useful for spotting high-frequency rolloff patterns typical of lossy compression. This is a visual reference tool — not a quality meter. All analysis runs locally in your browser.',
  },

  'lossless-detector': {
    metaTitle: 'Lossy Source Heuristic Analyzer — High-Frequency Rolloff Reference | OFPlayer',
    metaDescription:
      'Analyze the high-frequency spectrum of a FLAC or WAV file to check for signs of a lossy source. Results are a heuristic indicator — not a definitive proof. Local, no upload required.',
    h1: 'Lossy Source Heuristic Analyzer',
    url: `${SITE_URL}/tools/audio/lossless-detector`,
    intro:
      'Analyzes the frequency spectrum of your audio file to look for high-frequency cutoff patterns associated with lossy encoding. Results indicate a risk level — not a definitive verdict. A genuine recording can also show high-frequency rolloff. All analysis is local.',
  },

  'loudness-scanner': {
    metaTitle: 'Loudness Reference Tool — Estimated LUFS & Playback Gain | OFPlayer',
    metaDescription:
      'Estimate the approximate loudness (LUFS-style), sample peak, and a playback gain suggestion for volume normalization. Simplified RMS measurement — not an EBU R128 meter. Runs locally.',
    h1: 'Loudness Reference / Playback Gain',
    url: `${SITE_URL}/tools/audio/loudness-scanner`,
    intro:
      'Estimate the approximate loudness of any audio file and get a suggested playback gain adjustment. Uses simplified RMS analysis — results are a practical reference, not a certified EBU R128 measurement. All processing is local in your browser.',
  },

  'cue-splitter': {
    metaTitle: 'CUE Sheet Splitter — Split Single-File Albums into Tracks | OFPlayer',
    metaDescription:
      'Split a single-file album into individual tracks using a CUE sheet. Same-format direct copy (FLAC→FLAC, WAV→WAV) is recommended. Runs locally via WebAssembly.',
    h1: 'CUE Sheet Splitter',
    url: `${SITE_URL}/tools/audio/cue-splitter`,
    intro:
      'Load a CUE sheet and its matching audio file to split a single-file album into individual tracks. Splitting uses direct stream copy for maximum speed and quality. Same-format output (e.g., FLAC source → FLAC output) is most reliable. No server upload — everything runs locally via WebAssembly.',
  },
}
