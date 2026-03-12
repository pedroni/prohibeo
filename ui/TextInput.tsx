import type { InputHTMLAttributes } from 'react'

type TextInputSize = 'md' | 'lg'

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: TextInputSize
}

function getTextInputClassName(size: TextInputSize): string {
  const sizeClassName = size === 'lg' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'

  return `w-full border border-foreground/20 bg-background text-foreground outline-none placeholder:text-muted-foreground focus:bg-foreground/5 ${sizeClassName}`
}

export function TextInput({ size = 'md', ...props }: TextInputProps) {
  return (
    <input
      className={getTextInputClassName(size)}
      {...props}
    />
  )
}
