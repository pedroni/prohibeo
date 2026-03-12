import { findMatchingRule } from '../shared/domains'
import { getEnabledPresetSelectors, usesSectionHidingOnly } from '../shared/presets'
import { formatScheduleSummary, isSiteRuleBlockingNow } from '../shared/schedule'
import { getSiteRules, watchSiteRules } from '../shared/storage'
import type { SiteRule } from '../shared/types'

const HIDE_STYLE_ID = 'prohibeo-hide-style'
let activeBlockedRuleId: string | null = null

function getUniqueSelectors(rule: SiteRule): string[] {
  return [...new Set([...getEnabledPresetSelectors(rule), ...rule.customSelectors])]
}

function removeHideStyle(): void {
  document.getElementById(HIDE_STYLE_ID)?.remove()
}

function ensureHideStyle(): HTMLStyleElement {
  const existingStyle = document.getElementById(HIDE_STYLE_ID)

  if (existingStyle instanceof HTMLStyleElement) {
    return existingStyle
  }

  const style = document.createElement('style')

  style.id = HIDE_STYLE_ID
  ;(document.head ?? document.documentElement).append(style)

  return style
}

function applyHideStyle(rule: SiteRule | undefined): void {
  if (!rule || !rule.enabled) {
    removeHideStyle()
    return
  }

  const selectors = getUniqueSelectors(rule)

  if (selectors.length === 0) {
    removeHideStyle()
    return
  }

  const style = ensureHideStyle()

  style.textContent = selectors
    .map((selector) => `${selector} { display: none !important; }`)
    .join('\n')
}

function buildBlockedMarkup(rule: SiteRule): string {
  const blockingSummary =
    rule.blockingMode === 'always'
      ? 'This website is always blocked.'
      : `Strict mode is active right now: ${formatScheduleSummary(rule.schedule)}.`

  return `
    <main class="prohibeo-shell">
    <section class="prohibeo-card">
    <p class="prohibeo-brand">prohibeo</p>
        <h1>${rule.domain} is blocked</h1>
        <p>${blockingSummary}</p>
        <p>Open the Prohibeo popup to change this rule.</p>
      </section>
    </main>
  `
}

function blockPage(rule: SiteRule): void {
  window.stop()
  activeBlockedRuleId = rule.id
  removeHideStyle()
  document.title = `Blocked · ${rule.domain} · Prohibeo`

  const root = document.documentElement

  if (!root) {
    return
  }

  root.innerHTML = ''

  const head = document.createElement('head')
  const metaCharset = document.createElement('meta')

  metaCharset.setAttribute('charset', 'UTF-8')

  const metaViewport = document.createElement('meta')
  metaViewport.name = 'viewport'
  metaViewport.content = 'width=device-width, initial-scale=1.0'

  const title = document.createElement('title')
  title.textContent = `Blocked · ${rule.domain} · Prohibeo`

  const style = document.createElement('style')
  style.textContent = `
    :root {
      --background: #fff;
      --foreground: #000;
      --border: #000;
      color: var(--foreground);
      background: var(--background);
      font-family: Inter, system-ui, sans-serif;
      color-scheme: light dark;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      min-height: 100vh;
      background: var(--background);
      color: var(--foreground);
    }

    .prohibeo-shell {
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .prohibeo-card {
      width: min(480px, 100%);
      border: 1px solid var(--border);
      padding: 24px;
    }

    .prohibeo-brand {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 32px;
      line-height: 1.1;
    }

    p {
      margin: 0 0 12px;
      font-size: 16px;
      line-height: 1.5;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --background: #131313;
        --foreground: #E6E6E6;
        --border: #525252;
      }
    }
  `

  const body = document.createElement('body')
  body.innerHTML = buildBlockedMarkup(rule)

  head.append(metaCharset, metaViewport, title, style)
  root.append(head, body)
}

function unblockIfNeeded(): void {
  if (activeBlockedRuleId) {
    window.location.reload()
  }
}

function applyMatchingRule(siteRules: SiteRule[]): void {
  const matchingRule = findMatchingRule(siteRules, window.location.hostname)

  if (
    matchingRule &&
    isSiteRuleBlockingNow(matchingRule) &&
    !usesSectionHidingOnly(matchingRule.domain)
  ) {
    blockPage(matchingRule)
    return
  }

  if (activeBlockedRuleId) {
    unblockIfNeeded()
    return
  }

  applyHideStyle(matchingRule)
}

async function refreshRules(): Promise<void> {
  try {
    const siteRules = await getSiteRules()
    applyMatchingRule(siteRules)
  } catch (error) {
    console.error('Prohibeo failed to load rules.', error)
    removeHideStyle()
  }
}

void refreshRules()

watchSiteRules((siteRules) => {
  applyMatchingRule(siteRules)
})

window.setInterval(() => {
  void refreshRules()
}, 60_000)

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    void refreshRules()
  }
})
