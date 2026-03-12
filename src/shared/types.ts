export const WEEKDAY_ORDER = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const

export type Weekday = (typeof WEEKDAY_ORDER)[number]

export const BLOCKING_MODES = ['always', 'scheduled'] as const

export type BlockingMode = (typeof BLOCKING_MODES)[number]

export const YOUTUBE_PRESET_KEYS = [
  'hideComments',
  'hideHomeSuggestions',
  'hideShorts',
  'hideVideoSuggestions',
] as const

export type YouTubePresetKey = (typeof YOUTUBE_PRESET_KEYS)[number]

export type PresetOptionKey = YouTubePresetKey

export type StrictSchedule = {
  weekdays: Weekday[]
  startHour: number
  endHour: number
}

export type PresetToggles = Partial<Record<PresetOptionKey, boolean>>

export type SiteRule = {
  id: string
  domain: string
  enabled: boolean
  blockingMode: BlockingMode
  schedule: StrictSchedule
  presetToggles: PresetToggles
  customSelectors: string[]
  createdAt: string
  updatedAt: string
}

export type PresetOptionDefinition<Key extends string = string> = {
  key: Key
  label: string
  description: string
  selectors: string[]
}
