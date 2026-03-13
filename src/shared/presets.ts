import type { PresetOptionDefinition, PresetOptionKey, SiteRule } from './types'

import { YOUTUBE_PRESET_OPTIONS } from './presets/youtube'

interface PresetConfig {
  displayName: string
  options: PresetOptionDefinition<PresetOptionKey>[]
  sectionHidingOnly: boolean
}

const PRESET_REGISTRY: Record<string, PresetConfig> = {
  'youtube.com': {
    displayName: 'YouTube',
    options: YOUTUBE_PRESET_OPTIONS,
    sectionHidingOnly: true,
  },
}

export function usesSectionHidingOnly(domain: string): boolean {
  return PRESET_REGISTRY[domain]?.sectionHidingOnly ?? false
}

export function getPresetOptionsForDomain(
  domain: string,
): PresetOptionDefinition<PresetOptionKey>[] {
  return PRESET_REGISTRY[domain]?.options ?? []
}

export function getPresetDisplayName(domain: string): string | null {
  return PRESET_REGISTRY[domain]?.displayName ?? null
}

export function getEnabledPresetLabels(rule: SiteRule): string[] {
  return getPresetOptionsForDomain(rule.domain)
    .filter((option) => rule.presetToggles[option.key])
    .map((option) => option.label)
}

export function getEnabledPresetSelectors(rule: SiteRule): string[] {
  return getPresetOptionsForDomain(rule.domain).flatMap((option) =>
    rule.presetToggles[option.key] ? option.selectors : [],
  )
}

export function hasSectionHiding(rule: SiteRule): boolean {
  return getEnabledPresetSelectors(rule).length > 0 || rule.customSelectors.length > 0
}

export function isRuleActiveOnPage(rule: SiteRule): boolean {
  return rule.enabled || hasSectionHiding(rule) || rule.temporaryBlockUntil !== null
}
