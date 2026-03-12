import type { InputHTMLAttributes } from 'react'

type TextInputProps = InputHTMLAttributes<HTMLInputElement>

export function TextInput({ className = '', ...props }: TextInputProps) {
  return (
    <input
      className={`w-full border border-black bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-500 focus:bg-neutral-50 dark:border-neutral-700 dark:bg-[#131313] dark:text-[#E6E6E6] dark:placeholder:text-neutral-500 dark:focus:bg-neutral-900 ${className}`}
      {...props}
    />
  )
}
