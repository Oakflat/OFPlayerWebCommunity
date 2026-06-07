/**
 * CN: OFPlayer Tools 工具分类定义
 *
 * EN: OFPlayer Tools category definitions
 */

export const TOOL_CATEGORIES = {
  lyrics: {
    id: 'lyrics',
    label: 'Lyrics Tools',
    labelCn: '歌词',
    description: 'Tools for LRC, SRT, and subtitle processing',
    descriptionCn: 'LRC 偏移、格式检查、LRC ↔ SRT 互转',
    icon: 'music-note',
  },
  audio: {
    id: 'audio',
    label: 'Audio Tools',
    labelCn: '音频',
    description: 'Audio conversion, spectrum analysis, loudness scanning, and CUE splitting',
    descriptionCn: '格式转换、频谱查看、响度扫描、CUE 切轨、真假无损检测',
    icon: 'waveform',
  },
  metadata: {
    id: 'metadata',
    label: 'Metadata Tools',
    labelCn: '元数据',
    description: 'View and edit audio file metadata',
    descriptionCn: '查看音频文件内嵌标签信息',
    icon: 'tag',
  },
  library: {
    id: 'library',
    label: 'Library Tools',
    labelCn: '曲库',
    description: 'Tools for organizing your music library',
    descriptionCn: '文件名整理，保持曲库整洁',
    icon: 'folder',
  },
}

export const CATEGORY_ORDER = ['lyrics', 'audio', 'metadata', 'library']
