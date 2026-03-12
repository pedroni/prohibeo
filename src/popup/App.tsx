import { faBan, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'

import { normalizeDomainInput } from '../shared/domains'
import { createSiteRule, getSiteRules, saveSiteRules, watchSiteRules } from '../shared/storage'
import type { SiteRule } from '../shared/types'

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

export default function App() {
  const [siteRules, setSiteRules] = useState<SiteRule[]>([])
  const [websiteInput, setWebsiteInput] = useState('')
  const [selectedSiteRuleId, setSelectedSiteRuleId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  async function persistSiteRules(nextSiteRules: SiteRule[]): Promise<void> {
    const sortedSiteRules = sortSiteRules(nextSiteRules)

    setSiteRules(sortedSiteRules)
    await saveSiteRules(sortedSiteRules)
  }

  async function handleAddWebsite(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    try {
      const normalizedDomain = normalizeDomainInput(websiteInput)
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
    <div className="relative min-h-[560px] w-[420px] bg-background text-foreground">
      <div className="flex min-h-[560px] flex-col">
        <header className="border-b border-foreground/20 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center border border-foreground/20 text-lg">
              <FontAwesomeIcon icon={faBan} />
            </span>
            <div>
              <h1 className="text-2xl font-bold">Prohibeo</h1>
              <p className="text-sm text-muted-foreground">
                Block websites and hide distracting sections.
              </p>
            </div>
          </div>
        </header>

        {/* Form sits outside the scroll container so the combobox dropdown isn't clipped */}
        <div className="space-y-3 px-4 py-4">
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
              />
              <Button type="submit">
                <FontAwesomeIcon icon={faPlus} />
                Add
              </Button>
            </div>
          </form>
        </div>

        <main className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
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
                rule={siteRule}
                onEdit={() => setSelectedSiteRuleId(siteRule.id)}
                onRemove={() => {
                  void handleRemoveSiteRule(siteRule.id)
                }}
              />
            ))}
          </div>
        </main>
      </div>

      {selectedSiteRule ? (
        <SiteSettingsPanel
          key={selectedSiteRule.id}
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
