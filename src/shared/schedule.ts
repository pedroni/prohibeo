import type { SiteRule, StrictSchedule, Weekday } from './types'

const JAVASCRIPT_DAY_TO_WEEKDAY: readonly Weekday[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

export const DEFAULT_SCHEDULE: StrictSchedule = {
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  startHour: 9,
  endHour: 17,
}

export function getWeekdayForDate(date: Date): Weekday {
  return JAVASCRIPT_DAY_TO_WEEKDAY[date.getDay()]
}

export function getPreviousWeekday(weekday: Weekday): Weekday {
  const index = JAVASCRIPT_DAY_TO_WEEKDAY.indexOf(weekday)

  return JAVASCRIPT_DAY_TO_WEEKDAY[(index + 6) % JAVASCRIPT_DAY_TO_WEEKDAY.length]
}

export function isScheduleActive(schedule: StrictSchedule, at = new Date()): boolean {
  if (schedule.weekdays.length === 0) {
    return false
  }

  const currentWeekday = getWeekdayForDate(at)
  const currentHour = at.getHours()
  const activeDays = new Set(schedule.weekdays)

  if (schedule.startHour === schedule.endHour) {
    return activeDays.has(currentWeekday)
  }

  if (schedule.startHour < schedule.endHour) {
    return (
      activeDays.has(currentWeekday) &&
      currentHour >= schedule.startHour &&
      currentHour < schedule.endHour
    )
  }

  return (
    (activeDays.has(currentWeekday) && currentHour >= schedule.startHour) ||
    (activeDays.has(getPreviousWeekday(currentWeekday)) && currentHour < schedule.endHour)
  )
}

export function isSiteRuleBlockingNow(rule: SiteRule, at = new Date()): boolean {
  if (!rule.enabled) {
    return false
  }

  if (rule.blockingMode === 'always') {
    return true
  }

  return isScheduleActive(rule.schedule, at)
}

export function formatHourLabel(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const normalized = hour % 12 === 0 ? 12 : hour % 12

  return `${normalized}:00 ${suffix}`
}

export function formatWeekdaySummary(weekdays: Weekday[]): string {
  if (weekdays.length === 0) {
    return 'No days'
  }

  const weekdaySet = new Set(weekdays)
  const weekdaysOnly = ['mon', 'tue', 'wed', 'thu', 'fri'] as const

  if (weekdaySet.size === 7) {
    return 'Every day'
  }

  if (weekdaysOnly.every((weekday) => weekdaySet.has(weekday)) && weekdaySet.size === 5) {
    return 'Mon-Fri'
  }

  return weekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join(', ')
}

export function formatScheduleSummary(schedule: StrictSchedule): string {
  if (schedule.startHour === schedule.endHour) {
    return `${formatWeekdaySummary(schedule.weekdays)} • All day`
  }

  return `${formatWeekdaySummary(schedule.weekdays)} • ${formatHourLabel(schedule.startHour)}-${formatHourLabel(schedule.endHour)}`
}
