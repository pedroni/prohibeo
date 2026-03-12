import { faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { faGear, faGlobe, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { getEnabledPresetLabels, usesSectionHidingOnly } from '../../shared/presets'
import { formatScheduleSummary, isSiteRuleBlockingNow } from '../../shared/schedule'
import type { SiteRule } from '../../shared/types'

type SiteCardProps = {
  rule: SiteRule
  onEdit: () => void
  onRemove: () => void
}

function getSiteIcon(domain: string) {
  if (domain === 'youtube.com') {
    return faYoutube
  }

  if (domain === 'x.com' || domain === 'twitter.com') {
    return faXTwitter
  }

  return faGlobe
}

export function SiteCard({ rule, onEdit, onRemove }: SiteCardProps) {
  const enabledPresetLabels = getEnabledPresetLabels(rule)
  const selectorCount = rule.customSelectors.length
  const blockingNow = isSiteRuleBlockingNow(rule)
  const sectionOnlyRule = usesSectionHidingOnly(rule.domain)

  return (
    <article className="border border-black p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center border border-black">
              <FontAwesomeIcon icon={getSiteIcon(rule.domain)} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{rule.domain}</h2>
              <p className="text-xs font-medium uppercase tracking-wide">
                {rule.blockingMode === 'always'
                  ? sectionOnlyRule
                    ? 'Sections hidden'
                    : 'Always blocked'
                  : `Scheduled • ${formatScheduleSummary(rule.schedule)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Edit ${rule.domain}`}
            onClick={onEdit}
            className="inline-flex h-9 w-9 items-center justify-center border border-black"
          >
            <FontAwesomeIcon icon={faGear} />
          </button>
          <button
            type="button"
            aria-label={`Remove ${rule.domain}`}
            onClick={onRemove}
            className="inline-flex h-9 w-9 items-center justify-center border border-black"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`border px-2 py-1 text-xs font-semibold ${
            blockingNow ? 'border-black bg-black text-white' : 'border-black bg-white text-black'
          }`}
        >
          {blockingNow
            ? sectionOnlyRule
              ? 'Hiding now'
              : 'Blocking now'
            : sectionOnlyRule
              ? 'Not hiding now'
              : 'Not blocking now'}
        </span>

        {enabledPresetLabels.map((label) => (
          <span key={label} className="border border-black px-2 py-1 text-xs font-semibold">
            {label}
          </span>
        ))}

        {selectorCount > 0 ? (
          <span className="border border-black px-2 py-1 text-xs font-semibold">
            {selectorCount} selector{selectorCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </article>
  )
}
