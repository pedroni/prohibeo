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
import { Select } from '@ui/Select'
import { TextInput } from '@ui/TextInput'
import { Toggle } from './Toggle'

type SiteSettingsPanelProps = {
  rule: SiteRule
  onClose: () => void
  onChange: (nextRule: SiteRule) => void
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)

interface ScheduleFormValues {
  name: string
  weekdays: Weekday[]
  startHour: number
  endHour: number
}

type ScheduleFormState =
  | { mode: 'idle' }
  | { mode: 'adding' }
  | { mode: 'editing'; scheduleId: string }

const DEFAULT_FORM_VALUES: ScheduleFormValues = {
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

interface ScheduleFormProps {
  values: ScheduleFormValues
  nameError: string | null
  onChange: (next: ScheduleFormValues) => void
  onSave: () => void
  onCancel: () => void
}

function ScheduleForm({ values, nameError, onChange, onSave, onCancel }: ScheduleFormProps) {
  function toggleWeekday(weekday: Weekday): void {
    const next = values.weekdays.includes(weekday)
      ? values.weekdays.filter((w) => w !== weekday)
      : [...values.weekdays, weekday].sort(
          (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b),
        )
    onChange({ ...values, weekdays: next })
  }

  return (
    <div className="space-y-3 border-t border-foreground/20 pt-3">
      <div>
        <p className="mb-1 text-sm font-bold">Schedule name</p>
        <TextInput
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          placeholder="e.g. Deep Focus"
          autoComplete="off"
        />
        {nameError ? (
          <p className="mt-1 text-xs font-semibold text-foreground">{nameError}</p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Days</p>
        <div className="flex justify-between">
          {WEEKDAY_ORDER.map((weekday) => (
            <Button
              key={weekday}
              size="xs"
              variant={values.weekdays.includes(weekday) ? 'primary' : 'secondary'}
              onClick={() => toggleWeekday(weekday)}
            >
              {WEEKDAY_LABELS[weekday]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm font-bold">
          <span>Start hour</span>
          <Select
            value={values.startHour}
            onChange={(e) => onChange({ ...values, startHour: Number(e.target.value) })}
          >
            {HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {formatHourLabel(hour)}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1 text-sm font-bold">
          <span>End hour</span>
          <Select
            value={values.endHour}
            onChange={(e) => onChange({ ...values, endHour: Number(e.target.value) })}
          >
            {HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {formatHourLabel(hour)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={onSave}>
          Save
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function SiteSettingsPanel({
  rule,
  onClose,
  onChange,
}: SiteSettingsPanelProps) {
  const [selectorInput, setSelectorInput] = useState('')
  const [selectorError, setSelectorError] = useState<string | null>(null)
  const [scheduleFormState, setScheduleFormState] = useState<ScheduleFormState>({ mode: 'idle' })
  const [scheduleFormValues, setScheduleFormValues] = useState<ScheduleFormValues>(DEFAULT_FORM_VALUES)
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

  function handleSaveSchedule(): void {
    const name = scheduleFormValues.name.trim()

    if (!name) {
      setScheduleNameError('Enter a name for this schedule.')
      return
    }

    if (scheduleFormState.mode === 'editing') {
      const { scheduleId } = scheduleFormState
      updateRule({
        ...rule,
        schedules: rule.schedules.map((s) =>
          s.id === scheduleId
            ? { ...s, name, weekdays: scheduleFormValues.weekdays, startHour: scheduleFormValues.startHour, endHour: scheduleFormValues.endHour }
            : s
        ),
      })
    } else {
      const schedule: NamedSchedule = {
        id: crypto.randomUUID(),
        name,
        weekdays: scheduleFormValues.weekdays,
        startHour: scheduleFormValues.startHour,
        endHour: scheduleFormValues.endHour,
      }
      updateRule({
        ...rule,
        schedules: [...rule.schedules, schedule],
      })
    }

    setScheduleFormState({ mode: 'idle' })
    setScheduleFormValues(DEFAULT_FORM_VALUES)
    setScheduleNameError(null)
  }

  function handleCancelSchedule(): void {
    setScheduleFormState({ mode: 'idle' })
    setScheduleFormValues(DEFAULT_FORM_VALUES)
    setScheduleNameError(null)
  }

  function handleEditSchedule(schedule: NamedSchedule): void {
    setScheduleFormState({ mode: 'editing', scheduleId: schedule.id })
    setScheduleFormValues({
      name: schedule.name,
      weekdays: [...schedule.weekdays],
      startHour: schedule.startHour,
      endHour: schedule.endHour,
    })
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

            {rule.schedules.length === 0 && scheduleFormState.mode === 'idle' ? (
              <p className="text-sm text-muted-foreground">
                No schedules yet. Add one to define when this site is blocked.
              </p>
            ) : null}

            {/* Existing schedule rows */}
            {rule.schedules.map((schedule) =>
              scheduleFormState.mode === 'editing' && scheduleFormState.scheduleId === schedule.id ? (
                <ScheduleForm
                  key={schedule.id}
                  values={scheduleFormValues}
                  nameError={scheduleNameError}
                  onChange={(next) => {
                    setScheduleFormValues(next)
                    if (scheduleNameError) setScheduleNameError(null)
                  }}
                  onSave={handleSaveSchedule}
                  onCancel={handleCancelSchedule}
                />
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
                    <Button
                      size="icon"
                      aria-label={`Edit ${schedule.name}`}
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </Button>
                    <Button
                      size="icon"
                      aria-label={`Remove ${schedule.name}`}
                      onClick={() => handleRemoveSchedule(schedule.id)}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </Button>
                  </div>
                </div>
              )
            )}

            {/* Add schedule form */}
            {scheduleFormState.mode === 'adding' ? (
              <ScheduleForm
                values={scheduleFormValues}
                nameError={scheduleNameError}
                onChange={(next) => {
                  setScheduleFormValues(next)
                  if (scheduleNameError) setScheduleNameError(null)
                }}
                onSave={handleSaveSchedule}
                onCancel={handleCancelSchedule}
              />
            ) : scheduleFormState.mode === 'idle' ? (
              <Button onClick={() => setScheduleFormState({ mode: 'adding' })}>
                <FontAwesomeIcon icon={faPlus} />
                Add schedule
              </Button>
            ) : null}
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
                  <Button
                    size="icon"
                    aria-label={`Remove ${selector}`}
                    onClick={() => handleRemoveSelector(selector)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </Button>
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
