import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export type SearchableSelectOption<TValue extends string> = {
  value: TValue
  searchText: string
  label: string
  meta?: string
  icon?: ReactNode
}

type SearchableSelectProps<TValue extends string> = {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: TValue) => void
  options: SearchableSelectOption<TValue>[]
  placeholder: string
  buttonLabel: string
  emptyMessage?: string
}

export function SearchableSelect<TValue extends string>({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  buttonLabel,
  emptyMessage = 'No matches found.',
}: SearchableSelectProps<TValue>) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const query = value.trim().toLowerCase()
  const filteredOptions = options.filter((option) => {
    if (!query) {
      return true
    }

    return option.searchText.toLowerCase().includes(query)
  })

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('button')
      items[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleSelect(nextValue: TValue): void {
    onChange(nextValue)
    onSelect?.(nextValue)
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        setActiveIndex(-1)
      }
      return
    }

    if (!open || filteredOptions.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((previous) => (previous < filteredOptions.length - 1 ? previous + 1 : 0))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((previous) => (previous > 0 ? previous - 1 : filteredOptions.length - 1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const indexToSelect = activeIndex >= 0 ? activeIndex : 0
      const nextOption = filteredOptions[indexToSelect]

      if (nextOption) {
        handleSelect(nextOption.value)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1"
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      <div className={`flex border border-foreground/20 bg-background ${open ? 'bg-foreground/5' : ''}`}>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setActiveIndex(-1)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          aria-label={buttonLabel}
          className="border-l border-foreground/20 px-3 hover:bg-foreground/20"
          onClick={() => setOpen((previous) => !previous)}
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open ? (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-20 max-h-52 overflow-y-auto border border-t-0 border-foreground/20 bg-background"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                type="button"
                key={option.value}
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-foreground/20 ${index === activeIndex ? 'bg-foreground/20' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  handleSelect(option.value)
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.icon ? (
                  <span className="flex w-4 shrink-0 items-center justify-center text-foreground">
                    {option.icon}
                  </span>
                ) : null}
                <span className="flex-1 text-left">{option.label}</span>
                {option.meta ? <span className="text-muted-foreground">{option.meta}</span> : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
