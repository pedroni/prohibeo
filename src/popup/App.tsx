import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'

import { normalizeDomainInput } from '../shared/domains'
import { clearExpiredTemporaryBlocks } from '../shared/schedule'
import { createSiteRule, getSiteRules, saveSiteRules, watchSiteRules } from '../shared/storage'
import type { SiteRule } from '../shared/types'
import logoUrl from '../assets/logo.png'

import { Button } from '@ui/Button'
import { SiteCard } from './components/SiteCard'
import { SiteSettingsPanel } from './components/SiteSettingsPanel'
import { SocialMediaCombobox } from './components/SocialMediaCombobox'

function sortSiteRules(siteRules: SiteRule[]): SiteRule[] {
  return [...siteRules].sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while saving changes.'
}

function siteRulesChanged(left: SiteRule[], right: SiteRule[]): boolean {
  return JSON.stringify(left) !== JSON.stringify(right)
}

export default function App() {
  const [siteRules, setSiteRules] = useState<SiteRule[]>([])
  const [websiteInput, setWebsiteInput] = useState('')
  const [selectedSiteRuleId, setSelectedSiteRuleId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  const selectedSiteRule = useMemo(
    () => siteRules.find((siteRule) => siteRule.id === selectedSiteRuleId) ?? null,
    [selectedSiteRuleId, siteRules],
  )

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    async function loadSiteRules(): Promise<void> {
      try {
        unsubscribe = watchSiteRules((nextSiteRules) => {
          if (!cancelled) {
            setSiteRules(sortSiteRules(nextSiteRules))
          }
        })

        const storedSiteRules = await getSiteRules()

        if (!cancelled) {
          setSiteRules(sortSiteRules(storedSiteRules))
          setErrorMessage(null)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadSiteRules()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    const hasTemporaryBlocks = siteRules.some(
      (siteRule) => siteRule.temporaryBlockUntil !== null,
    )

    if (!hasTemporaryBlocks) {
      return
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [siteRules])

  useEffect(() => {
    const normalizedSiteRules = clearExpiredTemporaryBlocks(siteRules, currentTime)

    if (!siteRulesChanged(siteRules, normalizedSiteRules)) {
      return
    }

    void persistSiteRules(normalizedSiteRules).catch((error) => {
      setErrorMessage(getErrorMessage(error))
    })
  }, [currentTime, siteRules])

  async function persistSiteRules(nextSiteRules: SiteRule[]): Promise<void> {
    const sortedSiteRules = sortSiteRules(nextSiteRules)

    setSiteRules(sortedSiteRules)
    await saveSiteRules(sortedSiteRules)
  }

  async function handleAddWebsite(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    await addWebsite(websiteInput)
  }

  async function addWebsite(rawInput: string): Promise<void> {
    try {
      const normalizedDomain = normalizeDomainInput(rawInput)
      const existingSiteRule = siteRules.find((siteRule) => siteRule.domain === normalizedDomain)

      if (existingSiteRule) {
        setSelectedSiteRuleId(existingSiteRule.id)
        throw new Error(`${normalizedDomain} is already in Prohibeo.`)
      }

      const nextSiteRule = createSiteRule(normalizedDomain)
      await persistSiteRules([...siteRules, nextSiteRule])
      setWebsiteInput('')
      setSelectedSiteRuleId(nextSiteRule.id)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleUpdateSiteRule(nextSiteRule: SiteRule): Promise<void> {
    try {
      await persistSiteRules(
        siteRules.map((siteRule) => (siteRule.id === nextSiteRule.id ? nextSiteRule : siteRule)),
      )
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleRemoveSiteRule(siteRuleId: string): Promise<void> {
    try {
      await persistSiteRules(siteRules.filter((siteRule) => siteRule.id !== siteRuleId))

      if (selectedSiteRuleId === siteRuleId) {
        setSelectedSiteRuleId(null)
      }

      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="relative h-[560px] w-[420px] overflow-hidden bg-background text-foreground">
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-foreground/20 bg-background px-4 py-4">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            <div className="flex min-h-10 items-center">
              <img
                src={logoUrl}
                alt="Prohibeo logo"
                className="h-10 w-10 border border-foreground/20 object-cover"
              />
            </div>

            <div className="flex min-h-10 min-w-0 items-center">
              <h1 className="text-2xl font-bold leading-none">
                Prohibeo
              </h1>
            </div>

            <p
              className="min-w-0 overflow-hidden text-sm leading-5 text-muted-foreground"
            >
              Block websites and hide distracting sections.
            </p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            <form onSubmit={handleAddWebsite} className="space-y-3 border border-foreground/20 p-4">
              <div>
                <h2 className="text-lg font-bold">Website to block</h2>
                <p className="text-sm text-muted-foreground">
                  Add a URL or domain. YouTube hides distracting sections while keeping
                  the site accessible. Other sites show a block screen.
                </p>
              </div>

              {errorMessage ? (
                <p className="text-sm font-semibold text-red-500">{errorMessage}</p>
              ) : null}

              <div className="flex gap-2">
                <SocialMediaCombobox
                  value={websiteInput}
                  excludedDomains={siteRules.map((r) => r.domain)}
                  onChange={(value) => {
                    setWebsiteInput(value)
                    if (errorMessage) {
                      setErrorMessage(null)
                    }
                  }}
                  onSelect={(value) => {
                    void addWebsite(value)
                  }}
                />
                <Button type="submit">
                  <FontAwesomeIcon icon={faPlus} />
                  Add
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Blocked websites</h2>
              <p className="text-sm text-muted-foreground">
                {siteRules.length} site{siteRules.length === 1 ? '' : 's'}
              </p>
            </div>

            {isLoading ? <p className="text-sm text-muted-foreground">Loading your settings...</p> : null}

            {!isLoading && siteRules.length === 0 ? (
              <div className="border border-foreground/20 p-4">
                <p className="font-bold text-base">No websites added yet.</p>
                <p className="text-sm text-muted-foreground">
                  Add a domain to start blocking full pages or hiding specific sections.
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              {siteRules.map((siteRule) => (
                <SiteCard
                  key={siteRule.id}
                  now={currentTime}
                  rule={siteRule}
                  onEdit={() => setSelectedSiteRuleId(siteRule.id)}
                  onRemove={() => {
                    void handleRemoveSiteRule(siteRule.id)
                  }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {selectedSiteRule ? (
        <SiteSettingsPanel
          key={selectedSiteRule.id}
          now={currentTime}
          rule={selectedSiteRule}
          onClose={() => setSelectedSiteRuleId(null)}
          onChange={(nextSiteRule) => {
            void handleUpdateSiteRule(nextSiteRule)
          }}
        />
      ) : null}
    </div>
  )
}
