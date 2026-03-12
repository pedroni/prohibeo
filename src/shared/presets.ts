import type { PresetOptionDefinition, PresetOptionKey, SiteRule } from './types'

import { YOUTUBE_PRESET_OPTIONS } from './presets/youtube'

export function usesSectionHidingOnly(domain: string): boolean {
  return domain === 'youtube.com'
}

export function getPresetOptionsForDomain(
  domain: string,
): PresetOptionDefinition<PresetOptionKey>[] {
  if (domain === 'youtube.com') {
    return YOUTUBE_PRESET_OPTIONS
  }

  return []
}

export function getPresetDisplayName(domain: string): string | null {
  if (domain === 'youtube.com') {
    return 'YouTube'
  }

  return null
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
