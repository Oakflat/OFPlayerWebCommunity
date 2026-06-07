import { describe, it, expect } from 'vitest'
import {
  parseTimestampMs,
  formatTimestampMs,
  parseLrc,
  formatLrc,
  offsetLrc,
  validateLrc,
} from '../src/tools/lyrics/lrc/lrcCore.js'
import { lrcToSrt } from '../src/tools/lyrics/convert/lrcToSrt.js'
import { srtToLrc } from '../src/tools/lyrics/convert/srtToLrc.js'

// ── parseTimestampMs ──────────────────────────────────────────────────────────

describe('parseTimestampMs', () => {
  it('parses mm:ss.xx (2-digit ms)', () => {
    expect(parseTimestampMs('01:23.45')).toBe(83450)
  })

  it('parses mm:ss.xxx (3-digit ms)', () => {
    expect(parseTimestampMs('01:23.456')).toBe(83456)
  })

  it('parses mm:ss (no ms)', () => {
    expect(parseTimestampMs('01:23')).toBe(83000)
  })

  it('parses mm:ss:xx (old format)', () => {
    expect(parseTimestampMs('01:23:45')).toBe(83450)
  })

  it('returns -1 for invalid input', () => {
    expect(parseTimestampMs('abc')).toBe(-1)
    expect(parseTimestampMs('')).toBe(-1)
    expect(parseTimestampMs('99:99:99:99')).toBe(-1)
  })

  it('handles zero timestamps', () => {
    expect(parseTimestampMs('00:00.00')).toBe(0)
  })
})

// ── formatTimestampMs ─────────────────────────────────────────────────────────

describe('formatTimestampMs', () => {
  it('formats with 2-digit ms by default', () => {
    expect(formatTimestampMs(83450)).toBe('01:23.45')
  })

  it('formats with 3-digit ms', () => {
    expect(formatTimestampMs(83456, 3)).toBe('01:23.456')
  })

  it('clamps negative values to 0', () => {
    expect(formatTimestampMs(-100)).toBe('00:00.00')
  })

  it('handles zero', () => {
    expect(formatTimestampMs(0)).toBe('00:00.00')
  })
})

// ── parseLrc ──────────────────────────────────────────────────────────────────

describe('parseLrc', () => {
  const STANDARD_LRC = `[ar:Test Artist]
[ti:Test Title]
[00:01.00]First line
[00:05.50]Second line
[00:10.00]Third line`

  it('parses standard LRC', () => {
    const { lines, metadata } = parseLrc(STANDARD_LRC)
    expect(lines).toHaveLength(3)
    expect(lines[0].timeMs).toBe(1000)
    expect(lines[0].text).toBe('First line')
    expect(metadata.ar).toBe('Test Artist')
    expect(metadata.ti).toBe('Test Title')
  })

  it('returns empty result for empty input', () => {
    const { lines, metadata, issues } = parseLrc('')
    expect(lines).toHaveLength(0)
    expect(Object.keys(metadata)).toHaveLength(0)
    expect(issues).toHaveLength(0)
  })

  it('preserves metadata lines', () => {
    const { metadataLines } = parseLrc(STANDARD_LRC)
    expect(metadataLines).toHaveLength(2)
    expect(metadataLines[0].key).toBe('ar')
    expect(metadataLines[1].key).toBe('ti')
  })

  it('detects invalid timestamp', () => {
    const lrc = '[99:99:99:99]Invalid line'
    const { issues } = parseLrc(lrc)
    const invalidIssues = issues.filter((i) => i.type === 'invalid_timestamp')
    expect(invalidIssues.length).toBeGreaterThan(0)
  })

  it('detects missing timestamp (plain text line)', () => {
    const lrc = 'Plain text without timestamp'
    const { issues } = parseLrc(lrc)
    expect(issues.some((i) => i.type === 'missing_timestamp')).toBe(true)
  })

  it('detects duplicate timestamps', () => {
    const lrc = `[00:01.00]Line A\n[00:01.00]Line B`
    const { issues } = parseLrc(lrc)
    expect(issues.some((i) => i.type === 'duplicate_timestamp')).toBe(true)
  })

  it('detects time order issues', () => {
    const lrc = `[00:05.00]Later\n[00:01.00]Earlier`
    const { issues } = parseLrc(lrc)
    expect(issues.some((i) => i.type === 'time_order')).toBe(true)
  })

  it('detects empty text', () => {
    const lrc = `[00:01.00]`
    const { issues } = parseLrc(lrc)
    expect(issues.some((i) => i.type === 'empty_text')).toBe(true)
  })

  it('parses 3-digit millisecond timestamps', () => {
    const lrc = `[00:01.234]Three digit`
    const { lines } = parseLrc(lrc)
    expect(lines[0].timeMs).toBe(1234)
  })

  it('handles one line with multiple timestamps (chorus repeat)', () => {
    const lrc = `[00:01.00][01:00.00]Chorus line`
    const { lines } = parseLrc(lrc)
    expect(lines.length).toBe(2)
    expect(lines[0].timeMs).toBe(1000)
    expect(lines[1].timeMs).toBe(60000)
    expect(lines[0].text).toBe('Chorus line')
  })
})

// ── formatLrc ─────────────────────────────────────────────────────────────────

describe('formatLrc', () => {
  it('formats lines back to LRC text', () => {
    const lines = [
      { timeMs: 1000, text: 'First', lineNumber: 1, raw: '' },
      { timeMs: 5500, text: 'Second', lineNumber: 2, raw: '' },
    ]
    const result = formatLrc(lines)
    expect(result).toBe('[00:01.00]First\n[00:05.50]Second')
  })

  it('supports 3-digit millisecond format', () => {
    const lines = [{ timeMs: 1234, text: 'Test', lineNumber: 1, raw: '' }]
    const result = formatLrc(lines, { millisecondDigits: 3 })
    expect(result).toBe('[00:01.234]Test')
  })

  it('formats lines without timestamps as plain text', () => {
    const lines = [{ timeMs: null, text: 'No timestamp', lineNumber: 1, raw: '' }]
    const result = formatLrc(lines)
    expect(result).toBe('No timestamp')
  })
})

// ── offsetLrc ─────────────────────────────────────────────────────────────────

describe('offsetLrc', () => {
  const SIMPLE_LRC = `[ar:Artist]
[00:01.00]Line one
[00:05.00]Line two`

  it('offsets timestamps forward (positive offset)', () => {
    const result = offsetLrc(SIMPLE_LRC, 2000)
    expect(result).toContain('[00:03.00]Line one')
    expect(result).toContain('[00:07.00]Line two')
  })

  it('offsets timestamps backward (negative offset)', () => {
    const result = offsetLrc(SIMPLE_LRC, -500)
    expect(result).toContain('[00:00.50]Line one')
    expect(result).toContain('[00:04.50]Line two')
  })

  it('clamps to 0 — offset cannot produce negative timestamps', () => {
    const lrc = `[00:00.50]Early line`
    const result = offsetLrc(lrc, -2000)
    expect(result).toContain('[00:00.00]Early line')
  })

  it('preserves metadata lines unchanged', () => {
    const result = offsetLrc(SIMPLE_LRC, 1000)
    expect(result).toContain('[ar:Artist]')
  })

  it('returns empty string for empty input', () => {
    expect(offsetLrc('', 1000)).toBe('')
  })

  it('returns input unchanged for zero offset', () => {
    expect(offsetLrc(SIMPLE_LRC, 0)).toBe(SIMPLE_LRC)
  })
})

// ── validateLrc ───────────────────────────────────────────────────────────────

describe('validateLrc', () => {
  it('returns empty array for valid LRC', () => {
    const lrc = `[00:01.00]Line one\n[00:05.00]Line two`
    const issues = validateLrc(lrc)
    expect(issues).toHaveLength(0)
  })

  it('returns issues for invalid LRC', () => {
    const lrc = `[bad-tag]Line\nPlain text`
    const issues = validateLrc(lrc)
    expect(issues.length).toBeGreaterThan(0)
  })
})

// ── lrcToSrt ──────────────────────────────────────────────────────────────────

describe('lrcToSrt', () => {
  const LRC = `[00:01.00]First line\n[00:05.00]Second line\n[00:10.00]Third line`

  it('converts LRC to SRT format', () => {
    const { srt, errors } = lrcToSrt(LRC)
    expect(errors).toHaveLength(0)
    expect(srt).toContain('00:00:01,000 --> ')
    expect(srt).toContain('First line')
    expect(srt).toContain('1\n')
  })

  it('last line gets default duration of 5 seconds', () => {
    const { srt } = lrcToSrt(LRC)
    // Last line starts at 10s, should end at 15s
    expect(srt).toContain('00:00:10,000 --> 00:00:15,000')
  })

  it('returns errors for empty input', () => {
    const { srt, errors } = lrcToSrt('')
    expect(errors.length).toBeGreaterThan(0)
    expect(srt).toBe('')
  })

  it('returns errors for LRC with no timestamps', () => {
    const { srt, errors } = lrcToSrt('Plain text\nNo timestamps here')
    expect(errors.length).toBeGreaterThan(0)
    expect(srt).toBe('')
  })

  it('allows custom last line duration', () => {
    const singleLineLrc = '[00:01.00]Only line'
    const { srt } = lrcToSrt(singleLineLrc, { lastLineDurationMs: 3000 })
    expect(srt).toContain('00:00:01,000 --> 00:00:04,000')
  })
})

// ── srtToLrc ──────────────────────────────────────────────────────────────────

describe('srtToLrc', () => {
  const SRT = `1
00:00:01,000 --> 00:00:05,000
First line

2
00:00:05,000 --> 00:00:10,000
Second line

3
00:00:10,000 --> 00:00:15,000
Multi line
subtitle text`

  it('converts SRT to LRC format', () => {
    const { lrc, errors } = srtToLrc(SRT)
    expect(errors).toHaveLength(0)
    expect(lrc).toContain('[00:01.00]First line')
    expect(lrc).toContain('[00:05.00]Second line')
  })

  it('merges multi-line subtitles with space by default', () => {
    const { lrc } = srtToLrc(SRT)
    expect(lrc).toContain('[00:10.00]Multi line subtitle text')
  })

  it('can merge multi-line subtitles with newline', () => {
    const { lrc } = srtToLrc(SRT, { joinMultiLine: 'newline' })
    expect(lrc).toContain('[00:10.00]Multi line\nsubtitle text')
  })

  it('returns errors for empty input', () => {
    const { lrc, errors } = srtToLrc('')
    expect(errors.length).toBeGreaterThan(0)
    expect(lrc).toBe('')
  })

  it('returns errors for SRT with no valid blocks', () => {
    const { lrc, errors } = srtToLrc('Not SRT content')
    expect(errors.length).toBeGreaterThan(0)
    expect(lrc).toBe('')
  })

  it('handles SRT with comma or dot as ms separator', () => {
    const srtDot = `1\n00:00:01.000 --> 00:00:05.000\nTest line`
    const { lrc, errors } = srtToLrc(srtDot)
    expect(errors).toHaveLength(0)
    expect(lrc).toContain('[00:01.00]Test line')
  })

  it('sorts output by time', () => {
    const unordered = `2\n00:00:05,000 --> 00:00:10,000\nSecond\n\n1\n00:00:01,000 --> 00:00:05,000\nFirst`
    const { lrc } = srtToLrc(unordered)
    const lines = lrc.split('\n')
    expect(lines[0]).toContain('00:01.00')
    expect(lines[1]).toContain('00:05.00')
  })
})
