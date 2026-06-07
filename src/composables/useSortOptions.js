import { computed } from 'vue'

/**
 * CN: 所有合法的排序键，作为唯一真相来源。
 * CN: 未来新增排序维度（如 artist、album、year、custom 等）只需在此扩展。
 *
 * EN: All valid sort keys, as the single source of truth.
 * EN: Future new sort dimensions (like artist, album, year, custom, etc.) only need to be extended here.
 */
export const SORT_OPTION_KEYS = Object.freeze({
  RECENT: 'recent',
  TITLE: 'title',
  DURATION: 'duration',
  SIZE: 'size',
})

const VALID_SORT_OPTIONS = new Set(Object.values(SORT_OPTION_KEYS))

/**
 * CN: 将任意输入规范化为合法的排序键，不合法时回退到 RECENT。
 * CN: @param {unknown} value
 * CN: @returns {string}
 *
 * EN: Normalize any input to a valid sort key, fall back to RECENT if invalid.
 * EN: @param {unknown} value
 * EN: @returns {string}
 */
export function normalizeSortOption(value) {
  return VALID_SORT_OPTIONS.has(value) ? value : SORT_OPTION_KEYS.RECENT
}

/**
 * CN: 排序系统 composable。
 *
 * CN: 提供：
 * CN: - `sortOptions`         — 响应式的下拉选项列表（含本地化标签）
 * CN: - `applySortToTracks`   — 纯函数：对 {track, index}[] 按指定键排序，返回 track[]
 *
 * CN: @param {() => string} t       — i18n 翻译函数
 * CN: @param {{ value: string }} locale — 当前语言 ref（用于 localeCompare）
 *
 * EN: Sort system composable.
 *
 * EN: Provides:
 * EN: - `sortOptions`         — reactive dropdown options list (with localized labels)
 * EN: - `applySortToTracks`   — pure function: sort {track, index}[] by specified key, return track[]
 *
 * EN: @param {() => string} t       — i18n translation function
 * EN: @param {{ value: string }} locale — current language ref (for localeCompare)
 */
export function useSortOptions(t, locale) {
  /**
   * CN: 排序选项列表，语言切换时自动更新。
   * CN: 顺序即下拉菜单的显示顺序。
   *
   * EN: Sort options list, auto-updates when language changes.
   * EN: Order is the display order of the dropdown menu.
   */
  const sortOptions = computed(() => [
    { value: SORT_OPTION_KEYS.RECENT, label: t('player.sortRecent') },
    { value: SORT_OPTION_KEYS.TITLE, label: t('player.sortTitle') },
    { value: SORT_OPTION_KEYS.DURATION, label: t('player.sortDuration') },
    { value: SORT_OPTION_KEYS.SIZE, label: t('player.sortSize') },
  ])

  /**
   * CN: 对带有原始位置信息的曲目列表进行排序，返回排序后的纯 track 数组。
   *
   * CN: @param {{ track: object, index: number }[]} tracksWithIndex
   * CN:   - track  : 曲目对象
   * CN:   - index  : 曲目在原始未过滤列表中的位置（用于「最近导入」倒序）
   * CN: @param {string} sortOption  — 排序键（使用 SORT_OPTION_KEYS 中的值）
   * CN: @returns {object[]}         — 排序后的 track[]
   *
   * EN: Sort track list with original position info, return sorted pure track array.
   *
   * EN: @param {{ track: object, index: number }[]} tracksWithIndex
   * EN:   - track  : track object
   * EN:   - index  : track position in original unfiltered list (for "recent import" reverse)
   * EN: @param {string} sortOption  — sort key (use values from SORT_OPTION_KEYS)
   * EN: @returns {object[]}         — sorted track[]
   */
  function applySortToTracks(tracksWithIndex, sortOption) {
    const key = normalizeSortOption(sortOption)
    const result = [...tracksWithIndex]

    result.sort((left, right) => {
      switch (key) {
        case SORT_OPTION_KEYS.TITLE: {
          const leftTitle = left.track?.displayTitle || left.track?.title || ''
          const rightTitle = right.track?.displayTitle || right.track?.title || ''
          return leftTitle.localeCompare(rightTitle, locale.value)
        }
        case SORT_OPTION_KEYS.DURATION:
          return (right.track.duration ?? 0) - (left.track.duration ?? 0)
        case SORT_OPTION_KEYS.SIZE:
          return (
            (right.track.fileSize ?? right.track.size ?? 0) -
            (left.track.fileSize ?? left.track.size ?? 0)
          )
        case SORT_OPTION_KEYS.RECENT:
        default:
          // CN: props.tracks 已按 libraryOrder 升序排列（越后越新），倒序即「最近导入」
          // EN: props.tracks is sorted by libraryOrder ascending (newer at end), reverse is "recent import"
          return right.index - left.index
      }
    })

    return result.map(({ track }) => track)
  }

  return { sortOptions, applySortToTracks }
}
