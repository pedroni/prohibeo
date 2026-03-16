import { faCircleQuestion, faHeart, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'

import { recordQualifiedPopupOpen } from '../../shared/storage'

import { Button } from '@ui/Button'

const SPONSOR_URL = 'https://github.com/sponsors/pedroni?frequency=one-time'
const ISSUE_URL = 'https://github.com/pedroni/prohibeo/issues/new/choose'
const QUALIFIED_OPEN_DELAY_MS = 1000
const SPONSOR_PROMPT_INTERVAL = 5

type SponsorButtonProps = {
  label?: string
  variant?: 'primary' | 'secondary'
  size?: 'xxs' | 'sm' | 'xs'
}

export function SponsorButton({
  label = 'Sponsor',
  variant = 'secondary',
  size = 'xs',
}: SponsorButtonProps) {
  return (
    <Button href={SPONSOR_URL} size={size} variant={variant} target="_blank" rel="noreferrer">
      <FontAwesomeIcon icon={faHeart} className="text-rose-500" />
      {label}
    </Button>
  )
}

type IssueButtonProps = {
  label?: string
  size?: 'xxs' | 'sm' | 'xs'
}

export function IssueButton({ label = 'Help', size = 'xxs' }: IssueButtonProps) {
  return (
    <Button href={ISSUE_URL} size={size} variant="secondary" target="_blank" rel="noreferrer">
      <FontAwesomeIcon icon={faCircleQuestion} />
      {label}
    </Button>
  )
}

export function PopupSponsorSupport() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    const timeoutId = window.setTimeout(() => {
      void recordQualifiedPopupOpen()
        .then((nextCount) => {
          if (!cancelled && nextCount % SPONSOR_PROMPT_INTERVAL === 0) {
            setIsVisible(true)
          }
        })
        .catch((error: unknown) => {
          console.error('Prohibeo could not record popup open count.', error)
        })
    }, QUALIFIED_OPEN_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20">
      <div className="pointer-events-auto w-full border border-border bg-foreground p-2.5 text-background shadow-[0_10px_24px_rgba(0,0,0,0.18)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Finding Prohibeo helpful?</p>
            <p className="mt-0.5 text-xs leading-5 text-background/70">
              Sponsoring helps keep it free and fully unlocked.
            </p>
          </div>

          <Button
            size="icon"
            variant="secondary"
            aria-label="Dismiss sponsor message"
            onClick={() => setIsVisible(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <SponsorButton label="Sponsor" variant="secondary" size="sm" />
        </div>
      </div>
    </div>
  )
}
