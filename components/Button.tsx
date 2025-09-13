'use client'
import * as React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...rest
}: Props) {
  const sizeCls: Record<Size, string> = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-2.5',
    lg: 'text-lg px-5 py-3',
  }

  const variantCls: Record<Variant, string> = {
    primary:
      'bg-amber text-charcoal border border-amber hover:bg-amber/90 disabled:opacity-60',
    secondary:
      'bg-card text-charcoal border border-line hover:border-amber disabled:opacity-60',
    ghost:
      'bg-transparent text-charcoal hover:text-black disabled:opacity-60',
  }

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-2xl font-semibold shadow-soft transition-colors focus:outline-none',
        sizeCls[size],
        variantCls[variant],
        className
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
