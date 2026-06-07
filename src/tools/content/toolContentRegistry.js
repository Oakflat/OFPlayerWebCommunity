/**
 * OFPlayer Tools — 工具页内容注册表
 *
 * 将 SEO 内容与组件逻辑解耦。
 * 后续只需修改此文件即可更新所有工具页的文案。
 *
 * toolContentRegistry[toolId] = ToolPageContent
 * 每个 tool 包含英文主内容 + zhCn 中文副本
 */

const SITE_URL = ''

export const toolContentRegistry = {
  'lrc-offset': {
    toolId: 'lrc-offset',
    metaTitle: 'LRC Lyrics Offset Tool — Fix Out-of-Sync Lyrics | OFPlayer',
    metaDescription:
      'Shift all LRC timestamps forward or backward to fix lyrics that are out of sync. Works locally in your browser — no upload required.',
    h1: 'LRC Lyrics Offset Tool',
    url: `${SITE_URL}/tools/lyrics/lrc-offset`,
    featureList: [
      'Local processing',
      'No upload required',
      'LRC format support',
      'Seconds and milliseconds offset',
      'Delay and advance direction',
    ],
    intro:
      'Fix lyrics that are out of sync by shifting all timestamps at once. Supports seconds and milliseconds, positive and negative offsets. All processing is local — your lyrics never leave your device.',
    guideSections: [
      {
        heading: 'How to use',
        body: 'Paste your LRC file into the input box, enter the offset amount, choose the direction (delay or advance), and click Apply. The corrected LRC appears in the result box below.',
      },
      {
        heading: 'When to use this tool',
        body: 'Use this when every lyric line is consistently off by the same amount — for example, all lyrics appear 2 seconds too early or too late.',
      },
    ],
    useCases: [
      {
        title: 'Fix lyrics that appear too early or too late',
        body: 'Use a single positive or negative offset when the entire .lrc file is shifted by the same amount in Navidrome, Jellyfin, OFPlayer, or a mobile music player.',
      },
      {
        title: 'Adjust LRC timing in milliseconds',
        body: 'Fine-tune timestamps when a song version, intro, silence gap, or remaster causes the lyrics to drift from the vocals.',
      },
      {
        title: 'Repair downloaded LRC files before importing',
        body: 'Paste the downloaded lyrics, shift every timestamp locally, then save the corrected .lrc next to your audio file.',
      },
    ],
    faq: [
      {
        question: 'What is LRC lyrics offset?',
        answer:
          'LRC lyrics offset shifts all timestamp values in an LRC file by a fixed amount, moving every lyric line earlier or later in time.',
      },
      {
        question: 'Should I choose Delay or Advance?',
        answer:
          'If the lyrics appear before the vocals, choose Delay. If they appear after the vocals, choose Advance.',
      },
      {
        question: 'Does this tool upload my lyrics?',
        answer:
          'No. All processing happens locally in your browser. Your lyrics are never sent to any server.',
      },
      {
        question: 'Can the result be used with Navidrome, Jellyfin, or OFPlayer?',
        answer:
          'Yes. The output is a standard LRC file compatible with Navidrome, Jellyfin, OFPlayer, and most LRC-aware players.',
      },
    ],
    zhCn: {
      metaTitle: 'LRC 歌词时间偏移 — 一键修复歌词不同步 | OFPlayer',
      metaDescription: '整体偏移 LRC 时间戳，修复歌词不同步。所有处理在浏览器本地完成，无需上传。',
      h1: 'LRC 歌词时间偏移',
      featureList: [
        '本地处理',
        '无需上传',
        '支持 LRC 格式',
        '秒 / 毫秒精度',
        '提前 / 延后双向调整',
      ],
      intro:
        '歌词总是整体快了几秒或慢了几秒？一次性偏移全部时间戳就行。支持正负方向、秒级和毫秒级调节，所有处理都在本地——你的歌词不会离开你的设备。',
      guideSections: [
        {
          heading: '怎么用',
          body: '把 LRC 内容贴进来，输入偏移量，选方向（延后或提前），点「应用」。修好的 LRC 会出现在下方。',
        },
        {
          heading: '什么时候用',
          body: '当每一行歌词都偏了同样的时间——比如整首歌都提前 2 秒或延后 2 秒——用这个工具一次性搞定。',
        },
      ],
      useCases: [
        {
          title: '修正整体偏移的歌词',
          body: '同一个 .lrc 文件在 Navidrome、Jellyfin、OFPlayer 或者手机上播放时整体偏了，用一个固定偏移统一修正。',
        },
        {
          title: '毫秒级微调时间轴',
          body: '歌曲版本不同、前奏被裁过、重制版的空白时长变了——导致歌词和人声没对上，按毫秒调一下就好。',
        },
        {
          title: '导入前先修好下载的歌词',
          body: '把下载的 LRC 贴进来，本地偏移完，保存到音频文件旁边。',
        },
      ],
      faq: [
        {
          question: '什么是 LRC 歌词时间偏移？',
          answer:
            '就是把 LRC 文件里所有时间戳统一加上或减去一个固定值，让每一行歌词整体提前或延后。',
        },
        {
          question: '选「延后」还是「提前」？',
          answer: '歌词比人声先出来，选延后；歌词比人声慢，选提前。',
        },
        {
          question: '我的歌词会被上传吗？',
          answer: '不会。所有处理都在你的浏览器里完成，歌词不会发送到任何服务器。',
        },
        {
          question: '修好的 LRC 能在 Navidrome、Jellyfin 或 OFPlayer 里用吗？',
          answer:
            '能。输出是标准 LRC 文件，兼容 Navidrome、Jellyfin、OFPlayer 和大多数支持 LRC 的播放器。',
        },
      ],
    },
  },

  'lrc-validator': {
    toolId: 'lrc-validator',
    metaTitle: 'LRC Lyrics Validator — Check LRC Format Errors | OFPlayer',
    metaDescription:
      'Validate LRC lyrics files for format errors, invalid timestamps, and sync issues. Get actionable fix suggestions.',
    h1: 'LRC Lyrics Validator',
    url: `${SITE_URL}/tools/lyrics/lrc-validator`,
    featureList: [
      'Local processing',
      'No upload required',
      'LRC format validation',
      'Timestamp order check',
      'Duplicate detection',
      'Fix suggestions',
    ],
    intro:
      'Diagnose format errors, invalid timestamps, and sync issues in your LRC lyrics file. Get a full issue report with line numbers and fix suggestions.',
    guideSections: [
      {
        heading: 'Checks performed',
        body: 'Invalid timestamp format, duplicate timestamps, timestamps out of order, lines with no timestamp, empty text fields, and unrecognized metadata tags.',
      },
      {
        heading: 'How to fix common errors',
        body: 'Ensure all timestamps follow the [mm:ss.xx] format. Check that timestamps are in ascending order. Avoid duplicate timestamps for different lines.',
      },
    ],
    useCases: [
      {
        title: 'Diagnose why lyrics are not showing',
        body: 'Check timestamp syntax, missing timestamps, duplicate lines, and metadata tags before adding an LRC file to Navidrome, Jellyfin, OFPlayer, or another player.',
      },
      {
        title: 'Validate LRC files from lyrics websites',
        body: 'Paste a downloaded .lrc file and get line-level warnings before you save it into your music library.',
      },
      {
        title: 'Clean up LRC files before batch import',
        body: 'Use the issue report to spot malformed timestamps and encoding-related text problems before organizing a larger lyrics folder.',
      },
    ],
    faq: [
      {
        question: 'What is the standard LRC timestamp format?',
        answer:
          'The standard format is [mm:ss.xx], e.g. [01:23.45]. Three-digit milliseconds [mm:ss.xxx] are also supported by many players.',
      },
      {
        question: 'Why are my lyrics not showing in the player?',
        answer:
          'Common causes: invalid timestamp format, wrong file encoding (must be UTF-8), mismatched filename, or unsupported LRC features.',
      },
      {
        question: 'Why are my lyrics out of sync?',
        answer:
          'Lyrics may be out of sync if the timestamps were created for a different version of the track, or if there is a global offset metadata the player does not support.',
      },
      {
        question: 'Do Navidrome, Jellyfin, and OFPlayer support LRC?',
        answer:
          'Yes. All three support LRC files. Place the .lrc file next to the audio file with the same filename.',
      },
    ],
    zhCn: {
      metaTitle: 'LRC 歌词格式检查 — 找出格式错误 | OFPlayer',
      metaDescription: '检查 LRC 歌词的格式错误、时间戳问题和同步异常，给出可操作的修复建议。',
      h1: 'LRC 歌词格式检查',
      featureList: ['本地处理', '无需上传', '格式校验', '时间戳顺序检查', '重复检测', '修复建议'],
      intro:
        '帮你诊断 LRC 歌词文件里的问题：格式错误、时间戳异常、同步毛病。输出带行号的完整报告和修复建议。',
      guideSections: [
        {
          heading: '检查哪些内容',
          body: '无效时间戳、重复时间戳、时间戳乱序、缺时间戳的行、空文本字段、无法识别的元数据标签。',
        },
        {
          heading: '常见错误怎么修',
          body: '确保时间戳用 [mm:ss.xx] 格式，按升序排列，不同行别用重复时间戳。',
        },
      ],
      useCases: [
        {
          title: '排查歌词为什么不显示',
          body: '在把 LRC 放进 Navidrome、Jellyfin、OFPlayer 之前，先检查时间戳格式、缺失情况、重复行和元数据标签。',
        },
        {
          title: '校验从歌词站下载的 LRC',
          body: '贴进来跑一遍，拿到逐行问题报告再存档。',
        },
        {
          title: '批量整理前先清一遍格式',
          body: '用问题报告找出坏的时间戳和文本格式问题，减少后面导入匹配翻车的概率。',
        },
      ],
      faq: [
        {
          question: '标准 LRC 时间戳格式是什么？',
          answer: '[mm:ss.xx]，比如 [01:23.45]。三位毫秒 [mm:ss.xxx] 大多数播放器也支持。',
        },
        {
          question: '歌词在播放器里不显示是为什么？',
          answer:
            '常见原因：时间戳格式不对、文件编码不是 UTF-8、文件名没对上、或用了播放器不支持的 LRC 特性。',
        },
        {
          question: '歌词不同步是什么原因？',
          answer: '时间戳可能是按不同版本音轨做的，或者文件里有播放器不认的全局偏移元数据。',
        },
        {
          question: 'Navidrome、Jellyfin 和 OFPlayer 都支持 LRC 吗？',
          answer: '都支持。把 .lrc 文件放在音频文件旁边，同名就行。',
        },
      ],
    },
  },

  'lrc-to-srt': {
    toolId: 'lrc-to-srt',
    metaTitle: 'LRC to SRT Converter — Convert Lyrics to Subtitles | OFPlayer',
    metaDescription:
      'Convert LRC lyrics files to SRT subtitle format for video players. Fast, local, no upload required.',
    h1: 'LRC to SRT Converter',
    url: `${SITE_URL}/tools/lyrics/lrc-to-srt`,
    featureList: [
      'Local processing',
      'No upload required',
      'LRC to SRT conversion',
      'Automatic end time calculation',
      'Configurable last line duration',
    ],
    intro:
      'Convert LRC music lyrics to SRT subtitle format. End times are computed automatically: each line ends when the next one starts. The last line defaults to 5 seconds.',
    guideSections: [
      {
        heading: 'How end times are calculated',
        body: "Each LRC line's end time = the next line's start time minus 1ms. The last line receives a configurable default duration (5 seconds by default).",
      },
    ],
    useCases: [
      {
        title: 'Turn synced lyrics into video subtitles',
        body: 'Convert a music player .lrc file into .srt when you need line-timed subtitles for a lyric video, live recording, or video editor.',
      },
      {
        title: 'Reuse LRC lyrics outside music players',
        body: 'Create SRT files that work in video players and editing apps while keeping the original lyric timing as the source.',
      },
    ],
    faq: [
      {
        question: 'What is the difference between LRC and SRT?',
        answer:
          'LRC files are for music players and only store line start times. SRT files are for video subtitles and include both start and end times with sequence numbers.',
      },
      {
        question: 'Why does the last SRT block have a 5-second duration?',
        answer:
          'LRC does not store an end time for the last line. This tool defaults to 5 seconds, which suits most final lyric lines.',
      },
      {
        question: 'Will my lyrics be uploaded?',
        answer: 'No. All conversion is local in your browser.',
      },
    ],
    zhCn: {
      metaTitle: 'LRC 转 SRT — 歌词变字幕 | OFPlayer',
      metaDescription: '把 LRC 歌词转成 SRT 字幕格式，用在视频播放器里。快速、本地处理、不用上传。',
      h1: 'LRC 转 SRT',
      featureList: ['本地处理', '无需上传', 'LRC → SRT', '自动计算结束时间', '末行时长可调'],
      intro:
        '把 LRC 歌词转成 SRT 字幕。每行的结束时间自动算：当前行在下一行开始时结束。最后一行默认 5 秒，可以调。',
      inputLabel: 'LRC 歌词',
      outputLabel: 'SRT 字幕',
      guideSections: [
        {
          heading: '结束时间怎么算',
          body: '每行的结束时间 = 下一行开始时间 − 1ms。最后一行用你设置的一个默认时长（默认 5 秒）。',
        },
      ],
      useCases: [
        {
          title: '把同步歌词做成视频字幕',
          body: '要做歌词视频、现场录像字幕、或者剪视频时需要逐行歌词，把 .lrc 转成 .srt 就行。',
        },
        {
          title: '让歌词在播放器之外也能用',
          body: '以原始歌词时间轴为准，生成视频播放器和剪辑软件都能认的 SRT 字幕。',
        },
      ],
      faq: [
        {
          question: 'LRC 和 SRT 有什么区别？',
          answer:
            'LRC 给音乐播放器用，只记每行开始时间。SRT 给视频字幕用，有开始时间、结束时间和序号。',
        },
        {
          question: '为什么最后一条 SRT 是 5 秒？',
          answer: 'LRC 不存最后一行的结束时间，所以默认给 5 秒，大多数末行歌词够用了。',
        },
        {
          question: '我的歌词会被上传吗？',
          answer: '不会。所有转换都在你的浏览器里完成。',
        },
      ],
    },
  },

  'srt-to-lrc': {
    toolId: 'srt-to-lrc',
    metaTitle: 'SRT to LRC Converter — Convert Subtitles to Lyrics | OFPlayer',
    metaDescription:
      'Convert SRT subtitle files to LRC lyrics format for music players like OFPlayer, Navidrome, and Jellyfin.',
    h1: 'SRT to LRC Converter',
    url: `${SITE_URL}/tools/lyrics/srt-to-lrc`,
    featureList: [
      'Local processing',
      'No upload required',
      'SRT to LRC conversion',
      'Multi-line subtitle joining',
      'Music player compatible output',
    ],
    intro:
      "Convert SRT subtitle files to LRC format for use in music players. Each subtitle's start time becomes the LRC timestamp. Multi-line subtitles are joined automatically.",
    guideSections: [
      {
        heading: 'How multi-line subtitles are handled',
        body: 'If an SRT block has multiple text lines, they are joined with a space by default. You can switch to newline joining in the options.',
      },
    ],
    useCases: [
      {
        title: 'Create LRC lyrics from subtitle files',
        body: 'Convert an .srt file into .lrc when you want subtitles or transcript timing to work inside a music player.',
      },
      {
        title: 'Prepare lyrics for self-hosted music libraries',
        body: 'Generate a standard LRC file that can sit next to your audio file for OFPlayer, Navidrome, Jellyfin, and other LRC-aware players.',
      },
    ],
    faq: [
      {
        question: 'Which music players support LRC?',
        answer:
          'LRC is supported by OFPlayer, Navidrome, Jellyfin, foobar2000, AIMP, and many Android music apps.',
      },
      {
        question: 'What happens to multi-line SRT subtitles?',
        answer:
          'They are joined with a space by default. For example, "Line 1 / Line 2" becomes "Line 1 Line 2" in the LRC.',
      },
      {
        question: 'Will my files be uploaded?',
        answer: 'No. All conversion is local in your browser.',
      },
    ],
    zhCn: {
      metaTitle: 'SRT 转 LRC — 字幕变歌词 | OFPlayer',
      metaDescription:
        '把 SRT 字幕转成 LRC 歌词，用于 OFPlayer、Navidrome、Jellyfin 等音乐播放器。',
      h1: 'SRT 转 LRC',
      featureList: ['本地处理', '无需上传', 'SRT → LRC', '多行字幕自动合并', '兼容主流播放器'],
      intro:
        '把 SRT 字幕转成音乐播放器能用的 LRC 格式。每条字幕的开始时间变成 LRC 时间戳，多行字幕自动拼成一行。',
      inputLabel: 'SRT 字幕',
      outputLabel: 'LRC 歌词',
      guideSections: [
        {
          heading: '多行字幕怎么处理',
          body: 'SRT 里一个时间块有多行文字，默认用空格拼起来。也可以在选项里改成换行拼接。',
        },
      ],
      useCases: [
        {
          title: '从字幕生成歌词',
          body: '手上有 .srt 字幕或转录文本，想把时间轴用在音乐播放器上，转成 .lrc 就行。',
        },
        {
          title: '给自托管曲库准备歌词',
          body: '生成标准 LRC 文件，放在音频旁边，OFPlayer、Navidrome、Jellyfin 都能认。',
        },
      ],
      faq: [
        {
          question: '哪些音乐播放器支持 LRC？',
          answer:
            'OFPlayer、Navidrome、Jellyfin、foobar2000、AIMP，还有大多数 Android 音乐应用都支持。',
        },
        {
          question: '多行 SRT 字幕怎么处理？',
          answer: '默认用空格拼起来。比如「第一行 / 第二行」会变成「第一行 第二行」。',
        },
        {
          question: '我的文件会被上传吗？',
          answer: '不会。转换都在浏览器本地完成。',
        },
      ],
    },
  },

  'audio-metadata-viewer': {
    toolId: 'audio-metadata-viewer',
    metaTitle: 'Audio Metadata Viewer — Read MP3, FLAC, M4A Tags | OFPlayer',
    metaDescription:
      'View embedded metadata from MP3, FLAC, M4A, AAC, OGG, and WAV audio files. Fully local — no upload required.',
    h1: 'Audio Metadata Viewer',
    url: `${SITE_URL}/tools/audio/audio-metadata-viewer`,
    featureList: [
      'Local processing',
      'No upload required',
      'MP3 / FLAC / M4A / AAC / OGG / WAV support',
      'Cover art extraction',
      'Export as JSON',
    ],
    intro:
      'Read and inspect embedded tags from any audio file — title, artist, album, year, genre, bitrate, sample rate, bit depth, and more. All processing is local in your browser.',
    guideSections: [
      {
        heading: 'Supported formats',
        body: 'MP3 (ID3v1/v2), FLAC (Vorbis comments), M4A/AAC (iTunes atoms), OGG Vorbis, WAV, OPUS, and WMA files are supported.',
      },
      {
        heading: 'About cover art',
        body: 'If the file contains embedded artwork, it is displayed in the Artwork section. You can right-click the image to save it.',
      },
      {
        heading: 'Exporting metadata',
        body: 'Use "Copy as JSON" to copy all raw tag data to the clipboard, or "Save as JSON" to download it as a file.',
      },
    ],
    useCases: [
      {
        title: 'Read MP3 ID3 tags and FLAC metadata',
        body: 'Inspect title, artist, album, album artist, year, genre, bitrate, sample rate, bit depth, and embedded artwork without uploading the audio file.',
      },
      {
        title: 'Check why a music library shows wrong track info',
        body: 'Use the raw tag view to compare what is actually embedded in the file before troubleshooting Navidrome, Jellyfin, OFPlayer, or desktop taggers.',
      },
      {
        title: 'Export audio tags as JSON',
        body: 'Copy metadata for debugging, catalog audits, or reports while keeping the original audio file unchanged.',
      },
    ],
    faq: [
      {
        question: 'What audio formats are supported?',
        answer:
          'MP3, FLAC, M4A, AAC, OGG, WAV, OPUS, and WMA. The tool reads embedded tags using the music-metadata library.',
      },
      {
        question: 'Is my audio file uploaded anywhere?',
        answer: 'No. The file is read entirely within your browser. Nothing is sent to any server.',
      },
      {
        question: 'Why are some tags missing?',
        answer:
          'Not all tags are present in every file. Tags must be embedded by a tagger or music management app like MusicBrainz Picard, iTunes, or Mp3tag.',
      },
      {
        question: 'Can I edit the metadata?',
        answer:
          'Not in this tool. This viewer is read-only. For editing tags, use a dedicated tool like Mp3tag or MusicBrainz Picard.',
      },
    ],
    zhCn: {
      metaTitle: '音频元数据查看 — 读取 MP3、FLAC、M4A 标签 | OFPlayer',
      metaDescription:
        '查看 MP3、FLAC、M4A、AAC、OGG、WAV 等音频文件的内嵌元数据。完全本地，不用上传。',
      h1: '音频元数据查看',
      featureList: [
        '本地处理',
        '无需上传',
        '支持 MP3 / FLAC / M4A / AAC / OGG / WAV',
        '封面提取',
        '导出 JSON',
      ],
      intro:
        '拖一个音频文件进来，就能看到它里面写的是什么——标题、艺人、专辑、年份、流派、比特率、采样率、位深，还有内嵌封面。全部在浏览器本地完成。',
      guideSections: [
        {
          heading: '支持的格式',
          body: 'MP3（ID3v1/v2）、FLAC（Vorbis 注释）、M4A/AAC（iTunes 原子）、OGG Vorbis、WAV、OPUS、WMA。',
        },
        {
          heading: '关于封面',
          body: '如果文件里有内嵌封面，会直接显示。右键图片可以保存到本地。',
        },
        {
          heading: '导出元数据',
          body: '点「复制为 JSON」把原始标签数据拷到剪贴板，或「下载 JSON」保存成文件。',
        },
      ],
      useCases: [
        {
          title: '查看 MP3 ID3 标签和 FLAC 元数据',
          body: '不用上传音频，就能看到标题、艺人、专辑、专辑艺人、年份、流派、码率、采样率、位深和内嵌封面。',
        },
        {
          title: '排查曲库显示信息为什么不对',
          body: '用原始标签视图看看文件里实际写了什么，再去排查 Navidrome、Jellyfin、OFPlayer 或桌面标签工具的问题。',
        },
        {
          title: '把标签导出成 JSON',
          body: '拷走元数据用来调试、审计曲库、或出报告。原始音频文件不动。',
        },
      ],
      faq: [
        {
          question: '支持哪些音频格式？',
          answer: 'MP3、FLAC、M4A、AAC、OGG、WAV、OPUS、WMA。用 music-metadata 库读取内嵌标签。',
        },
        {
          question: '我的音频文件会被上传吗？',
          answer: '不会。文件完全在浏览器里读，不发送到任何服务器。',
        },
        {
          question: '为什么有些标签是空的？',
          answer:
            '不是所有文件都有全部标签。标签需要用 MusicBrainz Picard、iTunes 或 Mp3tag 等工具事先写入。',
        },
        {
          question: '能编辑元数据吗？',
          answer: '这个工具只能看，不能改。要编辑标签，请用 Mp3tag 或 MusicBrainz Picard。',
        },
      ],
    },
  },

  'filename-normalizer': {
    toolId: 'filename-normalizer',
    metaTitle: 'Music Filename Normalizer — Rename Files from Tags | OFPlayer',
    metaDescription:
      'Preview and generate normalized music file names based on embedded metadata tags. Supports {artist}, {title}, {album}, {year}, {track} templates.',
    h1: 'Music Filename Normalizer',
    url: `${SITE_URL}/tools/library/filename-normalizer`,
    featureList: [
      'Local processing',
      'No upload required',
      'Template-based naming',
      'Batch file preview',
      'Download with new name',
    ],
    intro:
      'Generate consistent file names for your music library based on embedded tags. Drop your audio files, set a naming template, preview the result, and download each file with its new name.',
    guideSections: [
      {
        heading: 'How templates work',
        body: 'Use placeholders in the template: {title}, {artist}, {album}, {year}, {track}, {disc}, {ext}. For example, "{artist} - {title}" produces "Artist Name - Song Title.mp3".',
      },
      {
        heading: 'Track number padding',
        body: 'Enable zero-padding to format track numbers as 01, 02, … instead of 1, 2, …. This keeps files sorted correctly in most file explorers.',
      },
      {
        heading: 'Downloading renamed files',
        body: 'Click the save button next to each file to download it with the new name. The file content is unchanged — only the file name differs.',
      },
    ],
    useCases: [
      {
        title: 'Rename music files from embedded tags',
        body: 'Preview names like "Artist - Title" or "01 - Title" using metadata already stored in MP3, FLAC, M4A, OGG, or WAV files.',
      },
      {
        title: 'Prepare filenames for self-hosted music servers',
        body: 'Create consistent filenames before importing music into Navidrome, Jellyfin, a NAS folder, or a local OFPlayer library.',
      },
      {
        title: 'Clean up mixed download folders',
        body: 'Use templates and track number padding to make albums sort correctly in file explorers and music players.',
      },
    ],
    faq: [
      {
        question: 'Does this tool rename files on my disk?',
        answer:
          'No. Renaming files on disk is not possible in a web browser. This tool lets you download each file with its new name. The original files on your disk are not modified.',
      },
      {
        question: 'What if a tag field is empty?',
        answer:
          'If a placeholder has no matching tag value, it is replaced with "Unknown" — for example, "Unknown Artist".',
      },
      {
        question: 'Is there a file limit?',
        answer:
          'There is no hard limit, but very large files may slow down metadata reading. For batch renaming of hundreds of files, a desktop tool like Mp3tag may be more efficient.',
      },
    ],
    zhCn: {
      metaTitle: '文件名规范化 — 按标签重命名音乐文件 | OFPlayer',
      metaDescription:
        '根据音频内嵌标签预览和生成规范文件名。支持 {artist}、{title}、{album}、{year}、{track} 等模板。',
      h1: '音乐文件名规范化',
      featureList: ['本地处理', '无需上传', '模板命名', '批量预览', '按新名称下载'],
      intro:
        '让你的音乐库文件名整齐划一。拖入音频文件，设定命名模板，预览效果，然后按新文件名下载。',
      guideSections: [
        {
          heading: '模板怎么用',
          body: '用占位符拼模板：{title}、{artist}、{album}、{year}、{track}、{disc}、{ext}。比如 "{artist} - {title}" 会生成 "周杰伦 - 晴天.mp3"。',
        },
        {
          heading: '音轨号补零',
          body: '开启后，音轨号会显示为 01、02、……而不是 1、2、……，在文件管理器里排序不会乱。',
        },
        {
          heading: '下载重命名后的文件',
          body: '点每首歌旁边的保存按钮，以新文件名下载。文件内容不变，只改名字。',
        },
      ],
      useCases: [
        {
          title: '按标签重命名音乐文件',
          body: '用 MP3、FLAC、M4A、OGG、WAV 里已有的标签，预览像 "歌手 - 歌名" 或 "01 - 歌名" 这样的文件名。',
        },
        {
          title: '导入前整理文件名',
          body: '在导入 Navidrome、Jellyfin、NAS 或 OFPlayer 之前，先生成一致的文件名。',
        },
        {
          title: '清理杂乱下载文件夹',
          body: '用模板和补零让专辑在文件管理器和播放器里按正确顺序排列。',
        },
      ],
      faq: [
        {
          question: '会直接改我磁盘上的文件名吗？',
          answer: '不会。网页浏览器没法直接改磁盘文件。这个工具是让你按新文件名下载，原文件不动。',
        },
        {
          question: '标签字段为空怎么办？',
          answer: '占位符没有对应标签值时，会用 "Unknown" 填充，比如 "Unknown Artist"。',
        },
        {
          question: '有文件数量限制吗？',
          answer:
            '没有硬性限制，但文件太大会拖慢读取速度。几百个文件批量操作的话，Mp3tag 这类桌面工具可能更合适。',
        },
      ],
    },
  },

  'audio-converter': {
    toolId: 'audio-converter',
    metaTitle: 'Audio Format Converter — Convert MP3, FLAC, WAV, M4A, Opus | OFPlayer',
    metaDescription:
      'Convert audio files between MP3, FLAC, WAV, M4A, and Opus locally in your browser. No upload required — powered by WebAssembly.',
    h1: 'Audio Format Converter',
    url: `${SITE_URL}/tools/audio/audio-converter`,
    featureList: [
      'Local processing',
      'No upload required',
      'MP3 / FLAC / WAV / M4A / Opus / OGG',
      'Quality presets',
      'WebAssembly-powered',
      'Download converted file',
    ],
    intro:
      'Convert audio files between formats directly in your browser. Supports MP3, FLAC, WAV, M4A, Opus, and OGG Vorbis. All processing is local — your files never leave your device.',
    guideSections: [
      {
        heading: 'How to use',
        body: 'Drop or select an audio file, choose the output format and quality, then click Convert. The conversion runs entirely in your browser using WebAssembly.',
      },
      {
        heading: 'About quality settings',
        body: 'Low, Medium, and High refer to bitrate presets (128, 192, 320 kbps) for lossy formats. Lossless preserves the original quality. For lossless-to-lossless conversion (e.g. WAV to FLAC), quality does not affect the output.',
      },
      {
        heading: 'Important: MP3 to FLAC does not improve quality',
        body: 'Converting a lossy format (like MP3) to a lossless format (like FLAC) does not restore lost audio data. It only re-encodes the existing lossy audio in a lossless container. The result will sound identical to the original MP3, but the file size will be larger.',
      },
    ],
    useCases: [
      {
        title: 'Convert MP3, FLAC, WAV, M4A, Opus, and OGG locally',
        body: 'Change audio formats in the browser for sharing, device compatibility, podcast clips, or personal library cleanup without uploading the file.',
      },
      {
        title: 'Create smaller lossy copies from lossless files',
        body: 'Convert FLAC or WAV to MP3, M4A, Opus, or OGG when you need a smaller file for a phone, car player, or web upload.',
      },
      {
        title: 'Avoid false quality upgrades',
        body: 'The tool warns that MP3 to FLAC does not improve sound quality, so you can choose a format based on compatibility rather than fake lossless claims.',
      },
    ],
    faq: [
      {
        question: 'What formats are supported?',
        answer:
          'Input: any audio file your browser can read (MP3, FLAC, WAV, M4A, OGG, OPUS, etc.). Output: MP3, FLAC, WAV, M4A (AAC), Opus, OGG Vorbis.',
      },
      {
        question: 'Is my audio file uploaded to a server?',
        answer:
          'No. The conversion runs entirely in your browser using WebAssembly. Your audio file never leaves your device.',
      },
      {
        question: 'Can converting MP3 to FLAC improve audio quality?',
        answer:
          'No. MP3 is a lossy format — some audio data has already been discarded. Converting to FLAC just stores the lossy audio in a larger file without restoring any quality.',
      },
      {
        question: 'Why is the conversion engine loading?',
        answer:
          'The first conversion requires loading the WebAssembly engine (~25 MB). This is cached by your browser for subsequent use.',
      },
      {
        question: 'Is there a file size limit?',
        answer:
          'There is no hard limit, but very large files (>100 MB) may be slow or fail due to browser memory constraints. For heavy batch processing, use a desktop tool like FFmpeg or OFPlayer Toolkit.',
      },
      {
        question: 'Can I convert multiple files at once?',
        answer:
          'This web tool processes one file at a time. For batch conversion, use OFPlayer Toolkit (desktop) or the FFmpeg command line.',
      },
    ],
    zhCn: {
      metaTitle: '音频格式转换 — MP3、FLAC、WAV、M4A、Opus | OFPlayer',
      metaDescription:
        '在浏览器本地转换音频格式。支持 MP3、FLAC、WAV、M4A、Opus。不用上传，WebAssembly 驱动。',
      h1: '音频格式转换',
      featureList: [
        '本地处理',
        '无需上传',
        '支持 MP3 / FLAC / WAV / M4A / Opus / OGG',
        '音质预设',
        'WebAssembly 驱动',
        '下载转换结果',
      ],
      intro:
        '在浏览器里直接转换音频格式。支持 MP3、FLAC、WAV、M4A、Opus 和 OGG Vorbis。所有处理在本地完成——你的文件不会离开你的设备。',
      guideSections: [
        {
          heading: '怎么用',
          body: '拖入或选一个音频文件，选输出格式和音质，点转换。转换全程在浏览器里跑 WebAssembly，不用联网。',
        },
        {
          heading: '音质设置说明',
          body: '低、中、高对应有损格式的比特率预设（128、192、320 kbps）。无损就是保持原始质量。无损转无损（比如 WAV 转 FLAC）的时候，音质选什么没影响。',
        },
        {
          heading: '重要：MP3 转 FLAC 不会变好听',
          body: '把有损格式（比如 MP3）转成无损（比如 FLAC），丢掉的音频数据不会回来。只是把有损音频装进了一个更大的无损容器，听着和原 MP3 一样，文件反而更大。',
        },
      ],
      useCases: [
        {
          title: '本地转换常用音频格式',
          body: '在浏览器里转格式，用来分享、适配不同设备、剪播客片段、整理曲库。不用上传文件。',
        },
        {
          title: '从无损文件出个小体积副本',
          body: 'FLAC 或 WAV 太大，手机、车机、网页上传有大小限制？转成 MP3、M4A、Opus 或 OGG。',
        },
        {
          title: '别被「伪无损」骗了',
          body: '工具会明确提醒 MP3 转 FLAC 不能提升音质，帮你按实际需要选格式，不被营销话术忽悠。',
        },
      ],
      faq: [
        {
          question: '支持哪些格式？',
          answer:
            '输入：浏览器能读的音频都行（MP3、FLAC、WAV、M4A、OGG、OPUS 等）。输出：MP3、FLAC、WAV、M4A (AAC)、Opus、OGG Vorbis。',
        },
        {
          question: '我的音频文件会上传到服务器吗？',
          answer: '不会。转换完全在浏览器里用 WebAssembly 跑，你的音频文件不会离开你的设备。',
        },
        {
          question: 'MP3 转 FLAC 能提升音质吗？',
          answer:
            '不能。MP3 是有损格式，部分音频数据已经丢了。转成 FLAC 只是把剩的有损数据装进更大的文件，音质不会变好。',
        },
        {
          question: '为什么转换引擎在加载？',
          answer: '第一次转需要下载 WebAssembly 引擎（约 25 MB），浏览器会缓存，下次就快了。',
        },
        {
          question: '有文件大小限制吗？',
          answer:
            '没有硬限制，但超大文件（>100 MB）可能因为浏览器内存不够而变慢或失败。大批量处理建议用 FFmpeg 命令行或 OFPlayer Toolkit。',
        },
        {
          question: '可以一次转多个文件吗？',
          answer:
            '这个网页版一次处理一个。批量转换请用 OFPlayer Toolkit（桌面版）或 FFmpeg 命令行。',
        },
      ],
    },
  },

  'spectrum-viewer': {
    toolId: 'spectrum-viewer',
    metaTitle: 'Audio Spectrum Viewer — Visualize Frequency Content | OFPlayer',
    metaDescription:
      'Visualize the frequency spectrum of MP3, FLAC, WAV, and other audio files. Detect high-frequency rolloff and check audio quality locally in your browser.',
    h1: 'Audio Spectrum Viewer',
    url: `${SITE_URL}/tools/audio/spectrum-viewer`,
    featureList: [
      'Local processing',
      'No upload required',
      'Max-hold spectrum display',
      'Logarithmic frequency axis',
      'High-frequency rolloff detection',
      'Sample rate and duration info',
    ],
    intro:
      'Drop any audio file to see its frequency spectrum. Identify high-frequency cutoffs typical of lossy compression. Useful for comparing formats and viewing frequency distribution. All analysis runs locally in your browser.',
    guideSections: [
      {
        heading: 'How to read the spectrum',
        body: 'The horizontal axis shows frequency on a logarithmic scale from 20 Hz to the Nyquist limit. The vertical axis shows amplitude in dB. A genuine lossless file fills the spectrum close to the Nyquist limit. A sharp drop at a lower frequency — 16 kHz, 18 kHz, or 20 kHz — often indicates lossy compression.',
      },
      {
        heading: 'What is max-hold spectrum?',
        body: 'The tool analyzes the file in overlapping windows and keeps the highest amplitude found at each frequency bin. This gives a stable "peak" view rather than a live scrolling display.',
      },
    ],
    useCases: [
      {
        title: 'Check FLAC files for high-frequency rolloff',
        body: 'Drop a FLAC file and look for a sudden drop in high-frequency energy. If the spectrum cuts off sharply at 16–20 kHz, the file may have been transcoded from a lossy source.',
      },
      {
        title: 'Compare MP3 quality settings',
        body: 'Drop two MP3 files encoded at different bitrates and compare where the high-frequency content ends. Higher bitrate MP3 files retain energy up to higher frequencies.',
      },
      {
        title: 'Verify audio before archiving',
        body: 'Check that a file you plan to archive as lossless actually contains the full frequency spectrum before committing to storage.',
      },
    ],
    faq: [
      {
        question: 'What does the spectrum tell me?',
        answer:
          'It shows the distribution of frequency energy in your audio file — this is a visual reference, not an absolute quality meter. A genuine lossless file typically extends close to the Nyquist limit (half the sample rate). A lossy-source file typically shows a sharp cutoff at a lower frequency, but some recordings naturally lack high-frequency content.',
      },
      {
        question: 'What is the Nyquist limit?',
        answer:
          'The Nyquist limit is half the sample rate. For a 44.1 kHz file, the Nyquist limit is 22.05 kHz. Human hearing extends to roughly 20 kHz, so a genuine lossless 44.1 kHz recording should contain energy up to around 22 kHz.',
      },
      {
        question: 'Is my audio uploaded?',
        answer: 'No. All analysis happens locally in your browser using the Web Audio API.',
      },
      {
        question: 'Why is analysis slow for long files?',
        answer:
          'The tool samples up to 64 evenly spaced windows from the file regardless of duration, so analysis time is roughly the same for short and long files.',
      },
    ],
    zhCn: {
      metaTitle: '音频频谱查看器 — 可视化频率内容 | OFPlayer',
      metaDescription:
        '可视化 MP3、FLAC、WAV 等音频文件的频谱。检测高频截断，在浏览器里本地检查音频质量。',
      h1: '音频频谱查看器',
      featureList: [
        '本地处理',
        '无需上传',
        '峰值保持频谱显示',
        '对数频率坐标轴',
        '高频截断检测',
        '采样率和时长信息',
      ],
      intro:
        '拖入任意音频文件，查看其频谱图。识别有损压缩典型的高频截断特征，查看频率分布作参考。所有分析在浏览器本地完成。',
      guideSections: [
        {
          heading: '怎么看频谱',
          body: '横轴是频率（对数坐标，从 20 Hz 到奈奎斯特极限），纵轴是振幅（dB）。真正的无损文件频谱能填满到奈奎斯特极限附近。如果在 16 kHz、18 kHz 或 20 kHz 处有明显截断，很可能是有损转无损。',
        },
        {
          heading: '什么是峰值保持频谱？',
          body: '工具对文件进行分块分析，保留每个频率点上出现过的最大振幅。结果是稳定的"峰值"视图，不是实时滚动的。',
        },
      ],
      useCases: [
        {
          title: '检查 FLAC 文件有没有高频截断',
          body: '拖入 FLAC 文件，看高频部分的能量是否突然消失。如果频谱在 16–20 kHz 处有明显断点，很可能是从有损源转码来的。',
        },
        {
          title: '对比不同码率的 MP3',
          body: '拖两个不同码率的 MP3，看高频内容分别延伸到哪里。码率越高，保留的高频越多。',
        },
        {
          title: '归档前先确认',
          body: '打算存成无损格式归档之前，先确认文件确实有完整的频谱内容。',
        },
      ],
      faq: [
        {
          question: '频谱能告诉我什么？',
          answer:
            '它展示了音频文件的频率能量分布——这是一个视觉参考，不是绝对的音质仪表。真正的无损文件频谱能延伸到奈奎斯特极限附近。有损源的文件通常在某个较低频率处有明显截断，但有些录音本身就缺少高频成分。',
        },
        {
          question: '奈奎斯特极限是什么？',
          answer:
            '奈奎斯特极限等于采样率的一半。44.1 kHz 文件的奈奎斯特极限是 22.05 kHz。人耳可以听到约 20 kHz，所以真正的无损 44.1 kHz 录音频谱应该延伸到 22 kHz 左右。',
        },
        {
          question: '我的音频会被上传吗？',
          answer: '不会。所有分析都用 Web Audio API 在浏览器里本地完成。',
        },
        {
          question: '长文件分析为什么慢？',
          answer: '工具会对文件均匀采样最多 64 个分析窗口，不管文件多长分析时间都差不多。',
        },
      ],
    },
  },

  'lossless-detector': {
    toolId: 'lossless-detector',
    metaTitle: 'Lossy Source Heuristic Analyzer — Check If FLAC Is Really Lossless | OFPlayer',
    metaDescription:
      'Detect whether a FLAC or WAV file is genuinely lossless or a lossy-source transcode. Analyzes high-frequency content locally — no upload required.',
    h1: 'Lossy Source Heuristic Analyzer',
    url: `${SITE_URL}/tools/audio/lossless-detector`,
    featureList: [
      'Local processing',
      'No upload required',
      'High-frequency rolloff reference',
      'Detected cutoff frequency',
      'Spectrum visualization',
    ],
    intro:
      'Not all FLAC files are created equal. This tool analyzes the frequency spectrum of your audio file to check for signs that it contains genuine high-frequency content or shows signs of lossy encoding. All analysis is local — your audio never leaves your device.',
    guideSections: [
      {
        heading: 'How detection works',
        body: 'The tool decodes the audio locally and runs a fast Fourier transform to find the highest frequency with significant energy. If the energy drops sharply well below the Nyquist limit — at 16 kHz, 18 kHz, or 20 kHz — the file likely originated from a lossy source.',
      },
      {
        heading: 'Understanding the verdict',
        body: '"Genuine" means energy extends to within 3% of Nyquist. "Likely genuine" means 20 kHz or higher. "Suspicious" means energy cuts off between 16–20 kHz, a range typical of 192–256 kbps MP3. "Lossy" means cutoff below 16.5 kHz, typical of 128 kbps or lower.',
      },
      {
        heading: 'Limitations',
        body: 'Frequency analysis is a heuristic. Some legitimate recordings have natural high-frequency rolloff. Some lossy sources may not trigger this check. Always use this as one data point, not a definitive verdict.',
      },
    ],
    useCases: [
      {
        title: 'Check if a FLAC download is genuine lossless',
        body: 'Drop a FLAC file to check whether its frequency content actually extends to the full spectrum, or whether it appears to be a re-encoded lossy file.',
      },
      {
        title: 'Audit a music library for pseudo-lossless files',
        body: 'Spot "upscaled" FLAC files — MP3 or AAC sources re-wrapped in a lossless container — before they waste storage space.',
      },
      {
        title: 'Verify a rip before archiving',
        body: 'After ripping a CD or copying from a streaming download, verify the resulting FLAC actually contains full-spectrum content.',
      },
    ],
    faq: [
      {
        question: 'Can this tool definitively prove a file is fake lossless?',
        answer:
          'No. This is a heuristic indicator based on frequency content — not proof. Frequency analysis is a strong clue but not definitive. Some recordings naturally lack high-frequency content. Some encoders apply transparent high-frequency limiting. Treat the result as a reference hint, not a final verdict.',
      },
      {
        question: 'What cutoff is typical for MP3?',
        answer:
          'MP3 128 kbps typically cuts around 16 kHz. 192 kbps around 18–19 kHz. 256 kbps around 19.5–20 kHz. 320 kbps often extends to 20+ kHz.',
      },
      {
        question: 'Is my audio uploaded?',
        answer: 'No. Everything runs locally in your browser.',
      },
    ],
    zhCn: {
      metaTitle: '真假无损检测 — 检查 FLAC 是否真正无损 | OFPlayer',
      metaDescription:
        '检测 FLAC 或 WAV 文件是真正的无损录音还是有损源转码。本地分析高频内容，无需上传。',
      h1: '有损痕跡参考分析',
      featureList: ['本地处理', '无需上传', '高频截断参考指示', '检测截断频率', '频谱可视化'],
      intro:
        '不是所有 FLAC 都货真价实。本工具分析音频文件的频谱，检查它是否存在真实高频内容的迹象，或有损编码的特征。结果仅供参考，所有分析在本地完成，音频不离开你的设备。',
      guideSections: [
        {
          heading: '检测原理',
          body: '工具在本地解码音频，用快速傅里叶变换找到能量明显高于噪底的最高频率。如果能量在远低于奈奎斯特极限的地方截断——比如 16 kHz、18 kHz 或 20 kHz——这个文件很可能来自有损源。',
        },
        {
          heading: '判断结果说明',
          body: '「真无损」：能量延伸到奈奎斯特极限的 97% 以上。「很可能是真的」：超过 20 kHz。「可疑」：16–20 kHz 截断，这是 192–256 kbps MP3 的典型区间。「有损」：截断低于 16.5 kHz，接近 128 kbps 或更低码率。',
        },
        {
          heading: '局限性',
          body: '频率分析是启发式方法，不是完整证明。有些真实录音本身就没有高频成分；有些有损源也可能不触发这个检测。把结果当参考，而不是最终定论。',
        },
      ],
      useCases: [
        {
          title: '检查下载的 FLAC 是不是真正的无损',
          body: '拖入 FLAC 文件，看频率内容是否真的延伸到完整频谱，还是只是有损文件重打包。',
        },
        {
          title: '排查曲库里的"假无损"',
          body: '找出 MP3 或 AAC 源被封装进无损容器的文件，避免白白浪费存储空间。',
        },
        {
          title: '抓轨后存档前先验一遍',
          body: '从 CD 抓轨或复制流媒体下载的文件后，验一下得到的 FLAC 是否真的有完整频谱。',
        },
      ],
      faq: [
        {
          question: '这个工具能证明文件是假无损吗？',
          answer:
            '不能彻底证明。频率分析是强有力的指示，但不是证明。有些录音本身就缺少高频成分；有些编码器也会做透明的高频限制。把结果当参考，不要当最终结论。',
        },
        {
          question: 'MP3 的典型截断频率是多少？',
          answer:
            'MP3 128 kbps 通常在 16 kHz 左右截断。192 kbps 在 18–19 kHz。256 kbps 在 19.5–20 kHz。320 kbps 通常延伸到 20 kHz 以上。',
        },
        {
          question: '我的音频会被上传吗？',
          answer: '不会。所有分析都在你的浏览器里本地完成。',
        },
      ],
    },
  },

  'loudness-scanner': {
    toolId: 'loudness-scanner',
    metaTitle: 'Loudness Reference — Estimate loudness, Peak & ReplayGain | OFPlayer',
    metaDescription:
      'Measure the integrated loudness (LUFS), true peak, and dynamic range of audio files. Get a ReplayGain suggestion for volume normalization. Runs locally in your browser.',
    h1: 'Loudness Reference / Playback Gain',
    url: `${SITE_URL}/tools/audio/loudness-scanner`,
    featureList: [
      'Local processing',
      'No upload required',
      'Integrated loudness (LUFS)',
      'True peak (dBFS)',
      'Dynamic range',
      'ReplayGain suggestion',
    ],
    intro:
      'Scan the loudness of any audio file and get its integrated LUFS value, true peak level, dynamic range, and a suggested ReplayGain adjustment. Helps you normalize volume across your music library. All processing is local in your browser.',
    guideSections: [
      {
        heading: 'What is LUFS?',
        body: 'LUFS (Loudness Units relative to Full Scale) is a standard for measuring perceived loudness. Streaming platforms typically target -14 LUFS. Classical music is often mastered at -23 LUFS. Modern pop is often louder at -8 to -10 LUFS.',
      },
      {
        heading: 'What is ReplayGain?',
        body: 'ReplayGain is a standard that stores a per-track gain adjustment so music players can normalize playback volume. The suggested value in this tool targets -14 LUFS. A positive value means the track is quieter than the target and should be turned up.',
      },
      {
        heading: 'Note on accuracy',
        body: 'This tool uses a simplified RMS-based loudness measurement without full EBU R128 K-weighting. Results are a close approximation useful for comparison, but may differ slightly from dedicated loudness meters.',
      },
    ],
    useCases: [
      {
        title: 'Find loud or quiet tracks in your library',
        body: 'Scan individual tracks to identify outliers — songs that are dramatically louder or quieter than the rest of your playlist.',
      },
      {
        title: 'Get a ReplayGain adjustment value',
        body: 'Use the suggested gain to write a ReplayGain tag in your audio files, enabling volume normalization in OFPlayer, foobar2000, and other ReplayGain-aware players.',
      },
      {
        title: 'Check for clipping or over-loud masters',
        body: 'A true peak above -1 dBFS indicates potential clipping during playback. Use this to identify over-compressed or loudness-war victims.',
      },
    ],
    faq: [
      {
        question: 'What loudness target should I use?',
        answer:
          'For general use, -14 LUFS is the target used by Spotify and YouTube. Classical and acoustic music is often best at -23 LUFS. Podcasts target -16 LUFS.',
      },
      {
        question: 'Is K-weighting applied?',
        answer:
          'No. This tool uses simplified RMS loudness without K-weighting for performance reasons. Results are close enough for comparison and ReplayGain estimation but are not certified EBU R128.',
      },
      {
        question: 'Is my audio uploaded?',
        answer: 'No. All processing runs locally in your browser using the Web Audio API.',
      },
    ],
    zhCn: {
      metaTitle: '响度参考 / 播放增益 — 估算响度、峰值和动态范围 | OFPlayer',
      metaDescription:
        '扫描音频的响度（LUFS）、真峰值和动态范围，给出 ReplayGain 建议值。本地处理，无需上传。',
      h1: '响度参考 / 播放增益',
      featureList: [
        '本地处理',
        '无需上传',
        '综合响度（LUFS）',
        '真峰值（dBFS）',
        '动态范围',
        'ReplayGain 建议值',
      ],
      intro:
        '扫描任意音频文件，得到综合响度 LUFS、真峰值、动态范围和 ReplayGain 建议增益，帮你让音乐库里的曲目音量更均衡。所有处理在浏览器里本地完成。',
      guideSections: [
        {
          heading: '什么是 LUFS？',
          body: 'LUFS（相对满刻度的响度单位）是衡量感知响度的国际标准。流媒体平台通常目标是 -14 LUFS。古典音乐常在 -23 LUFS。现代流行音乐可能只有 -8 到 -10 LUFS。',
        },
        {
          heading: '什么是 ReplayGain？',
          body: 'ReplayGain 是一种标准，把每首曲目的增益调整值写进音频标签，让播放器自动做音量均衡。本工具给出的建议值目标是 -14 LUFS。正值表示这首歌比目标安静，需要调高音量。',
        },
        {
          heading: '关于精度说明',
          body: '本工具使用简化的 RMS 响度测量，未完整实现 EBU R128 K 加权滤波。结果是良好的近似值，适合对比和估算，但可能和专业响度计略有差异。',
        },
      ],
      useCases: [
        {
          title: '找出库里特别响或特别轻的曲目',
          body: '扫描单首曲目，找出比播放列表里其他歌曲响度差异特别大的异常值。',
        },
        {
          title: '获取 ReplayGain 增益值',
          body: '用建议值把 ReplayGain 标签写进音频文件，让 OFPlayer、foobar2000 等支持 ReplayGain 的播放器自动均衡音量。',
        },
        {
          question: '检查削波或过响的母带',
          body: '真峰值超过 -1 dBFS 表明播放时可能出现削波。用这个来识别过度压缩或"响度战争"的受害者。',
        },
      ],
      faq: [
        {
          question: '该用哪个响度目标？',
          answer:
            '一般用途：-14 LUFS，这是 Spotify 和 YouTube 的目标值。古典和声学音乐通常 -23 LUFS 最佳。播客目标是 -16 LUFS。',
        },
        {
          question: '有没有用 K 加权？',
          answer:
            '没有。为了性能，本工具用的是简化的 RMS 响度，没有 K 加权。结果足够用来对比和估算 ReplayGain，但不是经过认证的 EBU R128 测量。',
        },
        {
          question: '我的音频会被上传吗？',
          answer: '不会。所有处理都用 Web Audio API 在浏览器里本地完成。',
        },
      ],
    },
  },

  'cue-splitter': {
    toolId: 'cue-splitter',
    metaTitle: 'CUE Sheet Splitter — Split FLAC / WAV Albums into Tracks | OFPlayer',
    metaDescription:
      'Split a single-file album into individual tracks using a CUE sheet. Supports FLAC, WAV, MP3, and M4A. Runs locally in your browser with WebAssembly.',
    h1: 'CUE Sheet Splitter',
    url: `${SITE_URL}/tools/audio/cue-splitter`,
    featureList: [
      'Local processing',
      'No upload required',
      'CUE sheet parsing',
      'FLAC / WAV output recommended (MP3/M4A may not work reliably)',
      'Per-track download',
      'WebAssembly powered',
    ],
    intro:
      'Load a CUE sheet and its matching audio file to split a single-file album into individual tracks. Download each track separately in FLAC, WAV, MP3, or M4A format. No server upload — everything runs locally via WebAssembly.',
    guideSections: [
      {
        heading: 'What is a CUE sheet?',
        body: 'A CUE sheet (.cue) is a plain text file that describes the track layout of an album stored in a single audio file. It contains track numbers, titles, performers, and start times. Common in audiophile communities for FLAC rips.',
      },
      {
        heading: 'How to split',
        body: 'Drop the .cue file and the matching audio file (FLAC, WAV, etc.) into the two drop zones. The track list will appear. Choose an output format and click "Split All". Each track is extracted using WebAssembly and can be downloaded individually.',
      },
      {
        heading: 'Output format notes',
        body: 'FLAC is recommended for lossless sources. WAV is uncompressed lossless. MP3 and M4A are lossy — use these only if you want a smaller file and accept quality loss. Note: the Web version uses direct stream copy. Cross-format output (e.g., FLAC source to MP3) may not work reliably.',
      },
    ],
    useCases: [
      {
        title: 'Split a FLAC + CUE album rip',
        body: 'Many audiophile album rips come as a single large FLAC file with a .cue file. Use this tool to split them into individual track files for importing into a music library.',
      },
      {
        title: 'Extract tracks from a WAV rip',
        body: 'CUE sheets are also used with WAV files. Drop the WAV and CUE together to extract individual tracks.',
      },
      {
        title: 'Prepare tracks for Navidrome, Jellyfin, or OFPlayer',
        body: 'Split the album into individual files before importing into a self-hosted music server. Most servers work best with one file per track.',
      },
    ],
    faq: [
      {
        question: 'What CUE file encodings are supported?',
        answer:
          'The tool reads the .cue file as UTF-8. If your CUE file uses a different encoding (such as GB2312 or Shift-JIS), the track titles may appear garbled.',
      },
      {
        question: 'Does splitting re-encode the audio?',
        answer:
          'The Web version uses direct stream copy (no re-encoding) in all cases, for maximum speed and quality. This works reliably when the output format matches the source (e.g., FLAC → FLAC). Selecting a different output format may produce unplayable files depending on the codec-container combination. Same-format output is recommended.',
      },
      {
        question: 'Why does loading take time?',
        answer:
          'The first split loads the FFmpeg WebAssembly engine from a CDN. Subsequent splits reuse the loaded engine.',
      },
      {
        question: 'Is my audio uploaded?',
        answer: 'No. All processing runs locally via WebAssembly in your browser.',
      },
    ],
    zhCn: {
      metaTitle: 'CUE 切轨 — 把整轨专辑按 CUE 拆成单曲 | OFPlayer',
      metaDescription:
        '根据 CUE 文件把整轨专辑（FLAC、WAV 等）拆成单曲。支持输出 FLAC、WAV、MP3、M4A，本地处理，无需上传。',
      h1: 'CUE 切轨',
      featureList: [
        '本地处理',
        '无需上传',
        'CUE 文件解析',
        '推荐输出 FLAC / WAV（MP3/M4A 可能不可靠）',
        '逐曲下载',
        'WebAssembly 驱动',
      ],
      intro:
        '放入 CUE 文件和对应的音频文件，把整轨专辑拆成独立单曲。支持逐首下载，输出格式可选 FLAC、WAV、MP3 或 M4A。全程本地处理，不上传服务器。',
      guideSections: [
        {
          heading: '什么是 CUE 文件？',
          body: 'CUE 文件（.cue）是一个描述专辑曲目布局的纯文本文件，记录了音轨编号、标题、艺人和开始时间。常见于发烧友的 FLAC 整轨专辑。',
        },
        {
          heading: '怎么切轨',
          body: '把 .cue 文件和对应的音频文件分别拖入两个区域，曲目列表就会出现。选好输出格式，点「切轨」。每首曲目都会用 WebAssembly 提取出来，可以分别下载。',
        },
        {
          heading: '输出格式说明',
          body: '无损源推荐用 FLAC。WAV 是无压缩的无损格式。MP3 和 M4A 是有损的——只在接受音质损失且需要小文件体积时选用。注意：Web 版使用直接复制流（不重新编码）。跨格式输出（如 FLAC 源转 MP3）可能因编解码器与容器不兼容而产生无效文件，不保证可用。',
        },
      ],
      useCases: [
        {
          title: '拆分 FLAC + CUE 整轨专辑',
          body: '很多发烧友专辑以单个 FLAC 大文件和 .cue 的形式分发。用这个工具拆成单首，再导入曲库。',
        },
        {
          title: '从 WAV 整轨提取单曲',
          body: 'CUE 文件也常和 WAV 搭配。把 WAV 和 CUE 一起拖进来，提取独立的单曲文件。',
        },
        {
          title: '为 Navidrome、Jellyfin 或 OFPlayer 准备单曲',
          body: '大多数自托管音乐服务器以每首歌一个文件的方式工作最顺畅。导入之前先切好轨。',
        },
      ],
      faq: [
        {
          question: 'CUE 文件支持哪些编码？',
          answer:
            '工具以 UTF-8 读取 .cue 文件。如果你的 CUE 用了 GB2312 或 Shift-JIS 等其他编码，曲目名可能会显示乱码。',
        },
        {
          question: '切轨会重新编码吗？',
          answer:
            'Web 版始终使用直接复制流（不重新编码），以保证速度和质量。输出格式与源文件相同时（如 FLAC → FLAC）最为可靠。选择不同格式可能因编解码器与容器不兼容而产生无效文件，建议使用与源文件相同的输出格式。',
        },
        {
          question: '为什么第一次要等一会儿？',
          answer:
            '第一次切轨需要从 CDN 加载 FFmpeg WebAssembly 引擎。之后复用已加载的引擎，速度更快。',
        },
        {
          question: '我的音频会被上传吗？',
          answer: '不会。所有处理都通过 WebAssembly 在浏览器里本地完成。',
        },
      ],
    },
  },
}

/**
 * 获取工具页内容
 * @param {string} toolId
 * @param {string} [locale='en'] - 当前语言，'zh-CN' 时合并 zhCn 副本
 * @returns {ToolPageContent | null}
 */
export function getToolContent(toolId, locale = 'en') {
  const entry = toolContentRegistry[toolId]
  if (!entry) return null
  if (locale !== 'zh-CN' || !entry.zhCn) return entry

  const { zhCn, ...base } = entry
  return {
    ...base,
    ...zhCn,
    url: base.url,
    featureList: zhCn.featureList || base.featureList,
    guideSections: zhCn.guideSections || base.guideSections,
    faq: zhCn.faq || base.faq,
  }
}
