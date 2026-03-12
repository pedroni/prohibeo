import { useMemo, useState } from 'react'
import { faArrowLeft, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  getPresetDisplayName,
  getPresetOptionsForDomain,
  usesSectionHidingOnly,
} from '../../shared/presets'
import {
  WEEKDAY_LABELS,
  formatHourLabel,
  formatScheduleSummary,
} from '../../shared/schedule'
import { WEEKDAY_ORDER, type BlockingMode, type SiteRule, type Weekday } from '../../shared/types'

import { Button } from './Button'
import { TextInput } from './TextInput'
import { Toggle } from './Toggle'

type SiteSettingsPanelProps = {
  rule: SiteRule
  onClose: () => void
  onChange: (nextRule: SiteRule) => void
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)

function isValidSelector(selector: string): boolean {
  try {
    document.createElement('div').querySelector(selector)
    return true
  } catch {
    return false
  }
}

export function SiteSettingsPanel({
  rule,
  onClose,
  onChange,
}: SiteSettingsPanelProps) {
  const [selectorInput, setSelectorInput] = useState('')
  const [selectorError, setSelectorError] = useState<string | null>(null)

  const presetLabel = getPresetDisplayName(rule.domain)
  const presetOptions = useMemo(() => getPresetOptionsForDomain(rule.domain), [rule.domain])
  const sectionOnlyRule = usesSectionHidingOnly(rule.domain)

  function updateRule(nextRule: SiteRule): void {
    onChange({
      ...nextRule,
      updatedAt: new Date().toISOString(),
    })
  }

  function handleBlockingModeChange(blockingMode: BlockingMode): void {
    updateRule({
      ...rule,
      blockingMode,
    })
  }

  function toggleWeekday(weekday: Weekday): void {
    const nextWeekdays = rule.schedule.weekdays.includes(weekday)
      ? rule.schedule.weekdays.filter((value) => value !== weekday)
      : [...rule.schedule.weekdays, weekday].sort(
          (left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right),
        )

    updateRule({
      ...rule,
      schedule: {
        ...rule.schedule,
        weekdays: nextWeekdays,
      },
    })
  }

  function updateHour(field: 'startHour' | 'endHour', value: string): void {
    updateRule({
      ...rule,
      schedule: {
        ...rule.schedule,
        [field]: Number(value),
      },
    })
  }

  function togglePresetOption(optionKey: keyof SiteRule['presetToggles']): void {
    updateRule({
      ...rule,
      presetToggles: {
        ...rule.presetToggles,
        [optionKey]: !rule.presetToggles[optionKey],
      },
    })
  }

  function handleAddSelector(): void {
    const selector = selectorInput.trim()

    if (!selector) {
      setSelectorError('Enter a CSS selector to hide.')
      return
    }

    if (!isValidSelector(selector)) {
      setSelectorError('Enter a valid CSS selector.')
      return
    }

    if (rule.customSelectors.includes(selector)) {
      setSelectorError('That CSS selector is already added.')
      return
    }

    updateRule({
      ...rule,
      customSelectors: [...rule.customSelectors, selector],
    })
    setSelectorInput('')
    setSelectorError(null)
  }

  function handleRemoveSelector(selector: string): void {
    updateRule({
      ...rule,
      customSelectors: rule.customSelectors.filter((value) => value !== selector),
    })
  }

  return (
    <section className="absolute inset-0 z-10 flex flex-col bg-white pb-4">
      <header className="border-b border-black px-4 py-4">
        <button
          type="button"
          onClick={onClose}
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </button>

        <h2 className="text-2xl font-bold">Website Settings - {rule.domain}</h2>
        <p className="text-sm">Customize how this website appears and behaves.</p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section className="space-y-3 border border-black p-4">
          <div>
            <h3 className="text-lg font-bold">{sectionOnlyRule ? 'Activation' : 'Blocking'}</h3>
            <p className="text-sm">
              {sectionOnlyRule
                ? 'YouTube is never replaced with the Prohibeo block screen. These controls decide when its distracting sections are hidden.'
                : 'New sites default to always blocked. Switch to a strict schedule when needed.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              active={rule.blockingMode === 'always'}
              onClick={() => handleBlockingModeChange('always')}
            >
              {sectionOnlyRule ? 'Always active' : 'Always block'}
            </Button>
            <Button
              active={rule.blockingMode === 'scheduled'}
              onClick={() => handleBlockingModeChange('scheduled')}
            >
              {sectionOnlyRule ? 'Scheduled activation' : 'Scheduled blocking'}
            </Button>
          </div>

          {rule.blockingMode === 'scheduled' ? (
            <div className="space-y-4 border-t border-black pt-4">
              <div>
                <p className="text-sm font-bold">Strict Mode weekdays</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEKDAY_ORDER.map((weekday) => (
                    <Button
                      key={weekday}
                      active={rule.schedule.weekdays.includes(weekday)}
                      className="min-w-12 px-3 py-2 text-xs"
                      onClick={() => toggleWeekday(weekday)}
                    >
                      {WEEKDAY_LABELS[weekday]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2 text-sm font-bold">
                  <span>Start hour</span>
                  <select
                    value={rule.schedule.startHour}
                    onChange={(event) => updateHour('startHour', event.target.value)}
                    className="w-full border border-black bg-white px-3 py-2 text-sm"
                  >
                    {HOUR_OPTIONS.map((hour) => (
                      <option key={hour} value={hour}>
                        {formatHourLabel(hour)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-bold">
                  <span>End hour</span>
                  <select
                    value={rule.schedule.endHour}
                    onChange={(event) => updateHour('endHour', event.target.value)}
                    className="w-full border border-black bg-white px-3 py-2 text-sm"
                  >
                    {HOUR_OPTIONS.map((hour) => (
                      <option key={hour} value={hour}>
                        {formatHourLabel(hour)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="text-sm font-semibold">
                Current schedule: {formatScheduleSummary(rule.schedule)}
              </p>
            </div>
          ) : null}
        </section>

        {presetOptions.length > 0 ? (
          <section className="space-y-4 border border-black p-4">
            <div>
              <h3 className="text-lg font-bold">Eliminate distractions</h3>
              <p className="text-sm">
                Hide distracting elements to stay focused while the site remains accessible.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold">{presetLabel} quick toggles</p>

              {presetOptions.map((option) => (
                <div
                  key={option.key}
                  className="flex items-start justify-between gap-3 border-t border-black pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="space-y-1">
                    <p className="font-bold">{option.label}</p>
                    <p className="text-sm">{option.description}</p>
                  </div>
                  <Toggle
                    checked={Boolean(rule.presetToggles[option.key])}
                    label={option.label}
                    onToggle={() => togglePresetOption(option.key)}
                  />
                </div>
                ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4 border border-black p-4">
          <div>
            <h3 className="text-lg font-bold">Custom selectors</h3>
            <p className="text-sm">
              Add CSS selectors to hide specific sections on this site.
            </p>
          </div>

          <div className="flex gap-2">
            <TextInput
              value={selectorInput}
              onChange={(event) => {
                setSelectorInput(event.target.value)
                if (selectorError) {
                  setSelectorError(null)
                }
              }}
              placeholder="e.g. #comments or .sidebar"
            />
            <Button onClick={handleAddSelector}>
              <FontAwesomeIcon icon={faPlus} />
              Add
            </Button>
          </div>

          {selectorError ? (
            <p className="border border-black px-3 py-2 text-sm font-semibold">
              {selectorError}
            </p>
          ) : null}

          {rule.customSelectors.length > 0 ? (
            <div className="space-y-2">
              {rule.customSelectors.map((selector) => (
                <div
                  key={selector}
                  className="flex items-center justify-between gap-3 border border-black px-3 py-2"
                >
                  <code className="min-w-0 flex-1 truncate text-sm">{selector}</code>
                  <button
                    type="button"
                    aria-label={`Remove ${selector}`}
                    onClick={() => handleRemoveSelector(selector)}
                    className="inline-flex h-8 w-8 items-center justify-center border border-black"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm">No custom selectors added yet.</p>
          )}
        </section>
      </div>
    </section>
  )
}
