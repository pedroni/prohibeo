import { faGear } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ReactNode } from 'react'

import { Button } from '@ui/Button'
import { ConfirmDeleteButton } from '@ui/ConfirmDeleteButton'
import { getEnabledPresetLabels, usesSectionHidingOnly } from '../../shared/presets'
import {
  formatCountdownDuration,
  getTemporaryBlockRemainingMs,
  isSiteRuleBlockingNow,
} from '../../shared/schedule'
import { resolveSchedulesForRule } from '../../shared/storage'
import type { NamedSchedule, SiteRule } from '../../shared/types'
import {
  getSiteIcon,
  getSiteIconHoverClassName,
} from '../siteMetadata'

type SiteCardProps = {
  now: Date
  rule: SiteRule
  schedules: NamedSchedule[]
  onEdit: () => void
  onRemove: () => void
}

function Badge({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`border px-2 py-1 text-xs font-semibold ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-foreground'
      }`}
    >
      {children}
    </span>
  )
}

function getRuleLabel(rule: SiteRule, schedules: NamedSchedule[], now: Date): string {
  if (usesSectionHidingOnly(rule.domain) && rule.blockingMode === 'always') {
    return 'Sections hidden'
  }

  if (rule.blockingMode === 'temporary') {
    const remainingMs = getTemporaryBlockRemainingMs(rule, now)

    return remainingMs && remainingMs > 0
      ? `Temporary - ${formatCountdownDuration(remainingMs)} left`
      : 'Temporary'
  }

  if (rule.blockingMode === 'always') {
    return 'Always blocked'
  }

  const resolvedSchedules = resolveSchedulesForRule(rule, schedules)

  if (resolvedSchedules.length === 0) {
    return 'Scheduled - No schedules'
  }

  return resolvedSchedules.length === 1
    ? `Scheduled - ${resolvedSchedules[0].name}`
    : `Scheduled - ${resolvedSchedules.length} schedules`
}

export function SiteCard({ now, rule, schedules, onEdit, onRemove }: SiteCardProps) {
  const enabledPresetLabels = getEnabledPresetLabels(rule)
  const selectorCount = rule.customSelectors.length
  const resolvedRule = {
    ...rule,
    schedules: resolveSchedulesForRule(rule, schedules),
  }
  const blockingNow = isSiteRuleBlockingNow(resolvedRule, now)

  return (
    <article className="group border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9! shrink-0 items-center justify-center border border-border">
              <FontAwesomeIcon
                icon={getSiteIcon(rule.domain)}
                className={`text-muted-foreground transition-colors ${getSiteIconHoverClassName(rule.domain)}`}
              />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{rule.domain}</h2>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {getRuleLabel(rule, schedules, now)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" aria-label={`Edit ${rule.domain}`} onClick={onEdit}>
            <FontAwesomeIcon icon={faGear} />
          </Button>
          <ConfirmDeleteButton
            ariaLabel={`Remove ${rule.domain}`}
            confirmAriaLabel={`Confirm remove ${rule.domain}`}
            onConfirm={onRemove}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge active={blockingNow}>{blockingNow ? 'Blocking now' : 'Not blocking now'}</Badge>

        {enabledPresetLabels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}

        {selectorCount > 0 ? (
          <Badge>
            {selectorCount} selector{selectorCount === 1 ? '' : 's'}
          </Badge>
        ) : null}
      </div>
    </article>
  )
}
