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
  const paletteClassName = active ? 'bg-black text-white' : 'bg-white text-black'

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border border-black px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${paletteClassName} ${className}`}
      {...props}
    />
  )
}
