import { findMatchingRule } from '../shared/domains'
import { getEnabledPresetSelectors, usesSectionHidingOnly } from '../shared/presets'
import { formatScheduleSummary, getActiveSchedules, isSiteRuleBlockingNow } from '../shared/schedule'
import { getSiteRules, watchSiteRules } from '../shared/storage'
import type { SiteRule } from '../shared/types'

const HIDE_STYLE_ID = 'prohibeo-hide-style'
const OVERLAY_ID = 'prohibeo-block-overlay'
const SCROLL_LOCK_ID = 'prohibeo-scroll-lock'

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

function removeBlockOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove()
  document.getElementById(SCROLL_LOCK_ID)?.remove()
}

// Styles live inside a Shadow DOM — the page's CSS cannot pierce in.
// Background is on .shell (the shadow "body") rather than :host so it reliably fills the space.
const SHADOW_CSS = `
  :host {
    display: block;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  .shell {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #ffffff;
    color: #000000;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    color-scheme: light dark;
  }
  .card {
    width: min(480px, 100%);
    border: 1px solid #000000;
    padding: 24px;
  }
  .brand {
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
    font-weight: bold;
  }
  p {
    margin: 0 0 12px;
    font-size: 16px;
    line-height: 1.5;
  }
  @media (prefers-color-scheme: dark) {
    .shell { background: #131313; color: #e6e6e6; }
    .card { border-color: #525252; }
  }
`

function getBlockStatusText(rule: SiteRule): string {
  if (rule.blockingMode === 'always') {
    return 'This website is always blocked.'
  }

  const active = getActiveSchedules(rule)

  if (active.length === 1) {
    return `${active[0].name} — ${formatScheduleSummary(active[0])}`
  }

  if (active.length > 1) {
    return active.map((s) => s.name).join(', ')
  }

  return 'This website is blocked.'
}

function applyBlockOverlay(rule: SiteRule): void {
  const statusText = getBlockStatusText(rule)

  // If already showing, update text via shadow root (mode: 'open').
  const existing = document.getElementById(OVERLAY_ID)
  if (existing?.shadowRoot) {
    const h1 = existing.shadowRoot.querySelector('h1')
    const status = existing.shadowRoot.querySelector('.status')
    if (h1) h1.textContent = `${rule.domain} is blocked`
    if (status) status.textContent = statusText
    return
  }

  const scrollLock = document.createElement('style')
  scrollLock.id = SCROLL_LOCK_ID
  scrollLock.textContent = 'html, body { overflow: hidden !important; }'
  document.documentElement.append(scrollLock)

  const overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  // position:fixed + max z-index keeps us above everything
  overlay.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;')

  // Shadow DOM gives us a hard CSS boundary — the blocked site's styles cannot pierce in
  const shadow = overlay.attachShadow({ mode: 'open' })

  const shadowStyle = document.createElement('style')
  shadowStyle.textContent = SHADOW_CSS

  const shell = document.createElement('div')
  shell.className = 'shell'

  const card = document.createElement('section')
  card.className = 'card'

  const brand = document.createElement('p')
  brand.className = 'brand'
  brand.textContent = 'prohibeo'

  const heading = document.createElement('h1')
  heading.textContent = `${rule.domain} is blocked`

  const status = document.createElement('p')
  status.className = 'status'
  status.textContent = statusText

  const hint = document.createElement('p')
  hint.textContent = 'Open the Prohibeo popup to change this rule.'

  card.append(brand, heading, status, hint)
  shell.append(card)
  shadow.append(shadowStyle, shell)
  document.documentElement.append(overlay)
}

function applyMatchingRule(siteRules: SiteRule[]): void {
  const matchingRule = findMatchingRule(siteRules, window.location.hostname)

  if (
    matchingRule &&
    isSiteRuleBlockingNow(matchingRule) &&
    !usesSectionHidingOnly(matchingRule.domain)
  ) {
    applyBlockOverlay(matchingRule)
    return
  }

  removeBlockOverlay()
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
