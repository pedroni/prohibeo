export type KnownSite = {
  domain: string
  label: string
  aliases?: string[]
}

export const KNOWN_SITES: KnownSite[] = [
  { domain: 'youtube.com', label: 'YouTube', aliases: ['youtu.be'] },
  { domain: 'facebook.com', label: 'Facebook' },
  { domain: 'instagram.com', label: 'Instagram' },
  { domain: 'x.com', label: 'X', aliases: ['twitter.com'] },
  { domain: 'tiktok.com', label: 'TikTok' },
  { domain: 'linkedin.com', label: 'LinkedIn' },
  { domain: 'reddit.com', label: 'Reddit' },
  { domain: 'snapchat.com', label: 'Snapchat' },
  { domain: 'pinterest.com', label: 'Pinterest' },
  { domain: 'twitch.tv', label: 'Twitch' },
  { domain: 'discord.com', label: 'Discord', aliases: ['discord.gg'] },
  { domain: 'whatsapp.com', label: 'WhatsApp' },
  { domain: 'telegram.org', label: 'Telegram', aliases: ['t.me'] },
]

export function findKnownSite(domain: string): KnownSite | undefined {
  const normalizedDomain = domain.toLowerCase()

  return KNOWN_SITES.find(
    (site) =>
      site.domain === normalizedDomain || site.aliases?.includes(normalizedDomain) === true,
  )
}

export function canonicalizeKnownSiteDomain(domain: string): string {
  return findKnownSite(domain)?.domain ?? domain.toLowerCase()
}

export function getKnownSiteDomains(domain: string): string[] {
  const knownSite = findKnownSite(domain)

  if (!knownSite) {
    return [domain.toLowerCase()]
  }

  return [knownSite.domain, ...(knownSite.aliases ?? [])]
}
