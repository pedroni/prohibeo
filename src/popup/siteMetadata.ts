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

export const KNOWN_SITES: KnownSite[] = BASE_KNOWN_SITES.map((site) => ({
  ...site,
  icon: SITE_ICONS[site.domain] ?? faGlobe,
}))

export function getSiteIcon(domain: string): IconDefinition {
  return SITE_ICONS[canonicalizeKnownSiteDomain(domain)] ?? faGlobe
}
