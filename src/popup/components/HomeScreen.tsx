import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, type FormEvent } from 'react'

import logoUrl from '../../assets/logo.png'
import type { NamedSchedule, SiteRule } from '../../shared/types'

import { Button } from '@ui/Button'
import { SiteCard } from './SiteCard'
import { SiteSelectable } from './SiteSelectable'

type HomeScreenProps = {
  now: Date
  siteRules: SiteRule[]
  schedules: NamedSchedule[]
  isLoading: boolean
  errorMessage: string | null
  onClearError: () => void
  onAddWebsite: (rawInput: string) => Promise<void>
  onEditSiteRule: (siteRuleId: string) => void
  onRemoveSiteRule: (siteRuleId: string) => void
}

export function HomeScreen({
  now,
  siteRules,
  schedules,
  isLoading,
  errorMessage,
  onClearError,
  onAddWebsite,
  onEditSiteRule,
  onRemoveSiteRule,
}: HomeScreenProps) {
  const [websiteInput, setWebsiteInput] = useState('')

  async function handleAddWebsite(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    await onAddWebsite(websiteInput)
  }

  return (
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
                    onClearError()
                  }
                }}
                onSelect={(value) => {
                  void onAddWebsite(value)
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
                now={now}
                rule={siteRule}
                schedules={schedules}
                onEdit={() => onEditSiteRule(siteRule.id)}
                onRemove={() => onRemoveSiteRule(siteRule.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
