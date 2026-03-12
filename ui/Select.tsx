import type { SelectHTMLAttributes } from 'react'

type SelectSize = 'md' | 'lg'

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  size?: SelectSize
}

function getSelectClassName(size: SelectSize): string {
  const sizeClassName = size === 'lg' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'

  return `w-full border border-foreground/20 bg-background text-foreground outline-none focus:bg-foreground/5 ${sizeClassName}`
}

export function Select({ size = 'md', ...props }: SelectProps) {
  return (
    <select
      className={getSelectClassName(size)}
      {...props}
    />
  )
}
