import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo } from 'react'

import { Selectable, type SelectableOption } from '@ui/Selectable'

import { KNOWN_SITES } from '../siteMetadata'

interface SiteSelectableProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  excludedDomains?: string[]
}

export function SiteSelectable({
  value,
  onChange,
  onSelect,
  excludedDomains = [],
}: SiteSelectableProps) {
  const options: SelectableOption<string>[] = useMemo(
    () =>
      KNOWN_SITES.filter((site) => {
        const siteDomains = [site.domain, ...(site.aliases ?? [])]
        return !siteDomains.some((domain) => excludedDomains.includes(domain))
      }).map((site) => ({
        value: site.domain,
        searchText: [site.label, site.domain, ...(site.aliases ?? [])].join(' '),
        label: site.label,
        meta: site.domain,
        icon: <FontAwesomeIcon icon={site.icon} />,
        iconActiveClassName: site.iconActiveClassName,
      })),
    [excludedDomains],
  )

  return (
    <Selectable
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      options={options}
      placeholder="e.g. youtube.com"
      buttonLabel="Show popular sites"
      emptyMessage="No matching sites found."
    />
  )
}
