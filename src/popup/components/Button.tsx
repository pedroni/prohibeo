import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

export function Button({
  active = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const paletteClassName = active
    ? 'bg-black text-white dark:border-neutral-300 dark:bg-[#E6E6E6] dark:text-[#131313]'
    : 'bg-white text-black dark:border-neutral-700 dark:bg-[#131313] dark:text-[#E6E6E6]'

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border border-black px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 ${paletteClassName} ${className}`}
      {...props}
    />
  )
}
