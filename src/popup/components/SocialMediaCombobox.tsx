import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faDiscord,
  faFacebook,
  faInstagram,
  faLinkedin,
  faPinterest,
  faReddit,
  faSnapchat,
  faTelegram,
  faTiktok,
  faTwitch,
  faWhatsapp,
  faXTwitter,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'

interface SocialSite {
  domain: string
  label: string
  icon: IconDefinition
}

const SOCIAL_MEDIA_SITES: SocialSite[] = [
  { domain: 'youtube.com', label: 'YouTube', icon: faYoutube },
  { domain: 'facebook.com', label: 'Facebook', icon: faFacebook },
  { domain: 'instagram.com', label: 'Instagram', icon: faInstagram },
  { domain: 'x.com', label: 'X', icon: faXTwitter },
  { domain: 'tiktok.com', label: 'TikTok', icon: faTiktok },
  { domain: 'linkedin.com', label: 'LinkedIn', icon: faLinkedin },
  { domain: 'reddit.com', label: 'Reddit', icon: faReddit },
  { domain: 'snapchat.com', label: 'Snapchat', icon: faSnapchat },
  { domain: 'pinterest.com', label: 'Pinterest', icon: faPinterest },
  { domain: 'twitch.tv', label: 'Twitch', icon: faTwitch },
  { domain: 'discord.com', label: 'Discord', icon: faDiscord },
  { domain: 'whatsapp.com', label: 'WhatsApp', icon: faWhatsapp },
  { domain: 'telegram.org', label: 'Telegram', icon: faTelegram },
]

interface SocialMediaComboboxProps {
  value: string
  onChange: (value: string) => void
  excludedDomains?: string[]
}

export function SocialMediaCombobox({ value, onChange, excludedDomains = [] }: SocialMediaComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const query = value.trim().toLowerCase()
  const filteredSites = SOCIAL_MEDIA_SITES.filter((site) => {
    if (excludedDomains.includes(site.domain)) return false
    if (!query) return true
    return site.label.toLowerCase().includes(query) || site.domain.toLowerCase().includes(query)
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

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleSelect(domain: string) {
    onChange(domain)
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
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
    <div ref={containerRef} className="relative flex-1">
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
