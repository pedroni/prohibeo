type ToggleProps = {
  checked: boolean
  label: string
  onToggle: () => void
}

export function Toggle({ checked, label, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={onToggle}
      className="inline-flex h-7 w-12 items-center rounded-full border border-foreground/20 bg-background px-1"
    >
      <span
        className={`h-5 w-5 rounded-full border border-foreground/20 transition ${
          checked
            ? 'translate-x-5 bg-foreground'
            : 'translate-x-0 bg-background'
        }`}
      />
    </button>
  )
}
