import { faCheck, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'

import { Button } from './Button'

type ConfirmDeleteButtonProps = {
  ariaLabel: string
  confirmAriaLabel: string
  disabled?: boolean
  onConfirm: () => void
  timeoutMs?: number
}

const ICON_TRANSITION_CLASS_NAME = 'absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out'

export function ConfirmDeleteButton({
  ariaLabel,
  confirmAriaLabel,
  disabled = false,
  onConfirm,
  timeoutMs = 2500,
}: ConfirmDeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isAnimatingArm, setIsAnimatingArm] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const resetTimeoutRef = useRef<number | null>(null)
  const armAnimationTimeoutRef = useRef<number | null>(null)

  function clearResetTimeout(): void {
    if (resetTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(resetTimeoutRef.current)
    resetTimeoutRef.current = null
  }

  function clearArmAnimationTimeout(): void {
    if (armAnimationTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(armAnimationTimeoutRef.current)
    armAnimationTimeoutRef.current = null
  }

  function resetConfirmation(): void {
    clearResetTimeout()
    clearArmAnimationTimeout()
    setIsConfirming(false)
    setIsAnimatingArm(false)
  }

  function armConfirmation(): void {
    setIsConfirming(true)
    setIsAnimatingArm(true)
    clearResetTimeout()
    clearArmAnimationTimeout()
    resetTimeoutRef.current = window.setTimeout(() => {
      setIsConfirming(false)
      setIsAnimatingArm(false)
      resetTimeoutRef.current = null
    }, timeoutMs)
    armAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimatingArm(false)
      armAnimationTimeoutRef.current = null
    }, 180)
  }

  function handleClick(): void {
    if (disabled) {
      return
    }

    if (isConfirming) {
      resetConfirmation()
      onConfirm()
      return
    }

    armConfirmation()
  }

  useEffect(
    () => () => {
      clearResetTimeout()
      clearArmAnimationTimeout()
    },
    [],
  )

  useEffect(() => {
    if (!isConfirming) {
      return
    }

    function handlePointerDown(event: PointerEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        resetConfirmation()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isConfirming])

  return (
    <div ref={containerRef} className={isAnimatingArm ? 'animate-subtle-confirm-shake' : undefined}>
      <Button
        size="icon"
        variant={isConfirming ? 'danger' : 'secondary'}
        aria-label={isConfirming ? confirmAriaLabel : ariaLabel}
        aria-pressed={isConfirming}
        disabled={disabled}
        onClick={handleClick}
      >
        <span className="relative h-4 w-4 overflow-hidden" aria-hidden="true">
          <span
            className={`${ICON_TRANSITION_CLASS_NAME} ${
              isConfirming ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </span>
          <span
            className={`${ICON_TRANSITION_CLASS_NAME} ${
              isConfirming ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            <FontAwesomeIcon icon={faCheck} />
          </span>
        </span>
      </Button>
    </div>
  )
}
