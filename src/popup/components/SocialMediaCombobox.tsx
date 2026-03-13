import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'

import { KNOWN_SITES } from '../siteMetadata'

interface SocialMediaComboboxProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  excludedDomains?: string[]
}

export function SocialMediaCombobox({
  value,
  onChange,
  onSelect,
  excludedDomains = [],
}: SocialMediaComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const query = value.trim().toLowerCase()
  const filteredSites = KNOWN_SITES.filter((site) => {
    const siteDomains = [site.domain, ...(site.aliases ?? [])]
    if (siteDomains.some((domain) => excludedDomains.includes(domain))) return false
    if (!query) return true
    return (
      site.label.toLowerCase().includes(query) ||
      siteDomains.some((domain) => domain.toLowerCase().includes(query))
    )
  })

  // Reset active index when the filtered list changes (user is typing)
  // Done inline in the onChange handler below to avoid calling setState in an effect.

  // Scroll active item into view when navigating with keyboard
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('button')
      items[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleSelect(domain: string) {
    onChange(domain)
    onSelect?.(domain)
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        setActiveIndex(-1)
      }
      return
    }

    if (!open || filteredSites.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev < filteredSites.length - 1 ? prev + 1 : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredSites.length - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const indexToSelect = activeIndex >= 0 ? activeIndex : 0
      handleSelect(filteredSites[indexToSelect].domain)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1"
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      <div className={`flex border border-foreground/20 bg-background ${open ? 'bg-foreground/5' : ''}`}>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setActiveIndex(-1)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="e.g. youtube.com"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          aria-label="Show popular sites"
          className="border-l border-foreground/20 px-3 hover:bg-foreground/20"
          onClick={() => setOpen((prev) => !prev)}
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && filteredSites.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-20 max-h-52 overflow-y-auto border border-t-0 border-foreground/20 bg-background"
        >
          {filteredSites.map((site, index) => (
            <button
              type="button"
              key={site.domain}
              className={`flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-foreground/20 ${index === activeIndex ? 'bg-foreground/20' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(site.domain)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <FontAwesomeIcon icon={site.icon} className="w-4 shrink-0 text-foreground" />
              <span className="flex-1 text-left">{site.label}</span>
              <span className="text-muted-foreground">{site.domain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
