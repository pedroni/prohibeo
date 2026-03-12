import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

type ButtonVariant = 'primary' | 'secondary'
type ButtonSize = 'md' | 'lg' | 'xs'

type CommonButtonProps = {
  children: ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
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
): string {
  const variantClassName =
    variant === 'primary'
      ? 'border-foreground/20 bg-foreground! text-background! hover:bg-foreground/80!'
      : 'border-foreground/20 bg-background! text-foreground! hover:bg-foreground/10!'
  const sizeClassName =
    size === 'lg'
      ? 'px-4 py-3 text-sm'
      : size === 'xs'
        ? 'min-w-12 px-3 py-2 text-xs'
        : 'px-3 py-2 text-sm'

  return `inline-flex items-center justify-center gap-2 border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName} ${sizeClassName}`
}

export function Button(props: ButtonProps) {
  if ('href' in props && props.href) {
    const {
      children,
      href,
      size = 'md',
      variant = 'primary',
      ...linkProps
    } = props
    const resolvedClassName = getButtonClassName(variant, size)

    return (
      <a href={href} className={resolvedClassName} {...linkProps}>
        {children}
      </a>
    )
  }

  const nativeButtonProps = props as NativeButtonProps
  const {
    children,
    size = 'md',
    type = 'button',
    variant = 'secondary',
    ...buttonProps
  } = nativeButtonProps
  const resolvedClassName = getButtonClassName(variant, size)

  return (
    <button type={type} className={resolvedClassName} {...buttonProps}>
      {children}
    </button>
  )
}
