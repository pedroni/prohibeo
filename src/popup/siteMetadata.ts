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
import { faGlobe } from '@fortawesome/free-solid-svg-icons'

import {
  KNOWN_SITES as BASE_KNOWN_SITES,
  canonicalizeKnownSiteDomain,
  type KnownSite as BaseKnownSite,
} from '../shared/knownSites'

export type KnownSite = BaseKnownSite & {
  icon: IconDefinition
  iconActiveClassName: string
  iconHoverClassName: string
}

const SITE_ICONS: Record<string, IconDefinition> = {
  'youtube.com': faYoutube,
  'facebook.com': faFacebook,
  'instagram.com': faInstagram,
  'x.com': faXTwitter,
  'tiktok.com': faTiktok,
  'linkedin.com': faLinkedin,
  'reddit.com': faReddit,
  'snapchat.com': faSnapchat,
  'pinterest.com': faPinterest,
  'twitch.tv': faTwitch,
  'discord.com': faDiscord,
  'whatsapp.com': faWhatsapp,
  'telegram.org': faTelegram,
}

const SITE_ICON_ACTIVE_CLASS_NAMES: Record<string, string> = {
  'youtube.com': 'text-red-500',
  'facebook.com': 'text-blue-600',
  'instagram.com': 'text-pink-500',
  'x.com': 'text-foreground',
  'tiktok.com': 'text-cyan-500',
  'linkedin.com': 'text-sky-600',
  'reddit.com': 'text-orange-500',
  'snapchat.com': 'text-yellow-400',
  'pinterest.com': 'text-rose-600',
  'twitch.tv': 'text-violet-500',
  'discord.com': 'text-indigo-500',
  'whatsapp.com': 'text-green-500',
  'telegram.org': 'text-sky-500',
}

const SITE_ICON_HOVER_CLASS_NAMES: Record<string, string> = {
  'youtube.com': 'group-hover:text-red-500',
  'facebook.com': 'group-hover:text-blue-600',
  'instagram.com': 'group-hover:text-pink-500',
  'x.com': 'group-hover:text-foreground',
  'tiktok.com': 'group-hover:text-cyan-500',
  'linkedin.com': 'group-hover:text-sky-600',
  'reddit.com': 'group-hover:text-orange-500',
  'snapchat.com': 'group-hover:text-yellow-400',
  'pinterest.com': 'group-hover:text-rose-600',
  'twitch.tv': 'group-hover:text-violet-500',
  'discord.com': 'group-hover:text-indigo-500',
  'whatsapp.com': 'group-hover:text-green-500',
  'telegram.org': 'group-hover:text-sky-500',
}

export const KNOWN_SITES: KnownSite[] = BASE_KNOWN_SITES.map((site) => ({
  ...site,
  icon: SITE_ICONS[site.domain] ?? faGlobe,
  iconActiveClassName: SITE_ICON_ACTIVE_CLASS_NAMES[site.domain] ?? 'text-muted-foreground',
  iconHoverClassName: SITE_ICON_HOVER_CLASS_NAMES[site.domain] ?? 'group-hover:text-muted-foreground',
}))

export function getSiteIcon(domain: string): IconDefinition {
  return SITE_ICONS[canonicalizeKnownSiteDomain(domain)] ?? faGlobe
}

export function getSiteIconActiveClassName(domain: string): string {
  return SITE_ICON_ACTIVE_CLASS_NAMES[canonicalizeKnownSiteDomain(domain)] ?? 'text-muted-foreground'
}

export function getSiteIconHoverClassName(domain: string): string {
  return SITE_ICON_HOVER_CLASS_NAMES[canonicalizeKnownSiteDomain(domain)] ?? 'group-hover:text-muted-foreground'
}
