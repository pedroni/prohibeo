import { getPresetOptionsForDomain, usesSectionHidingOnly } from './presets'
import { DEFAULT_SCHEDULE } from './schedule'
import {
  BLOCKING_MODES,
  WEEKDAY_ORDER,
  YOUTUBE_PRESET_KEYS,
  type BlockingMode,
  type PresetOptionKey,
  type PresetToggles,
  type SiteRule,
  type StrictSchedule,
  type Weekday,
} from './types'

const SITE_RULES_STORAGE_KEY = 'siteRules'

function ensureStorageAvailability(): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    throw new Error(
      'Chrome extension APIs are unavailable. Load Distractio as an unpacked extension to use it.',
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isBlockingMode(value: unknown): value is BlockingMode {
  return typeof value === 'string' && BLOCKING_MODES.includes(value as BlockingMode)
}

function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'string' && WEEKDAY_ORDER.includes(value as Weekday)
}

function isPresetOptionKey(value: unknown): value is PresetOptionKey {
  return (
    typeof value === 'string' &&
    YOUTUBE_PRESET_KEYS.includes(value as (typeof YOUTUBE_PRESET_KEYS)[number])
  )
}

function parseSchedule(value: unknown, index: number): StrictSchedule {
  if (!isRecord(value) || !Array.isArray(value.weekdays)) {
    throw new Error(`Stored schedule for site rule ${index + 1} is malformed.`)
  }

  const weekdays = value.weekdays

  if (!weekdays.every(isWeekday)) {
    throw new Error(`Stored weekdays for site rule ${index + 1} are malformed.`)
  }

  if (
    typeof value.startHour !== 'number' ||
    typeof value.endHour !== 'number' ||
    value.startHour < 0 ||
    value.startHour > 23 ||
    value.endHour < 0 ||
    value.endHour > 23
  ) {
    throw new Error(`Stored schedule hours for site rule ${index + 1} are malformed.`)
  }

  return {
    weekdays: [...new Set(weekdays)],
    startHour: value.startHour,
    endHour: value.endHour,
  }
}

function parsePresetToggles(value: unknown, index: number): PresetToggles {
  if (value === undefined) {
    return {}
  }

  if (!isRecord(value)) {
    throw new Error(`Stored preset toggles for site rule ${index + 1} are malformed.`)
  }

  const toggles: PresetToggles = {}

  for (const [key, toggleValue] of Object.entries(value)) {
    if (!isPresetOptionKey(key) || typeof toggleValue !== 'boolean') {
      throw new Error(`Stored preset toggles for site rule ${index + 1} are malformed.`)
    }

    toggles[key] = toggleValue
  }

  return toggles
}

function parseSiteRule(value: unknown, index: number): SiteRule {
  if (!isRecord(value)) {
    throw new Error(`Stored site rule ${index + 1} is malformed.`)
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.domain !== 'string' ||
    typeof value.enabled !== 'boolean' ||
    !isBlockingMode(value.blockingMode) ||
    !Array.isArray(value.customSelectors) ||
    !value.customSelectors.every((selector) => typeof selector === 'string') ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    throw new Error(`Stored site rule ${index + 1} is malformed.`)
  }

  return {
    id: value.id,
    domain: value.domain,
    enabled: value.enabled,
    blockingMode: value.blockingMode,
    schedule: parseSchedule(value.schedule, index),
    presetToggles: parsePresetToggles(value.presetToggles, index),
    customSelectors: value.customSelectors,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function parseSiteRules(value: unknown): SiteRule[] {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error('Stored site rules are malformed.')
  }

  return value.map(parseSiteRule)
}

function createDefaultPresetToggles(domain: string): PresetToggles {
  return getPresetOptionsForDomain(domain).reduce<PresetToggles>((toggles, option) => {
    toggles[option.key] = usesSectionHidingOnly(domain)
    return toggles
  }, {})
}

export function createSiteRule(domain: string): SiteRule {
  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    domain,
    enabled: true,
    blockingMode: 'always',
    schedule: {
      weekdays: [...DEFAULT_SCHEDULE.weekdays],
      startHour: DEFAULT_SCHEDULE.startHour,
      endHour: DEFAULT_SCHEDULE.endHour,
    },
    presetToggles: createDefaultPresetToggles(domain),
    customSelectors: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export async function getSiteRules(): Promise<SiteRule[]> {
  ensureStorageAvailability()
  const storedValue = await chrome.storage.local.get(SITE_RULES_STORAGE_KEY)
  return parseSiteRules(storedValue[SITE_RULES_STORAGE_KEY])
}

export async function saveSiteRules(siteRules: SiteRule[]): Promise<void> {
  ensureStorageAvailability()
  await chrome.storage.local.set({ [SITE_RULES_STORAGE_KEY]: siteRules })
}

export function watchSiteRules(onRulesChanged: (siteRules: SiteRule[]) => void): () => void {
  ensureStorageAvailability()

  const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    if (areaName !== 'local' || !changes[SITE_RULES_STORAGE_KEY]) {
      return
    }

    onRulesChanged(parseSiteRules(changes[SITE_RULES_STORAGE_KEY].newValue))
  }

  chrome.storage.onChanged.addListener(listener)

  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}
