import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary'
const COMMON_CLASSNAME =
  'flex items-center justify-center h-[48px] rounded-md border-2 border-[var(--color-primary-button-border)] bg-[var(--color-primary-button-background)] text-[var(--color-primary-button-text)] text-[14px] font-bold'

const variantClassName: Record<ButtonVariant, string> = {
  primary: `${COMMON_CLASSNAME} border-[var(--color-primary-button-border)] bg-[var(--color-primary-button-background)] text-[var(--color-primary-button-text)]`,
  secondary: `${COMMON_CLASSNAME} border-[var(--color-secondary-button-border)] bg-[var(--color-secondary-button-background)] text-[var(--color-secondary-button-text)]`,
}

type BaseProps = {
  variant?: ButtonVariant
  tag?: 'button' | 'a'
  children: ReactNode
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    tag?: 'button'
  }

type ButtonAsAnchor = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    tag: 'a'
  }

type ButtonProps = ButtonAsButton | ButtonAsAnchor

export function Button({
  tag = 'button',
  variant = 'primary',
  children,
  className,
  ...rest
}: ButtonProps) {
  const classes = [variantClassName[variant], className].filter(Boolean).join(' ')

  if (tag === 'a') {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a className={classes} {...anchorProps}>
        {children}
      </a>
    )
  }

  const buttonProps = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
