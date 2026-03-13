import { getDomain } from 'tldts'

import { isRuleActiveOnPage } from './presets'
import type { SiteRule } from './types'

function parseUrlCandidate(input: string): URL {
  const candidate = input.includes('://') ? input : `https://${input}`

  try {
    return new URL(candidate)
  } catch {
    throw new Error('Enter a valid website or URL.')
  }
}

export function normalizeDomainInput(input: string): string {
  const trimmed = input.trim().toLowerCase()

  if (!trimmed) {
    throw new Error('Enter a website to block.')
  }

  const parsedUrl = parseUrlCandidate(trimmed)
  const registrableDomain = getDomain(parsedUrl.hostname, {
    allowPrivateDomains: true,
  })
  const normalizedDomain = (registrableDomain ?? parsedUrl.hostname).toLowerCase()

  if (!normalizedDomain.includes('.')) {
    throw new Error('Enter a valid public website domain.')
  }

  return normalizedDomain
}

export function domainMatches(hostname: string, domain: string): boolean {
  const normalizedHostname = hostname.toLowerCase()
  const normalizedDomain = domain.toLowerCase()

  return (
    normalizedHostname === normalizedDomain ||
    normalizedHostname.endsWith(`.${normalizedDomain}`)
  )
}

export function findMatchingRule(rules: SiteRule[], hostname: string): SiteRule | undefined {
  return [...rules]
    .filter((rule) => isRuleActiveOnPage(rule) && domainMatches(hostname, rule.domain))
    .sort((left, right) => right.domain.length - left.domain.length)[0]
}
