// components/Brand.tsx
import Image from 'next/image'

type Props = {
  /** 
   * 'wordmark' = logo horizontal con texto (recomendado para el header)
   * 'icon'     = solo isotipo redondo (para favicons, badges, etc.)
   * 'lockup'   = icono + wordmark en línea
   */
  variant?: 'wordmark' | 'icon' | 'lockup'
  className?: string
  alt?: string
}

export default function Brand({
  variant = 'wordmark',
  className = '',
  alt = 'platy'
}: Props) {
  if (variant === 'icon') {
    return (
      <Image
        src="/brand/PLATY_logo_icon_1024.png"
        alt={alt}
        width={36}
        height={36}
        priority
        className={className}
      />
    )
  }

  if (variant === 'lockup') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image
          src="/brand/PLATY_logo_icon_1024.png"
          alt={alt}
          width={28}
          height={28}
          priority
        />
        <Image
          src="/brand/PLATY_wordmark_1800.png"
          alt={alt}
          width={140}
          height={32}
          priority
        />
      </div>
    )
  }

  // variant === 'wordmark'
  return (
    <Image
      src="/brand/PLATY_wordmark_1800.png"
      alt={alt}
      width={160}
      height={36}
      priority
      className={className}
    />
  )
}

