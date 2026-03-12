import { useMemo, useState } from 'react'
import { faArrowLeft, faPencil, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  getPresetDisplayName,
  getPresetOptionsForDomain,
  usesSectionHidingOnly,
} from '../../shared/presets'
import {
  DEFAULT_SCHEDULE,
  WEEKDAY_LABELS,
  formatHourLabel,
  formatScheduleSummary,
} from '../../shared/schedule'
import {
  WEEKDAY_ORDER,
  type BlockingMode,
  type NamedSchedule,
  type SiteRule,
  type Weekday,
} from '../../shared/types'

import { Button } from '@ui/Button'
import { TextInput } from '@ui/TextInput'
import { Toggle } from './Toggle'

type SiteSettingsPanelProps = {
  rule: SiteRule
  onClose: () => void
  onChange: (nextRule: SiteRule) => void
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)

interface NewScheduleForm {
  name: string
  weekdays: Weekday[]
  startHour: number
  endHour: number
}

const EMPTY_SCHEDULE_FORM: NewScheduleForm = {
  name: '',
  weekdays: [...DEFAULT_SCHEDULE.weekdays],
  startHour: DEFAULT_SCHEDULE.startHour,
  endHour: DEFAULT_SCHEDULE.endHour,
}

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
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [newSchedule, setNewSchedule] = useState<NewScheduleForm>(EMPTY_SCHEDULE_FORM)
  const [scheduleNameError, setScheduleNameError] = useState<string | null>(null)

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
      enabled: blockingMode === 'always' ? true : rule.enabled,
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

  function toggleNewScheduleWeekday(weekday: Weekday): void {
    setNewSchedule((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter((w) => w !== weekday)
        : [...prev.weekdays, weekday].sort(
            (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b),
          ),
    }))
  }

  function handleSaveSchedule(): void {
    const name = newSchedule.name.trim()

    if (!name) {
      setScheduleNameError('Enter a name for this schedule.')
      return
    }

    if (editingScheduleId !== null) {
      updateRule({
        ...rule,
        schedules: rule.schedules.map((s) =>
          s.id === editingScheduleId
            ? { ...s, name, weekdays: newSchedule.weekdays, startHour: newSchedule.startHour, endHour: newSchedule.endHour }
            : s
        ),
      })
      setEditingScheduleId(null)
    } else {
      const schedule: NamedSchedule = {
        id: crypto.randomUUID(),
        name,
        weekdays: newSchedule.weekdays,
        startHour: newSchedule.startHour,
        endHour: newSchedule.endHour,
      }
      updateRule({
        ...rule,
        schedules: [...rule.schedules, schedule],
      })
      setIsAddingSchedule(false)
    }

    setNewSchedule(EMPTY_SCHEDULE_FORM)
    setScheduleNameError(null)
  }

  function handleCancelSchedule(): void {
    setNewSchedule(EMPTY_SCHEDULE_FORM)
    setScheduleNameError(null)
    setIsAddingSchedule(false)
    setEditingScheduleId(null)
  }

  function handleEditSchedule(schedule: NamedSchedule): void {
    setEditingScheduleId(schedule.id)
    setNewSchedule({
      name: schedule.name,
      weekdays: [...schedule.weekdays],
      startHour: schedule.startHour,
      endHour: schedule.endHour,
    })
    setIsAddingSchedule(false)
    setScheduleNameError(null)
  }

  function handleRemoveSchedule(id: string): void {
    updateRule({
      ...rule,
      schedules: rule.schedules.filter((s) => s.id !== id),
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
    <section className="absolute inset-0 z-10 flex flex-col bg-background pb-4 text-foreground">
      <header className="border-b border-foreground/20 px-4 py-4">
        <button
          type="button"
          onClick={onClose}
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </button>

        <h2 className="text-2xl font-bold">Website Settings - {rule.domain}</h2>
        <p className="text-sm text-muted-foreground">
          Customize how this website appears and behaves.
        </p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">

        {/* Blocking mode */}
        <section className="space-y-3 border border-foreground/20 p-4">
          <div>
            <h3 className="text-lg font-bold">Blocking</h3>
            <p className="text-sm text-muted-foreground">
              {sectionOnlyRule
                ? 'YouTube sections are hidden to reduce distractions. Switch to a strict schedule when needed.'
                : 'New sites default to always blocked. Switch to a strict schedule when needed.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={rule.blockingMode === 'always' ? 'primary' : 'secondary'}
              onClick={() => handleBlockingModeChange('always')}
            >
              Always block
            </Button>
            <Button
              variant={rule.blockingMode === 'scheduled' ? 'primary' : 'secondary'}
              onClick={() => handleBlockingModeChange('scheduled')}
            >
              Scheduled blocking
            </Button>
          </div>
        </section>

        {/* Schedules — separate section, only visible in scheduled mode */}
        {rule.blockingMode === 'scheduled' ? (
          <section className="space-y-3 border border-foreground/20 p-4">
            <div>
              <h3 className="text-lg font-bold">Schedules</h3>
              <p className="text-sm text-muted-foreground">
                Block this site during specific times. Each schedule can have its own name, days, and hours.
              </p>
            </div>

            {rule.schedules.length === 0 && !isAddingSchedule ? (
              <p className="text-sm text-muted-foreground">
                No schedules yet. Add one to define when this site is blocked.
              </p>
            ) : null}

            {/* Existing schedule rows */}
            {rule.schedules.map((schedule) =>
              editingScheduleId === schedule.id ? (
                <div key={schedule.id} className="space-y-3 border-t border-foreground/20 pt-3">
                  <div>
                    <p className="mb-1 text-sm font-bold">Schedule name</p>
                    <TextInput
                      value={newSchedule.name}
                      onChange={(e) => {
                        setNewSchedule((prev) => ({ ...prev, name: e.target.value }))
                        if (scheduleNameError) setScheduleNameError(null)
                      }}
                      placeholder="e.g. Deep Focus"
                      autoComplete="off"
                    />
                    {scheduleNameError ? (
                      <p className="mt-1 text-xs font-semibold text-foreground">{scheduleNameError}</p>
                    ) : null}
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold">Days</p>
                    <div className="flex justify-between">
                      {WEEKDAY_ORDER.map((weekday) => (
                        <Button
                          key={weekday}
                          size="xs"
                          variant={newSchedule.weekdays.includes(weekday) ? 'primary' : 'secondary'}
                          onClick={() => toggleNewScheduleWeekday(weekday)}
                        >
                          {WEEKDAY_LABELS[weekday]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1 text-sm font-bold">
                      <span>Start hour</span>
                      <select
                        value={newSchedule.startHour}
                        onChange={(e) =>
                          setNewSchedule((prev) => ({ ...prev, startHour: Number(e.target.value) }))
                        }
                        className="w-full border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground"
                      >
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>
                            {formatHourLabel(hour)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm font-bold">
                      <span>End hour</span>
                      <select
                        value={newSchedule.endHour}
                        onChange={(e) =>
                          setNewSchedule((prev) => ({ ...prev, endHour: Number(e.target.value) }))
                        }
                        className="w-full border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground"
                      >
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>
                            {formatHourLabel(hour)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleSaveSchedule}>
                      Save
                    </Button>
                    <Button variant="secondary" onClick={handleCancelSchedule}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between gap-3 border-t border-foreground/20 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold">{schedule.name}</p>
                    <p className="text-sm text-muted-foreground">{formatScheduleSummary(schedule)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${schedule.name}`}
                      onClick={() => handleEditSchedule(schedule)}
                      className="inline-flex h-8 w-8 items-center justify-center border border-foreground/20 hover:bg-foreground/20"
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${schedule.name}`}
                      onClick={() => handleRemoveSchedule(schedule.id)}
                      className="inline-flex h-8 w-8 items-center justify-center border border-foreground/20 hover:bg-foreground/20"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Add schedule form */}
            {isAddingSchedule ? (
              <div className="space-y-3 border-t border-foreground/20 pt-3">
                <div>
                  <p className="mb-1 text-sm font-bold">Schedule name</p>
                  <TextInput
                    value={newSchedule.name}
                    onChange={(e) => {
                      setNewSchedule((prev) => ({ ...prev, name: e.target.value }))
                      if (scheduleNameError) setScheduleNameError(null)
                    }}
                    placeholder="e.g. Deep Focus"
                    autoComplete="off"
                  />
                  {scheduleNameError ? (
                    <p className="mt-1 text-xs font-semibold text-foreground">{scheduleNameError}</p>
                  ) : null}
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold">Days</p>
                  <div className="flex justify-between">
                    {WEEKDAY_ORDER.map((weekday) => (
                      <Button
                        key={weekday}
                        size="xs"
                        variant={newSchedule.weekdays.includes(weekday) ? 'primary' : 'secondary'}
                        onClick={() => toggleNewScheduleWeekday(weekday)}
                      >
                        {WEEKDAY_LABELS[weekday]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm font-bold">
                    <span>Start hour</span>
                    <select
                      value={newSchedule.startHour}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({ ...prev, startHour: Number(e.target.value) }))
                      }
                      className="w-full border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {HOUR_OPTIONS.map((hour) => (
                        <option key={hour} value={hour}>
                          {formatHourLabel(hour)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-sm font-bold">
                    <span>End hour</span>
                    <select
                      value={newSchedule.endHour}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({ ...prev, endHour: Number(e.target.value) }))
                      }
                      className="w-full border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {HOUR_OPTIONS.map((hour) => (
                        <option key={hour} value={hour}>
                          {formatHourLabel(hour)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleSaveSchedule}>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleCancelSchedule}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              editingScheduleId === null ? (
                <Button onClick={() => setIsAddingSchedule(true)}>
                  <FontAwesomeIcon icon={faPlus} />
                  Add schedule
                </Button>
              ) : null
            )}
          </section>
        ) : null}

        {/* YouTube preset toggles */}
        {presetOptions.length > 0 ? (
          <section className="space-y-4 border border-foreground/20 p-4">
            <div>
              <h3 className="text-lg font-bold">Eliminate distractions</h3>
              <p className="text-sm text-muted-foreground">
                Hide distracting elements to stay focused while the site remains accessible.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold">{presetLabel} quick toggles</p>

              {presetOptions.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between gap-3 border-t border-foreground/20 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="space-y-1">
                    <p className="font-bold">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
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

        {/* Custom CSS selectors */}
        <section className="space-y-4 border border-foreground/20 p-4">
          <div>
            <h3 className="text-lg font-bold">Custom selectors</h3>
            <p className="text-sm text-muted-foreground">
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
            <p className="border border-foreground/20 px-3 py-2 text-sm font-semibold">
              {selectorError}
            </p>
          ) : null}

          {rule.customSelectors.length > 0 ? (
            <div className="space-y-2">
              {rule.customSelectors.map((selector) => (
                <div
                  key={selector}
                  className="flex items-center justify-between gap-3 border border-foreground/20 px-3 py-2"
                >
                  <code className="min-w-0 flex-1 truncate text-sm">{selector}</code>
                  <button
                    type="button"
                    aria-label={`Remove ${selector}`}
                    onClick={() => handleRemoveSelector(selector)}
                    className="inline-flex h-8 w-8 items-center justify-center border border-foreground/20"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No custom selectors added yet.</p>
          )}
        </section>
      </div>
    </section>
  )
}
