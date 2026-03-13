import { useEffect, useMemo, useState } from 'react'

import { normalizeDomainInput } from '../shared/domains'
import { clearExpiredTemporaryBlocks } from '../shared/schedule'
import {
  createSiteRule,
  getExtensionData,
  saveExtensionData,
  watchExtensionData,
} from '../shared/storage'
import type { ExtensionData, NamedSchedule, SiteRule } from '../shared/types'

import { HomeScreen } from './components/HomeScreen'
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

  async function addWebsite(rawInput: string): Promise<void> {
    try {
      const normalizedDomain = normalizeDomainInput(rawInput)
      const existingSiteRule = siteRules.find((siteRule) => siteRule.domain === normalizedDomain)

      if (existingSiteRule) {
        setErrorMessage(null)
        setSelectedSiteRuleId(existingSiteRule.id)
        return
      }

      const nextSiteRule = createSiteRule(normalizedDomain)
      await persistExtensionData({
        siteRules: [...siteRules, nextSiteRule],
        schedules,
      })
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
    <div className="h-[560px] w-[420px] overflow-hidden bg-background text-foreground">
      {selectedSiteRule ? (
        <SiteSettingsPanel
          now={currentTime}
          rule={selectedSiteRule}
          schedules={schedules}
          siteRules={siteRules}
          errorMessage={errorMessage}
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
      ) : (
        <HomeScreen
          now={currentTime}
          siteRules={siteRules}
          schedules={schedules}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
          onAddWebsite={addWebsite}
          onEditSiteRule={setSelectedSiteRuleId}
          onRemoveSiteRule={(siteRuleId) => {
            void handleRemoveSiteRule(siteRuleId)
          }}
        />
      )}
    </div>
  )
}
