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
      className="inline-flex h-7 w-12 items-center rounded-full border border-black bg-white px-1 dark:border-neutral-700 dark:bg-[#131313]"
    >
      <span
        className={`h-5 w-5 rounded-full border border-black transition dark:border-neutral-700 ${
          checked
            ? 'translate-x-5 bg-black dark:bg-[#E6E6E6]'
            : 'translate-x-0 bg-white dark:bg-[#131313]'
        }`}
      />
    </button>
  )
}
