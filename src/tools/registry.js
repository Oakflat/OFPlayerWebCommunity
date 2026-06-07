/**
 * CN: OFPlayer Tools 工具注册表
 *
 * CN: 所有工具页从这里读取配置，添加新工具只需修改此文件。
 *
 * EN: OFPlayer Tools registry
 *
 * EN: All tool pages read configuration from here, adding new tools only requires modifying this file.
 */

/** CN: @type {ToolDefinition[]} */
/** EN: @type {ToolDefinition[]} */
export const toolRegistry = [
  // ── CN: 歌词工具 ─── EN: Lyrics tools ────────────────────────────────────────
  {
    id: 'lrc-offset',
    slug: 'lrc-offset',
    category: 'lyrics',
    title: 'LRC Lyrics Offset Tool',
    titleCn: 'LRC 歌词时间偏移',
    shortTitle: 'LRC Offset',
    shortTitleCn: '歌词偏移',
    description:
      'Fix LRC lyrics that are out of sync by shifting all timestamps forward or backward.',
    descriptionCn: '歌词总是整体偏了几秒？一次性偏移所有时间戳，让歌词和人声对上。',
    keywords: [
      'lrc offset',
      'lrc lyrics fix',
      'fix lyrics sync',
      'lrc timestamp',
      'lyrics not synced',
      'lyrics out of sync',
      '歌词偏移',
      '歌词不同步',
      'navidrome lyrics',
      'jellyfin lyrics',
      'ofplayer lyrics',
    ],
    status: 'available',
    route: '/tools/lyrics/lrc-offset',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['lrc-validator', 'lrc-to-srt'],
  },
  {
    id: 'lrc-validator',
    slug: 'lrc-validator',
    category: 'lyrics',
    title: 'LRC Lyrics Validator',
    titleCn: 'LRC 歌词格式检查',
    shortTitle: 'LRC Validator',
    shortTitleCn: '歌词检查',
    description:
      'Check your LRC lyrics file for format errors, invalid timestamps, and sync issues.',
    descriptionCn: '检查 LRC 歌词的格式错误、时间戳问题和同步异常，给出修复建议。',
    keywords: [
      'lrc validator',
      'lrc format check',
      'lrc error',
      'lrc timestamp error',
      'lyrics format error',
      'lyrics not showing',
      'validate lrc',
      '歌词格式检查',
      'navidrome lrc',
      'jellyfin lrc',
    ],
    status: 'available',
    route: '/tools/lyrics/lrc-validator',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['lrc-offset', 'lrc-to-srt', 'srt-to-lrc'],
  },
  {
    id: 'lrc-to-srt',
    slug: 'lrc-to-srt',
    category: 'lyrics',
    title: 'LRC to SRT Converter',
    titleCn: 'LRC 转 SRT',
    shortTitle: 'LRC → SRT',
    shortTitleCn: 'LRC 转 SRT',
    description: 'Convert LRC lyrics to SRT subtitle format for use in video players.',
    descriptionCn: '把 LRC 歌词转成 SRT 字幕，用在视频播放器里。',
    keywords: [
      'lrc to srt',
      'lrc convert srt',
      'lyrics to subtitle',
      'lrc srt converter',
      '歌词转字幕',
      'lrc格式转srt',
      'convert lyrics subtitle',
    ],
    status: 'available',
    route: '/tools/lyrics/lrc-to-srt',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['srt-to-lrc', 'lrc-offset', 'lrc-validator'],
  },
  {
    id: 'srt-to-lrc',
    slug: 'srt-to-lrc',
    category: 'lyrics',
    title: 'SRT to LRC Converter',
    titleCn: 'SRT 转 LRC',
    shortTitle: 'SRT → LRC',
    shortTitleCn: 'SRT 转 LRC',
    description: 'Convert SRT subtitle files to LRC lyrics format for use in music players.',
    descriptionCn: '把 SRT 字幕转成 LRC 歌词，在音乐播放器里用。',
    keywords: [
      'srt to lrc',
      'srt convert lrc',
      'subtitle to lyrics',
      'srt lrc converter',
      '字幕转歌词',
      'srt格式转lrc',
      'convert subtitle lyrics',
    ],
    status: 'available',
    route: '/tools/lyrics/srt-to-lrc',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['lrc-to-srt', 'lrc-offset', 'lrc-validator'],
  },
  // ── CN: 音频工具（即将推出） ─── EN: Audio tools (coming soon) ───────────────────
  {
    id: 'audio-metadata-viewer',
    slug: 'audio-metadata-viewer',
    category: 'audio',
    title: 'Audio Metadata Viewer',
    titleCn: '音频元数据查看',
    shortTitle: 'Metadata Viewer',
    shortTitleCn: '元数据查看',
    description: 'View embedded metadata from MP3, FLAC, M4A and other audio files locally.',
    descriptionCn: '拖个音频文件进来，查看标题、艺人、专辑、比特率等内嵌标签。',
    keywords: [
      'audio metadata viewer',
      'mp3 metadata',
      'flac metadata',
      'id3 tag viewer',
      '音频元数据',
      'mp3标签查看',
      'audio tag reader',
    ],
    status: 'available',
    route: '/tools/audio/audio-metadata-viewer',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['filename-normalizer', 'audio-converter'],
  },
  {
    id: 'audio-converter',
    slug: 'audio-converter',
    category: 'audio',
    title: 'Audio Format Converter',
    titleCn: '音频格式转换',
    shortTitle: 'Audio Converter',
    shortTitleCn: '音频转换',
    description:
      'Convert audio files between MP3, FLAC, WAV, M4A, and Opus — locally in your browser.',
    descriptionCn: '在浏览器里直接转音频格式。MP3、FLAC、WAV、M4A、Opus 互转，不用上传。',
    keywords: [
      'audio converter',
      'mp3 to flac',
      'flac to mp3',
      'audio format convert',
      '音频格式转换',
      'mp3转flac',
      'wav转mp3',
      'local audio converter',
    ],
    status: 'available',
    route: '/tools/audio/audio-converter',
    localFirst: true,
    requiresWasm: true,
    relatedToolIds: ['audio-metadata-viewer', 'spectrum-viewer', 'loudness-scanner'],
  },
  {
    id: 'spectrum-viewer',
    slug: 'spectrum-viewer',
    category: 'audio',
    title: 'Audio Spectrum Viewer',
    titleCn: '频谱查看器',
    shortTitle: 'Spectrum Viewer',
    shortTitleCn: '频谱查看',
    description:
      'Visualize the frequency spectrum of any audio file. Detect high-frequency rolloff and judge audio quality — locally in your browser.',
    descriptionCn: '可视化音频文件的频谱。检测高频截断、判断音频质量，本地处理，无需上传。',
    keywords: [
      'audio spectrum viewer',
      'frequency spectrum',
      'audio spectrum analyzer',
      'high frequency rolloff',
      '音频频谱',
      '频谱分析',
      '高频截断',
      'flac spectrum',
      'mp3 spectrum',
    ],
    status: 'available',
    route: '/tools/audio/spectrum-viewer',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['lossless-detector', 'audio-metadata-viewer', 'loudness-scanner'],
  },
  {
    id: 'lossless-detector',
    slug: 'lossless-detector',
    category: 'audio',
    title: 'Pseudo-Lossless Detector',
    titleCn: '真假无损检测',
    shortTitle: 'Lossless Detector',
    shortTitleCn: '真假无损',
    description:
      'Detect whether a lossless audio file is genuinely lossless or a lossy source transcoded to FLAC/WAV. Analyzes high-frequency content locally.',
    descriptionCn:
      '检测无损文件是真正无损还是"有损转无损"。通过高频截断分析自动给出判断，本地处理。',
    keywords: [
      'lossless detector',
      'pseudo lossless',
      'fake flac detector',
      'lossy to lossless',
      '真假无损',
      '假无损检测',
      '有损转无损',
      'flac quality check',
      '音频质量检测',
    ],
    status: 'available',
    route: '/tools/audio/lossless-detector',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['spectrum-viewer', 'audio-metadata-viewer', 'audio-converter'],
  },
  {
    id: 'loudness-scanner',
    slug: 'loudness-scanner',
    category: 'audio',
    title: 'Loudness Scanner / ReplayGain',
    titleCn: '响度扫描 / ReplayGain',
    shortTitle: 'Loudness Scanner',
    shortTitleCn: '响度扫描',
    description:
      'Measure the integrated loudness (LUFS), true peak, and dynamic range of audio files. Get a ReplayGain suggestion to normalize playback volume.',
    descriptionCn:
      '扫描音频的响度（LUFS）、真峰值和动态范围，给出 ReplayGain 建议值，让播放音量更均衡。',
    keywords: [
      'loudness scanner',
      'replaygain',
      'lufs meter',
      'audio loudness',
      'true peak',
      '响度扫描',
      'ReplayGain',
      'LUFS',
      '音量均衡',
      'dynamic range',
    ],
    status: 'available',
    route: '/tools/audio/loudness-scanner',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['spectrum-viewer', 'audio-converter', 'audio-metadata-viewer'],
  },
  {
    id: 'cue-splitter',
    slug: 'cue-splitter',
    category: 'audio',
    title: 'CUE Sheet Splitter',
    titleCn: 'CUE 切轨',
    shortTitle: 'CUE Splitter',
    shortTitleCn: 'CUE 切轨',
    description:
      'Split a single-file album into individual tracks using a CUE sheet. Works locally in your browser with WebAssembly.',
    descriptionCn:
      '根据 CUE 文件把整轨专辑拆成单曲，在浏览器里本地完成，支持 FLAC、WAV、MP3 等格式。',
    keywords: [
      'cue splitter',
      'cue sheet',
      'split flac',
      'split wav',
      'cue to tracks',
      'CUE切轨',
      'CUE分割',
      '整轨专辑切割',
      'flac cue split',
      'album splitter',
    ],
    status: 'available',
    route: '/tools/audio/cue-splitter',
    localFirst: true,
    requiresWasm: true,
    relatedToolIds: ['audio-converter', 'audio-metadata-viewer', 'filename-normalizer'],
  },
  // ── CN: 曲库工具（即将推出） ─── EN: Library tools (coming soon) ───────────────────
  {
    id: 'filename-normalizer',
    slug: 'filename-normalizer',
    category: 'library',
    title: 'Music Filename Normalizer',
    titleCn: '文件名规范化',
    shortTitle: 'Filename Normalizer',
    shortTitleCn: '文件名整理',
    description: 'Preview and normalize music file names based on track metadata.',
    descriptionCn: '按标签模板预览和生成规范文件名，告别乱码文件名。',
    keywords: [
      'music filename normalizer',
      'rename music files',
      'music file organizer',
      '音乐文件名规范化',
      '音乐文件重命名',
    ],
    status: 'available',
    route: '/tools/library/filename-normalizer',
    localFirst: true,
    requiresWasm: false,
    relatedToolIds: ['audio-metadata-viewer'],
  },
]

/**
 * CN: 按 ID 查找工具
 * CN: @param {string} id
 * CN: @returns {ToolDefinition | undefined}
 *
 * EN: Find tool by ID
 * EN: @param {string} id
 * EN: @returns {ToolDefinition | undefined}
 */
export function getToolById(id) {
  return toolRegistry.find((t) => t.id === id)
}

/**
 * CN: 按分类获取工具列表
 * CN: @param {string} category
 * CN: @returns {ToolDefinition[]}
 *
 * EN: Get tools list by category
 * EN: @param {string} category
 * EN: @returns {ToolDefinition[]}
 */
export function getToolsByCategory(category) {
  return toolRegistry.filter((t) => t.category === category)
}

/**
 * CN: 获取可用工具列表（status === 'available'）
 * CN: @returns {ToolDefinition[]}
 *
 * EN: Get available tools list (status === 'available')
 * EN: @returns {ToolDefinition[]}
 */
export function getAvailableTools() {
  return toolRegistry.filter((t) => t.status === 'available')
}

/**
 * CN: 根据 relatedToolIds 获取相关工具列表
 * CN: @param {string[]} ids
 * CN: @returns {ToolDefinition[]}
 *
 * EN: Get related tools list by relatedToolIds
 * EN: @param {string[]} ids
 * EN: @returns {ToolDefinition[]}
 */
export function getRelatedTools(ids = []) {
  return ids.map((id) => getToolById(id)).filter(Boolean)
}
