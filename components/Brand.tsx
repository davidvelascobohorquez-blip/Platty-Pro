'use client'
import Image from 'next/image'
import Link from 'next/link'

type Props = { className?: string }

export default function Brand({ className = '' }: Props) {
  return (
    <Link
      href="/"
      aria-label="Ir al inicio"
      className={`inline-flex items-center ${className}`}
    >
      {/* Solo un lockup (wordmark). Sin íconos extra. */}
      <Image
        src="/brand/PLATY_wordmark_1800.png"
        alt="platy — Menús inteligentes, ahorro real"
        width={240}
        height={64}
        priority
        className="h-10 w-auto md:h-12"
      />
    </Link>
  )
}

