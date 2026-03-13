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

export const BLOCKING_MODES = ['always', 'scheduled', 'temporary'] as const

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

export type NamedSchedule = StrictSchedule & {
  id: string
  name: string
}

export type ExtensionData = {
  siteRules: SiteRule[]
  schedules: NamedSchedule[]
}

export type PresetToggles = Partial<Record<PresetOptionKey, boolean>>

export type SiteRule = {
  id: string
  domain: string
  blockingMode: BlockingMode
  scheduleIds: string[]
  temporaryBlockUntil: string | null
  presetToggles: PresetToggles
  customSelectors: string[]
  createdAt: string
  updatedAt: string
}

export type ResolvedSiteRule = SiteRule & {
  schedules: NamedSchedule[]
}

export type PresetOptionDefinition<Key extends string = string> = {
  key: Key
  label: string
  description: string
  selectors: string[]
}
