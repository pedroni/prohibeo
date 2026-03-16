import { findMatchingRule } from '../shared/domains'
import {
  getEnabledPresetSelectors,
  hasSectionHiding,
  usesSectionHidingOnly,
} from '../shared/presets'
import {
  clearExpiredTemporaryBlocks,
  formatCountdownDuration,
  formatScheduleSummary,
  getActiveSchedules,
  getNextRuleTransition,
  getTemporaryBlockRemainingMs,
  isSiteRuleBlockingNow,
} from '../shared/schedule'
import {
  getExtensionData,
  saveExtensionData,
  watchExtensionData,
} from '../shared/storage'
import type { ExtensionData, ResolvedSiteRule, SiteRule } from '../shared/types'

const HIDE_STYLE_ID = 'prohibeo-hide-style'
const OVERLAY_ID = 'prohibeo-block-overlay'
const SCROLL_LOCK_ID = 'prohibeo-scroll-lock'
const TRANSITION_REFRESH_BUFFER_MS = 250

let scheduledRefreshId: number | null = null

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

function applyHideStyle(rule: ResolvedSiteRule | undefined): void {
  if (!rule || !hasSectionHiding(rule)) {
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

function clearScheduledRefresh(): void {
  if (scheduledRefreshId === null) {
    return
  }

  window.clearTimeout(scheduledRefreshId)
  scheduledRefreshId = null
}

function scheduleRefreshAt(nextRefreshAt: Date | null): void {
  clearScheduledRefresh()

  if (nextRefreshAt === null) {
    return
  }

  const delayMs = Math.max(0, nextRefreshAt.getTime() - Date.now()) + TRANSITION_REFRESH_BUFFER_MS

  scheduledRefreshId = window.setTimeout(() => {
    scheduledRefreshId = null
    void refreshRules()
  }, delayMs)
}

function siteRulesChanged(left: SiteRule[], right: SiteRule[]): boolean {
  return JSON.stringify(left) !== JSON.stringify(right)
}

const SHADOW_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
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
  .countdown {
    font-weight: 700;
  }
  @media (prefers-color-scheme: dark) {
    .shell { background: #131313; color: #e6e6e6; }
    .card { border-color: #525252; }
  }
`

function getBlockStatusText(rule: ResolvedSiteRule, at = new Date()): string {
  const temporaryBlockRemainingMs =
    rule.blockingMode === 'temporary' ? getTemporaryBlockRemainingMs(rule, at) : null

  if (temporaryBlockRemainingMs !== null) {
    return temporaryBlockRemainingMs > 0
      ? `Temporary block - ${formatCountdownDuration(temporaryBlockRemainingMs)} remaining.`
      : 'Temporary block ended.'
  }

  if (rule.blockingMode === 'always') {
    return 'This website is always blocked.'
  }

  const active = getActiveSchedules(rule, at)

  if (active.length === 1) {
    return `${active[0].name} — ${formatScheduleSummary(active[0])}`
  }

  if (active.length > 1) {
    return active.map((schedule) => schedule.name).join(', ')
  }

  return 'This website is blocked.'
}

function applyBlockOverlay(rule: ResolvedSiteRule, at = new Date()): void {
  const statusText = getBlockStatusText(rule, at)
  const temporaryBlockRemainingMs =
    rule.blockingMode === 'temporary' ? getTemporaryBlockRemainingMs(rule, at) : null

  const existing = document.getElementById(OVERLAY_ID)

  if (existing?.shadowRoot) {
    const heading = existing.shadowRoot.querySelector('h1')
    const status = existing.shadowRoot.querySelector('.status')
    const countdown = existing.shadowRoot.querySelector('.countdown')

    if (heading) {
      heading.textContent = `${rule.domain} is blocked`
    }

    if (status) {
      status.textContent = statusText
    }

    if (countdown) {
      countdown.textContent =
        temporaryBlockRemainingMs !== null && temporaryBlockRemainingMs > 0
          ? `${formatCountdownDuration(temporaryBlockRemainingMs)} left`
          : ''
    }

    return
  }

  const scrollLock = document.createElement('style')
  scrollLock.id = SCROLL_LOCK_ID
  scrollLock.textContent = 'html, body { overflow: hidden !important; }'
  document.documentElement.append(scrollLock)

  const overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  overlay.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;')

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

  const countdown = document.createElement('p')
  countdown.className = 'countdown'
  countdown.textContent =
    temporaryBlockRemainingMs !== null && temporaryBlockRemainingMs > 0
      ? `${formatCountdownDuration(temporaryBlockRemainingMs)} left`
      : ''

  card.append(brand, heading, status, countdown, hint)
  shell.append(card)
  shadow.append(shadowStyle, shell)
  document.documentElement.append(overlay)
}

function applyMatchingRule(siteRules: SiteRule[], schedules: ResolvedSiteRule['schedules'], at = new Date()): void {
  const matchingRule = findMatchingRule(siteRules, schedules, window.location.hostname)
  const blockingNow = matchingRule ? isSiteRuleBlockingNow(matchingRule, at) : false

  if (matchingRule && blockingNow && !usesSectionHidingOnly(matchingRule.domain)) {
    applyBlockOverlay(matchingRule, at)
    return
  }

  removeBlockOverlay()
  applyHideStyle(blockingNow ? matchingRule : undefined)
  scheduleRefreshAt(matchingRule ? getNextRuleTransition(matchingRule, at) : null)
}

async function syncExtensionData(extensionData: ExtensionData, at = new Date()): Promise<void> {
  const normalizedSiteRules = clearExpiredTemporaryBlocks(extensionData.siteRules, at)

  if (siteRulesChanged(extensionData.siteRules, normalizedSiteRules)) {
    await saveExtensionData({
      ...extensionData,
      siteRules: normalizedSiteRules,
    })
  }

  applyMatchingRule(normalizedSiteRules, extensionData.schedules, at)
}

async function refreshRules(): Promise<void> {
  try {
    await syncExtensionData(await getExtensionData(), new Date())
  } catch (error) {
    console.error('Prohibeo failed to load rules.', error)
    clearScheduledRefresh()
    removeBlockOverlay()
    removeHideStyle()
  }
}

void refreshRules()

watchExtensionData((extensionData) => {
  void syncExtensionData(extensionData, new Date()).catch((error) => {
    console.error('Prohibeo failed to sync updated rules.', error)
    clearScheduledRefresh()
    removeBlockOverlay()
    removeHideStyle()
  })
})

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    void refreshRules()
  }
})
