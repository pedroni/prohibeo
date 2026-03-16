import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'xxs' | 'sm' | 'md' | 'lg' | 'xs' | 'icon'

type CommonButtonProps = {
  children: ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
  className?: string
}

type LinkButtonProps = CommonButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
  }

type NativeButtonProps = CommonButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type ButtonProps = LinkButtonProps | NativeButtonProps

function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  const variantClassName =
    variant === 'primary'
      ? 'border-border bg-foreground! text-background! hover:bg-foreground/80!'
      : variant === 'danger'
        ? 'border-red-500 bg-red-500/10! text-red-700! hover:bg-red-500/20! dark:text-red-300!'
        : 'border-border bg-background! text-foreground! hover:bg-foreground/10!'
  const sizeClassName =
    size === 'lg'
      ? 'px-4 py-3 text-sm'
      : size === 'xxs'
        ? 'px-2 py-1 text-[11px]'
      : size === 'sm'
        ? 'px-2.5 py-1.5 text-xs'
      : size === 'xs'
        ? 'min-w-12 px-3 py-2 text-xs'
      : size === 'icon'
          ? 'h-9 w-9 shrink-0'
          : 'px-3 py-2 text-sm'

  return `inline-flex items-center justify-center gap-2 border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName} ${sizeClassName} ${className ?? ''}`.trim()
}

export function Button(props: ButtonProps) {
  if ('href' in props && props.href) {
    const {
      children,
      className,
      href,
      size = 'md',
      variant = 'primary',
      ...linkProps
    } = props
    const resolvedClassName = getButtonClassName(variant, size, className)

    return (
      <a href={href} className={resolvedClassName} {...linkProps}>
        {children}
      </a>
    )
  }

  const nativeButtonProps = props as NativeButtonProps
  const {
    children,
    className,
    size = 'md',
    type = 'button',
    variant = 'secondary',
    ...buttonProps
  } = nativeButtonProps
  const resolvedClassName = getButtonClassName(variant, size, className)

  return (
    <button type={type} className={resolvedClassName} {...buttonProps}>
      {children}
    </button>
  )
}
