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

export interface KnownSite {
  domain: string
  label: string
  icon: IconDefinition
  aliases?: string[]
}

export const KNOWN_SITES: KnownSite[] = [
  { domain: 'youtube.com', label: 'YouTube', icon: faYoutube, aliases: ['youtu.be'] },
  { domain: 'facebook.com', label: 'Facebook', icon: faFacebook },
  { domain: 'instagram.com', label: 'Instagram', icon: faInstagram },
  { domain: 'x.com', label: 'X', icon: faXTwitter, aliases: ['twitter.com'] },
  { domain: 'tiktok.com', label: 'TikTok', icon: faTiktok },
  { domain: 'linkedin.com', label: 'LinkedIn', icon: faLinkedin },
  { domain: 'reddit.com', label: 'Reddit', icon: faReddit },
  { domain: 'snapchat.com', label: 'Snapchat', icon: faSnapchat },
  { domain: 'pinterest.com', label: 'Pinterest', icon: faPinterest },
  { domain: 'twitch.tv', label: 'Twitch', icon: faTwitch },
  { domain: 'discord.com', label: 'Discord', icon: faDiscord, aliases: ['discord.gg'] },
  { domain: 'whatsapp.com', label: 'WhatsApp', icon: faWhatsapp },
  { domain: 'telegram.org', label: 'Telegram', icon: faTelegram, aliases: ['t.me'] },
]

function matchesKnownSite(domain: string, site: KnownSite): boolean {
  return site.domain === domain || site.aliases?.includes(domain) === true
}

export function getSiteIcon(domain: string): IconDefinition {
  return KNOWN_SITES.find((site) => matchesKnownSite(domain, site))?.icon ?? faGlobe
}
