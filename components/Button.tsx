type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}
export default function Button({ variant='primary', className='', ...rest }: Props) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 outline-amber'
  const styles = {
    primary: 'bg-amber text-charcoal hover:bg-amberDark',
    secondary: 'bg-charcoal text-white hover:bg-black',
    ghost: 'bg-transparent text-charcoal hover:bg-black/5'
  } as const
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest} />
}
