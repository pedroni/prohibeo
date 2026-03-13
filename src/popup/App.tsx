import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'

import logoUrl from '../assets/logo.png'
import { normalizeDomainInput } from '../shared/domains'
import { clearExpiredTemporaryBlocks } from '../shared/schedule'
import {
  createSiteRule,
  getExtensionData,
  saveExtensionData,
  watchExtensionData,
} from '../shared/storage'
import type { ExtensionData, NamedSchedule, SiteRule } from '../shared/types'

import { Button } from '@ui/Button'
import { SiteSelectable } from './components/SiteSelectable'
import { SiteCard } from './components/SiteCard'
import { SiteSettingsPanel } from './components/SiteSettingsPanel'

function pruneUnusedSchedules(siteRules: SiteRule[], schedules: NamedSchedule[]): NamedSchedule[] {
  const usedScheduleIds = new Set(siteRules.flatMap((siteRule) => siteRule.scheduleIds))
  return schedules.filter((schedule) => usedScheduleIds.has(schedule.id))
}

function sortSiteRules(siteRules: SiteRule[]): SiteRule[] {
  return [...siteRules].sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

function sortSchedules(schedules: NamedSchedule[]): NamedSchedule[] {
  return [...schedules].sort((left, right) => left.name.localeCompare(right.name))
}

function normalizeExtensionData(extensionData: ExtensionData): ExtensionData {
  return {
    siteRules: sortSiteRules(extensionData.siteRules),
    schedules: sortSchedules(extensionData.schedules),
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while saving changes.'
}

function siteRulesChanged(left: SiteRule[], right: SiteRule[]): boolean {
  return JSON.stringify(left) !== JSON.stringify(right)
}

export default function App() {
  const [extensionData, setExtensionData] = useState<ExtensionData>({ siteRules: [], schedules: [] })
  const [websiteInput, setWebsiteInput] = useState('')
  const [selectedSiteRuleId, setSelectedSiteRuleId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  const { siteRules, schedules } = extensionData
  const selectedSiteRule = useMemo(
    () => siteRules.find((siteRule) => siteRule.id === selectedSiteRuleId) ?? null,
    [selectedSiteRuleId, siteRules],
  )

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    async function loadExtensionData(): Promise<void> {
      try {
        unsubscribe = watchExtensionData((nextExtensionData) => {
          if (!cancelled) {
            setExtensionData(normalizeExtensionData(nextExtensionData))
          }
        })

        const storedExtensionData = await getExtensionData()

        if (!cancelled) {
          setExtensionData(normalizeExtensionData(storedExtensionData))
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

    void loadExtensionData()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    const hasTemporaryBlocks = siteRules.some((siteRule) => siteRule.temporaryBlockUntil !== null)

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

    void persistExtensionData({ siteRules: normalizedSiteRules, schedules }).catch((error) => {
      setErrorMessage(getErrorMessage(error))
    })
  }, [currentTime, schedules, siteRules])

  async function persistExtensionData(nextExtensionData: ExtensionData): Promise<void> {
    const normalized = normalizeExtensionData(nextExtensionData)
    setExtensionData(normalized)
    await saveExtensionData(normalized)
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
      await persistExtensionData({
        siteRules: [...siteRules, nextSiteRule],
        schedules,
      })
      setWebsiteInput('')
      setSelectedSiteRuleId(nextSiteRule.id)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleUpdateSiteRule(nextSiteRule: SiteRule): Promise<void> {
    try {
      await persistExtensionData({
        siteRules: siteRules.map((siteRule) => (siteRule.id === nextSiteRule.id ? nextSiteRule : siteRule)),
        schedules,
      })
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleUpdateSchedules(nextSchedules: NamedSchedule[]): Promise<void> {
    try {
      const validIds = new Set(nextSchedules.map((schedule) => schedule.id))
      const nextSiteRules = siteRules.map((siteRule) => ({
        ...siteRule,
        scheduleIds: siteRule.scheduleIds.filter((scheduleId) => validIds.has(scheduleId)),
      }))

      await persistExtensionData({
        siteRules: nextSiteRules,
        schedules: nextSchedules,
      })
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleCreateSchedule(nextSchedule: NamedSchedule, siteRuleId: string): Promise<void> {
    try {
      await persistExtensionData({
        siteRules: siteRules.map((siteRule) =>
          siteRule.id === siteRuleId
            ? { ...siteRule, scheduleIds: [...siteRule.scheduleIds, nextSchedule.id] }
            : siteRule,
        ),
        schedules: [...schedules, nextSchedule],
      })
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleAttachSchedule(siteRuleId: string, scheduleId: string): Promise<void> {
    try {
      await persistExtensionData({
        siteRules: siteRules.map((siteRule) =>
          siteRule.id === siteRuleId && !siteRule.scheduleIds.includes(scheduleId)
            ? { ...siteRule, scheduleIds: [...siteRule.scheduleIds, scheduleId] }
            : siteRule,
        ),
        schedules,
      })
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleDetachSchedule(siteRuleId: string, scheduleId: string): Promise<void> {
    try {
      const nextSiteRules = siteRules.map((siteRule) =>
        siteRule.id === siteRuleId
          ? { ...siteRule, scheduleIds: siteRule.scheduleIds.filter((value) => value !== scheduleId) }
          : siteRule,
      )

      await persistExtensionData({
        siteRules: nextSiteRules,
        schedules: pruneUnusedSchedules(nextSiteRules, schedules),
      })
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleRemoveSiteRule(siteRuleId: string): Promise<void> {
    try {
      const nextSiteRules = siteRules.filter((siteRule) => siteRule.id !== siteRuleId)

      await persistExtensionData({
        siteRules: nextSiteRules,
        schedules: pruneUnusedSchedules(nextSiteRules, schedules),
      })

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
          <div className="flex min-h-10 items-center gap-4">
            <img
              src={logoUrl}
              alt="Prohibeo logo"
              className="h-10 w-10 border border-foreground/20 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold leading-none">Prohibeo</h1>
              <p className="min-w-0 overflow-hidden text-sm leading-5 text-muted-foreground">
                Block websites and hide distracting sections.
              </p>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            <form onSubmit={handleAddWebsite} className="space-y-3 border border-foreground/20 p-4">
              <div>
                <h2 className="text-lg font-bold">Website to block</h2>
                <p className="text-sm text-muted-foreground">
                  Add a URL or domain. YouTube hides distracting sections while keeping the site
                  accessible. Other sites show a block screen.
                </p>
              </div>

              {errorMessage ? <p className="text-sm font-semibold text-red-500">{errorMessage}</p> : null}

              <div className="flex gap-2">
                <SiteSelectable
                  value={websiteInput}
                  excludedDomains={siteRules.map((rule) => rule.domain)}
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
                <p className="text-base font-bold">No websites added yet.</p>
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
                  schedules={schedules}
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
          schedules={schedules}
          siteRules={siteRules}
          onClose={() => setSelectedSiteRuleId(null)}
          onChange={(nextSiteRule) => {
            void handleUpdateSiteRule(nextSiteRule)
          }}
          onAttachSchedule={(siteRuleId: string, scheduleId: string) => {
            void handleAttachSchedule(siteRuleId, scheduleId)
          }}
          onCreateSchedule={(nextSchedule, siteRuleId) => {
            void handleCreateSchedule(nextSchedule, siteRuleId)
          }}
          onDetachSchedule={(siteRuleId: string, scheduleId: string) => {
            void handleDetachSchedule(siteRuleId, scheduleId)
          }}
          onSchedulesChange={(nextSchedules) => {
            void handleUpdateSchedules(nextSchedules)
          }}
        />
      ) : null}
    </div>
  )
}
