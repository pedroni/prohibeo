import { getPresetOptionsForDomain, usesSectionHidingOnly } from './presets'
import {
  BLOCKING_MODES,
  WEEKDAY_ORDER,
  YOUTUBE_PRESET_KEYS,
  type BlockingMode,
  type ExtensionData,
  type NamedSchedule,
  type PresetOptionKey,
  type PresetToggles,
  type ResolvedSiteRule,
  type SiteRule,
  type Weekday,
} from './types'

const SITE_RULES_STORAGE_KEY = 'siteRules'
const SCHEDULES_STORAGE_KEY = 'schedules'

function ensureStorageAvailability(): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    throw new Error(
      'Chrome extension APIs are unavailable. Load Prohibeo as an unpacked extension to use it.',
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

function parseNamedSchedule(value: unknown, scheduleIndex: number): NamedSchedule {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.weekdays)
  ) {
    throw new Error(`Stored schedule ${scheduleIndex + 1} is malformed.`)
  }

  const weekdays = value.weekdays

  if (!weekdays.every(isWeekday)) {
    throw new Error(`Stored weekdays in schedule ${scheduleIndex + 1} are malformed.`)
  }

  if (
    typeof value.startHour !== 'number' ||
    typeof value.endHour !== 'number' ||
    value.startHour < 0 ||
    value.startHour > 23 ||
    value.endHour < 0 ||
    value.endHour > 23
  ) {
    throw new Error(`Stored schedule hours in schedule ${scheduleIndex + 1} are malformed.`)
  }

  return {
    id: value.id,
    name: value.name,
    weekdays: [...new Set(weekdays)].sort(
      (left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right),
    ) as Weekday[],
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

function parseScheduleIds(value: unknown, index: number): string[] {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value) || !value.every((scheduleId) => typeof scheduleId === 'string')) {
    throw new Error(`Stored schedule references for site rule ${index + 1} are malformed.`)
  }

  return [...new Set(value)]
}

function parseSiteRule(
  value: unknown,
  index: number,
): SiteRule {
  if (!isRecord(value)) {
    throw new Error(`Stored site rule ${index + 1} is malformed.`)
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.domain !== 'string' ||
    !isBlockingMode(value.blockingMode) ||
    !(
      typeof value.temporaryBlockUntil === 'string' ||
      value.temporaryBlockUntil === null ||
      value.temporaryBlockUntil === undefined
    ) ||
    !Array.isArray(value.scheduleIds) ||
    !value.scheduleIds.every((scheduleId) => typeof scheduleId === 'string') ||
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
    blockingMode: value.blockingMode,
    scheduleIds: parseScheduleIds(value.scheduleIds, index),
    temporaryBlockUntil: typeof value.temporaryBlockUntil === 'string' ? value.temporaryBlockUntil : null,
    presetToggles: parsePresetToggles(value.presetToggles, index),
    customSelectors: [...new Set(value.customSelectors.map((selector) => selector.trim()).filter(Boolean))],
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

  return value.map((item, index) => parseSiteRule(item, index))
}

function parseSchedules(value: unknown): NamedSchedule[] {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error('Stored schedules are malformed.')
  }

  return value.map((schedule, index) => parseNamedSchedule(schedule, index))
}

function createDefaultPresetToggles(domain: string): PresetToggles {
  return getPresetOptionsForDomain(domain).reduce<PresetToggles>((toggles, option) => {
    toggles[option.key] = usesSectionHidingOnly(domain)
    return toggles
  }, {})
}

function normalizeData(siteRules: SiteRule[], schedules: NamedSchedule[]): ExtensionData {
  const scheduleIdsById = new Set(schedules.map((schedule) => schedule.id))

  const normalizedSiteRules = siteRules.map((rule) => {
    if (rule.scheduleIds.length > 0) {
      return {
        ...rule,
        scheduleIds: rule.scheduleIds.filter((scheduleId) => scheduleIdsById.has(scheduleId)),
      }
    }

    return rule
  })

  return {
    siteRules: normalizedSiteRules,
    schedules,
  }
}

export function resolveSchedulesForRule(rule: SiteRule, schedules: NamedSchedule[]): NamedSchedule[] {
  const scheduleMap = new Map(schedules.map((schedule) => [schedule.id, schedule]))

  return rule.scheduleIds
    .map((scheduleId) => scheduleMap.get(scheduleId))
    .filter((schedule): schedule is NamedSchedule => schedule !== undefined)
}

export function resolveSiteRules(siteRules: SiteRule[], schedules: NamedSchedule[]): ResolvedSiteRule[] {
  return siteRules.map((rule) => ({
    ...rule,
    schedules: resolveSchedulesForRule(rule, schedules),
  }))
}

export function createSiteRule(domain: string): SiteRule {
  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    domain,
    blockingMode: 'always',
    scheduleIds: [],
    temporaryBlockUntil: null,
    presetToggles: createDefaultPresetToggles(domain),
    customSelectors: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export async function getExtensionData(): Promise<ExtensionData> {
  ensureStorageAvailability()
  const storedValue = await chrome.storage.local.get([SITE_RULES_STORAGE_KEY, SCHEDULES_STORAGE_KEY])

  try {
    const rules = parseSiteRules(storedValue[SITE_RULES_STORAGE_KEY])
    const schedules = parseSchedules(storedValue[SCHEDULES_STORAGE_KEY])

    return normalizeData(rules, schedules)
  } catch (error) {
    console.error('Prohibeo could not parse stored extension data.', error)
    throw new Error('Stored Prohibeo data is malformed. Clear extension storage to recover.')
  }
}

export async function saveExtensionData(extensionData: ExtensionData): Promise<void> {
  ensureStorageAvailability()
  await chrome.storage.local.set({
    [SITE_RULES_STORAGE_KEY]: extensionData.siteRules,
    [SCHEDULES_STORAGE_KEY]: extensionData.schedules,
  })
}

export async function getSiteRules(): Promise<SiteRule[]> {
  return (await getExtensionData()).siteRules
}

export async function saveSiteRules(siteRules: SiteRule[]): Promise<void> {
  const extensionData = await getExtensionData()
  await saveExtensionData({
    ...extensionData,
    siteRules,
  })
}

export async function getSchedules(): Promise<NamedSchedule[]> {
  return (await getExtensionData()).schedules
}

export async function saveSchedules(schedules: NamedSchedule[]): Promise<void> {
  const extensionData = await getExtensionData()
  await saveExtensionData({
    ...extensionData,
    schedules,
  })
}

export function watchExtensionData(onDataChanged: (extensionData: ExtensionData) => void): () => void {
  ensureStorageAvailability()

  const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    if (areaName !== 'local') {
      return
    }

    const siteRulesChange = changes[SITE_RULES_STORAGE_KEY]
    const schedulesChange = changes[SCHEDULES_STORAGE_KEY]

    if (!siteRulesChange && !schedulesChange) {
      return
    }

    void getExtensionData().then(onDataChanged)
  }

  chrome.storage.onChanged.addListener(listener)

  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}

export function watchSiteRules(onRulesChanged: (siteRules: SiteRule[]) => void): () => void {
  return watchExtensionData((extensionData) => {
    onRulesChanged(extensionData.siteRules)
  })
}
